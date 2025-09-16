'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components/Toast';
import { useCustomerNotifications } from '../../../hooks/useSocket';

interface Order {
  _id: string;
  items: Array<{
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  total: number;
  deliveryFee: number;
  finalTotal: number;
  deliveryAddress: string | {
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
  restaurantId: {
    _id: string;
    name: string;
    address: string;
  };
  driverId?: {
    _id: string;
    name: string;
    phone: string;
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const { showToast, ToastContainer } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('eatnow_token') : null), []);
  useCustomerNotifications(token || undefined);

  useEffect(() => {
    loadOrders();
  }, []);

  // Listen for order status updates
  useEffect(() => {
    const handleOrderStatusUpdate = (event: any) => {
      console.log('Order status update received in orders page:', event.detail);
      // Reload orders to get updated status
      loadOrders();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('eatnow:order_status_update', handleOrderStatusUpdate);
      return () => {
        window.removeEventListener('eatnow:order_status_update', handleOrderStatusUpdate);
      };
    }
  }, []);

  const loadOrders = async () => {
    const token = localStorage.getItem('eatnow_token');
    if (!token) {
      router.push('/customer/login');
      return;
    }

    try {
      const response = await fetch(`${api}/orders/customer`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      } else {
        showToast('Không thể tải danh sách đơn hàng', 'error');
      }
    } catch (error) {
      console.error('Load orders error:', error);
      showToast('Có lỗi xảy ra khi tải danh sách đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') {
      return ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status);
    } else {
      return ['delivered', 'cancelled'].includes(order.status);
    }
  });

  // Refresh list when receiving realtime updates
  useEffect(() => {
    const handler = (e: Event) => {
      // Optional: can inspect (e as CustomEvent).detail to update specific order
      loadOrders();
    };
    window.addEventListener('eatnow:order_update', handler as EventListener);
    return () => window.removeEventListener('eatnow:order_update', handler as EventListener);
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Đơn hàng của tôi</h1>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'pending'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Đơn chờ giao ({orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'completed'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Đơn đã hoàn thành ({orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length})
                </button>
              </nav>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
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
                <div key={order._id} className="bg-white rounded-xl border p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Đơn hàng #{order._id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </p>
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
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Giao đến</h4>
                      <p className="text-gray-600">
                        {typeof order.deliveryAddress === 'string' 
                          ? order.deliveryAddress 
                          : order.deliveryAddress?.addressLine || 'Địa chỉ không xác định'
                        }
                      </p>
                      {order.specialInstructions && (
                        <p className="text-sm text-gray-500 mt-1">
                          Ghi chú: {order.specialInstructions}
                        </p>
                      )}
                    </div>
                  </div>

                  {order.driverId && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-1">Tài xế giao hàng</h4>
                      <p className="text-blue-700">{order.driverId.name}</p>
                      <p className="text-sm text-blue-600">{order.driverId.phone}</p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">×{item.quantity}</span>
                            <span className="text-gray-900">{item.name}</span>
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
                      
                      <button
                        onClick={() => router.push(`/customer/orders/${order._id}`)}
                        className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                      >
                        Xem chi tiết →
                      </button>
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