import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { DriverPresenceService } from '../../driver/services/driver-presence.service';
import { OrderQueueService } from './order-queue.service';
import { SmartAssignmentService } from '../../driver/services/smart-assignment.service';
import { OptimizedNotificationGateway } from '../../notification/optimized-notification.gateway';

/**
 * Assignment Worker Service
 * 
 * Worker tự động xử lý gán đơn cho tài xế
 * 
 * Luồng xử lý:
 * 1. Poll order queue mỗi 5 giây
 * 2. Lấy đơn hàng tiếp theo cần gán
 * 3. Tìm tài xế phù hợp trong bán kính 2km
 * 4. Gửi socket notification cho tài xế (1 phút timeout)
 * 5. Nếu timeout hoặc từ chối → tìm tài xế khác
 */

@Injectable()
export class AssignmentWorkerService {
  private readonly logger = new Logger(AssignmentWorkerService.name);
  private isRunning = false;
  private intervalId: any = null;
  private readonly POLL_INTERVAL = 3000; // 3 seconds (tăng tốc)
  private readonly BATCH_SIZE = 10; // Xử lý tối đa 10 đơn cùng lúc

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly driverPresenceService: DriverPresenceService,
    private readonly orderQueueService: OrderQueueService,
    private readonly smartAssignmentService: SmartAssignmentService,
    private readonly notificationGateway: OptimizedNotificationGateway,
  ) {}

  /**
   * Bắt đầu worker
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn('Assignment worker already running');
      return;
    }

    this.isRunning = true;
    this.logger.log('🚀 Assignment worker started');

    // Start polling
    this.pollOrders();
  }

  /**
   * Dừng worker
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.logger.log('🛑 Assignment worker stopped');
  }

  /**
   * Poll orders từ queue (batch processing)
   */
  private async pollOrders(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Check queue length
      const queueLength = await this.orderQueueService.getQueueLength();
      
      if (queueLength === 0) {
        // No orders in queue, check again later
        this.scheduleNextPoll();
        return;
      }

      if (queueLength > 0) {
        this.logger.debug(`📋 Processing queue (${queueLength} orders pending)`);
      }

      // Process batch of orders (up to BATCH_SIZE)
      const ordersProcessed = await this.processBatch();

      if (ordersProcessed === 0) {
        // No orders processed, check again later
      }

    } catch (error) {
      this.logger.error('Error in poll orders:', error);
    }
    
    // Schedule next poll only if still running
    if (this.isRunning) {
      this.scheduleNextPoll();
    }
  }

  /**
   * Xử lý batch orders cùng lúc
   */
  private async processBatch(): Promise<number> {
    let processed = 0;

    try {
      // Process up to BATCH_SIZE orders
      for (let i = 0; i < this.BATCH_SIZE; i++) {
        const orderId = await this.orderQueueService.getNextOrderForAssignment();
        if (!orderId) break;

        // Process order asynchronously (non-blocking)
        this.processOrder(orderId).catch(err => {
          this.logger.error(`Failed to process order ${orderId}:`, err);
        });

        processed++;
      }

      if (processed > 0) {
        this.logger.debug(`⚡ Processed ${processed} orders in this batch`);
      }

    } catch (error) {
      this.logger.error('Error processing batch:', error);
    }

    return processed;
  }

  /**
   * Xử lý đơn hàng - tìm và gán tài xế
   */
  private async processOrder(orderId: string): Promise<void> {
    try {
      // Get order info
      const order = await this.orderModel.findById(orderId).lean();
      if (!order) {
        this.logger.warn(`Order ${orderId} not found`);
        await this.orderQueueService.timeoutOrderAssignment(orderId);
        return;
      }

      // Check if already assigned
      if (order.driverId) {
        this.logger.log(`Order ${orderId} already assigned to driver ${order.driverId}`);
        await this.orderQueueService.confirmOrderAssignment(orderId);
        return;
      }

      // Get restaurant location
      const restaurantLat = order.restaurantCoordinates?.latitude;
      const restaurantLon = order.restaurantCoordinates?.longitude;
      
      if (!restaurantLat || !restaurantLon) {
        this.logger.error(`Order ${orderId} missing restaurant location`);
        await this.orderQueueService.timeoutOrderAssignment(orderId);
        return;
      }

      // Find nearby drivers (2km radius)
      const nearbyDrivers = await this.driverPresenceService.findNearbyDrivers(
        restaurantLat,
        restaurantLon,
        2 // 2km radius as per your requirement
      );

      if (nearbyDrivers.length === 0) {
        this.logger.warn(
          `No available drivers found for order ${orderId}, will retry later`
        );
        // Keep in queue, will retry
        return;
      }

      // Evaluate drivers and get best candidate
      const bestCandidate = await this.findBestDriver(orderId, nearbyDrivers);

      if (!bestCandidate) {
        this.logger.warn(`No suitable driver found for order ${orderId}`);
        return;
      }

      // Mark order as pending assignment
      await this.orderQueueService.markOrderPendingAssignment(
        orderId,
        bestCandidate.driverId,
        60000 // 1 minute timeout
      );

      // Send socket notification to driver
      await this.notifyDriver(bestCandidate.driverId, orderId, order);

      this.logger.log(
        `📨 Order ${orderId} sent to driver ${bestCandidate.driverId} ` +
        `(distance: ${bestCandidate.distance.toFixed(2)}km, score: ${bestCandidate.score?.toFixed(2)})`
      );

    } catch (error) {
      this.logger.error(`Failed to process order ${orderId}:`, error);
    }
  }

  /**
   * Tìm driver tốt nhất từ danh sách nearby drivers
   */
  private async findBestDriver(
    orderId: string,
    nearbyDrivers: Array<{ driverId: string; distance: number; presence: any }>
  ): Promise<{ driverId: string; distance: number; score?: number } | null> {
    
    if (nearbyDrivers.length === 0) return null;

    // Sort by distance first (closest first)
    const sortedDrivers = nearbyDrivers
      .map((driver) => ({
        driverId: driver.driverId,
        distance: driver.distance,
        presence: driver.presence
      }))
      .sort((a, b) => a.distance - b.distance);

    // Return closest driver
    return sortedDrivers[0];
  }

  /**
   * Gửi socket notification cho driver
   */
  private async notifyDriver(driverId: string, orderId: string, order: any): Promise<void> {
    try {
      this.logger.log(`📡 Emitting order notification to driver ${driverId}`);
      
      // Gửi socket notification thông qua Gateway
      this.notificationGateway.notifyDriverAssigned(driverId, {
        orderId,
        message: 'Bạn có đơn hàng mới!',
        order: {
          _id: orderId,
          code: order.code || order.orderCode,
          restaurantName: order.restaurantName,
          customerName: order.recipientName || order.customerName,
          deliveryAddress: order.deliveryAddress,
          total: order.finalTotal || order.total,
          createdAt: order.createdAt
        }
      });

      this.logger.log(`✅ Socket notification sent to driver ${driverId} for order ${orderId}`);

    } catch (error) {
      this.logger.error(`Failed to notify driver ${driverId}:`, error);
    }
  }

  /**
   * Schedule next poll
   */
  private scheduleNextPoll(): void {
    if (!this.isRunning) return;

    // Clear existing timeout to prevent memory leak
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }

    this.intervalId = setTimeout(() => {
      this.pollOrders();
    }, this.POLL_INTERVAL);
  }

  /**
   * Manual trigger để xử lý đơn hàng ngay lập tức
   */
  async triggerAssignment(orderId: string): Promise<void> {
    this.logger.log(`🔧 Manual trigger for order ${orderId}`);
    await this.processOrder(orderId);
  }

  /**
   * Lấy trạng thái worker
   */
  getStatus(): { isRunning: boolean; queueLength: number } {
    return {
      isRunning: this.isRunning,
      queueLength: 0 // Will be updated
    };
  }
}
