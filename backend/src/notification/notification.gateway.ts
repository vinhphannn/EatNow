import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private restaurantRooms = new Map<string, string>(); // restaurantId -> socketId
  private customerRooms = new Map<string, string>(); // customerId -> socketId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Remove from restaurant rooms
    for (const [restaurantId, socketId] of this.restaurantRooms.entries()) {
      if (socketId === client.id) {
        this.restaurantRooms.delete(restaurantId);
        break;
      }
    }
    
    // Remove from customer rooms
    for (const [customerId, socketId] of this.customerRooms.entries()) {
      if (socketId === client.id) {
        this.customerRooms.delete(customerId);
        break;
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
    const statusMessages = {
      'pending': 'Đơn hàng đang chờ xác nhận',
      'confirmed': 'Đơn hàng đã được xác nhận',
      'preparing': 'Đơn hàng đang được chuẩn bị',
      'ready': 'Đơn hàng đã sẵn sàng',
      'delivered': 'Đơn hàng đã được giao',
      'cancelled': 'Đơn hàng đã bị hủy'
    };

    this.server.to(`customer_${customerId}`).emit('order_update', {
      type: 'order_update',
      message: statusMessages[status] || 'Trạng thái đơn hàng đã được cập nhật',
      orderId: orderId,
      status: status,
      order: order,
      timestamp: new Date().toISOString()
    });
    console.log(`Notified customer ${customerId} about order update: ${status}`);
  }
}
