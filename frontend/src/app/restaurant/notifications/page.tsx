'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Stack,
  Box,
  Divider,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  ListItemButton
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faUtensils,
  faShoppingCart,
  faCreditCard,
  faTruck,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faEllipsisVertical,
  faFilter,
  faEnvelopeOpen,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'new_order' | 'order_status' | 'payment' | 'delivery' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  orderId?: string;
  orderCode?: string;
  status?: string;
  priority: 'low' | 'medium' | 'high';
}

export default function RestaurantNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const router = useRouter();

  // Load notifications from API
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/v1/notifications/restaurant`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setFilteredNotifications(data.notifications || []);
        } else if (response.status === 404) {
          // Backend API not implemented yet, show empty state
          console.log('📝 Notifications API not implemented yet, showing empty state');
          setNotifications([]);
          setFilteredNotifications([]);
        } else {
          console.error('Failed to load notifications');
          setNotifications([]);
          setFilteredNotifications([]);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
        setFilteredNotifications([]);
      }
    };

    loadNotifications();
  }, []);

  // Filter and sort notifications
  useEffect(() => {
    let filtered = [...notifications];

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(n => n.type === filter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.timestamp.getTime() - a.timestamp.getTime();
      } else if (sortBy === 'oldest') {
        return a.timestamp.getTime() - b.timestamp.getTime();
      } else if (sortBy === 'unread') {
        if (a.read === b.read) {
          return b.timestamp.getTime() - a.timestamp.getTime();
        }
        return a.read ? 1 : -1;
      }
      return 0;
    });

    setFilteredNotifications(filtered);
  }, [notifications, filter, sortBy]);

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    );
    
    // Navigate to order details if it's an order notification
    if (notification.orderId) {
      router.push(`/restaurant/orders/${notification.orderId}`);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, notification: Notification) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };

  const handleMarkAsRead = () => {
    if (selectedNotification) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === selectedNotification.id ? { ...n, read: true } : n
        )
      );
    }
    handleMenuClose();
  };

  const handleMarkAsUnread = () => {
    if (selectedNotification) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === selectedNotification.id ? { ...n, read: false } : n
        )
      );
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedNotification) {
      setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id));
    }
    handleMenuClose();
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Thông báo
          {unreadCount > 0 && (
            <Chip 
              label={unreadCount} 
              color="error" 
              size="small" 
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FontAwesomeIcon icon={faEnvelopeOpen} />}
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </Stack>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <FontAwesomeIcon icon={faFilter} />
            <Typography variant="subtitle1">Bộ lọc:</Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Loại thông báo</InputLabel>
              <Select
                value={filter}
                label="Loại thông báo"
                onChange={handleFilterChange}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="new_order">Đơn hàng mới</MenuItem>
                <MenuItem value="order_status">Trạng thái đơn</MenuItem>
                <MenuItem value="payment">Thanh toán</MenuItem>
                <MenuItem value="delivery">Giao hàng</MenuItem>
                <MenuItem value="system">Hệ thống</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sắp xếp</InputLabel>
              <Select
                value={sortBy}
                label="Sắp xếp"
                onChange={handleSortChange}
              >
                <MenuItem value="newest">Mới nhất</MenuItem>
                <MenuItem value="oldest">Cũ nhất</MenuItem>
                <MenuItem value="unread">Chưa đọc</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <FontAwesomeIcon icon={faBell} style={{ fontSize: 64, color: '#757575', marginBottom: 16 }} />
              <Typography variant="h6" color="text.secondary">
                Không có thông báo nào
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thông báo mới sẽ xuất hiện ở đây
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        backgroundColor: notification.read
                          ? 'transparent'
                          : 'rgba(25, 118, 210, 0.08)',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.12)'
                        }
                      }}
                    >
                      <ListItemIcon>
                        {getNotificationIcon(notification.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography
                              variant="subtitle1"
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
                            {!notification.read && (
                              <Chip
                                label="Mới"
                                size="small"
                                color="error"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            )}
                          </Stack>
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
                              {notification.message}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <FontAwesomeIcon
                                icon={faClock}
                                style={{ fontSize: 14, color: '#757575' }}
                              />
                              <Typography variant="caption" color="text.disabled">
                                {formatTimeAgo(notification.timestamp)}
                              </Typography>
                              {notification.orderCode && (
                                <Chip
                                  label={notification.orderCode}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 18 }}
                                />
                              )}
                            </Stack>
                          </Box>
                        }
                      />
                      <IconButton
                        onClick={(e) => handleMenuClick(e, notification)}
                        size="small"
                      >
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                      </IconButton>
                    </ListItemButton>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
              
          )}
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={selectedNotification?.read ? handleMarkAsUnread : handleMarkAsRead}>
          {selectedNotification?.read ? (
            <>
              <FontAwesomeIcon icon={faEnvelopeOpen} style={{ marginRight: 8 }} />
              Đánh dấu chưa đọc
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: 8 }} />
              Đánh dấu đã đọc
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <FontAwesomeIcon icon={faTrash} style={{ marginRight: 8 }} />
          Xóa thông báo
        </MenuItem>
      </Menu>
    </Container>
  );
}
