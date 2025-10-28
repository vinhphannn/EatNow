'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  IconButton,
  Alert
} from '@mui/material';
import {
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

interface OrderData {
  orderId: string;
  orderCode: string;
  restaurantName: string;
  restaurantAddress: string;
  deliveryAddress: string;
  recipientName: string;
  recipientPhone?: string;
  finalTotal: number;
  deliveryFee: number;
  driverTip: number;
  driverPayment: number;
  deliveryDistance: number;
  createdAt: string;
  specialInstructions: string;
  paymentMethod: string;
  timestamp: string;
  // Additional fields for compatibility
  items?: any[];
  subtotal?: number;
  customerId?: any;
}

interface NewOrderNotificationProps {
  open: boolean;
  order: OrderData | null;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function NewOrderNotification({
  open,
  order,
  onAccept,
  onReject,
  onClose,
  loading = false
}: NewOrderNotificationProps) {
  if (!order) return null;

  console.log('🔍 NewOrderNotification - Raw order data:', order);
  console.log('🔍 NewOrderNotification - Order items:', order.items);
  console.log('🔍 NewOrderNotification - Order customer:', order.customerId);
  console.log('🔍 NewOrderNotification - Order subtotal:', order.subtotal);
  console.log('🔍 NewOrderNotification - Order finalTotal:', order.finalTotal);
  console.log('🔍 NewOrderNotification - Order deliveryAddress:', order.deliveryAddress);
  console.log('🔍 NewOrderNotification - Order customerId:', order.customerId);

  // Safely extract order data with fallbacks
  const orderData = {
    _id: order?.orderId || 'unknown',
    orderCode: order?.orderCode || `#${(order?.orderId || '').slice(-6)}`,
    items: [], // Không có items trong notification
    subtotal: 0, // Không có subtotal trong notification
    total: order?.finalTotal || 0,
    deliveryFee: order?.deliveryFee || 0,
    tip: order?.driverTip || 0,
    doorFee: 0, // Không có doorFee trong notification
    finalTotal: order?.finalTotal || 0,
    driverPayment: order?.driverPayment || 0, // Tiền tài xế nhận được
    restaurantRevenue: 0, // Không có trong notification
    paymentMethod: order?.paymentMethod || 'cash',
    customerId: {},
    recipientName: order?.recipientName || 'Chưa cập nhật',
    recipientPhonePrimary: order?.recipientPhone || 'Chưa cập nhật',
    deliveryAddress: order?.deliveryAddress || 'Địa chỉ không xác định',
    deliveryDistance: order?.deliveryDistance || 0,
    estimatedDeliveryTime: null,
    specialInstructions: order?.specialInstructions || '',
    createdAt: order?.createdAt || new Date().toISOString()
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(1)} km`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'preparing': return 'primary';
      case 'ready': return 'success';
      default: return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              🆕 Đơn hàng mới!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mã đơn: #{orderData.orderCode}
            </Typography>
          </Box>
          <Chip 
            label="Chờ xác nhận" 
            color="warning" 
            variant="filled"
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={3}>
          {/* Thông tin người nhận */}
          {(orderData.recipientName !== 'Chưa cập nhật' || orderData.recipientPhonePrimary !== 'Chưa cập nhật') && (
            <Card variant="outlined" sx={{ bgcolor: 'info.light' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <UserIcon width={20} color="#0288d1" />
                  <Typography variant="subtitle1" fontWeight={600} color="info.dark">
                    Thông tin người nhận
                  </Typography>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Tên người nhận:</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {orderData.recipientName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">SĐT người nhận:</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      📞 {orderData.recipientPhonePrimary}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Địa chỉ giao hàng */}
          <Card variant="outlined" sx={{ bgcolor: 'success.light' }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <MapPinIcon width={20} color="#2e7d32" />
                <Typography variant="subtitle1" fontWeight={600} color="success.dark">
                  Địa chỉ giao hàng
                </Typography>
              </Stack>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                {orderData.deliveryAddress}
              </Typography>
              {orderData.deliveryDistance > 0 && (
                <Typography variant="body2" color="text.secondary">
                  📍 Khoảng cách: {formatDistance(orderData.deliveryDistance)}
                </Typography>
              )}
              {orderData.specialInstructions && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  💬 Ghi chú: {orderData.specialInstructions}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Danh sách món ăn */}
          <Card variant="outlined">
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <TruckIcon width={20} color="#ed6c02" />
                <Typography variant="subtitle1" fontWeight={600} color="warning.dark">
                  Món đã đặt ({orderData.items.length} món)
                </Typography>
              </Stack>
              <List dense>
                {orderData.items.length > 0 ? orderData.items.map((item: any, index: number) => (
                  <ListItem 
                    key={index}
                    sx={{ 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1, 
                      mb: 1,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <ListItemIcon>
                      <Typography variant="h6">🍽️</Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography fontWeight={600}>
                          {item.name || item.itemName || 'Món không xác định'}
                        </Typography>
                      }
                      secondary={
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="body2" color="text.secondary">
                            Số lượng: {item.quantity || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Giá: {formatPrice(item.price || item.unitPrice || 0)}
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color="primary.main">
                            Tổng: {formatPrice(item.subtotal || item.total || 0)}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                )) : (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography color="text.secondary">
                          Không có thông tin món ăn
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Tổng kết thanh toán */}
          <Card variant="outlined" sx={{ bgcolor: 'primary.light' }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <CurrencyDollarIcon width={20} color="#1976d2" />
                <Typography variant="subtitle1" fontWeight={600} color="primary.dark">
                  Tổng kết thanh toán
                </Typography>
              </Stack>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Tổng đơn hàng:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatPrice(orderData.finalTotal)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Phí giao hàng:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatPrice(orderData.deliveryFee)}
                  </Typography>
                </Stack>
                {orderData.tip > 0 && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Thưởng từ khách:
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      +{formatPrice(orderData.tip)}
                    </Typography>
                  </Stack>
                )}
                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    🎯 Bạn nhận được:
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {formatPrice(orderData.driverPayment)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Phương thức thanh toán:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {orderData.paymentMethod === 'cash' ? '💵 Tiền mặt' : '💳 Chuyển khoản'}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Thời gian đặt hàng */}
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ClockIcon width={18} color="#666" />
              <Typography variant="body2" color="text.secondary">
                Đặt lúc: {new Date(orderData.createdAt).toLocaleString('vi-VN')}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={() => onReject(orderData._id)}
          disabled={loading}
          startIcon={<XCircleIcon width={20} />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Từ chối đơn hàng
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => onAccept(orderData._id)}
          disabled={loading}
          startIcon={<CheckCircleIcon width={20} />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {loading ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
