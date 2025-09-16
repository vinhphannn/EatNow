import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketCleanup } from '../utils/socketCleanup';

export function useSocket(url: string, token?: string, connect: boolean = true) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Clean up existing socket first
    if (socketRef.current) {
      console.log('Cleaning up existing socket connection');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (!connect) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const newSocket = io(url, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: token ? { token } : undefined,
      forceNew: true, // Force new connection
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log('useSocket cleanup - disconnecting socket');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
    };
  }, [url, token, connect]);

  return { socket, connected };
}

export function useRestaurantNotifications(jwtToken?: string, restaurantIdFallback?: string) {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
  console.log('Restaurant WebSocket URL:', wsUrl);
  console.log('Restaurant JWT Token:', jwtToken ? 'Present' : 'Missing');
  console.log('Restaurant ID Fallback:', restaurantIdFallback);
  
  const { socket, connected } = useSocket(wsUrl, jwtToken, !!jwtToken);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const primedRef = useRef(false);
  const cleanup = SocketCleanup.getInstance();

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/notify.mp3');
      audioRef.current.loop = false;
    }
  }, []);

  // Prime audio on first user interaction to satisfy autoplay policies
  useEffect(() => {
    if (primedRef.current) return;
    const handler = () => {
      primedRef.current = true;
      try { audioRef.current?.play().then(() => { audioRef.current?.pause(); audioRef.current!.currentTime = 0; }).catch(() => {}); } catch {}
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('touchstart', handler);
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('click', handler, { once: true });
      document.addEventListener('keydown', handler, { once: true });
      document.addEventListener('touchstart', handler, { once: true });
    }
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Register socket for cleanup
    cleanup.registerSocket(`restaurant_${restaurantIdFallback || 'default'}`, socket);
    
    // Fallback: if backend couldn't auto-join via JWT, join explicit restaurant room
    if (restaurantIdFallback) {
      socket.emit('join_restaurant', restaurantIdFallback);
    }
    const onNewOrder = (payload: any) => {
      console.log('New order received', payload);
      try {
        if (audioRef.current) {
          audioRef.current.loop = true;
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      } catch {}
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('eatnow:new_order', { detail: payload }));
        }
      } catch {}
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Đơn hàng mới', { body: `Tổng: ${payload?.order?.total ?? ''}` });
        }
      }
    };
    const onOrderUpdate = (payload: any) => {
      console.log('Order update', payload);
      // Stop ringing when restaurant acknowledges/changes status
      const status = (payload?.status || '').toString();
      if (audioRef.current && (status === 'confirmed' || status === 'preparing' || status === 'ready' || status === 'cancelled')) {
        try {
          audioRef.current.loop = false;
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('eatnow:order_update', { detail: payload }));
        }
      } catch {}
    };
    const stopRingHandler = () => {
      try {
        if (audioRef.current) {
          audioRef.current.loop = false;
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      } catch {}
    };

    socket.on('new_order', onNewOrder);
    socket.on('order_update', onOrderUpdate);
    window.addEventListener('eatnow:stop_ring', stopRingHandler);
    return () => {
      if (restaurantIdFallback) {
        socket.emit('leave_restaurant', restaurantIdFallback);
      }
      socket.off('new_order', onNewOrder);
      socket.off('order_update', onOrderUpdate);
      window.removeEventListener('eatnow:stop_ring', stopRingHandler);
      
      // Cleanup socket
      cleanup.cleanupSocket(`restaurant_${restaurantIdFallback || 'default'}`);
    };
  }, [socket, restaurantIdFallback]);

  return { socket, connected };
}

export function useCustomerNotifications(jwtToken?: string) {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
  console.log('Customer WebSocket URL:', wsUrl);
  console.log('Customer JWT Token:', jwtToken ? 'Present' : 'Missing');
  
  const { socket, connected } = useSocket(wsUrl, jwtToken);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const primedRef = useRef(false);
  const cleanup = SocketCleanup.getInstance();

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/noti2.mp3');
      audioRef.current.loop = false;
    }
  }, []);

  // Prime audio for customer as well
  useEffect(() => {
    if (primedRef.current) return;
    const handler = () => {
      primedRef.current = true;
      try { audioRef.current?.play().then(() => { audioRef.current?.pause(); audioRef.current!.currentTime = 0; }).catch(() => {}); } catch {}
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('touchstart', handler);
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('click', handler, { once: true });
      document.addEventListener('keydown', handler, { once: true });
      document.addEventListener('touchstart', handler, { once: true });
    }
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Register socket for cleanup
    cleanup.registerSocket('customer_default', socket);
    
    const onOrderStatusUpdate = (payload: any) => {
      console.log('Order status update received:', payload);
      try {
        if (audioRef.current && (payload?.status === 'confirmed' || payload?.status === 'ready' || payload?.status === 'delivered' || payload?.status === 'cancelled')) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      } catch {}
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('eatnow:order_status_update', { detail: payload }));
        }
      } catch {}
    };
    socket.on('order_status_update', onOrderStatusUpdate);
    
    // Listen for driver location updates
    const onDriverLocationUpdate = (payload: any) => {
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('eatnow:driver_location_update', { detail: payload }));
        }
      } catch {}
    };
    socket.on('driver_location_update', onDriverLocationUpdate);
    
    return () => { 
      socket.off('order_status_update', onOrderStatusUpdate);
      socket.off('driver_location_update', onDriverLocationUpdate);
      // Cleanup socket
      cleanup.cleanupSocket('customer_default');
    };
  }, [socket]);

  return { socket, connected };
}
