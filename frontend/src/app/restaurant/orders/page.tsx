'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components';
import { useRestaurantNotifications } from '../../../hooks/useSocket';

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
  customerId: {
    _id: string;
    name: string;
    phone: string;
    email: string;
  };
  driverId?: {
    _id: string;
    name: string;
    phone: string;
  };
}

export default function RestaurantOrdersPage() {
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const { showToast, ToastContainer } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed'>('in-progress');
  
  // Setup restaurant notifications
  const token = typeof window !== 'undefined' ? localStorage.getItem('eatnow_token') : null;
  const { socket, connected } = useRestaurantNotifications(token || undefined, restaurantId);

  // Get restaurant ID from API
  useEffect(() => {
    loadRestaurantId();
  }, []);

  // Listen for order updates
  useEffect(() => {
    const handleOrderUpdate = (event: any) => {
      console.log('Order update received in restaurant orders:', event.detail);
      // Reload orders to get updated data
      if (restaurantId) {
        loadOrders();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('eatnow:order_update', handleOrderUpdate);
      return () => {
        window.removeEventListener('eatnow:order_update', handleOrderUpdate);
      };
    }
  }, [restaurantId]);

  const loadRestaurantId = async () => {
    const token = localStorage.getItem('eatnow_token');
    if (!token) return;

    try {
      const response = await fetch(`${api}/restaurants/mine`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const restaurant = await response.json();
        setRestaurantId(restaurant._id || restaurant.id);
      }
    } catch (error) {
      console.error('Load restaurant ID error:', error);
    }
  };


  useEffect(() => {
    if (socket) {
      const onNew = (data: any) => {
        showToast(`Có đơn hàng mới! Tổng: ${Number(data.order.total || 0).toLocaleString('vi-VN')}đ`, 'success');
        loadOrders();
      };
      const onUpd = (data: any) => {
        const short = String(data.orderId || '').slice(-8).toUpperCase();
        showToast(`Đơn hàng #${short} đã được cập nhật`, 'info');
        loadOrders();
      };
      socket.on('new_order', onNew);
      socket.on('order_update', onUpd);

      return () => {
        socket.off('new_order', onNew);
        socket.off('order_update', onUpd);
      };
    }
  }, [socket]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const token = localStorage.getItem('eatnow_token');
    if (!token) {
      router.push('/restaurant/login');
      return;
    }

    try {
      const response = await fetch(`${api}/orders/restaurant`, {
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
    if (activeTab === 'in-progress') {
      return ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status);
    } else {
      return ['delivered', 'cancelled'].includes(order.status);
    }
  });

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const token = localStorage.getItem('eatnow_token');
      // Stop ring immediately for better UX
      try { window.dispatchEvent(new CustomEvent('eatnow:stop_ring')); } catch {}
      const response = await fetch(`${api}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        showToast('Cập nhật trạng thái đơn hàng thành công', 'success');
        loadOrders(); // Reload orders
      } else {
        showToast('Không thể cập nhật trạng thái đơn hàng', 'error');
      }
    } catch (error) {
      console.error('Update order status error:', error);
      showToast('Có lỗi xảy ra khi cập nhật trạng thái đơn hàng', 'error');
    } finally {
      setUpdating(null);
    }
  };

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

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'delivered'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getNextStatusText = (currentStatus: string) => {
    const nextStatusMap = {
      pending: 'Xác nhận đơn hàng',
      confirmed: 'Bắt đầu chuẩn bị',
      preparing: 'Hoàn thành món ăn',
      ready: 'Đã giao hàng'
    };
    return nextStatusMap[currentStatus as keyof typeof nextStatusMap];
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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý đơn hàng</h1>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('in-progress')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'in-progress'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Đơn đang thực hiện ({orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length})
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
              <p className="text-gray-600">Các đơn hàng mới sẽ xuất hiện ở đây</p>
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
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getStatusIcon(order.status)}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    {/* Customer Info */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Thông tin khách hàng</h4>
                      <p className="text-gray-600">{order.customerId.name}</p>
                      <p className="text-sm text-gray-500">📞 {order.customerId.phone}</p>
                      <p className="text-sm text-gray-500">📧 {order.customerId.email}</p>
                    </div>
                    
                    {/* Delivery Info */}
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

                  {/* Items */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Món đã đặt</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
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
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>Tổng cộng:</span>
                      <span>{order.finalTotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <span>💳</span>
                      <span>
                        {order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>🕒</span>
                      <span>
                        {order.status === 'pending' && 'Chờ xác nhận từ nhà hàng'}
                        {order.status === 'confirmed' && 'Đã xác nhận, chờ chuẩn bị'}
                        {order.status === 'preparing' && 'Đang chuẩn bị món ăn'}
                        {order.status === 'ready' && 'Món ăn đã sẵn sàng'}
                        {order.status === 'delivered' && 'Đã giao hàng thành công'}
                        {order.status === 'cancelled' && 'Đơn hàng đã bị hủy'}
                      </span>
                    </div>
                    
                    {getNextStatus(order.status) && (
                      <button
                        onClick={() => updateOrderStatus(order._id, getNextStatus(order.status)!)}
                        disabled={updating === order._id}
                        className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        {updating === order._id ? 'Đang xử lý...' : getNextStatusText(order.status)}
                      </button>
                    )}
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