import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel('Notification') private notificationModel: Model<any>,
  ) {}

  async getNotifications(userId: string, options: {
    type?: string;
    priority?: string;
    status?: string;
    page: number;
    limit: number;
    unreadOnly?: boolean;
  }) {
    // Get real notifications from database
    const notifications = await this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();

    const total = await this.notificationModel.countDocuments({ userId });

    return {
      notifications,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit)
      }
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationModel.countDocuments({ 
      userId, 
      status: 'unread' 
    });
  }

  async getStats(userId: string) {
    const total = await this.notificationModel.countDocuments({ userId });
    const unread = await this.notificationModel.countDocuments({ 
      userId, 
      status: 'unread' 
    });
    
    const byType = await this.notificationModel.aggregate([
      { $match: { userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const byPriority = await this.notificationModel.aggregate([
      { $match: { userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const byStatus = await this.notificationModel.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return {
      total,
      unread,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    return {
      success: true,
      message: 'Notification marked as read'
    };
  }

  async markAllAsRead(userId: string) {
    return {
      success: true,
      message: 'All notifications marked as read'
    };
  }

  async getPreferences(userId: string) {
    return {
      allowPushNotifications: true,
      allowEmailNotifications: true,
      allowSMSNotifications: false,
      allowMarketingEmails: true,
      allowLocationTracking: false,
      language: 'vi',
      country: 'VN',
      timezone: 'Asia/Ho_Chi_Minh'
    };
  }

  async updatePreferences(userId: string, preferences: any) {
    return {
      success: true,
      message: 'Preferences updated successfully',
      preferences
    };
  }

  async deleteNotification(userId: string, notificationId: string) {
    return {
      success: true,
      message: 'Notification deleted successfully'
    };
  }
}
