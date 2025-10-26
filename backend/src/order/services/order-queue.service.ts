import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../schemas/order.schema';

/**
 * Order Queue Service
 * 
 * Quản lý hàng đợi đơn hàng chờ gán tài xế
 * 
 * Cấu trúc Redis:
 * - order:queue:{status} -> Sorted Set (priority, orderId)
 * - order:pending:assignment:{orderId} -> { order, assignedDriver, timeout }
 */

interface PendingAssignment {
  orderId: string;
  order: any;
  assignedDriver?: string;
  assignedAt?: string;
  timeout: number; // milliseconds
}

@Injectable()
export class OrderQueueService {
  private readonly logger = new Logger(OrderQueueService.name);
  private redis: any = null;

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {
    this.initRedis();
  }

  private async initRedis() {
    try {
      const url = process.env.REDIS_URL || process.env.REDIS_URI;
      if (!url) {
        this.logger.warn('Redis not configured');
        return;
      }

      const IORedis = require('ioredis');
      this.redis = new IORedis(url);
      this.logger.log('✅ Redis connected for order queue');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
    }
  }

  /**
   * Thêm đơn hàng vào queue chờ gán tài xế
   */
  async addOrderToQueue(orderId: string, priority: number = Date.now()): Promise<void> {
    if (!this.redis) return;

    try {
      // Add to sorted set with priority score (timestamp)
      await this.redis.zadd('order:queue:ready', priority, orderId);
      
      this.logger.log(`📦 Order ${orderId} added to assignment queue with priority ${priority}`);

    } catch (error) {
      this.logger.error(`Failed to add order ${orderId} to queue:`, error);
    }
  }

  /**
   * Lấy đơn hàng tiếp theo cần gán (atomic operation)
   */
  async getNextOrderForAssignment(): Promise<string | null> {
    if (!this.redis) return null;

    try {
      // Lua script để lấy và remove order atomically (tránh race condition)
      const luaScript = `
        local queue = 'order:queue:ready'
        local order = redis.call('ZRANGE', queue, 0, 0)
        if #order > 0 then
          redis.call('ZREM', queue, order[1])
          return order[1]
        end
        return nil
      `;

      const orderId = await this.redis.eval(luaScript, 0) as string | null;
      
      return orderId;

    } catch (error) {
      this.logger.error('Failed to get next order from queue:', error);
      return null;
    }
  }

  /**
   * Đánh dấu đơn hàng đang được gán cho driver
   */
  async markOrderPendingAssignment(
    orderId: string, 
    driverId: string, 
    timeoutMs: number = 60000
  ): Promise<void> {
    if (!this.redis) return;

    try {
      const pendingAssignment: PendingAssignment = {
        orderId,
        order: null, // Will be populated when needed
        assignedDriver: driverId,
        assignedAt: new Date().toISOString(),
        timeout: timeoutMs
      };

      // Store pending assignment
      await this.redis.set(
        `order:pending:assignment:${orderId}`,
        JSON.stringify(pendingAssignment),
        'EX',
        Math.ceil(timeoutMs / 1000) + 10 // TTL = timeout + 10s buffer
      );

      // Remove from ready queue (will be re-added if timeout)
      await this.redis.zrem('order:queue:ready', orderId);

      this.logger.log(
        `⏳ Order ${orderId} pending assignment to driver ${driverId} (timeout: ${timeoutMs}ms)`
      );

    } catch (error) {
      this.logger.error(`Failed to mark order ${orderId} as pending assignment:`, error);
    }
  }

  /**
   * Xác nhận đơn hàng đã được driver nhận
   */
  async confirmOrderAssignment(orderId: string): Promise<void> {
    if (!this.redis) return;

    try {
      // Remove from pending
      await this.redis.del(`order:pending:assignment:${orderId}`);

      // Remove from queue (already assigned)
      await this.redis.zrem('order:queue:ready', orderId);

      this.logger.log(`✅ Order ${orderId} assignment confirmed`);

    } catch (error) {
      this.logger.error(`Failed to confirm assignment for order ${orderId}:`, error);
    }
  }

  /**
   * Timeout: đơn hàng không được accept, đưa lại vào queue
   */
  async timeoutOrderAssignment(orderId: string): Promise<void> {
    if (!this.redis) return;

    try {
      // Get pending assignment info
      const pendingStr = await this.redis.get(`order:pending:assignment:${orderId}`);
      if (!pendingStr) return;

      const pending: PendingAssignment = JSON.parse(pendingStr);

      // Re-add to queue with higher priority
      await this.redis.zadd('order:queue:ready', Date.now() - 1000, orderId);

      // Remove pending
      await this.redis.del(`order:pending:assignment:${orderId}`);

      this.logger.warn(
        `⏰ Order ${orderId} assignment timed out, re-queued for driver ${pending.assignedDriver}`
      );

    } catch (error) {
      this.logger.error(`Failed to handle timeout for order ${orderId}:`, error);
    }
  }

  /**
   * Driver từ chối đơn hàng
   */
  async rejectOrderAssignment(orderId: string): Promise<void> {
    if (!this.redis) return;

    try {
      // Get pending assignment
      const pendingStr = await this.redis.get(`order:pending:assignment:${orderId}`);
      if (!pendingStr) return;

      const pending: PendingAssignment = JSON.parse(pendingStr);

      // Re-add to queue
      await this.redis.zadd('order:queue:ready', Date.now(), orderId);

      // Remove pending
      await this.redis.del(`order:pending:assignment:${orderId}`);

      this.logger.log(
        `❌ Driver ${pending.assignedDriver} rejected order ${orderId}, re-queued`
      );

    } catch (error) {
      this.logger.error(`Failed to handle rejection for order ${orderId}:`, error);
    }
  }

  /**
   * Lấy thông tin đơn hàng đang pending
   */
  async getPendingAssignment(orderId: string): Promise<PendingAssignment | null> {
    if (!this.redis) return null;

    try {
      const pendingStr = await this.redis.get(`order:pending:assignment:${orderId}`);
      if (!pendingStr) return null;

      return JSON.parse(pendingStr) as PendingAssignment;

    } catch (error) {
      this.logger.error(`Failed to get pending assignment for order ${orderId}:`, error);
      return null;
    }
  }

  /**
   * Lấy danh sách đơn hàng trong queue
   */
  async getQueueLength(): Promise<number> {
    if (!this.redis) return 0;

    try {
      const count = await this.redis.zcard('order:queue:ready');
      return count;
    } catch (error) {
      this.logger.error('Failed to get queue length:', error);
      return 0;
    }
  }
}
