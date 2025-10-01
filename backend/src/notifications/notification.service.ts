import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class NotificationService {
  constructor(
    // @InjectModel('Notification') private notificationModel: Model<any>,
  ) {}

  async getNotifications(userId: string, options: {
    type?: string;
    priority?: string;
    status?: string;
    page: number;
    limit: number;
    unreadOnly?: boolean;
  }) {
    // Mock data for now
    const mockNotifications = [
      {
        id: '1',
        userId,
        type: 'order',
        priority: 'normal',
        status: 'unread',
        title: 'Đơn hàng đã được xác nhận',
        message: 'Đơn hàng #12345 của bạn đã được xác nhận và đang được chuẩn bị.',
        createdAt: new Date().toISOString(),
        readAt: null
      },
      {
        id: '2',
        userId,
        type: 'promotion',
        priority: 'high',
        status: 'unread',
        title: 'Khuyến mãi mới!',
        message: 'Giảm 20% cho đơn hàng đầu tiên. Mã: WELCOME20',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        readAt: null
      }
    ];

    return {
      notifications: mockNotifications,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: mockNotifications.length,
        totalPages: Math.ceil(mockNotifications.length / options.limit)
      }
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Mock data - return 2 unread notifications
    return 2;
  }

  async getStats(userId: string) {
    return {
      total: 5,
      unread: 2,
      byType: {
        order: 2,
        promotion: 2,
        system: 1
      },
      byPriority: {
        low: 1,
        normal: 2,
        high: 2
      },
      byStatus: {
        unread: 2,
        read: 3
      }
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
