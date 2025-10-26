import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  Notification, 
  NotificationDocument, 
  NotificationType, 
  NotificationPriority,
  NotificationActor 
} from './schemas/notification.schema';

export interface CreateNotificationData {
  targetActor: NotificationActor;
  targetUserId: string;
  orderId?: string;
  restaurantId?: string;
  customerId?: string;
  driverId?: string;
  type: NotificationType;
  title: string;
  content: string;
  priority?: NotificationPriority;
  metadata?: {
    orderCode?: string;
    customerName?: string;
    restaurantName?: string;
    driverName?: string;
    total?: number;
    deliveryAddress?: string;
    [key: string]: any;
  };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * Tạo notification mới
   */
  async createNotification(data: CreateNotificationData): Promise<NotificationDocument> {
    try {
      const notification = new this.notificationModel({
        targetActor: data.targetActor,
        targetUserId: data.targetUserId,
        orderId: data.orderId ? new Types.ObjectId(data.orderId) : undefined,
        restaurantId: data.restaurantId ? new Types.ObjectId(data.restaurantId) : undefined,
        customerId: data.customerId ? new Types.ObjectId(data.customerId) : undefined,
        driverId: data.driverId ? new Types.ObjectId(data.driverId) : undefined,
        type: data.type,
        title: data.title,
        content: data.content,
        priority: data.priority || NotificationPriority.MEDIUM,
        metadata: data.metadata || {},
        read: false,
      });

      const savedNotification = await notification.save();
      this.logger.log(`✅ Created notification ${savedNotification._id} for ${data.targetActor} ${data.targetUserId}`);
      
      return savedNotification;
    } catch (error) {
      this.logger.error(`❌ Failed to create notification:`, error);
      throw error;
    }
  }

  /**
   * Lấy danh sách notifications theo actor và userId
   */
  async getNotificationsByActor(
    targetActor: NotificationActor,
    targetUserId: string,
    options: {
      limit?: number;
      skip?: number;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{ notifications: NotificationDocument[]; total: number; unreadCount: number }> {
    try {
      const { limit = 20, skip = 0, unreadOnly = false } = options;
      
      const query: any = { 
        targetActor,
        targetUserId 
      };
      if (unreadOnly) {
        query.read = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        this.notificationModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('orderId', 'code status finalTotal')
          .lean(),
        this.notificationModel.countDocuments(query),
        this.notificationModel.countDocuments({ 
          targetActor,
          targetUserId,
          read: false 
        })
      ]);

      return {
        notifications: notifications as NotificationDocument[],
        total,
        unreadCount
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get notifications for ${targetActor} ${targetUserId}:`, error);
      throw error;
    }
  }

  /**
   * Lấy danh sách notifications của restaurant (backward compatibility)
   */
  async getRestaurantNotifications(
    restaurantId: string, 
    options: {
      limit?: number;
      skip?: number;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{ notifications: NotificationDocument[]; total: number; unreadCount: number }> {
    return this.getNotificationsByActor(NotificationActor.RESTAURANT, restaurantId, options);
  }

  /**
   * Đánh dấu notification là đã đọc
   */
  async markAsRead(notificationId: string, targetActor: NotificationActor, targetUserId: string): Promise<boolean> {
    try {
      const result = await this.notificationModel.updateOne(
        { 
          _id: new Types.ObjectId(notificationId),
          targetActor,
          targetUserId
        },
        { 
          read: true, 
          readAt: new Date() 
        }
      );

      if (result.modifiedCount > 0) {
        this.logger.log(`✅ Marked notification ${notificationId} as read for ${targetActor} ${targetUserId}`);
        return true;
      } else {
        this.logger.warn(`⚠️ Notification ${notificationId} not found or already read`);
        return false;
      }
    } catch (error) {
      this.logger.error(`❌ Failed to mark notification ${notificationId} as read:`, error);
      throw error;
    }
  }

  /**
   * Đánh dấu tất cả notifications của actor là đã đọc
   */
  async markAllAsRead(targetActor: NotificationActor, targetUserId: string): Promise<number> {
    try {
      const result = await this.notificationModel.updateMany(
        { 
          targetActor,
          targetUserId,
          read: false
        },
        { 
          read: true, 
          readAt: new Date() 
        }
      );

      this.logger.log(`✅ Marked ${result.modifiedCount} notifications as read for ${targetActor} ${targetUserId}`);
      return result.modifiedCount;
    } catch (error) {
      this.logger.error(`❌ Failed to mark all notifications as read for ${targetActor} ${targetUserId}:`, error);
      throw error;
    }
  }

  /**
   * Xóa notification cũ (older than 30 days)
   */
  async cleanupOldNotifications(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.notificationModel.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        read: true
      });

      this.logger.log(`✅ Cleaned up ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error(`❌ Failed to cleanup old notifications:`, error);
      throw error;
    }
  }

  /**
   * Tạo notification cho đơn hàng mới (Restaurant)
   */
  async createNewOrderNotification(
    restaurantId: string, 
    orderId: string, 
    orderCode: string,
    customerName?: string,
    total?: number
  ): Promise<NotificationDocument> {
    return this.createNotification({
      targetActor: NotificationActor.RESTAURANT,
      targetUserId: restaurantId,
      restaurantId,
      orderId,
      type: NotificationType.NEW_ORDER,
      title: 'Đơn hàng mới',
      content: `Bạn có đơn hàng mới, vui lòng kiểm tra đơn để biết thêm chi tiết: ${orderCode}`,
      priority: NotificationPriority.HIGH,
      metadata: {
        orderCode,
        customerName,
        total
      }
    });
  }

  /**
   * Tạo notification cho customer khi đơn hàng được xác nhận
   */
  async createOrderConfirmedNotification(
    customerId: string,
    orderId: string,
    orderCode: string,
    restaurantName?: string
  ): Promise<NotificationDocument> {
    return this.createNotification({
      targetActor: NotificationActor.CUSTOMER,
      targetUserId: customerId,
      customerId,
      orderId,
      type: NotificationType.ORDER_CONFIRMED,
      title: 'Đơn hàng đã được xác nhận',
      content: `Đơn hàng ${orderCode} của bạn đã được nhà hàng ${restaurantName} xác nhận`,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        orderCode,
        restaurantName
      }
    });
  }

  /**
   * Tạo notification cho driver khi được giao đơn hàng
   */
  async createOrderAssignedNotification(
    driverId: string,
    orderId: string,
    orderCode: string,
    restaurantName?: string,
    deliveryAddress?: string
  ): Promise<NotificationDocument> {
    return this.createNotification({
      targetActor: NotificationActor.DRIVER,
      targetUserId: driverId,
      driverId,
      orderId,
      type: NotificationType.ORDER_ASSIGNED,
      title: 'Đơn hàng mới được giao',
      content: `Bạn có đơn hàng mới ${orderCode} từ ${restaurantName} cần giao đến ${deliveryAddress}`,
      priority: NotificationPriority.HIGH,
      metadata: {
        orderCode,
        restaurantName,
        deliveryAddress
      }
    });
  }
}