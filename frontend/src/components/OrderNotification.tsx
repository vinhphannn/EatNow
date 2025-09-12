'use client';

import { useEffect, useState } from 'react';
import { useCustomerNotifications } from '../hooks/useSocket';

interface OrderUpdate {
  type: string;
  message: string;
  orderId: string;
  status: string;
  order?: any;
  timestamp: string;
}

interface OrderNotificationProps {
  customerId: string;
  onOrderUpdate?: (update: OrderUpdate) => void;
}

export default function OrderNotification({ customerId, onOrderUpdate }: OrderNotificationProps) {
  const { socket, connected } = useCustomerNotifications(customerId);
  const [notifications, setNotifications] = useState<OrderUpdate[]>([]);

  useEffect(() => {
    if (socket) {
      const handleOrderUpdate = (update: OrderUpdate) => {
        console.log('Order update received:', update);
        
        // Add to notifications
        setNotifications(prev => [update, ...prev.slice(0, 4)]); // Keep only last 5
        
        // Call callback if provided
        if (onOrderUpdate) {
          onOrderUpdate(update);
        }
      };

      socket.on('order_update', handleOrderUpdate);

      return () => {
        socket.off('order_update', handleOrderUpdate);
      };
    }
  }, [socket, onOrderUpdate]);

  if (!connected) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={`${notification.orderId}-${notification.timestamp}-${index}`}
          className="bg-white border-l-4 border-blue-500 shadow-lg rounded-lg p-4 max-w-sm animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Mã đơn hàng: {notification.orderId}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(notification.timestamp).toLocaleTimeString('vi-VN')}
              </p>
            </div>
            <button
              onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
