import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

export function useSocketDriver(driverId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!driverId) return;
    const url = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000') : '';
    const socket = io(url, { withCredentials: true, transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      try { socket.emit('join_driver', driverId); } catch {}
    });

    const onStatus = (_payload: any) => {
      // Invalidate active orders when status changes
      queryClient.invalidateQueries({ queryKey: ['driverActiveOrders'] });
      queryClient.invalidateQueries({ queryKey: ['availableOrders'] });
    };
    const onWallet = (_payload: any) => {
      // If you have a wallet query key, invalidate here
      queryClient.invalidateQueries({ queryKey: ['driverWallet'] });
    };

    socket.on('order_status_update:v1', onStatus);
    socket.on('wallet_updated', onWallet);

    return () => {
      socket.off('order_status_update:v1', onStatus);
      socket.off('wallet_updated', onWallet);
      try { socket.emit('leave_driver', driverId); } catch {}
      socket.close();
    };
  }, [driverId, queryClient]);
}


