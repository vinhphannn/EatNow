'use client';

import { useEffect, useState } from 'react';
import { useCustomerNotifications } from '../hooks/useSocket';

interface OrderUpdate {
  type: string;
  message: string;
  orderId: string;
  status: string;
}

export default function OrderNotification() {
  const [notifications, setNotifications] = useState<OrderUpdate[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  useEffect(() => {
    // Cookie-based auth: get customer ID from AuthContext instead of localStorage
    // This should be passed as prop or use AuthContext
    setCustomerId(null); // Will be updated when AuthContext is available
  }, []);
  
  const { socket, connected } = useCustomerNotifications(customerId || '');

  useEffect(() => {
    if (socket && customerId) {
      const handleOrderUpdate = (data: OrderUpdate) => {
        setNotifications(prev => [...prev, data]);
        
        // Auto remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.orderId !== data.orderId));
        }, 5000);
      };

      socket.on('order_status_update:v1', handleOrderUpdate);
      
      return () => {
        socket.off('order_status_update:v1', handleOrderUpdate);
      };
    }
  }, [socket, customerId]);

  const removeNotification = (orderId: string) => {
    setNotifications(prev => prev.filter(n => n.orderId !== orderId));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.orderId}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                Cập nhật đơn hàng #{notification.orderId}
              </h4>
              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  notification.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  notification.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                  notification.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                  notification.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {notification.status}
                </span>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.orderId)}
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