'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components';
import { apiClient } from '../../../services/api.client';

interface Order {
  _id: string;
  orderCode?: string;
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
  deliveryDistance?: number;
  deliveryAddress: {
    label: string;
    addressLine: string;
    latitude: number;
    longitude: number;
    note?: string;
  };
  specialInstructions: string;
  paymentMethod: 'cash' | 'bank_transfer';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryTime?: string;
  restaurantId: {
    _id: string;
    name: string;
    address: string;
    phone?: string;
    imageUrl?: string;
  };
  driverId?: {
    _id: string;
    name: string;
    phone: string;
    vehicleType?: string;
    licensePlate?: string;
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const token = localStorage.getItem('eatnow_token');
    if (!token) {
      router.push('/customer/login');
      return;
    }

    try {
      const response = await apiClient.get('/api/v1/orders/customer');
      const ordersData = Array.isArray(response) ? response : ((response as any)?.data || []);
      setOrders(ordersData as any);
      console.log('Orders loaded:', ordersData);
      console.log('Number of orders:', ordersData.length);
      
      if (ordersData.length === 0) {
        console.log('No orders found - checking if user is logged in');
        const token = localStorage.getItem('eatnow_token');
        console.log('Token exists:', !!token);
      }
    } catch (error) {
      console.error('Load orders error:', error);
      showToast('Có lỗi xảy ra khi tải danh sách đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      await apiClient.put(`/api/v1/orders/${orderId}/cancel`);
      showToast('Đơn hàng đã được hủy', 'success');
      loadOrders(); // Refresh orders
    } catch (error) {
      console.error('Cancel order error:', error);
      showToast('Không thể hủy đơn hàng', 'error');
    }
  };

  const reorderItems = async (order: Order) => {
    try {
      // Add items to cart
      for (const item of order.items) {
        await apiClient.post('/api/v1/cart/add', {
          itemId: item.itemId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || ''
        });
      }
      showToast('Đã thêm món vào giỏ hàng', 'success');
      router.push('/customer/cart');
    } catch (error) {
      console.error('Reorder error:', error);
      showToast('Không thể thêm món vào giỏ hàng', 'error');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang chuẩn bị',
      ready: 'Sẵn sàng giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const iconMap = {
      pending: '⏳',
      confirmed: '✅',
      preparing: '👨‍🍳',
      ready: '📦',
      delivered: '🚚',
      cancelled: '❌'
    };
    return iconMap[status as keyof typeof iconMap] || '❓';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải danh sách đơn hàng...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
            <button
              onClick={() => router.push('/customer/home')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Đặt món mới
            </button>
          </div>

          {/* Filter and Sort Controls */}
          {orders.length > 0 && (
            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Lọc theo:</span>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">Tất cả</option>
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="preparing">Đang chuẩn bị</option>
                    <option value="ready">Sẵn sàng giao</option>
                    <option value="delivered">Đã giao</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Sắp xếp:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                  </select>
                </div>

                <div className="ml-auto text-sm text-gray-600">
                  Hiển thị {filteredOrders.length} / {orders.length} đơn hàng
                </div>
              </div>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa có đơn hàng nào</h2>
              <p className="text-gray-600 mb-6">Hãy đặt món để xem đơn hàng ở đây</p>
              <button
                onClick={() => router.push('/customer')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Đặt món ngay
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div key={order._id} className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Đơn hàng #{order.orderCode || order._id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </p>
                      {order.estimatedDeliveryTime && (
                        <p className="text-xs text-orange-600 mt-1">
                          🕐 Dự kiến giao: {new Date(order.estimatedDeliveryTime).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getStatusIcon(order.status)}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Nhà hàng</h4>
                      <p className="text-gray-600">{order.restaurantId.name}</p>
                      <p className="text-sm text-gray-500">{order.restaurantId.address}</p>
                      {order.restaurantId.phone && (
                        <p className="text-sm text-gray-500">📞 {order.restaurantId.phone}</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Giao đến</h4>
                      <p className="text-gray-600">{order.deliveryAddress.addressLine}</p>
                      {order.deliveryAddress.note && (
                        <p className="text-sm text-gray-500 mt-1">
                          📝 {order.deliveryAddress.note}
                        </p>
                      )}
                      {order.deliveryDistance && (
                        <p className="text-sm text-orange-600 mt-1">
                          📍 Khoảng cách: {order.deliveryDistance.toFixed(1)}km
                        </p>
                      )}
                    </div>
                  </div>

                  {order.driverId && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-1">🚚 Tài xế giao hàng</h4>
                      <p className="text-blue-700">{order.driverId.name}</p>
                      <p className="text-sm text-blue-600">📞 {order.driverId.phone}</p>
                      {order.driverId.vehicleType && (
                        <p className="text-sm text-blue-600">🚗 {order.driverId.vehicleType}</p>
                      )}
                      {order.driverId.licensePlate && (
                        <p className="text-sm text-blue-600">🔢 {order.driverId.licensePlate}</p>
                      )}
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">×{item.quantity}</span>
                            <div>
                              <span className="text-gray-900">{item.name}</span>
                              {item.specialInstructions && (
                                <p className="text-xs text-gray-500 mt-1">
                                  📝 {item.specialInstructions}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-gray-900 font-medium">
                            {item.subtotal.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t space-y-1">
                      <div className="flex justify-between text-gray-600">
                        <span>Tạm tính:</span>
                        <span>{order.total.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Phí giao hàng:</span>
                        <span>
                          {order.deliveryFee === 0 ? 'Miễn phí' : `${order.deliveryFee.toLocaleString('vi-VN')}đ`}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold text-gray-900">
                        <span>Tổng cộng:</span>
                        <span>{order.finalTotal.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>💳</span>
                        <span>
                          {order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Cancel Order Button */}
                        {(order.status === 'pending' || order.status === 'confirmed') && (
                          <button
                            onClick={() => cancelOrder(order._id)}
                            className="px-3 py-1 text-red-600 hover:text-red-700 font-medium text-sm border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                          >
                            Hủy đơn
                          </button>
                        )}
                        
                        {/* Reorder Button */}
                        {order.status === 'delivered' && (
                          <button
                            onClick={() => reorderItems(order)}
                            className="px-3 py-1 text-orange-600 hover:text-orange-700 font-medium text-sm border border-orange-300 rounded-md hover:bg-orange-50 transition-colors"
                          >
                            Đặt lại
                          </button>
                        )}
                        
                        {/* View Details Button */}
                        <button
                          onClick={() => router.push(`/customer/orders/${order._id}`)}
                          className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                        >
                          Xem chi tiết →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </main>
  );
}