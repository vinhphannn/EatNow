import { useEffect, useCallback, useRef } from 'react';
import { useCustomerNotifications } from './useSocket';

/**
 * Payment WebSocket Event Types
 */
export interface PaymentStatusUpdateEvent {
  type: 'payment_status_update';
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  transactionType: string;
  message: string;
  metadata?: any;
  timestamp: string;
}

export interface DepositCompletedEvent {
  type: 'deposit_completed';
  transactionId: string;
  amount: number;
  newBalance: number;
  providerTransactionId?: string;
  message: string;
  timestamp: string;
}

export interface WithdrawalCompletedEvent {
  type: 'withdrawal_completed';
  transactionId: string;
  amount: number;
  newBalance: number;
  message: string;
  timestamp: string;
}

/**
 * Hook để lắng nghe payment events qua WebSocket
 * Thay thế polling mechanism cũ
 */
export function usePaymentSocket(
  userId: string | null,
  options?: {
    onPaymentStatusUpdate?: (event: PaymentStatusUpdateEvent) => void;
    onDepositCompleted?: (event: DepositCompletedEvent) => void;
    onWithdrawalCompleted?: (event: WithdrawalCompletedEvent) => void;
  }
) {
  const { socket, connected } = useCustomerNotifications(userId || '');
  
  // Use refs to avoid recreating listeners on every render
  const onPaymentStatusUpdateRef = useRef(options?.onPaymentStatusUpdate);
  const onDepositCompletedRef = useRef(options?.onDepositCompleted);
  const onWithdrawalCompletedRef = useRef(options?.onWithdrawalCompleted);

  // Update refs when callbacks change
  useEffect(() => {
    onPaymentStatusUpdateRef.current = options?.onPaymentStatusUpdate;
    onDepositCompletedRef.current = options?.onDepositCompleted;
    onWithdrawalCompletedRef.current = options?.onWithdrawalCompleted;
  }, [options?.onPaymentStatusUpdate, options?.onDepositCompleted, options?.onWithdrawalCompleted]);

  // Setup event listeners
  useEffect(() => {
    if (!socket || !connected || !userId) {
      console.log('⚠️ Payment socket not ready:', { socket: !!socket, connected, userId });
      return;
    }

    console.log('💳 Setting up payment WebSocket listeners for user:', userId);

    // Payment status update listener
    const handlePaymentStatusUpdate = (event: PaymentStatusUpdateEvent) => {
      console.log('💳 Payment status update received:', event);
      if (onPaymentStatusUpdateRef.current) {
        onPaymentStatusUpdateRef.current(event);
      }
    };

    // Deposit completed listener
    const handleDepositCompleted = (event: DepositCompletedEvent) => {
      console.log('💰 Deposit completed received:', event);
      if (onDepositCompletedRef.current) {
        onDepositCompletedRef.current(event);
      }
    };

    // Withdrawal completed listener
    const handleWithdrawalCompleted = (event: WithdrawalCompletedEvent) => {
      console.log('💸 Withdrawal completed received:', event);
      if (onWithdrawalCompletedRef.current) {
        onWithdrawalCompletedRef.current(event);
      }
    };

    // Register event listeners
    socket.on('payment_status_update:v1', handlePaymentStatusUpdate);
    socket.on('deposit_completed:v1', handleDepositCompleted);
    socket.on('withdrawal_completed:v1', handleWithdrawalCompleted);

    console.log('✅ Payment WebSocket listeners registered');

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up payment WebSocket listeners');
      socket.off('payment_status_update:v1', handlePaymentStatusUpdate);
      socket.off('deposit_completed:v1', handleDepositCompleted);
      socket.off('withdrawal_completed:v1', handleWithdrawalCompleted);
    };
  }, [socket, connected, userId]);

  return {
    socket,
    connected,
    isReady: !!(socket && connected && userId),
  };
}

/**
 * Hook đơn giản để lắng nghe deposit completion
 * Dùng cho màn hình nạp tiền
 */
export function useDepositListener(
  userId: string | null,
  transactionId: string | null,
  onCompleted: (event: DepositCompletedEvent) => void
) {
  const handleDepositCompleted = useCallback(
    (event: DepositCompletedEvent) => {
      // Chỉ xử lý event cho transaction đang theo dõi
      if (transactionId && event.transactionId === transactionId) {
        console.log('✅ Deposit completed for transaction:', transactionId);
        onCompleted(event);
      }
    },
    [transactionId, onCompleted]
  );

  return usePaymentSocket(userId, {
    onDepositCompleted: handleDepositCompleted,
  });
}

/**
 * Hook để lắng nghe tất cả payment events và log
 * Dùng cho debugging
 */
export function usePaymentSocketDebug(userId: string | null) {
  return usePaymentSocket(userId, {
    onPaymentStatusUpdate: (event) => {
      console.log('🔔 [DEBUG] Payment Status Update:', event);
    },
    onDepositCompleted: (event) => {
      console.log('🔔 [DEBUG] Deposit Completed:', event);
    },
    onWithdrawalCompleted: (event) => {
      console.log('🔔 [DEBUG] Withdrawal Completed:', event);
    },
  });
}

