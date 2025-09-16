import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
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
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private restaurantRooms = new Map<string, string>(); // restaurantId -> socketId
  private customerRooms = new Map<string, string>(); // customerId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const tokenFromAuth = (client.handshake as any)?.auth?.token as string | undefined;
      const headerAuth = client.handshake.headers['authorization'] as string | undefined;
      const token = tokenFromAuth || (headerAuth && headerAuth.startsWith('Bearer ') ? headerAuth.substring(7) : undefined);

      if (!token) {
        console.warn(`Socket ${client.id} missing auth token - disconnecting`);
        client.disconnect(true);
        return;
      }

      const payload: any = await this.jwtService.verifyAsync(token);
      const userId: string = String(payload.sub || payload.id);
      const role: string | undefined = payload.role;

      // Store user info in socket for cleanup
      (client as any).userId = userId;
      (client as any).role = role;

      // Clean up any existing connections for this user
      this.cleanupUserConnections(userId);

      // Join rooms based on role
      if (role === 'restaurant' || role === 'owner' || role === 'admin_restaurant') {
        // Find restaurant by owner user id
        const restaurant = await this.restaurantModel.findOne({ ownerUserId: new Types.ObjectId(userId) }).lean();
        if (restaurant?._id) {
          this.joinRestaurantRoom(client, String(restaurant._id));
        }
      } else if (role === 'customer' || role === 'admin') {
        // Only join customer room for customers and admins
        this.joinCustomerRoom(client, userId);
      }

      console.log(`Client connected: ${client.id} user=${userId} role=${role}`);
    } catch (err) {
      console.warn(`Socket ${client.id} auth error - disconnecting`, err?.message || err);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    const role = (client as any).role;
    
    console.log(`Client disconnected: ${client.id} user=${userId} role=${role}`);
    
    // Remove from restaurant rooms
    for (const [restaurantId, socketId] of this.restaurantRooms.entries()) {
      if (socketId === client.id) {
        this.restaurantRooms.delete(restaurantId);
        console.log(`Restaurant ${restaurantId} left room`);
        break;
      }
    }
    
    // Remove from customer rooms
    for (const [customerId, socketId] of this.customerRooms.entries()) {
      if (socketId === client.id) {
        this.customerRooms.delete(customerId);
        console.log(`Customer ${customerId} left room`);
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
        console.log(`Cleaning up existing connection for user ${userId}: ${socket.id}`);
        socket.disconnect(true);
      }
    }
  }

  // Restaurant joins their room
  joinRestaurantRoom(client: Socket, restaurantId: string) {
    client.join(`restaurant_${restaurantId}`);
    this.restaurantRooms.set(restaurantId, client.id);
    console.log(`Restaurant ${restaurantId} joined room: restaurant_${restaurantId}`);
  }

  // Customer joins their room
  joinCustomerRoom(client: Socket, customerId: string) {
    client.join(`customer_${customerId}`);
    this.customerRooms.set(customerId, client.id);
    console.log(`Customer ${customerId} joined room: customer_${customerId}`);
  }

  @SubscribeMessage('join_restaurant')
  handleJoinRestaurant(client: Socket, restaurantId: string) {
    this.joinRestaurantRoom(client, restaurantId);
  }

  @SubscribeMessage('join_customer')
  handleJoinCustomer(client: Socket, customerId: string) {
    this.joinCustomerRoom(client, customerId);
  }

  @SubscribeMessage('leave_restaurant')
  handleLeaveRestaurant(client: Socket, restaurantId: string) {
    client.leave(`restaurant_${restaurantId}`);
    this.restaurantRooms.delete(restaurantId);
    console.log(`Restaurant ${restaurantId} left room`);
  }

  @SubscribeMessage('leave_customer')
  handleLeaveCustomer(client: Socket, customerId: string) {
    client.leave(`customer_${customerId}`);
    this.customerRooms.delete(customerId);
    console.log(`Customer ${customerId} left room`);
  }

  // Notify restaurant about new order
  notifyNewOrder(restaurantId: string, order: any) {
    this.server.to(`restaurant_${restaurantId}`).emit('new_order', {
      type: 'new_order',
      message: 'Có đơn hàng mới!',
      order: order,
      timestamp: new Date().toISOString()
    });
    console.log(`Notified restaurant ${restaurantId} about new order`);
  }

  // Notify restaurant about order status update
  notifyOrderUpdate(restaurantId: string, orderId: string, status: string) {
    this.server.to(`restaurant_${restaurantId}`).emit('order_update', {
      type: 'order_update',
      message: 'Đơn hàng đã được cập nhật',
      orderId: orderId,
      status: status,
      timestamp: new Date().toISOString()
    });
    console.log(`Notified restaurant ${restaurantId} about order update`);
  }

  // Notify customer about order status update
  notifyCustomer(customerId: string, orderId: string, status: string, order?: any) {
    this.server.to(`customer_${customerId}`).emit('order_status_update', {
      type: 'order_status_update',
      message: this.getStatusMessage(status),
      orderId: orderId,
      status: status,
      order: order,
      timestamp: new Date().toISOString()
    });
    console.log(`Notified customer ${customerId} about order ${orderId} status: ${status}`);
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
  sendLocationUpdate(customerId: string, locationData: {
    driverId: string;
    latitude: number;
    longitude: number;
    orderId: string;
    timestamp: Date;
  }): void {
    const socketId = this.customerRooms.get(customerId);
    if (socketId) {
      this.server.to(socketId).emit('driver_location_update', {
        type: 'driver_location_update',
        data: locationData,
        timestamp: new Date()
      });
      console.log(`Sent driver location update to customer ${customerId}`);
    } else {
      console.log(`Customer ${customerId} not connected to WebSocket`);
    }
  }

}
