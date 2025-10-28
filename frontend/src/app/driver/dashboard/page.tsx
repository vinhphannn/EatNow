
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthManager } from "@/utils/authManager";
import { useDriverAuth } from "@/contexts/AuthContext";
import { DriverGuard } from "@/components/guards/AuthGuard";
import DriverLiveMap from "@/components/map/DriverLiveMap";
import { driverService } from "@/services/driver.service";
import { useToast } from "@/components";
import { useSocket } from "@/hooks/useSocket";
import NewOrderNotification from "@/components/NewOrderNotification";

interface AvailableOrder {
  _id: string;
  orderCode?: string;
  restaurantId: {
    _id: string;
    name: string;
    address: string;
    phone?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  customerId: {
    _id: string;
    name: string;
    phone: string;
    email: string;
  };
  deliveryAddress: {
    addressLine: string;
    recipientName: string;
    recipientPhone: string;
    latitude?: number;
    longitude?: number;
    label?: string;
    note?: string;
  };
  status: string;
  finalTotal: number;
  subtotal: number;
  deliveryFee: number;
  driverTip?: number;
  tip?: number;
  doorFee?: number;
  driverPayment?: number;
  createdAt: string;
  specialInstructions?: string;
  paymentMethod: 'cash' | 'bank_transfer';
  deliveryDistance?: number;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  scheduledAt?: string;
  voucherCode?: string;
  platformFeeRate?: number;
  platformFeeAmount?: number;
  driverCommissionRate?: number;
  driverCommissionAmount?: number;
  customerPayment?: number;
  restaurantRevenue?: number;
  // Legacy fields for backward compatibility
  restaurantName?: string;
  restaurantAddress?: string;
  customerAddress?: string;
  customerName?: string;
  restaurantLat?: number;
  restaurantLng?: number;
  customerLat?: number;
  customerLng?: number;
}
import type { DriverDashboardStats } from "@/types/driver";

export default function DriverDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useDriverAuth();
  const { showToast } = useToast();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  const [stats, setStats] = useState<DriverDashboardStats | null>(null);
  const [error, setError] = useState<string>("");
  const [driverStatus, setDriverStatus] = useState<{
    status: string;
    deliveryStatus: string | null;
    currentOrderId?: string;
    lastCheckinAt?: string;
    lastCheckoutAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Available orders state
  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);
  
  // Socket connection
  const { socket, connected } = useSocket(api);
  
  // New order notification popup
  const [newOrderPopup, setNewOrderPopup] = useState<{
    open: boolean;
    order: AvailableOrder | null;
  }>({
    open: false,
    order: null
  });
  
  // Notification sound
  const [notificationSound, setNotificationSound] = useState<HTMLAudioElement | null>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || user?.role !== 'driver') {
      router.push('/driver/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  const fetchAvailableOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await fetch(`${api}/api/v1/orders/available`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableOrders(data || []);
      } else {
        console.error('Failed to fetch available orders');
        setAvailableOrders([]);
      }
    } catch (e: any) {
      console.error('Error fetching available orders:', e);
      setAvailableOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Gọi API logout để xóa session và cookie trên server
      await fetch(`${api}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Chuyển hướng đến trang login (cookie sẽ được xóa bởi server)
      if (typeof window !== 'undefined') {
        window.location.href = '/driver/login';
      }
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setAcceptingOrder(orderId);
      
      const response = await fetch(`${api}/api/v1/orders/${orderId}/accept`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (response.ok) {
        showToast('Đã nhận đơn hàng thành công!', 'success');
        setNewOrderPopup({ open: false, order: null }); // Close popup
        await fetchAvailableOrders(); // Refresh available orders
        router.push('/driver/current'); // Go to current orders
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Không thể nhận đơn hàng', 'error');
      }
    } catch (e: any) {
      showToast('Lỗi khi nhận đơn hàng: ' + e.message, 'error');
    } finally {
      setAcceptingOrder(null);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await driverService.getMyStats();
        setStats(data);
      } catch (e: any) {
        setError(e?.message || "Không thể tải thống kê");
      }
    };

    const fetchDriverStatus = async () => {
      try {
        console.log('Fetching driver status...');
        const response = await driverService.getDriverStatus();
        console.log('Driver status response:', response);
        if (response.success && response.data) {
          setDriverStatus(response.data);
          console.log('Driver status set:', response.data);
        } else {
          console.error('Failed to get driver status:', response);
        }
      } catch (e: any) {
        console.error('Failed to load driver status:', e);
        setError('Không thể tải trạng thái tài xế');
      }
    };

    fetchStats();
    fetchDriverStatus();
    fetchAvailableOrders(); // Load available orders
    
    const id = setInterval(() => {
      fetchStats();
      fetchDriverStatus();
      fetchAvailableOrders(); // Refresh available orders periodically
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Periodically send GPS to backend when driver is checked in
    let watchId: number | null = null;
    if (driverStatus?.status === 'checkin' && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          try {
            await driverService.updateMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          } catch {}
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
      );
    }
    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [driverStatus?.status]);

  // Listen for order assignment notification
  useEffect(() => {
    if (socket && connected && user?.id) {
      console.log('🚗 Driver setting up socket listeners');
      
      const onOrderAssigned = async (payload: any) => {
        console.log('📦 Order assigned to driver:', payload);
        
        // Backend sends: { type: 'order_assign:v1', order: { orderId: '...' }, message: '...' }
        const orderId = payload.order?.orderId || payload.orderId || payload.id;
        if (!orderId) {
          console.error('❌ No orderId in assignment payload:', payload);
          return;
        }
        
        // Fetch full order data from API
        try {
          const response = await fetch(`${api}/api/v1/orders/${orderId}`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const orderData = await response.json();
            console.log('✅ Got assigned order data:', orderData);
            
            // Show popup
            setNewOrderPopup({
              open: true,
              order: orderData
            });
            
            showToast('🆕 Bạn có đơn hàng mới!', 'success');
            
            // Play sound
            if (typeof window !== 'undefined' && 'Audio' in window) {
              try {
                if (notificationSound) {
                  notificationSound.pause();
                  notificationSound.currentTime = 0;
                }
                
                const audio = new Audio('/notify.mp3');
                audio.volume = 0.7;
                audio.loop = true;
                
                audio.play().then(() => {
                  setNotificationSound(audio);
                }).catch(() => {});
              } catch (e) {
                console.error('🔊 Sound error:', e);
              }
            }
          } else {
            console.error('❌ Failed to fetch order:', response.status);
            showToast('🆕 Bạn có đơn hàng mới!', 'success');
          }
        } catch (error) {
          console.error('❌ Error:', error);
          showToast('🆕 Bạn có đơn hàng mới!', 'success');
        }
      };

      socket.on('order_assign:v1', onOrderAssigned);
      
      // Listen for new order notification (from smart assignment)
      const onNewOrderNotification = (payload: any) => {
        console.log('🔔 New order notification received:', payload);
        
        // Convert notification data to AvailableOrder format
        const orderData: AvailableOrder = {
          _id: payload.orderId,
          orderCode: payload.orderCode,
          restaurantId: {
            _id: '',
            name: payload.restaurantName,
            address: payload.restaurantAddress,
            phone: ''
          },
          customerId: {
            _id: '',
            name: payload.recipientName,
            phone: '',
            email: ''
          },
          deliveryAddress: {
            addressLine: payload.deliveryAddress,
            recipientName: payload.recipientName,
            recipientPhone: ''
          },
          status: 'pending',
          finalTotal: payload.finalTotal,
          subtotal: 0,
          deliveryFee: payload.deliveryFee,
          driverTip: payload.driverTip,
          tip: payload.driverTip,
          doorFee: 0,
          driverPayment: payload.driverPayment,
          createdAt: payload.createdAt,
          specialInstructions: payload.specialInstructions,
          paymentMethod: payload.paymentMethod,
          deliveryDistance: payload.deliveryDistance
        };
        
        setNewOrderPopup({ 
          open: true, 
          order: {
            orderId: orderData._id,
            orderCode: orderData.orderCode,
            restaurantName: orderData.restaurantId.name,
            restaurantAddress: orderData.restaurantId.address,
            deliveryAddress: orderData.deliveryAddress.addressLine || '',
            recipientName: orderData.deliveryAddress.recipientName,
            recipientPhone: orderData.deliveryAddress.recipientPhone,
            finalTotal: orderData.finalTotal,
            deliveryFee: orderData.deliveryFee,
            driverTip: orderData.driverTip,
            driverPayment: orderData.driverPayment,
            deliveryDistance: orderData.deliveryDistance,
            createdAt: orderData.createdAt,
            specialInstructions: orderData.specialInstructions,
            paymentMethod: orderData.paymentMethod,
            timestamp: new Date().toISOString()
          } as any
        });
        
        // Play notification sound
        if (notificationSound) {
          notificationSound.play().catch(console.error);
        }
      };
      
      socket.on('new_order_notification', onNewOrderNotification);
      
      return () => {
        console.log('🧹 Cleaning up driver socket listeners');
        socket.off('order_assign:v1', onOrderAssigned);
        socket.off('new_order_notification', onNewOrderNotification);
      };
    }
  }, [socket, connected, user, api, showToast, notificationSound]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </main>
    );
  }

  const handleRejectOrder = async (orderId: string) => {
    try {
      // Stop notification sound
      if (notificationSound) {
        notificationSound.pause();
        notificationSound.currentTime = 0;
        setNotificationSound(null);
      }
      
      // Close popup and show message
      setNewOrderPopup({ open: false, order: null });
      showToast('Đã bỏ qua đơn hàng', 'info');
      
      // Note: Không cần gọi API reject vì đơn hàng sẽ được gán cho tài xế khác
    } catch (error) {
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  const handleClosePopup = () => {
    setNewOrderPopup({ open: false, order: null });
  };

  return (
    <DriverGuard fallbackPath="/driver/login">
      {/* Order notification popup */}
      <NewOrderNotification
        open={newOrderPopup.open}
        order={newOrderPopup.order as any}
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
        onClose={handleClosePopup}
      />
      
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Tài xế</h1>
            <p className="mt-1 text-gray-600">{greeting}, {user?.name || user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Trạng thái:</span>
            {!driverStatus ? (
              // Chưa load được status
              <button disabled className="rounded-full px-4 py-2 text-sm font-medium shadow bg-gray-300 text-gray-500 cursor-not-allowed">
                Đang tải...
              </button>
            ) : driverStatus.status === 'checkin' ? (
              // Đã check in -> hiện nút Check Out để nghỉ
              <button
                onClick={async () => {
                  try {
                    console.log('Attempting to check out...');
                    setLoading(true);
                    setError(''); // Clear previous errors
                    const response = await driverService.checkOut();
                    console.log('Check out response:', response);
                    
                    // Luôn refresh driver status sau khi check out
                    const statusResponse = await driverService.getDriverStatus();
                    console.log('Status after check out:', statusResponse);
                    if (statusResponse.success && statusResponse.data) {
                      setDriverStatus(statusResponse.data);
                    }
                    
                    if (!response.success) {
                      setError(response.message || 'Không thể check out');
                    } else {
                      console.log('Check out successful, status:', response);
                    }
                  } catch (e: any) {
                    console.error('Check out error:', e);
                    setError(e?.message || 'Lỗi khi check out');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className={`rounded-full px-4 py-2 text-sm font-medium shadow ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {loading ? 'Đang xử lý...' : 'Check Out'}
              </button>
            ) : (
              // Chưa check in -> hiện nút Check In để bắt đầu làm việc
              <button
                onClick={async () => {
                  try {
                    console.log('Attempting to check in...');
                    setLoading(true);
                    setError(''); // Clear previous errors
                    const response = await driverService.checkIn();
                    console.log('Check in response:', response);
                    
                    // Luôn refresh driver status sau khi check in
                    const statusResponse = await driverService.getDriverStatus();
                    console.log('Status after check in:', statusResponse);
                    if (statusResponse.success && statusResponse.data) {
                      setDriverStatus(statusResponse.data);
                    }
                    
                    if (!response.success) {
                      setError(response.message || 'Không thể check in');
                    } else {
                      console.log('Check in successful, status:', response);
                    }
                  } catch (e: any) {
                    console.error('Check in error:', e);
                    setError(e?.message || 'Lỗi khi check in');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className={`rounded-full px-4 py-2 text-sm font-medium shadow ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? 'Đang xử lý...' : 'Check In'}
              </button>
            )}
            {driverStatus?.lastCheckinAt && driverStatus?.status === 'checkin' && (
              <span className="text-xs text-gray-500">
                Check in: {new Date(driverStatus.lastCheckinAt).toLocaleTimeString('vi-VN')}
              </span>
            )}
            {driverStatus?.lastCheckoutAt && driverStatus?.status === 'checkout' && (
              <span className="text-xs text-gray-500">
                Check out: {new Date(driverStatus.lastCheckoutAt).toLocaleTimeString('vi-VN')}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <strong>Debug Info:</strong><br/>
            Driver Status: {JSON.stringify(driverStatus, null, 2)}<br/>
            Loading: {loading.toString()}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Đơn hôm nay" value={stats?.todayOrders ?? 0} />
          <StatCard label="Thu nhập hôm nay" value={formatCurrency(stats?.todayEarnings ?? 0)} />
          <StatCard label="Hoàn tất" value={stats?.completedOrders ?? 0} />
          <StatCard label="Điểm đánh giá" value={stats?.rating ? stats.rating.toFixed(1) : '—'} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="card p-4">
              <div className="mb-3 text-base font-semibold text-gray-800">Bản đồ realtime</div>
              <MapWithFallback />
            </div>
            
            {/* Available Orders Section */}
            <div className="mt-6 card p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800">Đơn hàng có sẵn</h3>
                <button
                  onClick={fetchAvailableOrders}
                  disabled={loadingOrders}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {loadingOrders ? 'Đang tải...' : 'Làm mới'}
                </button>
              </div>
              
              {loadingOrders ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Đang tải đơn hàng...</p>
                </div>
              ) : availableOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📦</div>
                  <p>Không có đơn hàng nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableOrders.map((order) => (
                    <div key={order._id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Header với ID và trạng thái */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-gray-900">
                              Đơn #{order._id.slice(-8).toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                              order.status === 'ready' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status === 'pending' ? 'Chờ xác nhận' :
                               order.status === 'confirmed' ? 'Đã xác nhận' :
                               order.status === 'preparing' ? 'Đang chuẩn bị' :
                               order.status === 'ready' ? 'Sẵn sàng' : order.status}
                            </span>
                          </div>
                          
                          {/* Thông tin chính */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            {/* Nhà hàng */}
                            <div className="flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">🏪</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {order.restaurantId?.name || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {order.restaurantId?.address || 'N/A'}
                                </div>
                                {order.restaurantId?.phone && (
                                  <div className="text-xs text-gray-500">
                                    📞 {order.restaurantId.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Địa chỉ giao hàng */}
                            <div className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">📍</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {order.deliveryAddress?.recipientName || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {order.deliveryAddress?.addressLine || 'N/A'}
                                </div>
                                {order.deliveryAddress?.recipientPhone && (
                                  <div className="text-xs text-gray-500">
                                    📞 {order.deliveryAddress.recipientPhone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Khoảng cách và thời gian */}
                          <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                            {order.deliveryDistance && (
                              <div className="flex items-center gap-1">
                                <span>📏</span>
                                <span>{order.deliveryDistance.toFixed(1)} km</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span>⏰</span>
                              <span>{new Date(order.createdAt).toLocaleString('vi-VN', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit'
                              })}</span>
                            </div>
                            {order.estimatedDeliveryTime && (
                              <div className="flex items-center gap-1">
                                <span>🚚</span>
                                <span>Dự kiến: {new Date(order.estimatedDeliveryTime).toLocaleString('vi-VN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit'
                                })}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Chi tiết tiền */}
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tạm tính:</span>
                                <span>{formatCurrency(order.subtotal || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Phí ship:</span>
                                <span>{formatCurrency(order.deliveryFee || 0)}</span>
                              </div>
                              {(order.driverTip || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Tip:</span>
                                  <span className="text-green-600">{formatCurrency(order.driverTip || 0)}</span>
                                </div>
                              )}
                              {(order.doorFee || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Phí cửa:</span>
                                  <span>{formatCurrency(order.doorFee || 0)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold text-gray-900 col-span-2 border-t pt-1">
                                <span>Tổng cộng:</span>
                                <span>{formatCurrency(order.finalTotal || 0)}</span>
                              </div>
                              {order.driverPayment && (
                                <div className="flex justify-between text-orange-600 font-medium col-span-2">
                                  <span>Bạn nhận:</span>
                                  <span>{formatCurrency(order.driverPayment)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Ghi chú đặc biệt */}
                          {order.specialInstructions && (
                            <div className="text-xs text-gray-600 mb-2 p-2 bg-yellow-50 rounded">
                              <span className="font-medium">📝 Ghi chú:</span> {order.specialInstructions}
                            </div>
                          )}
                          
                          {/* Phương thức thanh toán */}
                          <div className="text-xs text-gray-500">
                            💳 {order.paymentMethod === 'cash' ? 'Thanh toán tiền mặt' : 'Chuyển khoản'}
                          </div>
                        </div>
                        
                        {/* Nút nhận đơn */}
                        <div className="ml-4 flex flex-col gap-2">
                          <button
                            onClick={() => handleAcceptOrder(order._id)}
                            disabled={acceptingOrder === order._id || driverStatus?.status !== 'checkin'}
                            className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            {acceptingOrder === order._id ? 'Đang nhận...' : 'Nhận đơn'}
                          </button>
                          {driverStatus?.status !== 'checkin' && (
                            <span className="text-xs text-red-500 text-center">
                              Cần check-in
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="card p-4">
              <div className="text-base font-semibold text-gray-800">Nhanh truy cập</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <QuickLink href="/driver/current" label="Đơn hiện tại" />
                <QuickLink href="/driver/history" label="Lịch sử" />
                <QuickLink href="/driver/earnings" label="Thu nhập" />
                <QuickLink href="/driver/wallet" label="Ví tiền" />
                <QuickLink href="/driver/profile" label="Hồ sơ" />
              </div>
            </div>

            <div className="mt-6 card p-4">
              <div className="text-base font-semibold text-gray-800">Tài khoản</div>
              <div className="mt-3 space-y-1 text-sm text-gray-700">
                <div>Email: {user?.email}</div>
                <div>Tên: {user?.name}</div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-4 w-full rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >Đăng xuất</button>
            </div>
          </div>
        </div>
      </div>
    </main>
    </DriverGuard>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function MapWithFallback() {
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  return (
    <div className="relative">
      {error ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-lg border bg-gray-50 text-center">
          <div className="text-sm text-red-600">Không thể tải bản đồ</div>
          <button onClick={()=>{ setError(null); setKey((k)=>k+1); }} className="mt-2 rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Thử lại</button>
        </div>
      ) : (
        <div onErrorCapture={()=>setError('Map failed')}>
          <DriverLiveMap key={key} />
        </div>
      )}
    </div>
  );
}

function formatCurrency(v: number) {
  try { return new Intl.NumberFormat('vi-VN').format(v) + ' đ'; } catch { return `${v} đ`; }
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
      {label}
    </a>
  );
}