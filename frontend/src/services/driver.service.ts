import { apiClient } from './api.client';
import type {
  DriverDashboardStats,
  DriverOrderSummary,
  DriverProfile,
  DriverEarningsSummary,
  EarningEntry,
  PayoutRequest,
  UpdateDriverLocationRequest,
  UpdateDriverOrderStatusRequest,
} from '@/types/driver';

class DriverService {
  async getMyStats(): Promise<DriverDashboardStats> {
    try {
      return await apiClient.get<DriverDashboardStats>('/drivers/me/stats');
    } catch (e: any) {
      // Graceful fallback when driver profile is not created yet OR endpoint missing
      if (e?.status === 404) {
        return {
          todayOrders: 0,
          todayEarnings: 0,
          completedOrders: 0,
          rating: 0,
          totalDeliveries: 0,
          averageDeliveryTime: 0,
          onTimeRate: 0,
          completionRate: 0,
        };
      }
      return {
        todayOrders: 0,
        todayEarnings: 0,
        completedOrders: 0,
        rating: 0,
        totalDeliveries: 0,
        averageDeliveryTime: 0,
        onTimeRate: 0,
        completionRate: 0,
      };
    }
  }

  async getMyProfile(): Promise<DriverProfile> {
    return apiClient.get<DriverProfile>('/drivers/me');
  }

  async updateMyProfile(payload: Partial<DriverProfile>): Promise<{ ok: boolean }> {
    return apiClient.patch('/drivers/me', payload as any);
  }

  async updateMyLocation(payload: UpdateDriverLocationRequest): Promise<{ success: boolean } & Partial<DriverProfile>> {
    // Use new endpoint: POST /driver/orders/location
    const body = { latitude: payload.lat, longitude: payload.lng } as any;
    return apiClient.post('/driver/orders/location', body);
  }

  async setAvailability(isOnline: boolean): Promise<{ success: boolean; isOnline: boolean }> {
    return apiClient.post('/driver/location/status', { isOnline });
  }

  async checkIn(): Promise<{ success: boolean; message: string; status?: string }> {
    return apiClient.post('/driver/orders/checkin');
  }

  async checkOut(): Promise<{ success: boolean; message: string; status?: string }> {
    return apiClient.post('/driver/orders/checkout');
  }

  async getDriverStatus(): Promise<{ success: boolean; data?: { status: string; deliveryStatus: string | null; currentOrderId?: string; lastCheckinAt?: string; lastCheckoutAt?: string } }> {
    return apiClient.get('/drivers/me/status');
  }

  async getMyOrders(params?: { status?: string; page?: number; limit?: number }): Promise<{ orders: DriverOrderSummary[]; pagination?: any } | DriverOrderSummary[]> {
    // Get current orders for driver (incomplete orders)
    return await apiClient.get('/drivers/me/current-orders', { params });
  }

  async getOrderById(orderId: string): Promise<DriverOrderSummary> {
    try {
      return await apiClient.get<DriverOrderSummary>(`/driver/orders/${orderId}`);
    } catch {
      return await apiClient.get<DriverOrderSummary>(`/drivers/orders/${orderId}`);
    }
  }

  async acceptOrder(orderId: string, estimatedArrivalTime?: number): Promise<DriverOrderSummary> {
    return apiClient.post<DriverOrderSummary>('/driver/orders/accept', { 
      orderId, 
      estimatedArrivalTime 
    });
  }

  async rejectOrder(orderId: string, reason?: string): Promise<DriverOrderSummary> {
    return apiClient.post<DriverOrderSummary>('/driver/orders/reject', { 
      orderId, 
      reason 
    });
  }

  // Method này đã được thay thế bởi updateOrderStatus
  // Không cần thiết nữa

  async getDriverHistory(page = 1, limit = 20): Promise<{
    orders: DriverOrderSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return apiClient.get(`/driver/orders/assignment/history?page=${page}&limit=${limit}`);
  }

  async updateOrderStatus(orderId: string, payload: UpdateDriverOrderStatusRequest): Promise<DriverOrderSummary> {
    return apiClient.post<DriverOrderSummary>('/driver/orders/assignment/update-status', {
      orderId,
      ...payload
    });
  }

  // Các method này không được sử dụng - frontend sử dụng updateOrderStatus

  // Method này đã được thay thế bởi updateOrderStatus
  // Không cần thiết nữa

  async getEarningsSummary(): Promise<DriverEarningsSummary> {
    return apiClient.get<DriverEarningsSummary>('/drivers/me/earnings/summary');
  }

  async getEarningsHistory(params?: { page?: number; limit?: number; fromDate?: string; toDate?: string }): Promise<{ data: EarningEntry[]; pagination?: any } | EarningEntry[]> {
    return apiClient.get('/drivers/me/earnings', { params });
  }

  async getOrderHistory(params?: { page?: number; limit?: number; status?: string }) {
    return apiClient.get('/drivers/me/history', { params });
  }

  async requestPayout(payload: PayoutRequest): Promise<{ success: boolean; payoutId?: string }> {
    return apiClient.post('/drivers/me/payouts', payload);
  }
}

export const driverService = new DriverService();
export default driverService;


