'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components';
import { useRestaurantNotifications } from '../../../hooks/useSocket';
import { Tabs, Tab, Card, CardContent, CardHeader, CardActions, List, ListItem, ListItemText, ListItemIcon, Chip, Button, Stack, Typography, Divider, Box } from '@mui/material';
import OrderStatusChip from '@/components/ui/OrderStatusChip';
import NewOrderNotification from '@/components/NewOrderNotification';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPhone, faUtensils, faMoneyBillWave, faTruck, faCalendarAlt, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

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
  subtotal: number; // Tiền món ăn
  deliveryFee: number;
  finalTotal: number; // Tổng tiền khách trả
  restaurantRevenue: number; // Tiền quán nhận được (sau khi trừ phí platform)
  deliveryAddress: string | {
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
  deliveryDistance?: number;
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
    vehicleType?: string;
    licensePlate?: string;
  };
}

export default function RestaurantOrdersPage() {
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'delivering' | 'completed' | 'cancelled'>('pending');
  const [notificationSound, setNotificationSound] = useState<HTMLAudioElement | null>(null);
  
  // New order notification popup
  const [newOrderPopup, setNewOrderPopup] = useState<{
    open: boolean;
    order: any;
  }>({
    open: false,
    order: null
  });
  
  // Setup restaurant notifications
  const { socket, connected } = useRestaurantNotifications(restaurantId || '');
  
  // Debug socket connection
  useEffect(() => {
    console.log('🔌 Socket connection status:', { socket: !!socket, connected, restaurantId });
  }, [socket, connected, restaurantId]);

  // Get restaurant ID from API (cookie-based auth)
  useEffect(() => {
    loadRestaurantId();
  }, []);

  // Load orders when restaurantId is available
  useEffect(() => {
    if (restaurantId) {
      console.log('🔍 Restaurant ID loaded, loading orders:', restaurantId);
      loadOrders();
    }
  }, [restaurantId]); // Only depend on restaurantId, not loadOrders

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
    try {
      console.log('🔍 Loading restaurant ID...');
      const response = await fetch(`${api}/api/v1/restaurants/mine`, {
        credentials: 'include'
      });

      console.log('🔍 Restaurant API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        try {
          const restaurant = await response.json();
          console.log('🔍 Restaurant data loaded:', restaurant);
          const restaurantId = restaurant._id || restaurant.id || '';
          setRestaurantId(restaurantId);
          console.log('🔍 Restaurant ID set:', restaurantId);
        } catch (jsonError) {
          console.error('JSON parsing error in loadRestaurantId:', jsonError);
        }
      } else if (response.status === 401 || response.status === 403) {
        console.log('❌ Authentication failed, redirecting to login');
        router.push('/restaurant/login');
      } else {
        console.error('❌ Restaurant API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Load restaurant ID error:', error);
    }
  };


  // Listen for order updates
  useEffect(() => {
    console.log('🔌 Socket listener setup - socket:', !!socket, 'connected:', connected);
    if (socket && connected) {
      console.log('🔌 Setting up Socket.IO listeners for restaurant orders');
      const onStatus = (payload: any) => {
        try {
          const short = String(payload.orderId || '').slice(-8).toUpperCase();
          showToast(`Đơn #${short}: ${payload.status}`, 'info');
        } catch {}
        loadOrders();
      };


      // Simple handler: just get orderId from notification and fetch full data
      const onNewNotification = async (payload: any) => {
        console.log('🔔 Got new notification signal:', payload);
        
        // Get orderId from payload
        const orderId = payload.orderId;
        if (!orderId) {
          console.error('❌ No orderId in notification');
          return;
        }
        
        console.log('📥 Fetching order data for:', orderId);
        
        // Fetch full order data from API
        try {
          const response = await fetch(`${api}/api/v1/orders/${orderId}`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const orderData = await response.json();
            console.log('✅ Got order data:', orderData);
            
            // Show popup
            setNewOrderPopup({
              open: true,
              order: orderData
            });
            
            showToast(`🆕 Có đơn hàng mới!`, 'success');
            
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
            showToast('🆕 Có đơn hàng mới!', 'success');
          }
        } catch (error) {
          console.error('❌ Error:', error);
          showToast('🆕 Có đơn hàng mới!', 'success');
        }
      };

      socket.on('order_status_update:v1', onStatus);
      console.log('✅ Listening for order_status_update:v1');
      
      socket.on('new_notification:v1', onNewNotification);
      console.log('✅ Listening for new_notification:v1');
      
      return () => {
        console.log('🧹 Cleaning up Socket.IO listeners');
        socket.off('order_status_update:v1', onStatus);
        socket.off('new_notification:v1', onNewNotification);
      };
    } else {
      console.log('❌ Socket or not connected, skipping listener setup');
    }
  }, [socket, connected, showToast]);


  const loadOrders = async () => {
    try {
      console.log('🔍 Loading orders for restaurant:', restaurantId);
      const response = await fetch(`${api}/api/v1/restaurants/mine/orders`, {
        credentials: 'include'
      });

      console.log('🔍 Orders API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        try {
          const ordersData = await response.json();
          console.log('🔍 Raw orders data:', ordersData);
          const raw = Array.isArray(ordersData) ? ordersData : (ordersData?.data || []);
          const normalized = Array.isArray(raw) ? raw.map((o: any) => {
            // Debug log for order data
            console.log('🔍 Restaurant Orders - Raw order data:', {
              _id: o._id || o.id,
              customerId: o.customerId,
              customer: o.customer,
              subtotal: o.subtotal,
              finalTotal: o.finalTotal,
              restaurantRevenue: o.restaurantRevenue,
              items: o.items,
              deliveryAddress: o.deliveryAddress,
              recipientName: o.recipientName,
              recipientPhonePrimary: o.recipientPhonePrimary,
              paymentMethod: o.paymentMethod
            });
            
            // Normalize shape to match UI expectations
            if (!o.customerId && o.customer) {
              o.customerId = {
                _id: o.customer?._id || '',
                name: o.customer?.name || '',
                phone: o.customer?.phone || '',
                email: o.customer?.email || ''
              };
            }
            
            // Ensure driverId is properly populated
            if (!o.driverId && o.driver) {
              o.driverId = {
                _id: o.driver?._id || '',
                name: o.driver?.name || '',
                phone: o.driver?.phone || '',
                vehicleType: o.driver?.vehicleType || '',
                licensePlate: o.driver?.licensePlate || ''
              };
            }
            
            // Ensure subtotal exists - derive from items if missing
            if (!o.subtotal) {
              try {
                const items = Array.isArray(o.items) ? o.items : [];
                const derivedSubtotal = items.reduce((sum: number, it: any) => {
                  const itemSubtotal =
                    (typeof it.subtotal === 'number' ? it.subtotal : 0) ||
                    (typeof it.totalPrice === 'number' ? it.totalPrice : 0) ||
                    (typeof it.price === 'number' && typeof it.quantity === 'number' ? it.price * it.quantity : 0);
                  return sum + (itemSubtotal || 0);
                }, 0);
                o.subtotal = derivedSubtotal;
              } catch {}
            }

            // Calculate finalTotal properly (use subtotal instead of total)
            if (!o.finalTotal) {
              const subtotal = o.subtotal || 0;
              const deliveryFee = o.deliveryFee || 0;
              const tip = o.tip || 0;
              const doorFee = o.doorFee || 0;
              o.finalTotal = subtotal + deliveryFee + tip + doorFee;
            }

            // Ensure restaurantRevenue exists - derive from platformFee when available
            if (typeof o.restaurantRevenue !== 'number') {
              const subtotal = o.subtotal || 0;
              if (typeof o.platformFeeAmount === 'number') {
                o.restaurantRevenue = subtotal - o.platformFeeAmount;
              } else if (typeof o.platformFeeRate === 'number') {
                const platformFee = Math.round(subtotal * (o.platformFeeRate / 100));
                o.restaurantRevenue = subtotal - platformFee;
              } else {
                // Fallback: show subtotal as approximation to avoid empty UI
                o.restaurantRevenue = subtotal;
              }
            }
            
            if (!o._id && o.id) {
              o._id = o.id;
            }
            
            // Ensure orderCode is available
            if (!o.orderCode && o.code) {
              o.orderCode = o.code;
            }
            
            // Set default payment method to bank_transfer
            if (!o.paymentMethod) {
              o.paymentMethod = 'bank_transfer';
            }
            
            return o;
          }) : [];
          setOrders(normalized);
        } catch (jsonError) {
          setOrders([]);
          showToast('Dữ liệu đơn hàng không hợp lệ', 'error');
        }
      } else if (response.status === 401 || response.status === 403) {
        router.push('/restaurant/login');
      } else {
        showToast('Không thể tải danh sách đơn hàng', 'error');
      }
    } catch (error) {
      console.error('❌ Load orders error:', error);
      showToast('Có lỗi xảy ra khi tải danh sách đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on active tab
  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => {
    switch (activeTab) {
      case 'pending':
        return order.status === 'pending';
      case 'preparing':
        return order.status === 'confirmed';
      case 'delivering':
        return order.status === 'ready';
      case 'completed':
        return order.status === 'delivered';
      case 'cancelled':
        return order.status === 'cancelled';
      default:
        return false;
    }
  });

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      // Cookie-based auth: no need to get token from localStorage
      
      // Stop notification sound when accepting order
      if (notificationSound) {
        notificationSound.pause();
        notificationSound.currentTime = 0;
        setNotificationSound(null);
      }
      
      const response = await fetch(`${api}/api/v1/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        showToast('Cập nhật trạng thái đơn hàng thành công', 'success');
        loadOrders(); // Reload orders
      } else {
        showToast('Không thể cập nhật trạng thái đơn hàng', 'error');
      }
    } catch (error) {
      showToast('Có lỗi xảy ra khi cập nhật trạng thái đơn hàng', 'error');
    } finally {
      setUpdating(null);
    }
  };

  // Handle new order popup actions
  const handleAcceptOrder = async (orderId: string) => {
    try {
      // Stop notification sound
      if (notificationSound) {
        notificationSound.pause();
        notificationSound.currentTime = 0;
        setNotificationSound(null);
      }
      
      // Update order status to confirmed
      await updateOrderStatus(orderId, 'confirmed');
      
      // Close popup
      setNewOrderPopup({ open: false, order: null });
      
      showToast('Đã xác nhận đơn hàng thành công!', 'success');
    } catch (error) {
      showToast('Có lỗi xảy ra khi xác nhận đơn hàng', 'error');
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
      
      // Update order status to cancelled
      await updateOrderStatus(orderId, 'cancelled');
      
      // Close popup
      setNewOrderPopup({ open: false, order: null });
      
      showToast('Đã từ chối đơn hàng', 'info');
    } catch (error) {
      showToast('Có lỗi xảy ra khi từ chối đơn hàng', 'error');
    }
  };

  const handleClosePopup = () => {
    setNewOrderPopup({ open: false, order: null });
    // Don't stop sound here - let it continue until order is processed
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
      <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Đang tải danh sách đơn hàng...</Typography>
      </Stack>
    );
  }

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">Quản lý đơn hàng</Typography>
      </Stack>
      
      {/* New Order Notification Popup */}
      <NewOrderNotification
        open={newOrderPopup.open}
        order={newOrderPopup.order}
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
        onClose={handleClosePopup}
        loading={updating === newOrderPopup.order?._id}
      />

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab 
          value="pending" 
          label={`Chờ xác nhận (${orders.filter(o => o.status === 'pending').length})`} 
        />
        <Tab 
          value="preparing" 
          label={`Đang làm (${orders.filter(o => o.status === 'confirmed').length})`} 
        />
        <Tab 
          value="delivering" 
          label={`Sẵn sàng giao (${orders.filter(o => o.status === 'ready').length})`} 
        />
        <Tab 
          value="completed" 
          label={`Đã hoàn thành (${orders.filter(o => o.status === 'delivered').length})`} 
        />
        <Tab 
          value="cancelled" 
          label={`Đã hủy (${orders.filter(o => o.status === 'cancelled').length})`} 
        />
      </Tabs>

          {filteredOrders.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <Typography variant="h1" sx={{ fontSize: 56 }}>
                {activeTab === 'pending' && '⏳'}
                {activeTab === 'preparing' && '👨‍🍳'}
                {activeTab === 'delivering' && '🚚'}
                {activeTab === 'completed' && '✅'}
                {activeTab === 'cancelled' && '❌'}
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                {activeTab === 'pending' && 'Chưa có đơn hàng chờ xác nhận'}
                {activeTab === 'preparing' && 'Chưa có đơn hàng đang chuẩn bị'}
                {activeTab === 'delivering' && 'Chưa có đơn hàng sẵn sàng giao'}
                {activeTab === 'completed' && 'Chưa có đơn hàng hoàn thành'}
                {activeTab === 'cancelled' && 'Chưa có đơn hàng bị hủy'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeTab === 'pending' && 'Các đơn hàng mới sẽ xuất hiện ở đây'}
                {activeTab === 'preparing' && 'Các đơn hàng đã xác nhận sẽ chuyển sang đây'}
                {activeTab === 'delivering' && 'Các đơn hàng đã chuẩn bị xong sẽ hiển thị ở đây'}
                {activeTab === 'completed' && 'Các đơn hàng đã giao sẽ hiển thị ở đây'}
                {activeTab === 'cancelled' && 'Các đơn hàng bị hủy sẽ hiển thị ở đây'}
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {filteredOrders.map((order) => (
                <Card 
                  key={order._id} 
                  elevation={0} 
                  sx={{ 
                    border: theme => `1px solid ${theme.palette.divider}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: 'primary.main'
                    }
                  }}
                  onClick={() => router.push(`/restaurant/orders/${order._id}`)}
                >
                  <CardHeader
                    title={
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            Đơn hàng #{order.orderCode || order._id.slice(-8).toUpperCase()}
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '12px' }} />
                              {new Date(order.createdAt).toLocaleString('vi-VN')}
                            </Typography>
                            {order.deliveryDistance && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ fontSize: '12px' }} />
                                {order.deliveryDistance.toFixed(1)}km
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                        <OrderStatusChip status={order.status as any} />
                      </Stack>
                    }
                  />
                  <CardContent>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
                      {/* Thông tin cơ bản */}
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Khách hàng:
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {order.customerId?.name || 'Chưa cập nhật'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              SĐT:
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {order.customerId?.phone || 'Chưa cập nhật'}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {/* Số món và tổng tiền */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Box textAlign="center">
                          <Typography variant="body2" color="text.secondary">
                            Số món:
                          </Typography>
                          <Typography variant="h6" fontWeight={600} color="primary.main">
                            {order.items?.length || 0}
                          </Typography>
                        </Box>
                        <Box textAlign="center">
                          <Typography variant="body2" color="text.secondary">
                            Tiền món:
                          </Typography>
                          <Typography variant="h6" fontWeight={600} color="primary.main">
                            ₫{(order.subtotal || 0).toLocaleString('vi-VN')}
                          </Typography>
                        </Box>
                        <Box textAlign="center">
                          <Typography variant="body2" color="text.secondary">
                            Quán nhận:
                          </Typography>
                          <Typography variant="h6" fontWeight={600} color="success.main">
                            ₫{(order.restaurantRevenue || order.subtotal || 0).toLocaleString('vi-VN')}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Trạng thái tài xế */}
                      <Box textAlign="center">
                        <Typography variant="body2" color="text.secondary">
                          Tài xế:
                        </Typography>
                        {order.driverId ? (
                          <Typography variant="body1" fontWeight={600} color="success.main">
                            {order.driverId.name || 'Đã chỉ định'}
                          </Typography>
                        ) : (
                          <Typography variant="body1" fontWeight={600} color="warning.main">
                            Chưa chỉ định
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </CardContent>
                  
                  {/* Action buttons based on tab */}
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                      {activeTab === 'pending' && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order._id, 'confirmed');
                            }}
                            disabled={updating === order._id}
                            sx={{ flex: 1 }}
                          >
                            {updating === order._id ? 'Đang xử lý...' : 'Xác nhận'}
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order._id, 'cancelled');
                            }}
                            disabled={updating === order._id}
                            sx={{ flex: 1 }}
                          >
                            {updating === order._id ? 'Đang xử lý...' : 'Từ chối'}
                          </Button>
                        </>
                      )}
                      
                      {activeTab === 'preparing' && order.status === 'confirmed' && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order._id, 'ready');
                          }}
                          disabled={updating === order._id}
                          sx={{ flex: 1 }}
                        >
                          {updating === order._id ? 'Đang xử lý...' : 'Đã chuẩn bị xong'}
                        </Button>
                      )}
                      
                      {activeTab === 'delivering' && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                          Đang chờ tài xế giao hàng
                        </Typography>
                      )}
                    </Stack>
                  </CardActions>
                </Card>
              ))}
            </Stack>
          )}
    </div>
  );
}