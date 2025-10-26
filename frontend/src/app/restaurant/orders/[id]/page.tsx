'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Divider
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faClock,
  faUser,
  faPhone,
  faMapMarkerAlt,
  faUtensils,
  faMoneyBillWave,
  faCheckCircle,
  faTimesCircle,
  faCreditCard
} from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/components';

interface OrderItem {
  _id?: string;
  id?: string;
  itemId?: string;
  foodId?: string;
  food?: any;
  foodName?: string;
  name?: string;
  price?: number;
  quantity?: number;
  qty?: number;
  subtotal?: number;
  total?: number;
  totalPrice?: number;
  specialInstructions?: string;
  note?: string;
  options?: OrderItemOption[];
  imageUrl?: string;
  description?: string;
}

interface OrderItemOptionChoice {
  choiceId: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderItemOption {
  optionId: string;
  name: string;
  type: string;
  required: boolean;
  choices: OrderItemOptionChoice[];
  totalPrice: number;
}

interface Order {
  _id: string;
  code?: string;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  items: OrderItem[];
  customerId?: {
    name?: string;
    phone?: string;
  };
  recipientName?: string;
  recipientPhonePrimary?: string;
  deliveryAddress?: string | {
    label?: string;
    addressLine?: string;
    latitude?: number;
    longitude?: number;
    note?: string;
  };
  deliveryDistance?: number;
  specialInstructions?: string;
  total?: number;
  subtotal?: number;
  deliveryFee?: number;
  tip?: number;
  doorFee?: number;
  discount?: number;
  finalTotal?: number;
}

const OrderDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action?: 'accepted' | 'rejected' | 'ready';
    message?: string;
  }>({ open: false });

  const loadOrder = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/orders/${params.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Order data loaded:', data);
        setOrder(data);
      } else {
        console.error('Failed to load order');
        try {
          showToast('Không thể tải thông tin đơn hàng', 'error');
        } catch (error) {
          console.error('Toast error:', error);
        }
      }
    } catch (error) {
      console.error('Error loading order:', error);
      try {
        showToast('Lỗi khi tải đơn hàng', 'error');
      } catch (error) {
        console.error('Toast error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [params.id, showToast]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'preparing': return 'info';
      case 'ready': return 'primary';
      case 'delivered': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'accepted': return 'Đã chấp nhận';
      case 'rejected': return 'Đã từ chối';
      case 'preparing': return 'Đang chuẩn bị';
      case 'ready': return 'Sẵn sàng';
      case 'delivered': return 'Đã giao';
      default: return status;
    }
  };

  const handleStatusUpdate = async (action: 'accepted' | 'rejected' | 'ready') => {
    if (!order) return;
    
    setUpdating(true);
    try {
      const statusMap = {
        'accepted': 'confirmed',
        'rejected': 'cancelled',
        'ready': 'ready'
      };
      
      const response = await fetch(`http://localhost:3001/api/v1/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: statusMap[action] })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(updatedOrder);
        try {
          showToast(
            action === 'accepted' ? 'Đã chấp nhận đơn hàng' : 'Đã từ chối đơn hàng',
            'success'
          );
        } catch (error) {
          console.error('Toast error:', error);
        }
      } else {
        try {
          showToast('Cập nhật trạng thái thất bại', 'error');
        } catch (error) {
          console.error('Toast error:', error);
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      try {
        showToast('Lỗi khi cập nhật trạng thái', 'error');
      } catch (error) {
        console.error('Toast error:', error);
      }
    } finally {
      setUpdating(false);
      setConfirmDialog({ open: false });
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Không tìm thấy đơn hàng</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton 
                onClick={() => router.back()} 
                sx={{ 
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' }
                }}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </IconButton>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  Đơn hàng #{order.code || 'N/A'}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <FontAwesomeIcon icon={faClock} color="#666" />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(order.createdAt)}
                    </Typography>
                  </Stack>
                  <Chip 
                    label={getStatusText(order.status)} 
                    color={getStatusColor(order.status) as any}
                    size="small"
                  />
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Left Column - Order Items */}
          <Box sx={{ flex: { lg: 7 } }}>
            <Card elevation={2} sx={{ borderRadius: 3, height: 'fit-content' }}>
              <CardHeader 
                title={
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                      p: 1.5, 
                      backgroundColor: 'success.main', 
                      borderRadius: 2,
                      color: 'white'
                    }}>
                      <FontAwesomeIcon icon={faUtensils} />
                    </Box>
                    <Typography variant="h5" fontWeight="bold">
                      Món ăn ({order.items?.length || 0})
                    </Typography>
                  </Stack>
                }
                sx={{ 
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #e9ecef'
                }}
              />
              <CardContent sx={{ p: 0 }}>
                {order.items?.map((item, index) => {
                  const foodName = item.foodName || item.name || item.food?.name || 'Món không xác định';
                  const quantity = item.quantity || item.qty || 1;
                  const price = item.price || 0;
                  const subtotal = item.subtotal || (price * quantity);
                  const total = item.totalPrice || item.total || subtotal;
                  const specialInstructions = item.specialInstructions || item.note || '';
                  const options = item.options || [];
                  
                  return (
                    <Box key={item._id || item.id || index}>
                      <Box sx={{ 
                        p: 3, 
                        borderBottom: index < order.items.length - 1 ? '1px solid #f0f0f0' : 'none',
                        backgroundColor: index % 2 === 0 ? '#fafafa' : 'white'
                      }}>
                        <Stack direction="row" alignItems="flex-start" spacing={3}>
                          {/* Item Number */}
                          <Box sx={{ 
                            minWidth: 40, 
                            height: 40, 
                            borderRadius: '50%', 
                            backgroundColor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            flexShrink: 0
                          }}>
                            {index + 1}
                          </Box>
                          
                          {/* Item Details */}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight="700" sx={{ mb: 1, color: '#2c3e50' }}>
                              {foodName}
                            </Typography>
                            
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                              {formatPrice(price)} × {quantity} = {formatPrice(subtotal)}
                            </Typography>
                            
                            {/* Options */}
                            {options.length > 0 && (
                              <Box sx={{ mb: 1.5 }}>
                                {options.map((option, optIndex) => (
                                  <Box key={optIndex} sx={{ ml: 2, mb: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary" fontWeight="500">
                                      • {option.name}:
                                    </Typography>
                                    {option.choices.map((choice, choiceIndex) => (
                                      <Typography key={choiceIndex} variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                        - {choice.name} {choice.price > 0 && `(+${formatPrice(choice.price)})`}
                                      </Typography>
                                    ))}
                                  </Box>
                                ))}
                              </Box>
                            )}
                            
                            {/* Special Instructions */}
                            {specialInstructions && (
                              <Box sx={{ 
                                p: 2, 
                                backgroundColor: '#fff3cd', 
                                borderRadius: 2,
                                border: '1px solid #ffeaa7',
                                mt: 1
                              }}>
                                <Typography variant="body2" color="warning.dark" sx={{ fontStyle: 'italic' }}>
                                  📝 Ghi chú: {specialInstructions}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          
                          {/* Total Price */}
                          <Box sx={{ minWidth: 120, textAlign: 'right' }}>
                            <Typography variant="h5" color="primary" fontWeight="bold">
                              {formatPrice(total)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          </Box>

          {/* Right Column - Customer Info & Actions */}
          <Box sx={{ flex: { lg: 5 } }}>
            <Stack spacing={3}>
              {/* Customer Info */}
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardHeader 
                  title={
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ 
                        p: 1.5, 
                        backgroundColor: 'info.main', 
                        borderRadius: 2,
                        color: 'white'
                      }}>
                        <FontAwesomeIcon icon={faUser} />
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        Thông tin khách hàng
                      </Typography>
                    </Stack>
                  }
                  sx={{ 
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #e9ecef'
                  }}
                />
                <CardContent>
                  <Stack spacing={3}>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <FontAwesomeIcon icon={faUser} color="#666" />
                        <Typography variant="body2" color="text.secondary" fontWeight="600">
                          Tên người nhận
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight="600" sx={{ color: '#2c3e50' }}>
                        {order.recipientName || order.customerId?.name || 'Chưa cập nhật'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <FontAwesomeIcon icon={faPhone} color="#666" />
                        <Typography variant="body2" color="text.secondary" fontWeight="600">
                          Số điện thoại
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight="600" sx={{ color: '#2c3e50' }}>
                        {order.recipientPhonePrimary || order.customerId?.phone || 'Chưa cập nhật'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <FontAwesomeIcon icon={faMapMarkerAlt} color="#666" />
                        <Typography variant="body2" color="text.secondary" fontWeight="600">
                          Địa chỉ giao hàng
                        </Typography>
                      </Stack>
                      <Typography variant="body1" fontWeight="600" sx={{ color: '#2c3e50' }}>
                        {typeof order.deliveryAddress === 'object' 
                          ? order.deliveryAddress.addressLine || order.deliveryAddress.label || 'Chưa cập nhật'
                          : order.deliveryAddress || 'Chưa cập nhật'
                        }
                      </Typography>
                    </Box>
                    
                    {order.deliveryDistance && (
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <FontAwesomeIcon icon={faMapMarkerAlt} color="#666" />
                          <Typography variant="body2" color="text.secondary" fontWeight="600">
                            Khoảng cách
                          </Typography>
                        </Stack>
                        <Typography variant="h6" fontWeight="600" sx={{ color: '#2c3e50' }}>
                          {order.deliveryDistance.toFixed(1)} km
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardHeader 
                  title={
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ 
                        p: 1.5, 
                        backgroundColor: 'success.main', 
                        borderRadius: 2,
                        color: 'white'
                      }}>
                        <FontAwesomeIcon icon={faMoneyBillWave} />
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        Tổng kết
                      </Typography>
                    </Stack>
                  }
                  sx={{ 
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #e9ecef'
                  }}
                />
                <CardContent>
                  <Box sx={{ 
                    p: 3, 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                    borderRadius: 3,
                    color: 'white'
                  }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" fontWeight="bold">
                        Tổng tiền món ăn:
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {formatPrice(
                          order.items?.reduce((sum, item) => {
                            const itemTotal = item.totalPrice || item.total || (item.price * item.quantity);
                            return sum + itemTotal;
                          }, 0) || 0
                        )}
                      </Typography>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>

              {/* Actions */}
              {order.status === 'pending' && (
                <Card elevation={2} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<FontAwesomeIcon icon={faCheckCircle} />}
                        fullWidth
                        size="large"
                        sx={{ 
                          py: 1.5,
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          borderRadius: 2
                        }}
                        onClick={() => setConfirmDialog({
                          open: true,
                          action: 'accepted',
                          message: 'Bạn có chắc chắn muốn chấp nhận đơn hàng này?'
                        })}
                        disabled={updating}
                      >
                        Chấp nhận đơn hàng
                      </Button>
                      
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<FontAwesomeIcon icon={faTimesCircle} />}
                        fullWidth
                        size="large"
                        sx={{ 
                          py: 1.5,
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          borderRadius: 2
                        }}
                        onClick={() => setConfirmDialog({
                          open: true,
                          action: 'rejected',
                          message: 'Bạn có chắc chắn muốn từ chối đơn hàng này?'
                        })}
                        disabled={updating}
                      >
                        Từ chối đơn hàng
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Actions for confirmed orders */}
              {order.status === 'confirmed' && (
                <Card elevation={2} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<FontAwesomeIcon icon={faCheckCircle} />}
                      fullWidth
                      size="large"
                      sx={{ 
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        borderRadius: 2
                      }}
                      onClick={() => setConfirmDialog({
                        open: true,
                        action: 'ready',
                        message: 'Bạn có chắc chắn đã chuẩn bị xong đơn hàng này?'
                      })}
                      disabled={updating}
                    >
                      Đã chuẩn bị xong
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Box>
        </Box>

        {/* Confirmation Dialog */}
        <Dialog 
          open={confirmDialog.open} 
          onClose={() => setConfirmDialog({ open: false })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Xác nhận
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6">
              {confirmDialog.message}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
            <Button 
              onClick={() => setConfirmDialog({ open: false })}
              variant="outlined"
              size="large"
              sx={{ minWidth: 120, borderRadius: 2 }}
            >
              Hủy
            </Button>
            <Button
              onClick={() => confirmDialog.action && handleStatusUpdate(confirmDialog.action)}
              color={confirmDialog.action === 'accepted' || confirmDialog.action === 'ready' ? 'success' : 'error'}
              variant="contained"
              size="large"
              disabled={updating}
              sx={{ minWidth: 120, borderRadius: 2 }}
            >
              {updating ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default OrderDetailPage;