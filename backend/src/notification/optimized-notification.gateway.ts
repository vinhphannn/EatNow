import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MonitoringService } from './services/monitoring.service';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { Order, OrderDocument } from '../order/schemas/order.schema';
import { NotificationService } from './notification.service';
import { NotificationActor } from './schemas/notification.schema';

interface ConnectionInfo {
  socketId: string;
  userId: string;
  role: string;
  lastActivity: number;
  rooms: Set<string>;
}

interface LocationData {
  lat: number;
  lng: number;
  timestamp: number;
}

interface ChatMessage {
  senderType: 'customer' | 'driver' | 'restaurant';
  senderId: string;
  message: string;
  timestamp: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const env = process.env.CORS_ORIGIN || '';
      const allowed = env
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!origin || allowed.includes(origin) || /localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET','POST','OPTIONS'],
    credentials: true,
  },
  // Enable WebSocket và polling
  transports: ['websocket', 'polling'],
  // Compression để giảm bandwidth
  compression: true,
  // Ping timeout tối ưu
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class OptimizedNotificationGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OptimizedNotificationGateway.name);
  
  // Tối ưu hóa: Sử dụng WeakMap để tránh memory leaks
  private connections = new Map<string, ConnectionInfo>();
  private userConnections = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private roomOccupancy = new Map<string, Set<string>>(); // room -> Set<socketId>
  
  // Location tracking với TTL
  private driverLocations = new Map<string, LocationData>();
  private readonly LOCATION_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Rate limiting với sliding window
  private rateLimits = new Map<string, { count: number; windowStart: number }>();
  private readonly RATE_WINDOW = 10_000; // 10 seconds
  private readonly MAX_EVENTS_PER_WINDOW = 20;
  
  // Chat với LRU cache và TTL
  private chatCache = new Map<string, ChatMessage[]>();
  private readonly MAX_CHAT_MESSAGES = 50;
  private readonly CHAT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  
  // Offline notifications storage
  private offlineNotifications = new Map<string, any[]>();
  
  // Metrics
  private metrics = {
    totalConnections: 0,
    activeConnections: 0,
    messagesProcessed: 0,
    locationUpdates: 0,
    chatMessages: 0,
  };
  
  // Cleanup timers
  private cleanupTimer: NodeJS.Timeout | null = null;
  private metricsTimer: NodeJS.Timeout | null = null;
  
  // Redis integration
  private redisEnabled = false;
  private redisKV: any = null;

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly monitoringService: MonitoringService,
    private readonly notificationService: NotificationService,
  ) {}

  afterInit() {
    this.initializeRedis();
    this.startCleanupTimers();
    this.logger.log('Optimized Notification Gateway initialized');
  }

  private async initializeRedis() {
    try {
      const url = process.env.REDIS_URL || process.env.REDIS_URI;
      if (!url) return;
      
      const IORedis = require('ioredis');
      this.redisKV = new IORedis(url, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      
      this.redisEnabled = true;
      this.logger.log('Redis adapter enabled for optimization');
    } catch (e) {
      this.logger.warn('Redis not available, using in-memory only');
    }
  }

  private startCleanupTimers() {
    // Cleanup stale connections every 30 seconds
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleConnections();
      this.cleanupStaleLocations();
      this.cleanupStaleChat();
    }, 30_000);

    // Reset metrics every minute
    this.metricsTimer = setInterval(() => {
      this.logMetrics();
      this.resetMetrics();
    }, 60_000);
  }

  async handleConnection(client: Socket) {
    try {
      console.log(`🔌 New client connected: ${client.id}`);
      console.log(`🔍 Client headers:`, {
        origin: client.handshake.headers.origin,
        userAgent: client.handshake.headers['user-agent'],
        cookie: client.handshake.headers.cookie ? 'Present' : 'Missing'
      });
      
      const token = this.extractToken(client);
      if (!token) {
        console.log(`❌ Authentication failed for client ${client.id} - no token found`);
        console.log(`🔍 Raw cookie header:`, client.handshake.headers.cookie);
        client.disconnect();
        return;
      }
      
      console.log(`🔍 Token found: ${token.substring(0, 20)}...`);
      
      const { userId, role } = await this.authenticateUser(token);
      
      if (!userId) {
        console.log(`❌ Authentication failed for client: ${client.id}`);
        client.disconnect();
        return;
      }

      console.log(`✅ User authenticated: ${userId} (${role})`);

      // Cleanup existing connections for this user
      await this.cleanupUserConnections(userId);
      
      // Create connection info
      const connectionInfo: ConnectionInfo = {
        socketId: client.id,
        userId,
        role,
        lastActivity: Date.now(),
        rooms: new Set(),
      };
      
      this.connections.set(client.id, connectionInfo);
      this.addUserConnection(userId, client.id);
      
      // Auto-join appropriate rooms
      await this.autoJoinRooms(client, userId, role);
      
      this.metrics.totalConnections++;
      this.metrics.activeConnections++;
      
      this.logger.debug(`User ${userId} (${role}) connected with socket ${client.id}`);
      
    } catch (error) {
      this.logger.error(`Connection error for socket ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const connection = this.connections.get(client.id);
    if (!connection) return;

    const { userId, rooms } = connection;
    
    // Leave all rooms
    rooms.forEach(room => {
      this.leaveRoom(client, room);
    });
    
    // Cleanup connection data
    this.connections.delete(client.id);
    this.removeUserConnection(userId, client.id);
    
    this.metrics.activeConnections--;
    
    this.logger.debug(`User ${userId} disconnected from socket ${client.id}`);
  }

  private extractToken(client: Socket): string | undefined {
    const cookieToken = client.handshake.headers.cookie;
    
    console.log(`🔍 Cookie-based auth for client ${client.id}:`);
    console.log(`  - cookie: ${cookieToken ? 'present' : 'missing'}`);
    
    let token: string | undefined;
    
    // Extract token from cookie only
    if (cookieToken) {
      console.log(`  - raw cookie: ${cookieToken}`);
      
      // Try different cookie patterns for different actors
      let cookieMatch = cookieToken.match(/access_token=([^;]+)/);
      if (!cookieMatch) {
        cookieMatch = cookieToken.match(/eatnow_token=([^;]+)/);
      }
      if (!cookieMatch) {
        cookieMatch = cookieToken.match(/restaurant_token=([^;]+)/);
      }
      if (!cookieMatch) {
        cookieMatch = cookieToken.match(/customer_token=([^;]+)/);
      }
      if (!cookieMatch) {
        cookieMatch = cookieToken.match(/driver_token=([^;]+)/);
      }
      
      if (cookieMatch) {
        token = cookieMatch[1];
        console.log(`  - extracted from cookie: present`);
      } else {
        console.log(`  - cookie pattern not found`);
      }
    }
    
    console.log(`  - final token: ${token ? 'present' : 'missing'}`);
    
    return token;
  }

  private async authenticateUser(token: string): Promise<{ userId: string; role: string } | { userId: null; role: null }> {
    if (!token) return { userId: null, role: null };
    
    try {
      console.log(`🔍 JWT Secret check:`, {
        secret: process.env.JWT_SECRET ? 'from env' : 'using default',
        secretLength: (process.env.JWT_SECRET || 'dev-secret').length
      });
      
      const payload: any = await this.jwtService.verifyAsync(token);
      console.log(`🔍 JWT payload:`, {
        sub: payload.sub,
        role: payload.role,
        email: payload.email,
        exp: payload.exp,
        iat: payload.iat
      });
      
      return {
        userId: String(payload.sub || payload.id),
        role: payload.role,
      };
    } catch (error) {
      console.error(`❌ JWT verification failed:`, error);
      return { userId: null, role: null };
    }
  }

  private async cleanupUserConnections(userId: string) {
    const existingSockets = this.userConnections.get(userId);
    if (!existingSockets) return;

    for (const socketId of existingSockets) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect();
      }
    }
    
    this.userConnections.delete(userId);
  }

  private addUserConnection(userId: string, socketId: string) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(socketId);
  }

  private removeUserConnection(userId: string, socketId: string) {
    const sockets = this.userConnections.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  private async autoJoinRooms(client: Socket, userId: string, role: string) {
    try {
      console.log(`🏠 Auto-joining rooms for user ${userId} with role ${role}`);
      
      if (role === 'restaurant' || role === 'owner' || role === 'admin_restaurant') {
        console.log(`🔍 Looking up restaurant for user ${userId}`);
        const restaurant = await this.restaurantModel.findOne({ ownerUserId: new Types.ObjectId(userId) }).lean();
        
        if (restaurant?._id) {
          console.log(`✅ Found restaurant: ${restaurant._id} (${restaurant.name})`);
          this.joinRoom(client, `restaurant:${restaurant._id}`);
          
          // Send pending notifications when restaurant comes online
          await this.sendPendingNotifications(restaurant._id.toString());
        } else {
          console.error(`❌ No restaurant found for user ${userId}`);
        }
      } else if (role === 'customer' || role === 'admin' || role === 'user') {
        console.log(`👤 Joining user room: user:${userId}`);
        this.joinRoom(client, `user:${userId}`);
      } else if (role === 'driver') {
        console.log(`🚗 Joining driver room: driver:${userId}`);
        this.joinRoom(client, `driver:${userId}`);
      } else {
        console.warn(`⚠️ Unknown role: ${role} for user ${userId}`);
      }
    } catch (error) {
      console.error(`❌ Error auto-joining rooms for user ${userId}:`, error);
      this.logger.error(`Error auto-joining rooms for user ${userId}:`, error);
    }
  }

  private joinRoom(client: Socket, room: string) {
    console.log(`🚪 Attempting to join room: ${room} for client ${client.id}`);
    client.join(room);
    console.log(`✅ Client ${client.id} successfully joined room: ${room}`);
    
    const connection = this.connections.get(client.id);
    if (connection) {
      connection.rooms.add(room);
      connection.lastActivity = Date.now();
      console.log(`📝 Updated connection info for client ${client.id}`);
    } else {
      console.warn(`⚠️ No connection info found for client ${client.id}`);
    }
    
    // Track room occupancy
    if (!this.roomOccupancy.has(room)) {
      this.roomOccupancy.set(room, new Set());
    }
    this.roomOccupancy.get(room)!.add(client.id);
    
    const roomSize = this.roomOccupancy.get(room)!.size;
    console.log(`📊 Room ${room} now has ${roomSize} connection(s)`);
  }

  private leaveRoom(client: Socket, room: string) {
    client.leave(room);
    
    const connection = this.connections.get(client.id);
    if (connection) {
      connection.rooms.delete(room);
    }
    
    // Update room occupancy
    const occupants = this.roomOccupancy.get(room);
    if (occupants) {
      occupants.delete(client.id);
      if (occupants.size === 0) {
        this.roomOccupancy.delete(room);
      }
    }
  }

  // Optimized room management
  @SubscribeMessage('join_restaurant')
  handleJoinRestaurant(client: Socket, restaurantId: string) {
    console.log(`🏪 Restaurant ${restaurantId} joining room`);
    this.joinRoom(client, `restaurant:${restaurantId}`);
  }

  @SubscribeMessage('join_user')
  handleJoinUser(client: Socket, userId: string) {
    this.joinRoom(client, `user:${userId}`);
  }

  @SubscribeMessage('join_driver')
  handleJoinDriver(client: Socket, driverId: string) {
    const connection = this.connections.get(client.id);
    if (connection?.role === 'driver' && connection.userId === driverId) {
      this.joinRoom(client, `driver:${driverId}`);
    }
  }

  @SubscribeMessage('join_order')
  handleJoinOrder(client: Socket, orderId: string) {
    this.joinRoom(client, `order:${orderId}`);
    
    // Send cached chat history
    this.sendChatHistory(client, orderId);
    
    // Send last known driver location if available
    this.sendLastDriverLocation(client, orderId);
  }

  @SubscribeMessage('leave_order')
  handleLeaveOrder(client: Socket, orderId: string) {
    this.leaveRoom(client, `order:${orderId}`);
  }

  // Optimized location tracking
  @SubscribeMessage('driver_location')
  handleDriverLocation(client: Socket, payload: { orderId: string; latitude: number; longitude: number }) {
    const connection = this.connections.get(client.id);
    if (!connection || connection.role !== 'driver') return;

    const { orderId, latitude, longitude } = payload;
    const driverId = connection.userId;

    // Rate limiting
    if (!this.checkRateLimit(driverId)) {
      return;
    }

    // Distance-based throttling
    const lastLocation = this.driverLocations.get(driverId);
    if (lastLocation && this.shouldSkipLocationUpdate(lastLocation, latitude, longitude)) {
      return;
    }

    // Update location
    const locationData: LocationData = {
      lat: latitude,
      lng: longitude,
      timestamp: Date.now(),
    };
    
    this.driverLocations.set(driverId, locationData);
    this.metrics.locationUpdates++;

    // Broadcast to order room
    this.server.to(`order:${orderId}`).emit('driver_location_update:v1', {
      type: 'driver_location_update:v1',
      data: {
        driverId,
        latitude,
        longitude,
        orderId,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });

    // Persist to Redis if available
    if (this.redisEnabled) {
      this.persistLocationToRedis(orderId, driverId, locationData);
    }
  }

  private checkRateLimit(driverId: string): boolean {
    const now = Date.now();
    const rateLimit = this.rateLimits.get(driverId) || { count: 0, windowStart: now };
    
    if (now - rateLimit.windowStart > this.RATE_WINDOW) {
      rateLimit.windowStart = now;
      rateLimit.count = 0;
    }
    
    rateLimit.count++;
    this.rateLimits.set(driverId, rateLimit);
    
    return rateLimit.count <= this.MAX_EVENTS_PER_WINDOW;
  }

  private shouldSkipLocationUpdate(lastLocation: LocationData, lat: number, lng: number): boolean {
    const MIN_DISTANCE = 75; // meters
    const MIN_TIME = 2000; // 2 seconds
    
    const distance = this.calculateDistance(lastLocation.lat, lastLocation.lng, lat, lng);
    const timeDiff = Date.now() - lastLocation.timestamp;
    
    return distance < MIN_DISTANCE && timeDiff < MIN_TIME;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Optimized chat system
  @SubscribeMessage('order_chat_send')
  handleOrderChatSend(client: Socket, payload: { orderId: string; message: string }) {
    const connection = this.connections.get(client.id);
    if (!connection) return;

    const { orderId, message } = payload;
    const text = message?.trim();
    if (!orderId || !text) return;

    const chatMessage: ChatMessage = {
      senderType: this.getSenderType(connection.role),
      senderId: connection.userId,
      message: text,
      timestamp: new Date().toISOString(),
    };

    // Add to cache with LRU eviction
    this.addChatMessage(orderId, chatMessage);
    
    // Broadcast to order room
    this.server.to(`order:${orderId}`).emit('order_chat_message:v1', {
      orderId,
      ...chatMessage,
    });

    this.metrics.chatMessages++;
  }

  private getSenderType(role: string): 'customer' | 'driver' | 'restaurant' {
    if (role === 'driver') return 'driver';
    if (['restaurant', 'owner', 'admin_restaurant'].includes(role)) return 'restaurant';
    return 'customer';
  }

  private addChatMessage(orderId: string, message: ChatMessage) {
    if (!this.chatCache.has(orderId)) {
      this.chatCache.set(orderId, []);
    }
    
    const messages = this.chatCache.get(orderId)!;
    messages.push(message);
    
    // LRU eviction
    if (messages.length > this.MAX_CHAT_MESSAGES) {
      messages.shift();
    }
  }

  private sendChatHistory(client: Socket, orderId: string) {
    const messages = this.chatCache.get(orderId);
    if (messages && messages.length > 0) {
      client.emit('order_chat_history:v1', {
        orderId,
        messages: messages.slice(-20), // Last 20 messages
      });
    }
  }

  private sendLastDriverLocation(client: Socket, orderId: string) {
    // Implementation for sending last known driver location
    // This would integrate with Redis or database
  }

  // Create notification record in database
  private async createNotificationRecord(restaurantId: string, order: any) {
    try {
      const orderId = order._id || order.id?.toString();
      const orderCode = order.orderCode || order.id?.toString().slice(-8);
      
      console.log(`📝 Creating notification record for restaurant ${restaurantId}:`, {
        restaurantId,
        orderId,
        orderCode,
        type: 'new_order',
        title: 'Đơn hàng mới',
        content: `Bạn có đơn hàng mới, vui lòng kiểm tra đơn để biết thêm chi tiết: ${orderCode}`,
        priority: 'high'
      });
      
      // Create notification in database using new schema
      const notification = await this.notificationService.createNotification({
        targetActor: NotificationActor.RESTAURANT,
        targetUserId: restaurantId,
        restaurantId,
        orderId,
        type: 'new_order' as any,
        title: 'Đơn hàng mới',
        content: `Bạn có đơn hàng mới, vui lòng kiểm tra đơn để biết thêm chi tiết: ${orderCode}`,
        priority: 'high' as any,
        metadata: {
          orderCode,
          customerName: order.customerName,
          total: order.total
        }
      });
      
      console.log(`✅ Notification created with ID: ${notification._id}`);
      return notification;
      
    } catch (error) {
      console.error('Failed to create notification record:', error);
      throw error;
    }
  }

  // Notification methods
  async notifyNewOrder(restaurantId: string, order: any) {
    console.log(`🔔 Notifying restaurant ${restaurantId} about new order:`, order);
    
    // ALWAYS create notification record in database first
    let notification;
    try {
      notification = await this.createNotificationRecord(restaurantId, order);
      console.log(`✅ Notification record created for restaurant ${restaurantId}`);
    } catch (error) {
      console.error(`❌ Failed to create notification record:`, error);
      return; // Don't proceed if we can't save to database
    }
    
    // Check if restaurant is online
    const restaurantRoom = `restaurant:${restaurantId}`;
    const roomSize = this.server.sockets.adapter.rooms.get(restaurantRoom)?.size || 0;
    
    if (roomSize > 0) {
      console.log(`✅ Restaurant ${restaurantId} is online (${roomSize} connections), sending to room`);
      this.server.to(restaurantRoom).emit('new_order:v1', {
        type: 'new_order:v1',
        message: 'Có đơn hàng mới!',
        order,
        timestamp: new Date().toISOString(),
      });
      
      // Also send notification update event for dropdown with database notification
      this.server.to(restaurantRoom).emit('new_notification:v1', {
        type: 'new_notification',
        notificationId: notification._id,
        title: notification.title,
        content: notification.content,
        orderId: order._id || order.id?.toString(),
        orderCode: order.orderCode || order.id?.toString().slice(-8),
        timestamp: notification.createdAt,
        read: false,
        priority: notification.priority
      });
    } else {
      console.log(`⚠️ Restaurant ${restaurantId} is offline, notification saved to database`);
      
      // Fallback: Broadcast to all restaurant connections
      this.server.emit('restaurant_order_pending', {
        restaurantId,
        order,
        timestamp: new Date().toISOString(),
      });
      
      // Store for offline restaurant
      await this.storeOfflineNotification(restaurantId, order);
    }
    
    console.log(`📡 Event 'new_order:v1' sent to room 'restaurant:${restaurantId}'`);
  }

  /**
   * Gửi notification cho customer khi đơn hàng được xác nhận
   */
  async notifyOrderConfirmed(customerId: string, order: any) {
    console.log(`🔔 Notifying customer ${customerId} about order confirmation:`, order);
    
    try {
      const orderId = order._id || order.id?.toString();
      const orderCode = order.orderCode || order.id?.toString().slice(-8);
      
      // Create notification in database
      const notification = await this.notificationService.createNotification({
        targetActor: NotificationActor.CUSTOMER,
        targetUserId: customerId,
        customerId,
        orderId,
        type: 'order_confirmed' as any,
        title: 'Đơn hàng đã được xác nhận',
        content: `Đơn hàng ${orderCode} của bạn đã được nhà hàng xác nhận`,
        priority: 'medium' as any,
        metadata: {
          orderCode,
          restaurantName: order.restaurantName
        }
      });

      // Send socket notification to customer
      const customerRoom = `customer:${customerId}`;
      const roomSize = this.server.sockets.adapter.rooms.get(customerRoom)?.size || 0;
      
      if (roomSize > 0) {
        this.server.to(customerRoom).emit('order_confirmed:v1', {
          type: 'order_confirmed',
          notificationId: notification._id,
          title: notification.title,
          content: notification.content,
          orderId,
          orderCode,
          timestamp: notification.createdAt,
          read: false,
          priority: notification.priority
        });
      }
      
      console.log(`📡 Event 'order_confirmed:v1' sent to room 'customer:${customerId}'`);
    } catch (error) {
      console.error(`❌ Failed to notify customer about order confirmation:`, error);
    }
  }

  /**
   * Gửi notification đơn hàng cho tài xế (để tài xế chọn nhận hoặc bỏ qua)
   */
  async sendOrderNotificationToDriver(driverId: string, orderData: any) {
    try {
      const driverRoom = `driver:${driverId}`;
      const roomSize = this.server.sockets.adapter.rooms.get(driverRoom)?.size || 0;
      
      if (roomSize > 0) {
        this.server.to(driverRoom).emit('new_order_notification', {
          type: 'new_order_available',
          orderId: orderData.orderId,
          orderCode: orderData.orderCode,
          restaurantName: orderData.restaurantName,
          restaurantAddress: orderData.restaurantAddress,
          deliveryAddress: orderData.deliveryAddress,
          recipientName: orderData.recipientName,
          finalTotal: orderData.finalTotal,
          deliveryFee: orderData.deliveryFee,
          driverTip: orderData.driverTip,
          driverPayment: orderData.driverPayment,
          deliveryDistance: orderData.deliveryDistance,
          createdAt: orderData.createdAt,
          specialInstructions: orderData.specialInstructions,
          paymentMethod: orderData.paymentMethod,
          timestamp: new Date().toISOString()
        });
        
        console.log(`📱 Order notification sent to driver ${driverId} for order ${orderData.orderId}`);
        return true;
      } else {
        console.log(`⚠️ Driver ${driverId} not connected, cannot send notification`);
        return false;
      }
    } catch (error) {
      console.error('Error sending order notification to driver:', error);
      return false;
    }
  }

  /**
   * Gửi notification cho driver khi được giao đơn hàng
   */
  async notifyOrderAssigned(orderId: string, driverId: string) {
    console.log(`🔔 Notifying driver ${driverId} about order assignment:`, orderId);
    
    try {
      // Get order details
      const order = await this.orderModel.findById(orderId).populate('restaurantId', 'name').lean();
      if (!order) {
        console.error(`Order ${orderId} not found`);
        return;
      }

      const orderCode = order.code || orderId.slice(-8);
      
      // Create notification in database
      const notification = await this.notificationService.createNotification({
        targetActor: NotificationActor.DRIVER,
        targetUserId: driverId,
        driverId,
        orderId,
        type: 'order_assigned' as any,
        title: 'Đơn hàng mới được giao',
        content: `Bạn có đơn hàng mới ${orderCode} cần giao`,
        priority: 'high' as any,
        metadata: {
          orderCode,
          restaurantName: (order.restaurantId as any)?.name,
          deliveryAddress: JSON.stringify(order.deliveryAddress)
        }
      });

      // Send socket notification to driver
      const driverRoom = `driver:${driverId}`;
      const roomSize = this.server.sockets.adapter.rooms.get(driverRoom)?.size || 0;
      
      if (roomSize > 0) {
        this.server.to(driverRoom).emit('order_assigned:v1', {
          type: 'order_assigned',
          notificationId: notification._id,
          title: notification.title,
          content: notification.content,
          orderId,
          orderCode,
          timestamp: notification.createdAt,
          read: false,
          priority: notification.priority
        });
      }
      
      console.log(`📡 Event 'order_assigned:v1' sent to room 'driver:${driverId}'`);
    } catch (error) {
      console.error(`❌ Failed to notify driver about order assignment:`, error);
    }
  }

  /**
   * Gửi notification khi driver từ chối đơn hàng
   */
  async notifyOrderRejected(orderId: string, driverId: string, reason?: string) {
    console.log(`🔔 Notifying about order rejection:`, orderId);
    
    try {
      // Get order details
      const order = await this.orderModel.findById(orderId).populate('restaurantId', 'name').lean();
      if (!order) {
        console.error(`Order ${orderId} not found`);
        return;
      }

      const orderCode = order.code || orderId.slice(-8);
      
      // Create notification for restaurant
      const notification = await this.notificationService.createNotification({
        targetActor: NotificationActor.RESTAURANT,
        targetUserId: order.restaurantId._id.toString(),
        restaurantId: order.restaurantId._id.toString(),
        orderId,
        type: 'order_rejected' as any,
        title: 'Tài xế từ chối đơn hàng',
        content: `Đơn hàng ${orderCode} bị tài xế từ chối${reason ? ': ' + reason : ''}`,
        priority: 'medium' as any,
        metadata: {
          orderCode,
          reason
        }
      });

      // Send socket notification to restaurant
      const restaurantRoom = `restaurant:${order.restaurantId._id}`;
      const roomSize = this.server.sockets.adapter.rooms.get(restaurantRoom)?.size || 0;
      
      if (roomSize > 0) {
        this.server.to(restaurantRoom).emit('order_rejected:v1', {
          type: 'order_rejected',
          notificationId: notification._id,
          title: notification.title,
          content: notification.content,
          orderId,
          orderCode,
          timestamp: notification.createdAt,
          read: false,
          priority: notification.priority
        });
      }
      
      console.log(`📡 Event 'order_rejected:v1' sent to room 'restaurant:${order.restaurantId._id}'`);
    } catch (error) {
      console.error(`❌ Failed to notify about order rejection:`, error);
    }
  }

  /**
   * Gửi notification khi đơn hàng được giao thành công
   */
  async notifyOrderDelivered(orderId: string, driverId: string) {
    console.log(`🔔 Notifying about order delivery:`, orderId);
    
    try {
      // Get order details
      const order = await this.orderModel.findById(orderId)
        .populate('restaurantId', 'name')
        .populate('customerId', 'name')
        .lean();
      
      if (!order) {
        console.error(`Order ${orderId} not found`);
        return;
      }

      const orderCode = order.code || orderId.slice(-8);
      
      // Create notification for customer
      const customerNotification = await this.notificationService.createNotification({
        targetActor: NotificationActor.CUSTOMER,
        targetUserId: order.customerId._id.toString(),
        customerId: order.customerId._id.toString(),
        orderId,
        type: 'order_delivered' as any,
        title: 'Đơn hàng đã giao thành công',
        content: `Đơn hàng ${orderCode} đã được giao thành công`,
        priority: 'high' as any,
        metadata: {
          orderCode
        }
      });

      // Create notification for restaurant
      const restaurantNotification = await this.notificationService.createNotification({
        targetActor: NotificationActor.RESTAURANT,
        targetUserId: order.restaurantId._id.toString(),
        restaurantId: order.restaurantId._id.toString(),
        orderId,
        type: 'order_delivered' as any,
        title: 'Đơn hàng đã giao thành công',
        content: `Đơn hàng ${orderCode} đã được giao thành công`,
        priority: 'medium' as any,
        metadata: {
          orderCode
        }
      });

      // Send socket notifications
      const customerRoom = `customer:${order.customerId._id}`;
      const restaurantRoom = `restaurant:${order.restaurantId._id}`;
      
      // Notify customer
      const customerRoomSize = this.server.sockets.adapter.rooms.get(customerRoom)?.size || 0;
      if (customerRoomSize > 0) {
        this.server.to(customerRoom).emit('order_delivered:v1', {
          type: 'order_delivered',
          notificationId: customerNotification._id,
          title: customerNotification.title,
          content: customerNotification.content,
          orderId,
          orderCode,
          timestamp: customerNotification.createdAt,
          read: false,
          priority: customerNotification.priority
        });
      }

      // Notify restaurant
      const restaurantRoomSize = this.server.sockets.adapter.rooms.get(restaurantRoom)?.size || 0;
      if (restaurantRoomSize > 0) {
        this.server.to(restaurantRoom).emit('order_delivered:v1', {
          type: 'order_delivered',
          notificationId: restaurantNotification._id,
          title: restaurantNotification.title,
          content: restaurantNotification.content,
          orderId,
          orderCode,
          timestamp: restaurantNotification.createdAt,
          read: false,
          priority: restaurantNotification.priority
        });
      }
      
      console.log(`📡 Event 'order_delivered:v1' sent to customer and restaurant`);
    } catch (error) {
      console.error(`❌ Failed to notify about order delivery:`, error);
    }
  }

  notifyOrderUpdate(restaurantId: string, orderId: string, status: string) {
    this.server.to(`restaurant:${restaurantId}`).emit('order_update:v1', {
      type: 'order_update:v1',
      message: 'Đơn hàng đã được cập nhật',
      orderId,
      status,
      timestamp: new Date().toISOString(),
    });

    this.server.to(`order:${orderId}`).emit('order_status_update:v1', {
      type: 'order_status_update:v1',
      orderId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  notifyCustomer(userId: string, orderId: string, status: string, order?: any) {
    this.server.to(`user:${userId}`).emit('order_status_update:v1', {
      type: 'order_status_update:v1',
      message: this.getStatusMessage(status),
      orderId,
      status,
      order,
      timestamp: new Date().toISOString(),
    });
  }

  notifyOrderCancellation(restaurantId: string, orderData: any) {
    this.server.to(`restaurant:${restaurantId}`).emit('order_cancelled:v1', {
      type: 'order_cancelled:v1',
      message: 'Đơn hàng đã bị hủy',
      order: orderData,
      timestamp: new Date().toISOString(),
    });
  }

  notifyDriverAssigned(driverId: string, order: any) {
    this.server.to(`driver:${driverId}`).emit('order_assign:v1', {
      type: 'order_assign:v1',
      message: 'Bạn vừa được gán một đơn hàng mới',
      order,
      timestamp: new Date().toISOString(),
    });
  }

  sendLocationUpdate(customerId: string, locationData: any) {
    this.server.to(`user:${customerId}`).emit('driver_location_update:v1', {
      type: 'driver_location_update:v1',
      message: 'Vị trí tài xế đã được cập nhật',
      data: locationData,
      timestamp: new Date().toISOString(),
    });
  }

  incrementReassignment(reason: 'timeout' | 'reject') {
    // Simple logging for reassignment tracking
    this.logger.log(`Driver reassignment: ${reason}`);
  }

  incrementOrdersMetric(kind: 'assigned' | 'completed' | 'cancelled') {
    // Simple logging for order tracking
    this.logger.log(`Order metric: ${kind}`);
  }

  getMetricsSummary() {
    return {
      connections: this.connections.size,
      userConnections: this.userConnections.size,
      roomOccupancy: this.roomOccupancy.size,
      driverLocations: this.driverLocations.size,
      chatCache: this.chatCache.size,
      redisEnabled: this.redisEnabled,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  private getStatusMessage(status: string): string {
    const statusMessages = {
      'pending': 'Đơn hàng đang chờ xác nhận',
      'confirmed': 'Đơn hàng đã được xác nhận',
      'preparing': 'Đơn hàng đang được chuẩn bị',
      'ready': 'Đơn hàng đã sẵn sàng',
      'delivered': 'Đơn hàng đã được giao',
      'cancelled': 'Đơn hàng đã bị hủy',
    };
    return statusMessages[status] || 'Trạng thái đơn hàng đã được cập nhật';
  }

  // Cleanup methods
  private cleanupStaleConnections() {
    const now = Date.now();
    const STALE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    for (const [socketId, connection] of this.connections.entries()) {
      if (now - connection.lastActivity > STALE_TIMEOUT) {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect();
        }
      }
    }
  }

  private cleanupStaleLocations() {
    const now = Date.now();
    for (const [driverId, location] of this.driverLocations.entries()) {
      if (now - location.timestamp > this.LOCATION_TTL) {
        this.driverLocations.delete(driverId);
      }
    }
  }

  private cleanupStaleChat() {
    const now = Date.now();
    for (const [orderId, messages] of this.chatCache.entries()) {
      if (messages.length === 0 || this.isChatStale(messages)) {
        this.chatCache.delete(orderId);
      }
    }
  }

  private isChatStale(messages: ChatMessage[]): boolean {
    if (messages.length === 0) return true;
    const lastMessage = messages[messages.length - 1];
    const lastMessageTime = new Date(lastMessage.timestamp).getTime();
    return Date.now() - lastMessageTime > this.CHAT_TTL;
  }

  private persistLocationToRedis(orderId: string, driverId: string, location: LocationData) {
    if (!this.redisEnabled || !this.redisKV) return;
    
    const key = `order:${orderId}:driver_location`;
    const data = JSON.stringify({
      driverId,
      latitude: location.lat,
      longitude: location.lng,
      timestamp: new Date(location.timestamp),
    });
    
    this.redisKV.setex(key, 900, data).catch(() => {}); // 15 minutes TTL
  }

  // Metrics and monitoring
  private logMetrics() {
    this.logger.log(`Metrics: Connections=${this.metrics.activeConnections}, Messages=${this.metrics.messagesProcessed}, Locations=${this.metrics.locationUpdates}, Chat=${this.metrics.chatMessages}`);
  }

  private resetMetrics() {
    this.metrics.messagesProcessed = 0;
    this.metrics.locationUpdates = 0;
    this.metrics.chatMessages = 0;
  }

  public getMetrics() {
    return {
      ...this.metrics,
      roomCount: this.roomOccupancy.size,
      userConnections: this.userConnections.size,
      driverLocations: this.driverLocations.size,
      chatCache: this.chatCache.size,
    };
  }

  // Cleanup on destroy
  // Order room management methods for OrderRealtimeService compatibility
  addDriverToOrderRoom(driverId: string, orderId: string): boolean {
    try {
      const driverSocket = this.findDriverSocket(driverId);
      if (driverSocket) {
        driverSocket.join(`order:${orderId}`);
        this.logger.log(`Driver ${driverId} joined order room ${orderId}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to add driver ${driverId} to order room ${orderId}:`, error);
      return false;
    }
  }

  async sremDriverFromOrder(orderId: string, driverId: string): Promise<void> {
    try {
      const driverSocket = this.findDriverSocket(driverId);
      if (driverSocket) {
        driverSocket.leave(`order:${orderId}`);
        this.logger.log(`Driver ${driverId} left order room ${orderId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to remove driver ${driverId} from order ${orderId}:`, error);
    }
  }

  async teardownOrder(orderId: string): Promise<void> {
    try {
      // Notify all clients in the order room that the order is complete
      this.server.to(`order:${orderId}`).emit('order_complete:v1', {
        type: 'order_complete:v1',
        message: 'Đơn hàng đã hoàn thành',
        orderId,
        timestamp: new Date().toISOString(),
      });

      // Clean up order-specific data
      this.chatCache.delete(orderId);
      
      this.logger.log(`Order ${orderId} teardown completed`);
    } catch (error) {
      this.logger.error(`Failed to teardown order ${orderId}:`, error);
    }
  }

  private findDriverSocket(driverId: string): any {
    for (const [socketId, connection] of this.connections.entries()) {
      if (connection.userId === driverId && connection.role === 'driver') {
        return this.server.sockets.sockets.get(socketId);
      }
    }
    return null;
  }

  // Store offline notifications for restaurants
  private async storeOfflineNotification(restaurantId: string, orderData: any) {
    try {
      // Store in Redis or database for offline restaurants
      const notification = {
        orderId: orderData.orderId,
        orderCode: orderData.orderCode,
        items: orderData.items,
        total: orderData.total,
        customerName: orderData.customerName,
        deliveryAddress: orderData.deliveryAddress,
        createdAt: orderData.createdAt,
        timestamp: Date.now()
      };
      
      // For now, store in memory (in production, use Redis)
      if (!this.offlineNotifications) {
        this.offlineNotifications = new Map();
      }
      
      const notifications = this.offlineNotifications.get(restaurantId) || [];
      notifications.push(notification);
      this.offlineNotifications.set(restaurantId, notifications);
      
      console.log(`💾 Stored offline notification for restaurant ${restaurantId}`);
    } catch (error) {
      console.error('Error storing offline notification:', error);
    }
  }

  // Send pending notifications when restaurant comes online
  private async sendPendingNotifications(restaurantId: string) {
    if (!this.offlineNotifications) return;
    
    const notifications = this.offlineNotifications.get(restaurantId) || [];
    if (notifications.length === 0) return;
    
    console.log(`📬 Sending ${notifications.length} pending notifications to restaurant ${restaurantId}`);
    
    // Send all pending notifications
    notifications.forEach(notification => {
      this.server.to(`restaurant:${restaurantId}`).emit('new_order:v1', {
        type: 'new_order:v1',
        message: 'Có đơn hàng mới!',
        order: notification,
        timestamp: new Date().toISOString(),
        isPending: true // Flag to indicate this is a pending notification
      });
    });
    
    // Clear sent notifications
    this.offlineNotifications.delete(restaurantId);
  }

  onDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    if (this.redisKV) {
      this.redisKV.disconnect();
    }
  }
}
