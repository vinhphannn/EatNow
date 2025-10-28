import { apiClient } from './api.client';

/**
 * Wallet Service - Xử lý ví và thanh toán
 * 
 * APIs:
 * - GET /wallet/balance - Lấy số dư
 * - GET /wallet/transactions - Lịch sử giao dịch
 * - POST /payment/deposit - Nạp tiền
 * - POST /payment/withdraw - Rút tiền
 * - POST /payment/order - Thanh toán đơn hàng
 */

export interface WalletBalance {
  balance: number;
  pendingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  isActive: boolean;
}

export interface WalletTransaction {
  _id: string;
  type: 'deposit' | 'withdraw' | 'order_payment' | 'order_revenue' | 'commission' | 'platform_fee' | 'refund';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  provider?: string;
  providerPaymentUrl?: string;
  orderId?: string;
  orderCode?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DepositResponse {
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  redirectUrl?: string;
  message?: string;
}

export interface WithdrawResponse {
  success: boolean;
  transactionId: string;
  status: string;
  message: string;
}

export interface PaymentUrlResponse {
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  redirectUrl?: string;
}

class WalletService {
  /**
   * Lấy thông tin ví
   * GET /api/v1/wallet/balance
   */
  async getBalance(): Promise<WalletBalance> {
    try {
      console.log('🔍 WalletService: Calling getBalance API...');
      const response: any = await apiClient.get('/customer/wallet/balance');
      console.log('🔍 WalletService: Full response:', response);
      console.log('🔍 WalletService: Response data:', response.data);
      console.log('🔍 WalletService: Response status:', response.status);
      
      // API client trả về data trực tiếp, không phải response.data
      if (!response) {
        throw new Error('API trả về undefined');
      }
      
      return response; // Trả về response trực tiếp
    } catch (error: any) {
      console.error('🔍 WalletService: getBalance error:', error);
      throw new Error(error.response?.data?.error || 'Không thể lấy số dư ví');
    }
  }

  /**
   * Lấy lịch sử giao dịch
   * GET /api/v1/customer/wallet/transactions?limit=50
   */
  async getTransactions(limit: number = 50): Promise<WalletTransaction[]> {
    try {
      console.log('🔍 WalletService: Calling getTransactions API...');
      const response: any = await apiClient.get(`/customer/wallet/transactions?limit=${limit}`);
      console.log('🔍 WalletService: Transactions response:', response);
      return response; // API client trả về data trực tiếp
    } catch (error: any) {
      console.error('🔍 WalletService: getTransactions error:', error);
      throw new Error(error.response?.data?.error || 'Không thể lấy lịch sử giao dịch');
    }
  }

  /**
   * Nạp tiền vào ví qua MoMo
   * POST /api/v1/payment/deposit
   */
  async deposit(amount: number, provider: string = 'momo'): Promise<DepositResponse> {
    try {
      console.log('WalletService: Calling deposit API with:', { amount, provider, ownerType: 'customer' });
      
      const response: any = await apiClient.post('/payment/deposit', {
        amount,
        provider,
        ownerType: 'customer',
      });
      
      console.log('WalletService: Full API response:', response);
      console.log('WalletService: Response data:', response.data);
      
      // API client trả về response trực tiếp, không wrap trong .data
      return response;
    } catch (error: any) {
      console.error('WalletService: Deposit error:', error);
      throw new Error(error.response?.data?.error || 'Không thể nạp tiền');
    }
  }

  /**
   * Rút tiền từ ví
   * POST /api/v1/payment/withdraw
   */
  async withdraw(amount: number, provider: string = 'momo', phoneNumber?: string): Promise<WithdrawResponse> {
    try {
      const response: any = await apiClient.post('/payment/withdraw', {
        amount,
        provider,
        phoneNumber,
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Không thể rút tiền');
    }
  }

  /**
   * Thanh toán đơn hàng
   * POST /api/v1/payment/order
   */
  async payOrder(orderId: string, amount: number, orderCode: string, restaurantId: string): Promise<PaymentUrlResponse> {
    try {
      const response: any = await apiClient.post('/payment/order', {
        orderId,
        amount,
        orderCode,
        restaurantId,
      });
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Không thể thanh toán đơn hàng');
    }
  }

  /**
   * Xác nhận nạp tiền (manual confirm for testing)
   * POST /api/v1/payment/confirm-deposit
   */
  async confirmDeposit(transactionId: string): Promise<{ success: boolean; message: string; transactionId?: string }> {
    try {
      const response: any = await apiClient.post('/payment/confirm-deposit', {
        transactionId,
      });
      
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Không thể xác nhận nạp tiền');
    }
  }

  /**
   * Kiểm tra trạng thái giao dịch
   * GET /api/v1/payment/check/:transactionId
   */
  async checkTransaction(transactionId: string): Promise<{ success: boolean; transaction?: any; message?: string }> {
    try {
      const response: any = await apiClient.get(`/payment/check/${transactionId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Không thể kiểm tra giao dịch');
    }
  }

  /**
   * Format số tiền VND
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get transaction type label
   */
  getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      deposit: 'Nạp tiền',
      withdraw: 'Rút tiền',
      order_payment: 'Thanh toán đơn hàng',
      order_revenue: 'Nhận tiền đơn hàng',
      commission: 'Hoa hồng',
      platform_fee: 'Phí platform',
      refund: 'Hoàn tiền',
    };
    return labels[type] || type;
  }

  /**
   * Get transaction status color
   */
  getTransactionStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'text-yellow-600',
      completed: 'text-green-600',
      failed: 'text-red-600',
      cancelled: 'text-gray-600',
    };
    return colors[status] || 'text-gray-600';
  }
}

export const walletService = new WalletService();

