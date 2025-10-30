import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000, // 20s để tránh timeout do cold start Render
});

api.interceptors.request.use((config) => {
  if (global.__DRIVER_TOKEN__) {
    config.headers.Authorization = `Bearer ${global.__DRIVER_TOKEN__}`;
  }
  return config;
});

const driverApi = {
  async ping() {
    try {
      const { data } = await api.get('/health');
      return data;
    } catch (e) {
      return null;
    }
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password, role: 'driver' });
    if (data?.token) {
      global.__DRIVER_TOKEN__ = data.token;
    }
    return data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      global.__DRIVER_TOKEN__ = null;
    }
  },

  async getActiveOrders() {
    const { data } = await api.get('/driver/orders/active');
    return data?.orders || [];
  },

  async getOrderById(orderId) {
    const { data } = await api.get(`/driver/orders/${orderId}`);
    return data;
  },

  async acceptOrder(orderId) {
    const { data } = await api.post(`/driver/orders/${orderId}/accept`);
    return data;
  },

  async rejectOrder(orderId) {
    const { data } = await api.post(`/driver/orders/${orderId}/reject`);
    return data;
  },

  async completeOrder(orderId) {
    const { data } = await api.post(`/driver/orders/${orderId}/complete`);
    return data;
  },

  async updateLocation({ latitude, longitude }) {
    const { data } = await api.post('/driver/orders/location', { latitude, longitude });
    return data;
  },
};

export default driverApi;
