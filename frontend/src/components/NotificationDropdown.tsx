'use client';

import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Button,
  Box,
  Divider,
  Chip,
  Avatar
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faBellSlash,
  faUtensils,
  faShoppingCart,
  faCreditCard,
  faTruck,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { notificationService, Notification } from '@/services/notification.service';

interface NotificationDropdownProps {
  restaurantId?: string;
}

export default function NotificationDropdown({ restaurantId }: NotificationDropdownProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  
  // Socket.IO connection for real-time notifications
  const { socket, connected } = useSocket(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');

  const open = Boolean(anchorEl);

  // Load notifications from API
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await notificationService.restaurant.getNotifications({ limit: 10 });
        setNotifications(response.data || []);
        setUnreadCount(response.pagination.unreadCount || 0);
        console.log('📝 Loaded notifications:', response);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    loadNotifications();
  }, []);

  // Socket.IO real-time notifications
  useEffect(() => {
    if (socket && connected && restaurantId) {
      console.log('🔔 Setting up Socket.IO listeners for notifications');
      
    const onNewNotification = (payload: any) => {
      console.log('🔔 New notification received:', payload);
      
      // Convert socket payload to Notification format
      const notification: Notification = {
        _id: payload.notificationId || Date.now().toString(),
        restaurantId: restaurantId || '',
        orderId: payload.orderId,
        type: payload.type || 'new_order',
        title: payload.title || 'Đơn hàng mới',
        content: payload.content || payload.message || 'Bạn có đơn hàng mới',
        priority: payload.priority || 'high',
        read: false,
        metadata: {
          orderCode: payload.orderCode,
        },
        createdAt: payload.timestamp || new Date().toISOString(),
        updatedAt: payload.timestamp || new Date().toISOString(),
      };
      
      console.log('🔔 Notification details:', notification);
      
      // Add new notification to the list
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep only 10 most recent
      setUnreadCount(prev => prev + 1);
      
      console.log('🔔 Notification added to dropdown, new unread count:', unreadCount + 1);
    };

      const onNotificationUpdate = (payload: any) => {
        console.log('🔔 Notification update received:', payload);
        const { notificationId, read } = payload;
        
        // Update notification read status
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, read } : n
          )
        );
        
        if (read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      };

      socket.on('new_notification:v1', onNewNotification);
      socket.on('notification_update:v1', onNotificationUpdate);

      return () => {
        console.log('🧹 Cleaning up notification Socket.IO listeners');
        socket.off('new_notification:v1', onNewNotification);
        socket.off('notification_update:v1', onNotificationUpdate);
      };
    }
  }, [socket, connected, restaurantId]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read via API
    if (!notification.read) {
      try {
        await notificationService.restaurant.markAsRead(notification._id);
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        console.log('✅ Notification marked as read:', notification._id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Navigate to order details if it's an order notification
    if (notification.orderId) {
      router.push(`/restaurant/orders/${notification.orderId}`);
    }
    
    handleClose();
  };

  const handleViewAll = () => {
    router.push('/restaurant/notifications');
    handleClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <FontAwesomeIcon icon={faShoppingCart} style={{ color: '#1976d2' }} />;
      case 'order_status':
        return <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#2e7d32' }} />;
      case 'payment':
        return <FontAwesomeIcon icon={faCreditCard} style={{ color: '#2e7d32' }} />;
      case 'delivery':
        return <FontAwesomeIcon icon={faTruck} style={{ color: '#0288d1' }} />;
      case 'system':
        return <FontAwesomeIcon icon={faUtensils} style={{ color: '#757575' }} />;
      default:
        return <FontAwesomeIcon icon={faBell} style={{ color: '#757575' }} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const timestampDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const diff = now.getTime() - timestampDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  const recentNotifications = notifications.slice(0, 5); // Show only 5 most recent

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: 'inherit',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <FontAwesomeIcon icon={faBell} />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            mt: 1
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FontAwesomeIcon icon={faBell} />
            Thông báo
            {unreadCount > 0 && (
              <Chip 
                label={unreadCount} 
                size="small" 
                color="error" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>

        <List sx={{ p: 0, maxHeight: 350, overflow: 'auto' }}>
          {recentNotifications.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="Không có thông báo mới"
                secondary="Tất cả thông báo đã được đọc"
              />
            </ListItem>
          ) : (
            recentNotifications.map((notification, index) => (
              <React.Fragment key={notification._id}>
                <ListItem
                  component="button"
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.12)'
                    },
                    cursor: 'pointer',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: notification.read ? 'normal' : 'bold',
                            color: notification.read ? 'text.secondary' : 'text.primary'
                          }}
                        >
                          {notification.title}
                        </Typography>
                        <Chip
                          label={notification.priority}
                          size="small"
                          color={getPriorityColor(notification.priority) as any}
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontWeight: notification.read ? 'normal' : 'medium',
                            mb: 0.5
                          }}
                        >
                          {notification.content}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FontAwesomeIcon icon={faClock} style={{ fontSize: 14, color: '#757575' }} />
                          <Typography variant="caption" color="text.disabled">
                            {formatTimeAgo(notification.createdAt)}
                          </Typography>
                          {notification.metadata?.orderCode && (
                            <Chip
                              label={notification.metadata.orderCode}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 18 }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < recentNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </List>

        {notifications.length > 5 && (
          <>
            <Divider />
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                fullWidth
                endIcon={<FontAwesomeIcon icon={faArrowRight} />}
                onClick={handleViewAll}
                sx={{ textTransform: 'none' }}
              >
                Xem tất cả thông báo ({notifications.length})
              </Button>
            </Box>
          </>
        )}
      </Popover>
    </>
  );
}