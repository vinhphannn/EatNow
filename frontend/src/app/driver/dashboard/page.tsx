
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
  
  // Socket connection
  const { socket, connected } = useSocket(api);
  
  // New order notification popup
  const [newOrderPopup, setNewOrderPopup] = useState<{
    open: boolean;
    order: any;
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
    
    const id = setInterval(() => {
      fetchStats();
      fetchDriverStatus();
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
      
      return () => {
        console.log('🧹 Cleaning up driver socket listeners');
        socket.off('order_assign:v1', onOrderAssigned);
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

  // Handle order acceptance
  const handleAcceptOrder = async (orderId: string) => {
    try {
      // Stop notification sound
      if (notificationSound) {
        notificationSound.pause();
        notificationSound.currentTime = 0;
        setNotificationSound(null);
      }
      
      // Update order status to picked_up
      const response = await fetch(`${api}/api/v1/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'picked_up' })
      });

      if (response.ok) {
        setNewOrderPopup({ open: false, order: null });
        showToast('Đã nhận đơn hàng thành công!', 'success');
        router.push('/driver/current');
      } else {
        showToast('Không thể nhận đơn hàng', 'error');
      }
    } catch (error) {
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      // Stop notification sound
      if (notificationSound) {
        notificationSound.pause();
        notificationSound.currentTime = 0;
        setNotificationSound(null);
      }
      
      // Update order status to rejected/cancelled
      const response = await fetch(`${api}/api/v1/orders/${orderId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        setNewOrderPopup({ open: false, order: null });
        showToast('Đã từ chối đơn hàng', 'info');
      } else {
        showToast('Không thể từ chối đơn hàng', 'error');
      }
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
        order={newOrderPopup.order}
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
                disabled={loading || driverStatus?.deliveryStatus === 'delivering'}
                className={`rounded-full px-4 py-2 text-sm font-medium shadow ${
                  loading || driverStatus?.deliveryStatus === 'delivering'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {loading ? 'Đang xử lý...' : 
                 driverStatus?.deliveryStatus === 'delivering' ? 'Đang giao hàng' : 
                 'Check Out'}
              </button>
            ) : (
              // Chưa check in hoặc checkout -> hiện nút Check In để bắt đầu làm việc
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
                disabled={loading || driverStatus?.status === 'ban'}
                className={`rounded-full px-4 py-2 text-sm font-medium shadow ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : driverStatus?.status === 'ban'
                    ? 'bg-red-300 text-red-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? 'Đang xử lý...' : 
                 driverStatus?.status === 'ban' ? 'Bị cấm' : 
                 'Check In'}
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
          </div>
          <div>
            <div className="card p-4">
              <div className="text-base font-semibold text-gray-800">Nhanh truy cập</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <QuickLink href="/driver/current" label="Đơn hiện tại" />
                <QuickLink href="/driver/history" label="Lịch sử" />
                <QuickLink href="/driver/earnings" label="Thu nhập" />
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
                onClick={() => { localStorage.removeItem('driverToken'); router.push('/driver/login'); }}
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