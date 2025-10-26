import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Global socket instance to prevent multiple connections
let globalSocket: Socket | null = null;
let globalConnected = false;

export function useSocket(url: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const urlRef = useRef(url);

  // Update URL ref when it changes
  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  const connectSocket = useCallback(() => {
    // Prevent multiple connection attempts
    if (isConnectingRef.current || (globalSocket && globalSocket.connected)) {
      if (globalSocket) {
        setSocket(globalSocket);
        setConnected(globalConnected);
      }
      return;
    }

    console.log('🔍 Socket connection attempt:', {
      url: urlRef.current,
      withCredentials: true
    });
    
    isConnectingRef.current = true;
    
    // Use existing socket if available and connected
    if (globalSocket && globalSocket.connected) {
      setSocket(globalSocket);
      setConnected(true);
      return;
    }
    
    // If socket exists but not connected, try to reconnect
    if (globalSocket && !globalSocket.connected) {
      console.log('🔄 Reconnecting existing socket...');
      globalSocket.connect();
      setSocket(globalSocket);
      return;
    }
    
    // Create new socket only if none exists
    if (!globalSocket) {
      const newSocket = io(urlRef.current, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        // Cookie-based auth only
        auth: {},
        extraHeaders: {},
        // Add reconnection settings
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 3,
        timeout: 10000,
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to server');
        console.log('🔍 Socket connected state:', newSocket.connected);
        setConnected(true);
        globalConnected = true;
        isConnectingRef.current = false;
      });

      newSocket.on('connect_error', (error) => {
        console.log('❌ Connection error:', error);
        setConnected(false);
        globalConnected = false;
        isConnectingRef.current = false;
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server:', reason);
        console.log('🔍 Socket connected state after disconnect:', newSocket.connected);
        setConnected(false);
        globalConnected = false;
        isConnectingRef.current = false;
        
        // Only reconnect if it's not a manual disconnect
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!newSocket.connected) {
              console.log('🔄 Attempting to reconnect...');
              newSocket.connect();
            }
          }, 3000);
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        setConnected(false);
        globalConnected = false;
        isConnectingRef.current = false;
      });

      // Add additional event listeners for debugging
      newSocket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected after', attemptNumber, 'attempts');
        setConnected(true);
        globalConnected = true;
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('❌ Reconnection error:', error);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('❌ Reconnection failed - giving up');
        setConnected(false);
        globalConnected = false;
      });

      globalSocket = newSocket;
    }
    
    setSocket(globalSocket);
  }, []);

  useEffect(() => {
    connectSocket();

    return () => {
      // Don't cleanup global socket, just clear local refs
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectSocket]);

  return { socket, connected };
}

export function useRestaurantNotifications(restaurantId: string) {
  const wsUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001')
    : 'http://localhost:3001';
  const { socket, connected } = useSocket(wsUrl);
  const restaurantIdRef = useRef(restaurantId);

  // Update ref when restaurantId changes
  useEffect(() => {
    restaurantIdRef.current = restaurantId;
  }, [restaurantId]);

  useEffect(() => {
    if (socket && connected && restaurantId) {
      console.log('🏪 Restaurant joining room:', restaurantId);
      // Join restaurant room
      socket.emit('join_restaurant', restaurantId);
      
      return () => {
        console.log('🏪 Restaurant leaving room:', restaurantId);
        socket.emit('leave_restaurant', restaurantId);
      };
    }
  }, [socket, connected, restaurantId]);

  return { socket, connected };
}

export function useCustomerNotifications(customerId: string) {
  const wsUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001')
    : 'http://localhost:3001';
  const { socket, connected } = useSocket(wsUrl);
  const customerIdRef = useRef(customerId);

  // Update ref when customerId changes
  useEffect(() => {
    customerIdRef.current = customerId;
  }, [customerId]);

  useEffect(() => {
    if (socket && connected && customerId) {
      console.log('👤 Customer joining room:', customerId);
      // Join user room (server expects 'join_user')
      socket.emit('join_user', customerId);
      
      return () => {
        console.log('👤 Customer leaving room:', customerId);
        socket.emit('leave_user', customerId);
      };
    }
  }, [socket, connected, customerId]);

  return { socket, connected };
}
