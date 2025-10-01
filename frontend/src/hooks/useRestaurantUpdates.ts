import { useEffect, useState, useCallback } from 'react';
import { restaurantService } from '@modules/restaurant/services';

interface RestaurantUpdate {
  type: 'order' | 'review' | 'customer' | 'payment' | 'notification';
  data: any;
  timestamp: string;
}

interface UseRestaurantUpdatesOptions {
  enabled?: boolean;
  onOrderUpdate?: (data: any) => void;
  onNewOrder?: (data: any) => void;
  onReviewUpdate?: (data: any) => void;
  onPaymentUpdate?: (data: any) => void;
  onNotification?: (data: any) => void;
}

export const useRestaurantUpdates = (options: UseRestaurantUpdatesOptions = {}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<RestaurantUpdate | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const {
    enabled = true,
    onOrderUpdate,
    onNewOrder,
    onReviewUpdate,
    onPaymentUpdate,
    onNotification,
  } = options;

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      restaurantService.subscribeToUpdates().then(ws => {
        ws.onopen = () => {
        console.log('🔗 Connected to restaurant updates');
        setConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        try {
          const update: RestaurantUpdate = JSON.parse(event.data);
          setLastUpdate(update);

          switch (update.type) {
            case 'order':
              if (update.data.status === 'pending') {
                onNewOrder?.(update.data);
                // Play notification sound
                try {
                  const audio = new Audio('/notify.mp3');
                  audio.play().catch(() => {
                    // Fallback to system beep
                    console.log('\a');
                  });
                } catch (error) {
                  console.log('Could not play notification sound');
                }
              } else {
                onOrderUpdate?.(update.data);
              }
              break;
            case 'review':
              onReviewUpdate?.(update.data);
              break;
            case 'payment':
              onPaymentUpdate?.(update.data);
              break;
            case 'notification':
              onNotification?.(update.data);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

        ws.onclose = (event) => {
          console.log('🔌 Disconnected from restaurant updates', event.code, event.reason);
          setConnected(false);
          setSocket(null);

          // Attempt to reconnect if not manually closed
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
            
            setTimeout(() => {
              setReconnectAttempts(prev => prev + 1);
              connect();
            }, delay);
          } else if (reconnectAttempts >= maxReconnectAttempts) {
            setConnectionError('Không thể kết nối đến server. Vui lòng tải lại trang.');
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionError('Lỗi kết nối đến server');
        };

        setSocket(ws);
      }).catch(error => {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionError('Không thể tạo kết nối WebSocket');
      });
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Không thể tạo kết nối WebSocket');
    }
  }, [enabled, onOrderUpdate, onNewOrder, onReviewUpdate, onPaymentUpdate, onNotification, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close(1000, 'Manual disconnect');
      setSocket(null);
      setConnected(false);
    }
  }, [socket]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (socket && connected) {
      socket.send(JSON.stringify({ type, data }));
    }
  }, [socket, connected]);

  // Auto-connect on mount and when dependencies change
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    connected,
    lastUpdate,
    connectionError,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage,
  };
};

// Hook for order-specific updates
export const useOrderUpdates = (restaurantId?: string) => {
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [updatedOrders, setUpdatedOrders] = useState<any[]>([]);

  const { connected } = useRestaurantUpdates({
    enabled: !!restaurantId,
    onNewOrder: (order) => {
      setNewOrders(prev => [order, ...prev.slice(0, 9)]); // Keep last 10
      
      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('eatnow:new_order', {
        detail: { order, restaurantId }
      }));
    },
    onOrderUpdate: (order) => {
      setUpdatedOrders(prev => [order, ...prev.slice(0, 9)]); // Keep last 10
      
      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('eatnow:order_update', {
        detail: { order, restaurantId }
      }));
    },
  });

  const clearNewOrders = useCallback(() => {
    setNewOrders([]);
  }, []);

  const clearUpdatedOrders = useCallback(() => {
    setUpdatedOrders([]);
  }, []);

  return {
    connected,
    newOrders,
    updatedOrders,
    clearNewOrders,
    clearUpdatedOrders,
  };
};

// Hook for notification management
export const useRestaurantNotifications = (restaurantId?: string) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { connected } = useRestaurantUpdates({
    enabled: !!restaurantId,
    onNotification: (notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    },
  });

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await restaurantService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await restaurantService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    connected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
};

// Hook for real-time stats updates
export const useRestaurantStats = (refreshInterval: number = 30000) => {
  const [stats, setStats] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const data = await restaurantService.getDashboardStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  }, []);

  // Auto-refresh stats
  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshStats, refreshInterval]);

  // Listen for order updates to refresh stats
  useEffect(() => {
    const handleOrderUpdate = () => {
      refreshStats();
    };

    window.addEventListener('eatnow:order_update', handleOrderUpdate);
    window.addEventListener('eatnow:new_order', handleOrderUpdate);

    return () => {
      window.removeEventListener('eatnow:order_update', handleOrderUpdate);
      window.removeEventListener('eatnow:new_order', handleOrderUpdate);
    };
  }, [refreshStats]);

  return {
    stats,
    lastUpdated,
    refreshStats,
  };
};
