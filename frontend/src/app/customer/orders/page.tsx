'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components';
import { apiClient } from '../../../services/api.client';
import { cartService } from '../../../services/cart.service';
import { useCustomerAuth } from '@/contexts/AuthContext';
import { useCustomerNotifications } from '@/hooks/useSocket';

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
  recipientName?: string;
  recipientPhonePrimary?: string;
  recipientPhoneSecondary?: string;
  purchaserPhone?: string;
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
  const { showToast } = useToast();
  const { user } = useCustomerAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [draftCarts, setDraftCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'delivering' | 'history' | 'cancelled' | 'draft'>('delivering');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{[orderId: string]: Array<{id: string, message: string, sender: 'customer' | 'driver', timestamp: Date}>}>({});

  useEffect(() => {
    // If using cookie-based auth, rely on server session; optional client hint
    loadOrders();
    loadDraftCarts();
  }, []);

  // Realtime: listen for order status updates and refresh
  const { socket } = useCustomerNotifications((user as any)?.id || (user as any)?._id || '');
  useEffect(() => {
    if (!socket) return;
    const onStatus = (payload: any) => {
      try {
        const short = String(payload.orderId || '').slice(-8).toUpperCase();
        showToast(`Đơn #${short} cập nhật: ${payload.status}`, 'info');
      } catch {}
      loadOrders();
    };
    socket.on('order_status_update:v1', onStatus);
    return () => {
      socket.off('order_status_update:v1', onStatus);
    };
  }, [socket]);

  // Join per-order rooms so updates arrive even if user room mismatch
  useEffect(() => {
    if (!socket || !orders?.length) return;
    try {
      orders.forEach(o => socket.emit('join_order', o._id));
      return () => {
        orders.forEach(o => socket.emit('leave_order', o._id));
      };
    } catch {}
  }, [socket, orders.map?.(o => o._id).join(',')]);

  const loadOrders = async () => {
    try {
      console.log('🔍 Loading orders from /api/v1/orders/customer');
      const response = await apiClient.get('/api/v1/orders/customer');
      console.log('🔍 Orders response:', response);
      const ordersData = Array.isArray(response) ? response : ((response as any)?.data || []);
      console.log('🔍 Parsed orders data:', ordersData);
      setOrders(ordersData as any);
      
      // If unauthorized, redirect to login
    } catch (error) {
      console.error('Load orders error:', error);
      const status = (error as any)?.status || (error as any)?.response?.status;
      if (status === 401 || status === 403) {
        router.push('/customer/login');
        return;
      }
      showToast('Có lỗi xảy ra khi tải danh sách đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDraftCarts = async () => {
    try {
      const carts = await cartService.getAllCarts('cookie-auth');
      setDraftCarts(carts || []);
    } catch (error) {
      console.error('Load draft carts error:', error);
      showToast('Có lỗi xảy ra khi tải giỏ hàng nháp', 'error');
    }
  };

  const deleteDraftCart = async (cartId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giỏ hàng nháp này?')) {
      return;
    }

    try {
      // Find the restaurant ID for this cart
      const cart = draftCarts.find(c => c._id === cartId);
      if (!cart) {
        showToast('Không tìm thấy giỏ hàng', 'error');
        return;
      }

      await cartService.clearCart(cart.restaurantId._id, 'cookie-auth');
      showToast('Đã xóa giỏ hàng nháp', 'success');
      loadDraftCarts(); // Refresh draft carts
    } catch (error) {
      console.error('Delete draft cart error:', error);
      showToast('Không thể xóa giỏ hàng nháp', 'error');
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
      router.push('/customer/home');
    } catch (error) {
      console.error('Reorder error:', error);
      showToast('Không thể thêm món vào giỏ hàng', 'error');
    }
  };

  const openChat = (orderId: string) => {
    setChatOrderId(orderId);
    // Initialize chat messages if not exists
    if (!chatMessages[orderId]) {
      setChatMessages(prev => ({
        ...prev,
        [orderId]: []
      }));
    }
  };

  const closeChat = () => {
    setChatOrderId(null);
    setChatMessage('');
  };

  const sendMessage = async () => {
    if (!chatMessage.trim() || !chatOrderId) return;

    const newMessage = {
      id: Date.now().toString(),
      message: chatMessage.trim(),
      sender: 'customer' as const,
      timestamp: new Date()
    };

    setChatMessages(prev => ({
      ...prev,
      [chatOrderId]: [...(prev[chatOrderId] || []), newMessage]
    }));

    setChatMessage('');

    // TODO: Send message to backend/WebSocket
    showToast('Tin nhắn đã gửi', 'success');
  };

  // Separate orders into different categories
  const deliveringOrders = orders.filter(order => 
    ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
  );
  
  const historyOrders = orders.filter(order => 
    order.status === 'delivered'
  );
  
  const cancelledOrders = orders.filter(order => 
    order.status === 'cancelled'
  );

  // Get orders based on active tab
  const currentOrders = activeTab === 'delivering' ? deliveringOrders : 
                        activeTab === 'history' ? historyOrders : 
                        activeTab === 'cancelled' ? cancelledOrders : 
                        activeTab === 'draft' ? draftCarts : [];
  
  const filteredOrders = currentOrders.sort((a, b) => {
    if (activeTab === 'draft') {
      // For draft carts, sort by restaurant name
      return a.restaurantId?.name?.localeCompare(b.restaurantId?.name || '') || 0;
    }
    
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

          {/* Tab Navigation */}
          {(orders.length > 0 || draftCarts.length > 0) && (
            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('delivering')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'delivering'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Đang giao ({deliveringOrders.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'history'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Lịch sử ({historyOrders.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('cancelled')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'cancelled'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Đã hủy ({cancelledOrders.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('draft')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'draft'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Đơn nháp ({draftCarts.length})
                  </button>
                </div>

                {/* Sort Control - Only for orders */}
                {activeTab !== 'draft' && (
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
                )}
              </div>
            </div>
          )}

          {orders.length === 0 && draftCarts.length === 0 ? (
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
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                {activeTab === 'delivering' ? '🚚' : 
                 activeTab === 'history' ? '✅' : 
                 activeTab === 'cancelled' ? '❌' : '📝'}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {activeTab === 'delivering' 
                  ? 'Không có đơn hàng đang giao' 
                  : activeTab === 'history'
                  ? 'Không có đơn hàng đã hoàn thành'
                  : activeTab === 'cancelled'
                  ? 'Không có đơn hàng đã hủy'
                  : 'Không có giỏ hàng nháp'
                }
              </h2>
              <p className="text-gray-600 mb-6">
                {activeTab === 'delivering' 
                  ? 'Tất cả đơn hàng của bạn đã được giao xong' 
                  : activeTab === 'history'
                  ? 'Bạn chưa có đơn hàng nào đã hoàn thành'
                  : activeTab === 'cancelled'
                  ? 'Bạn chưa có đơn hàng nào đã hủy'
                  : 'Bạn chưa có giỏ hàng nào chưa đặt'
                }
              </p>
              {(activeTab === 'delivering' || activeTab === 'draft') && (
                <button
                  onClick={() => router.push('/customer')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {activeTab === 'draft' ? 'Tạo giỏ hàng mới' : 'Đặt món mới'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tab Content Header */}
              <div className="text-sm text-gray-600 mb-4">
                Hiển thị {filteredOrders.length} {activeTab === 'draft' ? 'giỏ hàng nháp' : 
                  activeTab === 'delivering' ? 'đơn hàng đang giao' :
                  activeTab === 'history' ? 'đơn hàng đã hoàn thành' :
                  activeTab === 'cancelled' ? 'đơn hàng đã hủy' : 'đơn hàng'}
              </div>
              
              {filteredOrders.map((order) => (
                <div key={order._id} className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {activeTab === 'draft' 
                          ? `Giỏ hàng - ${order.restaurantId?.name || 'Nhà hàng'}`
                          : `Đơn hàng #${order.orderCode || (order._id ? String(order._id).slice(-8).toUpperCase() : 'N/A')}`
                        }
                      </h3>
                      <p className="text-sm text-gray-600">
                        {activeTab === 'draft' 
                          ? `Tổng ${order.totalItems || 0} món - ${order.totalAmount?.toLocaleString('vi-VN')}đ`
                          : new Date(order.createdAt).toLocaleString('vi-VN')
                        }
                      </p>
                      {activeTab !== 'draft' && order.estimatedDeliveryTime && (
                        <p className="text-xs text-orange-600 mt-1">
                          🕐 Dự kiến giao: {new Date(order.estimatedDeliveryTime).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {activeTab === 'draft' ? (
                        <span className="text-2xl">📝</span>
                      ) : (
                        <>
                          <span className="text-2xl">{getStatusIcon(order.status)}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </>
                      )}
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
                    
                    {activeTab !== 'draft' && (
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
                    )}
                    
                    {activeTab === 'draft' && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Tổng quan</h4>
                        <p className="text-gray-600">{order.totalItems || 0} món</p>
                        <p className="text-sm text-gray-500">
                          Tổng tiền: {order.totalAmount?.toLocaleString('vi-VN')}đ
                        </p>
                        <p className="text-sm text-orange-600 mt-1">
                          📝 Chưa đặt hàng
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Recipient Information - Only for orders */}
                  {activeTab !== 'draft' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Người nhận</h4>
                        <p className="text-gray-600">{order.recipientName || 'Chưa cập nhật'}</p>
                        {order.recipientPhonePrimary && (
                          <p className="text-sm text-gray-500">📞 {order.recipientPhonePrimary}</p>
                        )}
                        {order.recipientPhoneSecondary && (
                          <p className="text-sm text-gray-500">📞 {order.recipientPhoneSecondary} (phụ)</p>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Người đặt</h4>
                        <p className="text-gray-600">{order.purchaserPhone || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  {order.specialInstructions && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-900 mb-1">📝 Ghi chú đơn hàng</h4>
                      <p className="text-yellow-800 text-sm">{order.specialInstructions}</p>
                    </div>
                  )}

                  {activeTab !== 'draft' && order.driverId && (
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
                              {/* Show options for draft carts */}
                              {activeTab === 'draft' && item.options && item.options.length > 0 && (
                                <div className="mt-1">
                                  {item.options.map((option, optIndex) => (
                                    <div key={optIndex} className="text-xs text-gray-500">
                                      <span className="font-medium">{option.name}:</span>
                                      {option.choices && option.choices.length > 0 && (
                                        <span className="ml-1">
                                          {option.choices.map((choice, choiceIndex) => (
                                            <span key={choiceIndex} className="text-green-700">
                                              {choice.name}
                                              {choice.quantity > 1 && ` (x${choice.quantity})`}
                                              {choice.price > 0 && ` (+${choice.price.toLocaleString('vi-VN')}đ)`}
                                              {choiceIndex < option.choices.length - 1 && ', '}
                                            </span>
                                          ))}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-gray-900 font-medium">
                            {activeTab === 'draft' 
                              ? (item.totalPrice || item.subtotal).toLocaleString('vi-VN') + 'đ'
                              : item.subtotal.toLocaleString('vi-VN') + 'đ'
                            }
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t space-y-1">
                      {activeTab === 'draft' ? (
                        <div className="flex justify-between text-lg font-semibold text-gray-900">
                          <span>Tổng tiền:</span>
                          <span>{order.totalAmount?.toLocaleString('vi-VN')}đ</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-gray-600">
                            <span>Tạm tính:</span>
                            <span>{order.subtotal?.toLocaleString('vi-VN') || 0}đ</span>
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
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {activeTab === 'draft' ? (
                        <>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>📝</span>
                            <span>Giỏ hàng nháp</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Continue Shopping Button */}
                            <button
                              onClick={() => router.push(`/customer/restaurants/${order.restaurantId._id}`)}
                              className="px-3 py-1 text-orange-600 hover:text-orange-700 font-medium text-sm border border-orange-300 rounded-md hover:bg-orange-50 transition-colors"
                            >
                              Tiếp tục mua
                            </button>
                            
                            {/* Checkout Button */}
                            <button
                              onClick={() => router.push(`/customer/checkout?restaurantId=${order.restaurantId._id}`)}
                              className="px-3 py-1 text-green-600 hover:text-green-700 font-medium text-sm border border-green-300 rounded-md hover:bg-green-50 transition-colors"
                            >
                              Đặt hàng
                            </button>
                            
                            {/* Delete Draft Button */}
                            <button
                              onClick={() => deleteDraftCart(order._id)}
                              className="px-3 py-1 text-red-600 hover:text-red-700 font-medium text-sm border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                            >
                              Xóa
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>💳</span>
                            <span>
                              {order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Chat with Driver Button */}
                            {order.driverId && (order.status === 'preparing' || order.status === 'ready') && (
                              <button
                                onClick={() => openChat(order._id)}
                                className="px-3 py-1 text-blue-600 hover:text-blue-700 font-medium text-sm border border-blue-300 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-1"
                              >
                                💬 Chat tài xế
                              </button>
                            )}
                            
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {chatOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">🚚</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Chat với tài xế</h3>
                  <p className="text-sm text-gray-500">Đơn hàng #{orders.find(o => o._id === chatOrderId)?.orderCode || chatOrderId.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={closeChat}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages[chatOrderId]?.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">💬</div>
                  <p>Chưa có tin nhắn nào</p>
                  <p className="text-sm">Hãy bắt đầu cuộc trò chuyện với tài xế</p>
                </div>
              ) : (
                chatMessages[chatOrderId]?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        msg.sender === 'customer'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === 'customer' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {msg.timestamp.toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}