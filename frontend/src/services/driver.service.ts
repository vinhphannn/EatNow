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
    // Align with backend: POST /driver/location/update with latitude/longitude
    const body = { latitude: payload.lat, longitude: payload.lng } as any;
    return apiClient.post('/driver/location/update', body);
  }

  async setAvailability(isOnline: boolean): Promise<{ success: boolean; isOnline: boolean }> {
    return apiClient.post('/driver/location/status', { isOnline });
  }

  async getMyOrders(params?: { status?: string; page?: number; limit?: number }): Promise<{ orders: DriverOrderSummary[]; pagination?: any } | DriverOrderSummary[]> {
    // Align with backend singular prefix where applicable
    try {
      return await apiClient.get('/driver/orders', { params });
    } catch (e) {
      return await apiClient.get('/drivers/me/orders', { params });
    }
  }

  async getOrderById(orderId: string): Promise<DriverOrderSummary> {
    try {
      return await apiClient.get<DriverOrderSummary>(`/driver/orders/${orderId}`);
    } catch {
      return await apiClient.get<DriverOrderSummary>(`/drivers/orders/${orderId}`);
    }
  }

  async acceptOrder(orderId: string): Promise<DriverOrderSummary> {
    return apiClient.post<DriverOrderSummary>(`/driver/orders/${orderId}/accept`);
  }

  async rejectOrder(orderId: string, note?: string): Promise<DriverOrderSummary> {
    return apiClient.post<DriverOrderSummary>(`/driver/orders/${orderId}/reject`, { note });
  }

  async updateOrderStatus(orderId: string, payload: UpdateDriverOrderStatusRequest): Promise<DriverOrderSummary> {
    // Map some common transitions to explicit endpoints if needed
    return apiClient.post<DriverOrderSummary>(`/driver/orders/${orderId}/status`, payload as any);
  }

  async arrivedAtRestaurant(orderId: string) {
    return apiClient.post(`/driver/orders/${orderId}/arrived-restaurant`);
  }

  async pickedUp(orderId: string) {
    return apiClient.post(`/driver/orders/${orderId}/picked-up`);
  }

  async arrivedAtCustomer(orderId: string) {
    return apiClient.post(`/driver/orders/${orderId}/arrived-customer`);
  }

  async delivered(orderId: string) {
    return apiClient.post(`/driver/orders/${orderId}/delivered`);
  }

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


