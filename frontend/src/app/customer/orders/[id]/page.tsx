'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '../../../../components/Toast';
import { useCustomerNotifications } from '../../../../hooks/useSocket';

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
  restaurantId: {
    _id: string;
    name: string;
    address: string;
    phone: string;
  };
  driverId?: {
    _id: string;
    name: string;
    phone: string;
  };
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const { showToast, ToastContainer } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('eatnow_token') : null), []);
  useCustomerNotifications(token || undefined);

  useEffect(() => {
    if (params.id) {
      loadOrder(params.id as string);
    }
  }, [params.id]);

  // Listen for order status updates
  useEffect(() => {
    const handleOrderStatusUpdate = (event: any) => {
      console.log('Order status update received in order detail:', event.detail);
      const { orderId, order: updatedOrder } = event.detail;
      
      // If this update is for the current order, update the state
      if (orderId === params.id) {
        if (updatedOrder) {
          setOrder(updatedOrder);
        } else {
          // Reload the order if we don't have the full order data
          loadOrder(orderId);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('eatnow:order_status_update', handleOrderStatusUpdate);
      return () => {
        window.removeEventListener('eatnow:order_status_update', handleOrderStatusUpdate);
      };
    }
  }, [params.id]);

  // Listen for driver location updates
  useEffect(() => {
    const handleDriverLocationUpdate = (event: any) => {
      if (event.detail.data.orderId === params.id) {
        setDriverLocation({
          latitude: event.detail.data.latitude,
          longitude: event.detail.data.longitude,
        });
        console.log('Driver location updated:', event.detail.data);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('eatnow:driver_location_update', handleDriverLocationUpdate);
      return () => {
        window.removeEventListener('eatnow:driver_location_update', handleDriverLocationUpdate);
      };
    }
  }, [params.id]);

  const loadOrder = async (orderId: string) => {
    const token = localStorage.getItem('eatnow_token');
    if (!token) {
      router.push('/customer/login');
      return;
    }

    try {
      const response = await fetch(`${api}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      } else {
        showToast('Không thể tải chi tiết đơn hàng', 'error');
        router.push('/customer/orders');
      }
    } catch (error) {
      console.error('Load order error:', error);
      showToast('Có lỗi xảy ra khi tải chi tiết đơn hàng', 'error');
      router.push('/customer/orders');
    } finally {
      setLoading(false);
    }
  };

  // When an order update event is received, re-fetch details (simple approach: refocus)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.orderId && params.id === detail.orderId) {
        loadOrder(detail.orderId);
      } else if (params.id) {
        // If unknown, still refresh to be safe
        loadOrder(params.id as string);
      }
    };
    window.addEventListener('eatnow:order_update', handler as EventListener);
    return () => window.removeEventListener('eatnow:order_update', handler as EventListener);
  }, [params.id]);

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

  const getStatusDescription = (status: string) => {
    const descriptions = {
      pending: 'Đơn hàng đang chờ nhà hàng xác nhận',
      confirmed: 'Nhà hàng đã xác nhận đơn hàng',
      preparing: 'Nhà hàng đang chuẩn bị món ăn',
      ready: 'Món ăn đã sẵn sàng, tài xế đang đến lấy',
      delivered: 'Đơn hàng đã được giao thành công',
      cancelled: 'Đơn hàng đã bị hủy'
    };
    return descriptions[status as keyof typeof descriptions] || '';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải chi tiết đơn hàng...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy đơn hàng</h1>
            <p className="text-gray-600 mb-6">Đơn hàng không tồn tại hoặc bạn không có quyền xem</p>
            <button
              onClick={() => router.push('/customer/orders')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Quay lại danh sách đơn hàng
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push('/customer/orders')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại
            </button>
            
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getStatusIcon(order.status)}</span>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-gray-900">
                  Đơn hàng #{order._id.slice(-8).toUpperCase()}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Trạng thái đơn hàng</h2>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{getStatusIcon(order.status)}</div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{getStatusText(order.status)}</p>
                    <p className="text-gray-600">{getStatusDescription(order.status)}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Món đã đặt</h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🍽️</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {item.subtotal.toLocaleString('vi-VN')}đ
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.price.toLocaleString('vi-VN')}đ × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Restaurant Info */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin nhà hàng</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{order.restaurantId.name}</h3>
                    <p className="text-gray-600">{order.restaurantId.address}</p>
                    {order.restaurantId.phone && (
                      <p className="text-sm text-gray-500">📞 {order.restaurantId.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin giao hàng</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900">Địa chỉ giao hàng</h3>
                    <p className="text-gray-600">
                      {typeof order.deliveryAddress === 'string' 
                        ? order.deliveryAddress 
                        : order.deliveryAddress?.addressLine || 'Địa chỉ không xác định'
                      }
                    </p>
                    {typeof order.deliveryAddress === 'object' && order.deliveryAddress?.label && (
                      <p className="text-sm text-gray-500 mt-1">
                        📍 {order.deliveryAddress.label}
                      </p>
                    )}
                    {typeof order.deliveryAddress === 'object' && order.deliveryAddress?.note && (
                      <p className="text-sm text-gray-500 mt-1">
                        📝 {order.deliveryAddress.note}
                      </p>
                    )}
                  </div>
                  {order.specialInstructions && (
                    <div>
                      <h3 className="font-medium text-gray-900">Ghi chú đặc biệt</h3>
                      <p className="text-gray-600">{order.specialInstructions}</p>
                    </div>
                  )}
                  {order.driverId && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-1">Tài xế giao hàng</h3>
                      <p className="text-blue-700">{order.driverId.name}</p>
                      <p className="text-sm text-blue-600">📞 {order.driverId.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>
                
                <div className="space-y-3">
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
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>Tổng cộng:</span>
                      <span>{order.finalTotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>💳</span>
                    <span>
                      {order.paymentMethod === 'cash' ? 'Thanh toán tiền mặt' : 'Chuyển khoản'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📅</span>
                    <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </main>
  );
}
