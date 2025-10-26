import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const env = process.env.CORS_ORIGIN || '';
      const allowed = env
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      // Allow if no origin (same-origin) or listed in CORS_ORIGIN, always allow localhost for dev
      if (!origin || allowed.includes(origin) || /localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET','POST','OPTIONS'],
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private restaurantRooms = new Map<string, string>(); // restaurantId -> socketId
  private userRooms = new Map<string, string>(); // userId -> socketId
  private driverRooms = new Map<string, string>(); // driverId (user id for driver) -> socketId
  private lastDriverLocation = new Map<string, { lat: number; lng: number; at: number }>();
  private driverRate = new Map<string, { count: number; windowStart: number }>();
  private readonly driverRateWindowMs = 10_000; // 10s window
  private readonly driverRateMaxEvents = 20; // max events per window per driver (post-throttle)
  private readonly driverLocationTtlMs = 5 * 60 * 1000; // 5 minutes TTL
  private metrics = {
    driverLocationEvents: 0,
    driverReassignments: { timeout: 0, reject: 0 },
    orders: { assigned: 0, completed: 0, cancelled: 0 },
  };
  private metricsTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private redisEnabled = false;
  private redisPub: any = null;
  private redisSub: any = null;
  private redisKV: any = null;
  private cachedActiveOrdersCount: number | null = null;
  private cachedActiveOrdersAt = 0;
  private chatBuffers = new Map<string, Array<{ senderType: 'customer' | 'driver' | 'restaurant'; senderId: string; message: string; at: string }>>();

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
  ) {}

  afterInit() {
    // Optional Redis adapter wiring (env-driven)
    try {
      const url = process.env.REDIS_URL || process.env.REDIS_URI;
      if (!url) return;
      // Dynamically require to avoid hard dependency
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createAdapter } = require('@socket.io/redis-adapter');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const IORedis = require('ioredis');
      this.redisPub = new IORedis(url);
      this.redisSub = new IORedis(url);
      this.redisKV = new IORedis(url);
      this.server.adapter(createAdapter(this.redisPub, this.redisSub));
      this.redisEnabled = true;
      // redis adapter enabled
    } catch (e) {
      console.warn('[WS] Redis adapter not enabled:', (e && e.message) || e);
      this.redisEnabled = false;
    }
  }

  private startTimers() {
    if (!this.metricsTimer) {
      this.metricsTimer = setInterval(() => {
        try {
          // metrics log disabled in production
          this.metrics.driverLocationEvents = 0;
          this.metrics.driverReassignments.timeout = 0;
          this.metrics.driverReassignments.reject = 0;
          this.metrics.orders.assigned = 0;
          this.metrics.orders.completed = 0;
          this.metrics.orders.cancelled = 0;
        } catch {}
      }, 60_000);
    }
    if (!this.cleanupTimer) {
      this.cleanupTimer = setInterval(() => this.evictStaleDriverLocations(), 60_000);
    }
  }

  async handleConnection(client: Socket) {
    try {
      const tokenFromAuth = (client.handshake as any)?.auth?.token as string | undefined;
      const headerAuth = client.handshake.headers['authorization'] as string | undefined;
      const token = tokenFromAuth || (headerAuth && headerAuth.startsWith('Bearer ') ? headerAuth.substring(7) : undefined);

      let userId: string | undefined;
      let role: string | undefined;
      if (token) {
        try {
          const payload: any = await this.jwtService.verifyAsync(token);
          userId = String(payload.sub || payload.id);
          role = payload.role;
          (client as any).userId = userId;
          (client as any).role = role;
          // Clean up any existing connections for this user
          if (userId) this.cleanupUserConnections(userId);
          // Auto-join default rooms if role is known
          if (role === 'restaurant' || role === 'owner' || role === 'admin_restaurant') {
            const restaurant = await this.restaurantModel.findOne({ ownerUserId: new Types.ObjectId(userId) }).lean();
            if (restaurant?._id) this.joinRestaurantRoom(client, String(restaurant._id));
          } else if (role === 'customer' || role === 'admin' || role === 'user') {
            if (userId) this.joinUserRoom(client, userId);
          } else if (role === 'driver') {
            if (userId) this.joinDriverRoom(client, userId);
          }
        } catch (e) {
          // Allow connection without token; client can join rooms via explicit events
        }
      }

      // Start periodic timers once at first connection
      this.startTimers();
      // connection log disabled
    } catch (err) {
      console.warn(`Socket ${client.id} connection error`, err?.message || err);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    const role = (client as any).role;
    
    // disconnect log disabled
    
    // Remove from restaurant rooms
    for (const [restaurantId, socketId] of this.restaurantRooms.entries()) {
      if (socketId === client.id) {
        this.restaurantRooms.delete(restaurantId);
        // room leave log disabled
        break;
      }
    }
    
    // Remove from user rooms
    for (const [uid, socketId] of this.userRooms.entries()) {
      if (socketId === client.id) {
        this.userRooms.delete(uid);
        // room leave log disabled
        break;
      }
    }

    // Remove from driver rooms
    for (const [driverId, socketId] of this.driverRooms.entries()) {
      if (socketId === client.id) {
        this.driverRooms.delete(driverId);
        // room leave log disabled
        // Cleanup driver state
        this.lastDriverLocation.delete(driverId);
        this.driverRate.delete(driverId);
        break;
      }
    }
  }

  // Clean up existing connections for a user
  private cleanupUserConnections(userId: string) {
    // Find and disconnect existing connections for this user
    const connectedClients = Array.from(this.server.sockets.sockets.values());
    
    for (const socket of connectedClients) {
      const socketUserId = (socket as any).userId;
      if (socketUserId === userId) {
        // cleanup log disabled
        socket.disconnect(true);
      }
    }
  }

  // Restaurant joins their room
  joinRestaurantRoom(client: Socket, restaurantId: string) {
    client.join(`restaurant:${restaurantId}`);
    this.restaurantRooms.set(restaurantId, client.id);
    // join log disabled
  }

  // User joins their room
  joinUserRoom(client: Socket, userId: string) {
    client.join(`user:${userId}`);
    this.userRooms.set(userId, client.id);
    // join log disabled
  }

  // Driver joins their room
  joinDriverRoom(client: Socket, driverId: string) {
    client.join(`driver:${driverId}`);
    this.driverRooms.set(driverId, client.id);
    // join log disabled
  }

  // Order room helpers (temporary tri-party room)
  joinOrderRoom(client: Socket, orderId: string) {
    client.join(`order:${orderId}`);
    // join log disabled
  }

  leaveOrderRoom(client: Socket, orderId: string) {
    client.leave(`order:${orderId}`);
    // leave log disabled
  }

  @SubscribeMessage('join_restaurant')
  handleJoinRestaurant(client: Socket, restaurantId: string) {
    this.joinRestaurantRoom(client, restaurantId);
  }

  @SubscribeMessage('join_user')
  handleJoinUser(client: Socket, userId: string) {
    this.joinUserRoom(client, userId);
  }

  @SubscribeMessage('leave_restaurant')
  handleLeaveRestaurant(client: Socket, restaurantId: string) {
    client.leave(`restaurant:${restaurantId}`);
    this.restaurantRooms.delete(restaurantId);
    // leave log disabled
  }

  @SubscribeMessage('leave_user')
  handleLeaveUser(client: Socket, userId: string) {
    client.leave(`user:${userId}`);
    this.userRooms.delete(userId);
    // leave log disabled
  }

  @SubscribeMessage('join_driver')
  handleJoinDriver(client: Socket, driverId: string) {
    // Basic guard: driver can only join their own room
    const role = (client as any).role;
    const userId = (client as any).userId;
    if (role === 'driver' && userId === driverId) {
      this.joinDriverRoom(client, driverId);
    }
  }

  @SubscribeMessage('join_order')
  handleJoinOrder(client: Socket, orderId: string) {
    this.joinOrderRoom(client, orderId);
    // Replay last-known driver location for this order if available
    if (this.redisEnabled && this.redisKV) {
      const key = `order:${orderId}:last_location`;
      this.redisKV.get(key).then((val: string | null) => {
        if (!val) return;
        try {
          const data = JSON.parse(val);
          this.server.to(`order:${orderId}`).emit('driver_location_update:v1', {
            type: 'driver_location_update:v1',
            data,
            timestamp: new Date()
          });
        } catch {}
      }).catch(() => {});
    }
    // Send recent chat history (last 20)
    try {
      const history = (this.chatBuffers.get(orderId) || []).slice(-20);
      if (history.length) {
        client.emit('order_chat_history:v1', { orderId, messages: history });
      }
    } catch {}
  }

  @SubscribeMessage('leave_order')
  handleLeaveOrder(client: Socket, orderId: string) {
    this.leaveOrderRoom(client, orderId);
  }

  // Notify restaurant about new order
  notifyNewOrder(restaurantId: string, order: any) {
    this.server.to(`restaurant:${restaurantId}`).emit('new_order:v1', {
      type: 'new_order:v1',
      message: 'Có đơn hàng mới!',
      order: order,
      timestamp: new Date().toISOString()
    });
    // notification log disabled
  }

  // Notify restaurant about order status update
  notifyOrderUpdate(restaurantId: string, orderId: string, status: string) {
    // Canonical status event
    this.server.to(`restaurant:${restaurantId}`).emit('order_update:v1', {
      type: 'order_update:v1',
      message: 'Đơn hàng đã được cập nhật',
      orderId: orderId,
      status: status,
      timestamp: new Date().toISOString()
    });
    // Dual-emit for deprecation window to avoid client drift
    this.server.to(`order:${orderId}`).emit('order_status_update:v1', {
      type: 'order_status_update:v1',
      orderId,
      status,
      timestamp: new Date().toISOString(),
    });
    // notification log disabled
  }

  // Minimal status event to both driver and restaurant rooms
  emitOrderStatusChangedMinimal(params: { driverId?: string | null; restaurantId?: string | null; orderId: string; status: string; updatedAt?: string | Date }) {
    const payload = {
      orderId: params.orderId,
      status: params.status,
      updatedAt: (params.updatedAt || new Date()).toString(),
    };
    if (params.driverId) {
      this.server.to(`driver:${params.driverId}`).emit('order_status_changed', payload);
    }
    if (params.restaurantId) {
      this.server.to(`restaurant:${params.restaurantId}`).emit('order_status_changed', payload);
    }
  }

  // Notify restaurant about order cancellation
  notifyOrderCancellation(restaurantId: string, orderData: any) {
    this.server.to(`restaurant:${restaurantId}`).emit('order_cancelled:v1', {
      type: 'order_cancelled:v1',
      message: 'Đơn hàng đã bị hủy',
      order: orderData,
      timestamp: new Date().toISOString()
    });
    // notification log disabled
  }

  // Notify customer about order status update
  notifyCustomer(userId: string, orderId: string, status: string, order?: any) {
    this.server.to(`user:${userId}`).emit('order_status_update:v1', {
      type: 'order_status_update:v1',
      message: this.getStatusMessage(status),
      orderId: orderId,
      status: status,
      order: order,
      timestamp: new Date().toISOString()
    });
    // notification log disabled
  }

  // Notify a specific driver about assignment
  notifyDriverAssigned(driverId: string, order: any) {
    this.server.to(`driver:${driverId}`).emit('order_assign:v1', {
      type: 'order_assign:v1',
      message: 'Bạn vừa được gán một đơn hàng mới',
      order,
      timestamp: new Date().toISOString()
    });
    // notification log disabled
  }

  // Get user-friendly status message
  private getStatusMessage(status: string): string {
    const statusMessages = {
      'pending': 'Đơn hàng đang chờ xác nhận',
      'confirmed': 'Đơn hàng đã được xác nhận',
      'preparing': 'Đơn hàng đang được chuẩn bị',
      'ready': 'Đơn hàng đã sẵn sàng',
      'delivered': 'Đơn hàng đã được giao',
      'cancelled': 'Đơn hàng đã bị hủy'
    };
    return statusMessages[status] || 'Trạng thái đơn hàng đã được cập nhật';
  }

  /**
   * Send driver location update to customer
   */
  sendLocationUpdate(userId: string, locationData: {
    driverId: string;
    latitude: number;
    longitude: number;
    orderId: string;
    timestamp: Date;
  }): void {
    const socketId = this.userRooms.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('driver_location_update:v1', {
        type: 'driver_location_update:v1',
        data: locationData,
        timestamp: new Date()
      });
      // location update log disabled
    } else {
      // user not connected log disabled
    }
  }

  /**
   * Driver pushes location via socket (throttled). Broadcast to order room and customer room.
   * Expected payload: { orderId: string, latitude: number, longitude: number }
   */
  @SubscribeMessage('driver_location')
  handleDriverLocation(client: Socket, payload: { orderId: string; latitude: number; longitude: number }) {
    const role = (client as any).role;
    const driverId = (client as any).userId as string;
    if (role !== 'driver' || !driverId || !payload?.orderId) return;

    const lat = Number(payload.latitude);
    const lng = Number(payload.longitude);
    if (!isFinite(lat) || !isFinite(lng)) return;

    // Throttle by distance (~75m) and time (>= 2s)
    const key = driverId;
    const now = Date.now();
    const prev = this.lastDriverLocation.get(key);
    const minMeters = 75;
    const minMs = 2000;
    if (prev && now - prev.at < minMs && this.haversineMeters(prev.lat, prev.lng, lat, lng) < minMeters) {
      return;
    }

    // Basic rate limiting per driver (windowed counter)
    const rate = this.driverRate.get(key) || { count: 0, windowStart: now };
    if (now - rate.windowStart > this.driverRateWindowMs) {
      rate.windowStart = now;
      rate.count = 0;
    }
    rate.count += 1;
    this.driverRate.set(key, rate);
    if (rate.count > this.driverRateMaxEvents) {
      return;
    }

    this.lastDriverLocation.set(key, { lat, lng, at: now });

    // Broadcast to order room
    const locationData = {
      driverId,
      latitude: lat,
      longitude: lng,
      orderId: payload.orderId,
      timestamp: new Date()
    };
    this.server.to(`order:${payload.orderId}`).emit('driver_location_update:v1', {
      type: 'driver_location_update:v1',
      data: locationData,
      timestamp: new Date()
    });

    // Metrics
    this.metrics.driverLocationEvents += 1;

    // Persist last-known locations with TTL if Redis is enabled
    if (this.redisEnabled && this.redisKV) {
      const ttlSec = 15 * 60; // 15 minutes
      const orderKey = `order:${payload.orderId}:last_location`;
      const driverKey = `driver:${driverId}:last_location`;
      const json = JSON.stringify(locationData);
      this.redisKV.setex(orderKey, ttlSec, json).catch(() => {});
      this.redisKV.setex(driverKey, ttlSec, json).catch(() => {});
    }
  }

  /**
   * Real-time order chat between customer and driver (and restaurant)
   */
  @SubscribeMessage('order_chat_send')
  handleOrderChatSend(client: Socket, payload: { orderId: string; message: string }) {
    const orderId = (payload as any)?.orderId;
    const text = String((payload as any)?.message || '').trim();
    if (!orderId || !text) return;
    const role = (client as any).role as string | undefined;
    const userId = String((client as any).userId || '');
    const senderType: 'customer' | 'driver' | 'restaurant' = role === 'driver' ? 'driver' : (role === 'restaurant' || role === 'owner' || role === 'admin_restaurant') ? 'restaurant' : 'customer';
    const msg = { senderType, senderId: userId, message: text, at: new Date().toISOString() };
    const buf = this.chatBuffers.get(orderId) || [];
    buf.push(msg);
    if (buf.length > 200) buf.shift();
    this.chatBuffers.set(orderId, buf);
    this.server.to(`order:${orderId}`).emit('order_chat_message:v1', { orderId, ...msg });
  }

  private haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private evictStaleDriverLocations() {
    const now = Date.now();
    for (const [driverId, info] of this.lastDriverLocation.entries()) {
      if (now - info.at > this.driverLocationTtlMs) {
        this.lastDriverLocation.delete(driverId);
      }
    }
    for (const [driverId, rate] of this.driverRate.entries()) {
      if (now - rate.windowStart > this.driverRateWindowMs * 3) {
        this.driverRate.delete(driverId);
      }
    }
  }

  // Public helpers for REST orchestration
  public addDriverToOrderRoom(driverId: string, orderId: string): boolean {
    const socketId = this.driverRooms.get(driverId);
    if (!socketId) return false;
    const socket = this.server.sockets.sockets.get(socketId);
    if (!socket) return false;
    socket.join(`order:${orderId}`);
    return true;
  }

  public async getMetricsSummary() {
    return {
      redisEnabled: this.redisEnabled,
      activeOrders: await this.getActiveOrdersCount(),
      roomCounts: {
        users: this.userRooms.size,
        restaurants: this.restaurantRooms.size,
        drivers: this.driverRooms.size,
      },
      counters: {
        driverLocationEvents: this.metrics.driverLocationEvents,
        driverReassignments: this.metrics.driverReassignments,
        orders: this.metrics.orders,
      },
    };
  }

  public incrementReassignment(reason: 'timeout' | 'reject') {
    if (reason === 'timeout') this.metrics.driverReassignments.timeout += 1;
    else if (reason === 'reject') this.metrics.driverReassignments.reject += 1;
  }

  public incrementOrdersMetric(kind: 'assigned' | 'completed' | 'cancelled') {
    if (kind === 'assigned') this.metrics.orders.assigned += 1;
    else if (kind === 'completed') this.metrics.orders.completed += 1;
    else if (kind === 'cancelled') this.metrics.orders.cancelled += 1;
  }

  private async getActiveOrdersCount(): Promise<number> {
    const now = Date.now();
    if (this.cachedActiveOrdersCount !== null && now - this.cachedActiveOrdersAt < 5000) {
      return this.cachedActiveOrdersCount;
    }
    if (!this.redisEnabled || !this.redisKV) {
      this.cachedActiveOrdersCount = 0;
      this.cachedActiveOrdersAt = now;
      return 0;
    }
    // Use SCAN to count keys matching order:*:status
    let cursor = '0';
    let count = 0;
    try {
      do {
        // SCAN cursor MATCH pattern COUNT 100
        // ioredis: scan(cursor, 'MATCH', pattern, 'COUNT', 100)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await this.redisKV.scan(cursor, 'MATCH', 'order:*:status', 'COUNT', 200);
        cursor = res[0];
        const keys: string[] = res[1] || [];
        count += keys.length;
      } while (cursor !== '0');
    } catch {
      // fallback to 0 on error
      count = 0;
    }
    this.cachedActiveOrdersCount = count;
    this.cachedActiveOrdersAt = now;
    return count;
  }

  public async teardownOrder(orderId: string) {
    try {
      await this.server.in(`order:${orderId}`).socketsLeave(`order:${orderId}`);
    } catch {}
    // Active orders gauge now computed via Redis; no in-memory tracking removal needed
    if (this.redisEnabled && this.redisKV) {
      try {
        const keys = [
          `order:${orderId}:drivers`,
          `order:${orderId}:customers`,
          `order:${orderId}:status`,
          `order:${orderId}:updatedAt`,
          `order:${orderId}:last_location`,
        ];
        await this.redisKV.del(keys);
      } catch {}
    }
  }

  public async sremDriverFromOrder(orderId: string, driverId: string) {
    // Best-effort: remove driver from Redis set and room
    if (this.redisEnabled && this.redisKV) {
      try {
        await this.redisKV.srem(`order:${orderId}:drivers`, driverId);
      } catch {}
    }
    const socketId = this.driverRooms.get(driverId);
    if (socketId) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        try { await socket.leave(`order:${orderId}`); } catch {}
      }
    }
  }

}
