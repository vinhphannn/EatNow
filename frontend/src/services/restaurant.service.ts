import { apiClient } from './api.client';

export interface Restaurant {
  _id: string;
  ownerUserId: string;
  name: string;
  description?: string;
  address?: string;
  imageUrl?: string;
  imageId?: string;
  
  // Business info
  businessLicense?: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  
  // Location
  latitude?: number;
  longitude?: number;
  city?: string;
  district?: string;
  ward?: string;
  
  // Operating hours
  openDays: number[];
  openTime: string;
  closeTime: string;
  
  // Status
  status: 'pending' | 'active' | 'suspended' | 'closed';
  isOpen: boolean;
  isAcceptingOrders: boolean;
  isDeliveryAvailable: boolean;
  isPickupAvailable: boolean;
  
  // Performance
  rating: number;
  reviewCount: number;
  orderCount: number;
  totalRevenue: number;
  
  // Delivery settings
  deliveryTime: string;
  deliveryFee: number;
  minOrderAmount: number;
  freeDeliveryThreshold: number;
  maxDeliveryDistance: number;
  
  // Category and tags
  category?: string;
  tags: string[];
  
  // Settings
  autoAcceptOrders: boolean;
  preparationTime: number;
  allowSpecialRequests: boolean;
  allowCustomization: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantStats {
  // Today's stats
  todayOrders: number;
  todayRevenue: number;
  todayGrowth: number; // % compared to yesterday
  
  // Current status
  pendingOrders: number;
  activeOrders: number;
  preparingOrders: number;
  readyOrders: number;
  
  // Menu stats
  totalMenuItems: number;
  activeMenuItems: number;
  newItemsThisMonth: number;
  
  // Performance metrics
  averageRating: number;
  totalReviews: number;
  completionRate: number;
  avgPreparationTime: number;
  onTimeDeliveryRate: number;
  
  // Monthly stats
  monthlyOrders: number;
  monthlyRevenue: number;
  monthlyGrowth: number; // % compared to last month
  avgOrderValue: number;
  
  // Popular items
  topSellingItems: Array<{
    itemId: string;
    name: string;
    orders: number;
    revenue: number;
    quantity: number;
    averageRating: number;
  }>;
  
  // Recent performance
  weeklyStats: Array<{
    date: string;
    orders: number;
    revenue: number;
    avgRating: number;
  }>;
  
  // Customer insights
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  
  // Financial insights
  totalEarnings: number;
  platformCommission: number;
  netEarnings: number;
  payoutPending: number;
  
  // Operational insights
  peakHours: string[];
  busiestDay: string;
  averageOrderPreparationTime: number;
  deliverySuccessRate: number;
}

export interface RecentOrder {
  _id: string;
  code: string;
  customer: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
  };
  items: Array<{
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
    specialInstructions?: string;
  }>;
  total: number;
  deliveryFee: number;
  finalTotal: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentMethod: 'cash' | 'bank_transfer';
  createdAt: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  specialInstructions?: string;
  deliveryAddress: {
    label: string;
    addressLine: string;
    latitude: number;
    longitude: number;
    note?: string;
  };
  driver?: {
    _id: string;
    name: string;
    phone?: string;
    vehicleType?: string;
    licensePlate?: string;
  };
  trackingHistory?: Array<{
    status: string;
    timestamp: string;
    note?: string;
    updatedBy?: string;
  }>;
}

export interface RestaurantAnalytics {
  // Revenue analytics
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
    avgOrderValue: number;
  }>;
  
  revenueByHour: Array<{
    hour: number;
    revenue: number;
    orders: number;
  }>;
  
  // Order analytics
  orderStatusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  
  orderTimeline: Array<{
    timestamp: string;
    status: string;
    count: number;
  }>;
  
  // Customer analytics
  customerSegments: Array<{
    segment: string;
    count: number;
    revenue: number;
    avgOrderValue: number;
  }>;
  
  // Menu analytics
  menuPerformance: Array<{
    itemId: string;
    name: string;
    category?: string;
    orders: number;
    revenue: number;
    rating: number;
    popularity: number;
    profitMargin: number;
  }>;
  
  // Delivery analytics
  deliveryPerformance: {
    avgDeliveryTime: number;
    onTimeRate: number;
    distanceStats: {
      avgDistance: number;
      maxDistance: number;
      minDistance: number;
    };
    driverPerformance: Array<{
      driverId: string;
      name: string;
      orders: number;
      avgDeliveryTime: number;
      rating: number;
    }>;
  };
  
  // Financial analytics
  financialSummary: {
    totalRevenue: number;
    totalCosts: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    platformCommission: number;
    deliveryFees: number;
    paymentFees: number;
  };
}

class RestaurantService {
  // Restaurant Management
  async getRestaurant(): Promise<Restaurant> {
    return apiClient.get('/api/v1/restaurants/mine');
  }

  async updateRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
    return apiClient.put('/api/v1/restaurants/mine', data);
  }

  async updateRestaurantStatus(status: 'active' | 'inactive' | 'busy'): Promise<void> {
    return apiClient.patch('/api/v1/restaurants/mine/status', { status });
  }

  async updateOperatingHours(data: {
    openDays: number[];
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  }): Promise<void> {
    return apiClient.patch('/api/v1/restaurants/mine/operating-hours', data);
  }

  async updateDeliverySettings(data: {
    deliveryFee: number;
    minOrderAmount: number;
    freeDeliveryThreshold: number;
    maxDeliveryDistance: number;
    deliveryTime: string;
    isDeliveryAvailable: boolean;
    isPickupAvailable: boolean;
  }): Promise<void> {
    return apiClient.patch('/api/v1/restaurants/mine/delivery-settings', data);
  }

  // Dashboard & Analytics
  async getDashboardStats(): Promise<RestaurantStats> {
    return apiClient.get('/api/v1/restaurants/mine/stats/dashboard');
  }

  async getAnalytics(period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<RestaurantAnalytics> {
    return apiClient.get(`/api/v1/restaurants/mine/analytics?period=${period}`);
  }

  async getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
    return apiClient.get(`/api/v1/restaurants/mine/orders/recent?limit=${limit}`);
  }

  async getTopSellingItems(period: 'today' | 'week' | 'month' = 'month', limit: number = 5): Promise<RestaurantStats['topSellingItems']> {
    return apiClient.get(`/api/v1/restaurants/mine/stats/top-selling-items?period=${period}&limit=${limit}`);
  }

  // Performance Metrics
  async getPerformanceMetrics(): Promise<{
    completionRate: number;
    avgPreparationTime: number;
    onTimeDeliveryRate: number;
    customerSatisfaction: number;
    orderAccuracy: number;
  }> {
    return apiClient.get('/api/v1/restaurants/mine/performance');
  }

  async getRevenueAnalytics(period: 'today' | 'week' | 'month' | 'quarter' | 'year'): Promise<{
    totalRevenue: number;
    growth: number;
    breakdown: Array<{
      date: string;
      revenue: number;
      orders: number;
    }>;
  }> {
    return apiClient.get(`/api/v1/restaurants/mine/analytics/revenue?period=${period}`);
  }

  // Menu Management
  async getMenuItems(): Promise<any[]> {
    return apiClient.get('/api/v1/restaurants/mine/items');
  }

  async getMenuItemStats(itemId: string): Promise<{
    orders: number;
    revenue: number;
    rating: number;
    popularity: number;
    trends: Array<{
      date: string;
      orders: number;
      revenue: number;
    }>;
  }> {
    return apiClient.get(`/api/v1/restaurants/mine/items/${itemId}/stats`);
  }

  // Order Management
  async getOrders(filters?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    orders: RecentOrder[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return apiClient.get('/api/v1/restaurants/mine/orders', { params: filters });
  }

  async getOrderDetails(orderId: string): Promise<RecentOrder> {
    return apiClient.get(`/api/v1/orders/${orderId}`);
  }

  async updateOrderStatus(orderId: string, status: string, note?: string): Promise<void> {
    return apiClient.patch(`/api/v1/orders/${orderId}/status`, { status, note });
  }

  // Customer Management
  async getCustomers(filters?: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'orders' | 'revenue' | 'lastOrder';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    customers: Array<{
      _id: string;
      name: string;
      email: string;
      phone?: string;
      avatarUrl?: string;
      totalOrders: number;
      totalSpent: number;
      lastOrderAt?: string;
      averageOrderValue: number;
      loyaltyTier: string;
      tags: string[];
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return apiClient.get('/api/v1/restaurants/mine/customers', { params: filters });
  }

  async getCustomerDetails(customerId: string): Promise<{
    customer: any;
    orders: RecentOrder[];
    stats: {
      totalOrders: number;
      totalSpent: number;
      averageOrderValue: number;
      lastOrderAt?: string;
      favoriteItems: Array<{
        itemId: string;
        name: string;
        orders: number;
      }>;
    };
  }> {
    return apiClient.get(`/api/v1/restaurants/mine/customers/${customerId}`);
  }

  // Reviews & Ratings
  async getReviews(filters?: {
    rating?: number;
    page?: number;
    limit?: number;
    sortBy?: 'date' | 'rating' | 'helpful';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    reviews: Array<{
      _id: string;
      customer: {
        _id: string;
        name: string;
        avatarUrl?: string;
      };
      rating: number;
      comment?: string;
      createdAt: string;
      helpfulCount: number;
      response?: string;
      responseAt?: string;
      orderId: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: Array<{
        rating: number;
        count: number;
        percentage: number;
      }>;
    };
  }> {
    return apiClient.get('/api/v1/restaurants/mine/reviews', { params: filters });
  }

  async respondToReview(reviewId: string, response: string): Promise<void> {
    return apiClient.post(`/api/v1/restaurants/mine/reviews/${reviewId}/response`, { response });
  }

  // Notifications & Alerts
  async getNotifications(filters?: {
    type?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    notifications: Array<{
      _id: string;
      type: string;
      title: string;
      message: string;
      isRead: boolean;
      createdAt: string;
      actionUrl?: string;
      data?: any;
    }>;
    unreadCount: number;
  }> {
    return apiClient.get('/api/v1/restaurants/mine/notifications', { params: filters });
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    return apiClient.patch(`/api/v1/restaurants/mine/notifications/${notificationId}/read`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    return apiClient.patch('/api/v1/restaurants/mine/notifications/read-all');
  }

  // Financial Management
  async getPayouts(filters?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    payouts: Array<{
      _id: string;
      amount: number;
      status: string;
      settlementStartDate: string;
      settlementEndDate: string;
      orderCount: number;
      grossAmount: number;
      commissionAmount: number;
      netAmount: number;
      processedAt?: string;
      completedAt?: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return apiClient.get('/api/v1/restaurants/mine/payouts', { params: filters });
  }

  async getFinancialSummary(period: 'today' | 'week' | 'month' | 'quarter' | 'year'): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    platformCommission: number;
    netEarnings: number;
    pendingPayout: number;
    completedPayouts: number;
    breakdown: Array<{
      date: string;
      revenue: number;
      orders: number;
      commission: number;
      netEarnings: number;
    }>;
  }> {
    return apiClient.get(`/api/v1/restaurants/mine/financial-summary?period=${period}`);
  }

  // Promotions & Marketing
  async getActivePromotions(): Promise<Array<{
    _id: string;
    name: string;
    code: string;
    type: string;
    value: number;
    usageCount: number;
    usageLimit: number;
    startDate: string;
    endDate: string;
    applicableItems?: string[];
  }>> {
    return apiClient.get('/api/v1/restaurants/mine/promotions/active');
  }

  async createPromotion(data: {
    name: string;
    code: string;
    type: 'percentage' | 'fixed_amount' | 'free_delivery';
    value: number;
    minOrderAmount?: number;
    usageLimit?: number;
    startDate: string;
    endDate: string;
    applicableItems?: string[];
  }): Promise<void> {
    return apiClient.post('/api/v1/restaurants/mine/promotions', data);
  }

  // Real-time Updates
  async subscribeToUpdates(): Promise<WebSocket> {
    // Cookie-based auth: WebSocket will include cookies automatically
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'}/restaurants/updates`;
    return new WebSocket(wsUrl);
  }

  // Export & Reports
  async exportOrders(format: 'csv' | 'excel', filters?: {
    fromDate?: string;
    toDate?: string;
    status?: string;
  }): Promise<Blob> {
    const response = await apiClient.get('/api/v1/restaurants/mine/orders/export', {
      params: { format, ...filters }
    });
    return response as Blob;
  }

  async exportFinancialReport(period: 'month' | 'quarter' | 'year', format: 'pdf' | 'excel'): Promise<Blob> {
    const response = await apiClient.get('/api/v1/restaurants/mine/financial-report', {
      params: { period, format }
    });
    return response as Blob;
  }
}

export const restaurantService = new RestaurantService();