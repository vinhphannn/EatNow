import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../../order/schemas/order.schema';
import { SmartDriverAssignmentService } from './smart-driver-assignment.service';
import { RedisService } from '../../common/services/redis.service';

@Injectable()
export class DriverAssignmentSchedulerService {
  private readonly logger = new Logger(DriverAssignmentSchedulerService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private smartDriverAssignmentService: SmartDriverAssignmentService,
    private redisService: RedisService,
  ) {}

  /**
   * Chạy mỗi 30 giây để tìm tài xế cho đơn hàng pending
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processPendingOrders() {
    try {
      // this.logger.debug('🔄 Running driver assignment scheduler...');
      
      // Lấy đơn hàng chưa có tài xế từ DB
      const pendingOrdersInDb = await this.orderModel.find({ 
        driverId: { $in: [null, undefined] },
        status: { $nin: ['delivered', 'cancelled'] }
      }).select('_id').lean();
      
      if (pendingOrdersInDb?.length === 0) {
        // this.logger.debug('No pending orders to process');
        return;
      }

      // this.logger.log(`Processing ${pendingOrdersInDb.length} pending orders from DB`);
      
      // Thêm vào Redis để xử lý
      for (const order of pendingOrdersInDb) {
        await this.redisService.addPendingOrder(String(order._id));
      }
      
      await this.smartDriverAssignmentService.processPendingOrders();

    } catch (error) {
      this.logger.error('Error in driver assignment scheduler:', error);
    }
  }

  /**
   * Chạy mỗi 5 phút để cleanup expired orders
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupExpiredOrders() {
    try {
      // this.logger.debug('🧹 Cleaning up expired orders...');
      
      const pendingOrders = await this.redisService.getPendingOrders();
      const expiredOrders = [];

      for (const orderId of pendingOrders) {
        // Kiểm tra nếu đơn hàng đã quá 30 phút
        const isExpired = await this.isOrderExpired(orderId);
        if (isExpired) {
          expiredOrders.push(orderId);
        }
      }

      if (expiredOrders.length > 0) {
        // this.logger.warn(`Found ${expiredOrders.length} expired orders`);
        
        for (const orderId of expiredOrders) {
          await this.handleExpiredOrder(orderId);
        }
      }

    } catch (error) {
      this.logger.error('Error cleaning up expired orders:', error);
    }
  }

  /**
   * Kiểm tra xem đơn hàng có hết hạn không
   */
  private async isOrderExpired(orderId: string): Promise<boolean> {
    try {
      // Tạm thời return false, sẽ implement sau
      return false;
    } catch (error) {
      this.logger.error(`Error checking if order ${orderId} is expired:`, error);
      return false;
    }
  }

  /**
   * Xử lý đơn hàng hết hạn
   */
  private async handleExpiredOrder(orderId: string): Promise<void> {
    try {
      this.logger.warn(`Handling expired order: ${orderId}`);
      
      // Xóa khỏi pending orders
      await this.redisService.removePendingOrder(orderId);
      
      // Có thể gửi notification cho admin hoặc customer
      // Hoặc chuyển sang chế độ manual assignment
      
      this.logger.log(`Expired order ${orderId} handled successfully`);
    } catch (error) {
      this.logger.error(`Error handling expired order ${orderId}:`, error);
    }
  }

  /**
   * Chạy manual để test
   */
  async runManualAssignment(): Promise<void> {
    this.logger.log('🚀 Running manual driver assignment...');
    await this.processPendingOrders();
  }
}
