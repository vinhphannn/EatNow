import { apiClient } from './api.client';

export enum NotificationActor {
  CUSTOMER = 'customer',
  RESTAURANT = 'restaurant', 
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export interface Notification {
  _id: string;
  targetActor: NotificationActor;
  targetUserId: string;
  orderId?: string;
  restaurantId?: string;
  customerId?: string;
  driverId?: string;
  type: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  readAt?: string;
  metadata?: {
    orderCode?: string;
    customerName?: string;
    restaurantName?: string;
    driverName?: string;
    total?: number;
    deliveryAddress?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  pagination: {
  total: number;
    unreadCount: number;
    limit: number;
    skip: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

export const notificationService = {
  // Restaurant notifications
  restaurant: {
    getNotifications: async (options?: {
    limit?: number;
      skip?: number;
    unreadOnly?: boolean;
    }): Promise<NotificationResponse> => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.skip) params.append('skip', options.skip.toString());
      if (options?.unreadOnly) params.append('unreadOnly', 'true');
      
      const queryString = params.toString();
      const url = `/api/v1/notifications/restaurant${queryString ? `?${queryString}` : ''}`;
      
      return apiClient.get(url);
    },

    markAsRead: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
      return apiClient.patch(`/api/v1/notifications/restaurant/${notificationId}/read`);
    },

    markAllAsRead: async (): Promise<{ success: boolean; message: string; markedCount: number }> => {
      return apiClient.patch('/api/v1/notifications/restaurant/read-all');
    },

    getUnreadCount: async (): Promise<UnreadCountResponse> => {
      return apiClient.get('/api/v1/notifications/restaurant/unread-count');
    },
  },

  // Customer notifications
  customer: {
    getNotifications: async (options?: {
      limit?: number;
      skip?: number;
      unreadOnly?: boolean;
    }): Promise<NotificationResponse> => {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.skip) params.append('skip', options.skip.toString());
      if (options?.unreadOnly) params.append('unreadOnly', 'true');
      
      const queryString = params.toString();
      const url = `/api/v1/notifications/customer${queryString ? `?${queryString}` : ''}`;
      
      return apiClient.get(url);
    },

    markAsRead: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
      return apiClient.patch(`/api/v1/notifications/customer/${notificationId}/read`);
    },

    markAllAsRead: async (): Promise<{ success: boolean; message: string; markedCount: number }> => {
      return apiClient.patch('/api/v1/notifications/customer/read-all');
    },

    getUnreadCount: async (): Promise<UnreadCountResponse> => {
      return apiClient.get('/api/v1/notifications/customer/unread-count');
    },
  },

  // Driver notifications
  driver: {
    getNotifications: async (options?: {
      limit?: number;
      skip?: number;
      unreadOnly?: boolean;
    }): Promise<NotificationResponse> => {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.skip) params.append('skip', options.skip.toString());
      if (options?.unreadOnly) params.append('unreadOnly', 'true');
      
      const queryString = params.toString();
      const url = `/api/v1/notifications/driver${queryString ? `?${queryString}` : ''}`;
      
      return apiClient.get(url);
    },

    markAsRead: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
      return apiClient.patch(`/api/v1/notifications/driver/${notificationId}/read`);
    },

    markAllAsRead: async (): Promise<{ success: boolean; message: string; markedCount: number }> => {
      return apiClient.patch('/api/v1/notifications/driver/read-all');
    },

    getUnreadCount: async (): Promise<UnreadCountResponse> => {
      return apiClient.get('/api/v1/notifications/driver/unread-count');
    },
  },

  // Admin notifications
  admin: {
    getNotifications: async (options?: {
      limit?: number;
      skip?: number;
      unreadOnly?: boolean;
    }): Promise<NotificationResponse> => {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.skip) params.append('skip', options.skip.toString());
      if (options?.unreadOnly) params.append('unreadOnly', 'true');
      
      const queryString = params.toString();
      const url = `/api/v1/notifications/admin${queryString ? `?${queryString}` : ''}`;
      
      return apiClient.get(url);
    },

    markAsRead: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
      return apiClient.patch(`/api/v1/notifications/admin/${notificationId}/read`);
    },

    markAllAsRead: async (): Promise<{ success: boolean; message: string; markedCount: number }> => {
      return apiClient.patch('/api/v1/notifications/admin/read-all');
    },

    getUnreadCount: async (): Promise<UnreadCountResponse> => {
      return apiClient.get('/api/v1/notifications/admin/unread-count');
    },
  },

  // Backward compatibility methods (deprecated)
  getRestaurantNotifications: async (options?: {
    limit?: number;
    skip?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationResponse> => {
    return notificationService.restaurant.getNotifications(options);
  },

  markAsRead: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
    return notificationService.restaurant.markAsRead(notificationId);
  },

  markAllAsRead: async (): Promise<{ success: boolean; message: string; markedCount: number }> => {
    return notificationService.restaurant.markAllAsRead();
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    return notificationService.restaurant.getUnreadCount();
  },
};