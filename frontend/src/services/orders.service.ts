import { apiClient } from '@/services/api.client';

export const ordersService = {
  async listAvailableOrders() {
    return apiClient.get('/api/v1/orders/available');
  },

  async listMyActiveOrders() {
    return apiClient.get('/api/v1/orders/mine/active');
  },

  async acceptOrder(orderId: string) {
    return apiClient.patch(`/api/v1/orders/${orderId}/accept`);
  },

  async completeOrder(orderId: string) {
    return apiClient.patch(`/api/v1/orders/${orderId}/complete`);
  },

  async listMineRestaurant(params?: { page?: number; limit?: number; status?: string }) {
    return apiClient.get('/api/v1/restaurants/mine/orders', { params });
  },
};

export type OrdersService = typeof ordersService;








