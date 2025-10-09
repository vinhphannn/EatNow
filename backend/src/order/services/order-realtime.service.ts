import { Injectable } from '@nestjs/common';
import { NotificationGateway } from '../../notification/notification.gateway';

@Injectable()
export class OrderRealtimeService {
  constructor(private readonly gateway: NotificationGateway) {}

  addDriverToOrderRoom(driverId: string, orderId: string): boolean {
    return this.gateway.addDriverToOrderRoom(driverId, orderId);
  }

  async sremDriverFromOrder(orderId: string, driverId: string): Promise<void> {
    await this.gateway.sremDriverFromOrder(orderId, driverId);
  }

  async teardownOrder(orderId: string): Promise<void> {
    await this.gateway.teardownOrder(orderId);
  }

  notifyOrderUpdate(restaurantId: string, orderId: string, status: string): void {
    this.gateway.notifyOrderUpdate(restaurantId, orderId, status);
  }

  notifyDriverAssigned(driverId: string, order: any): void {
    this.gateway.notifyDriverAssigned(driverId, order);
  }

  notifyCustomer(userId: string, orderId: string, status: string, order?: any): void {
    this.gateway.notifyCustomer(userId, orderId, status, order);
  }

  incrementReassignment(reason: 'timeout' | 'reject') {
    this.gateway.incrementReassignment(reason);
  }

  incrementOrdersMetric(kind: 'assigned' | 'completed' | 'cancelled') {
    this.gateway.incrementOrdersMetric(kind);
  }
}














