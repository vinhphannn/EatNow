import { apiCall } from "./api.service";

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'promotion' | 'system' | 'delivery' | 'review' | 'payment' | 'account' | 'marketing';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  title: string;
  message: string;
  actionUrl?: string;
  imageUrl?: string;
  orderId?: string;
  restaurantId?: string;
  driverId?: string;
  promotionId?: string;
  reviewId?: string;
  pushNotification: boolean;
  emailNotification: boolean;
  smsNotification: boolean;
  inAppNotification: boolean;
  scheduledFor: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  failureReason?: string;
  metadata?: {
    campaignId?: string;
    segmentId?: string;
    personalizationData?: Record<string, any>;
    trackingData?: Record<string, any>;
  };
  allowPush: boolean;
  allowEmail: boolean;
  allowSMS: boolean;
  openCount: number;
  clickCount: number;
  firstOpenedAt?: string;
  lastOpenedAt?: string;
  firstClickedAt?: string;
  lastClickedAt?: string;
  batchId?: string;
  campaignId?: string;
  templateId?: string;
  expiresAt?: string;
  isExpired: boolean;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  deviceId?: string;
  platform?: string;
  appVersion?: string;
  language: string;
  country: string;
  timezone?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  allowPushNotifications: boolean;
  allowEmailNotifications: boolean;
  allowSMSNotifications: boolean;
  allowMarketingEmails: boolean;
  allowLocationTracking: boolean;
  language: string;
  country: string;
  timezone?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    order?: number;
    promotion?: number;
    system?: number;
    delivery?: number;
    review?: number;
    payment?: number;
    account?: number;
    marketing?: number;
  };
  byPriority: {
    low?: number;
    normal?: number;
    high?: number;
    urgent?: number;
  };
  byStatus: {
    pending?: number;
    sent?: number;
    delivered?: number;
    read?: number;
    failed?: number;
  };
}

class NotificationService {
  private API_ENDPOINTS = {
    NOTIFICATIONS: '/api/v1/notifications',
    MARK_READ: '/api/v1/notifications',
    MARK_ALL_READ: '/api/v1/notifications/mark-all-read',
    PREFERENCES: '/api/v1/notifications/preferences',
    STATS: '/api/v1/notifications/stats',
    UNREAD_COUNT: '/api/v1/notifications/unread-count',
  };

  async getNotifications(options?: {
    type?: string;
    priority?: string;
    status?: string;
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<{ notifications: Notification[]; pagination: any }> {
    const params = new URLSearchParams();
    if (options?.type) params.append('type', options.type);
    if (options?.priority) params.append('priority', options.priority);
    if (options?.status) params.append('status', options.status);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.unreadOnly) params.append('unreadOnly', options.unreadOnly.toString());

    const endpoint = `${this.API_ENDPOINTS.NOTIFICATIONS}?${params.toString()}`;
    const data = await apiCall(endpoint, 'GET', null, true);
    return data;
  }

  async markAsRead(notificationId: string): Promise<any> {
    const data = await apiCall(`${this.API_ENDPOINTS.MARK_READ}/${notificationId}/read`, 'PUT', null, true);
    return data;
  }

  async markAllAsRead(): Promise<any> {
    const data = await apiCall(`${this.API_ENDPOINTS.MARK_ALL_READ}`, 'POST', null, true);
    return data;
  }

  async getUnreadCount(): Promise<number> {
    try {
      const data = await apiCall(this.API_ENDPOINTS.UNREAD_COUNT, 'GET', null, true);
      return data.count || 0;
    } catch (error) {
      // Silently handle auth errors - user might not be logged in
      if (error instanceof Error && error.message.includes('401')) {
        return 0;
      }
      console.warn('Could not fetch unread notification count:', error);
      return 0;
    }
  }

  async getStats(): Promise<NotificationStats> {
    const data = await apiCall(this.API_ENDPOINTS.STATS, 'GET', null, true);
    return data as NotificationStats;
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<any> {
    const data = await apiCall(this.API_ENDPOINTS.PREFERENCES, 'PUT', preferences, true);
    return data;
  }

  async getPreferences(): Promise<NotificationPreferences> {
    const data = await apiCall(this.API_ENDPOINTS.PREFERENCES, 'GET', null, true);
    return data as NotificationPreferences;
  }

  // Helper methods
  getNotificationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      order: '📦',
      promotion: '🎉',
      system: '⚙️',
      delivery: '🚚',
      review: '⭐',
      payment: '💳',
      account: '👤',
      marketing: '📢',
    };
    return iconMap[type] || '🔔';
  }

  getPriorityColor(priority: string): string {
    const colorMap: Record<string, string> = {
      low: 'text-gray-500',
      normal: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500',
    };
    return colorMap[priority] || 'text-gray-500';
  }

  getPriorityBgColor(priority: string): string {
    const colorMap: Record<string, string> = {
      low: 'bg-gray-100',
      normal: 'bg-blue-100',
      high: 'bg-orange-100',
      urgent: 'bg-red-100',
    };
    return colorMap[priority] || 'bg-gray-100';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  isExpired(notification: Notification): boolean {
    if (!notification.expiresAt) return false;
    return new Date(notification.expiresAt) < new Date();
  }

  shouldShowNotification(notification: Notification): boolean {
    return !this.isExpired(notification) && 
           notification.status !== 'failed';
  }
}

export const notificationService = new NotificationService();
