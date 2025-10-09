import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(url: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(url, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [url]);

  return { socket, connected };
}

export function useRestaurantNotifications(restaurantId: string) {
  const wsUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000')
    : 'http://localhost:3000';
  const { socket, connected } = useSocket(wsUrl);

  useEffect(() => {
    if (socket && restaurantId) {
      // Join restaurant room
      socket.emit('join_restaurant', restaurantId);
      
      return () => {
        socket.emit('leave_restaurant', restaurantId);
      };
    }
  }, [socket, restaurantId]);

  return { socket, connected };
}

export function useCustomerNotifications(customerId: string) {
  const wsUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000')
    : 'http://localhost:3000';
  const { socket, connected } = useSocket(wsUrl);

  useEffect(() => {
    if (socket && customerId) {
      // Join user room (server expects 'join_user')
      socket.emit('join_user', customerId);
      
      return () => {
        socket.emit('leave_user', customerId);
      };
    }
  }, [socket, customerId]);

  return { socket, connected };
}
