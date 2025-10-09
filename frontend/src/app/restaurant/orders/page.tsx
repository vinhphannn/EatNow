'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components';
import { useRestaurantNotifications } from '../../../hooks/useSocket';
import { Tabs, Tab, Card, CardContent, CardHeader, CardActions, List, ListItem, ListItemText, ListItemIcon, Chip, Button, Stack, Typography, Divider, Box } from '@mui/material';
import OrderStatusChip from '@/components/ui/OrderStatusChip';
import { BanknotesIcon, CubeIcon, ClockIcon } from '@heroicons/react/24/outline';

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
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { showToast, ToastContainer } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed'>('in-progress');
  
  // Setup restaurant notifications
  const token = typeof window !== 'undefined' ? localStorage.getItem('eatnow_token') : null;
  const { socket, connected } = useRestaurantNotifications(restaurantId || '');

  // Get restaurant ID from API (cookie-based auth)
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
    try {
      const response = await fetch(`${api}/api/v1/restaurants/mine`, {
        credentials: 'include'
      });

      if (response.ok) {
        try {
          const restaurant = await response.json();
          setRestaurantId(restaurant._id || restaurant.id || '');
        } catch (jsonError) {
          console.error('JSON parsing error in loadRestaurantId:', jsonError);
        }
      } else if (response.status === 401 || response.status === 403) {
        router.push('/restaurant/login');
      }
    } catch (error) {
      console.error('Load restaurant ID error:', error);
    }
  };


  useEffect(() => {
    if (socket) {
      const onStatus = (payload: any) => {
        try {
          const short = String(payload.orderId || '').slice(-8).toUpperCase();
          showToast(`Đơn #${short}: ${payload.status}`, 'info');
        } catch {}
        loadOrders();
      };
      socket.on('order_status_update:v1', onStatus);
      return () => {
        socket.off('order_status_update:v1', onStatus);
      };
    }
  }, [socket]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch(`${api}/api/v1/restaurants/mine/orders`, {
        credentials: 'include'
      });

      if (response.ok) {
        try {
          const ordersData = await response.json();
          const raw = Array.isArray(ordersData) ? ordersData : (ordersData?.data || []);
          const normalized = Array.isArray(raw) ? raw.map((o: any) => {
            // Normalize shape to match UI expectations
            if (!o.customerId && o.customer) {
              o.customerId = {
                _id: o.customer?._id || '',
                name: o.customer?.name || '',
                phone: o.customer?.phone || '',
                email: o.customer?.email || ''
              };
            }
            if (!o.finalTotal && typeof o.total === 'number') {
              o.finalTotal = o.total;
            }
            if (!o._id && o.id) {
              o._id = o.id;
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
      showToast('Có lỗi xảy ra khi tải danh sách đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on active tab
  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => {
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
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>Quản lý đơn hàng</Typography>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab value="in-progress" label={`Đơn đang thực hiện (${orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length})`} />
        <Tab value="completed" label={`Đơn đã hoàn thành (${orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length})`} />
      </Tabs>

          {filteredOrders.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <Typography variant="h1" sx={{ fontSize: 56 }}>📦</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>Chưa có đơn hàng nào</Typography>
              <Typography variant="body2" color="text.secondary">Các đơn hàng mới sẽ xuất hiện ở đây</Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {filteredOrders.map((order) => (
                <Card key={order._id} elevation={0} sx={{ border: theme => `1px solid ${theme.palette.divider}` }}>
                  <CardHeader
                    title={
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>Đơn hàng #{order._id.slice(-8).toUpperCase()}</Typography>
                          <Typography variant="caption" color="text.secondary">{new Date(order.createdAt).toLocaleString('vi-VN')}</Typography>
                        </Box>
                        <OrderStatusChip status={order.status as any} />
                      </Stack>
                    }
                  />
                  <CardContent>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} /> }>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Thông tin khách hàng</Typography>
                        <Typography>{order.customerId.name}</Typography>
                        <Typography variant="body2" color="text.secondary">📞 {order.customerId.phone}</Typography>
                        <Typography variant="body2" color="text.secondary">📧 {order.customerId.email}</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Giao đến</Typography>
                        <Typography>
                          {typeof order.deliveryAddress === 'string' ? order.deliveryAddress : (order.deliveryAddress?.addressLine || 'Địa chỉ không xác định')}
                        </Typography>
                        {order.specialInstructions && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Ghi chú: {order.specialInstructions}</Typography>
                        )}
                      </Box>
                    </Stack>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Món đã đặt</Typography>
                      <List dense>
                        {order.items.map((item, index) => (
                          <ListItem key={index} secondaryAction={
                            <Typography fontWeight={600}>{item.subtotal.toLocaleString('vi-VN')}đ</Typography>
                          }>
                            <ListItemIcon><CubeIcon width={18} /></ListItemIcon>
                            <ListItemText primary={item.name} secondary={`×${item.quantity}`} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BanknotesIcon width={18} />
                        <Typography variant="body2" color="text.secondary">{order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</Typography>
                      </Stack>
                      <Typography variant="h6">{order.finalTotal.toLocaleString('vi-VN')}đ</Typography>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ClockIcon width={16} />
                      <Typography variant="body2" color="text.secondary">
                        {order.status === 'pending' && 'Chờ xác nhận từ nhà hàng'}
                        {order.status === 'confirmed' && 'Đã xác nhận, chờ chuẩn bị'}
                        {order.status === 'preparing' && 'Đang chuẩn bị món ăn'}
                        {order.status === 'ready' && 'Món ăn đã sẵn sàng'}
                        {order.status === 'delivered' && 'Đã giao hàng thành công'}
                        {order.status === 'cancelled' && 'Đơn hàng đã bị hủy'}
                      </Typography>
                    </Stack>
                    {getNextStatus(order.status) && (
                      <Button
                        variant="contained"
                        color="primary"
                        disableElevation
                        onClick={() => updateOrderStatus(order._id, getNextStatus(order.status)!)}
                        disabled={updating === order._id}
                        sx={{ textTransform: 'none' }}
                      >
                        {updating === order._id ? 'Đang xử lý...' : getNextStatusText(order.status)}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              ))}
            </Stack>
          )}
      <ToastContainer />
    </div>
  );
}