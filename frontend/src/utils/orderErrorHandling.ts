/**
 * Order error handling utilities
 */

export interface OrderError {
  status?: number;
  message?: string;
  data?: any;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Handle order placement errors
 */
export const handleOrderError = (error: any, showToast: (message: string, type: ToastType) => void, router: any) => {
  console.error('Place order error:', error);
  
  const status = error?.response?.status;
  const errorMessage = error?.response?.data?.message;
  
  if (status === 401) {
    showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại', 'error');
    router.push('/auth/login');
  } else if (status === 400) {
    const message = errorMessage || 'Dữ liệu đơn hàng không hợp lệ';
    showToast(message, 'error');
  } else if (status === 404) {
    showToast('Không tìm thấy món ăn trong giỏ hàng', 'error');
  } else {
    showToast('Không thể đặt hàng. Vui lòng thử lại', 'error');
  }
};

/**
 * Handle successful order placement
 */
export const handleOrderSuccess = (
  order: any, 
  showToast: (message: string, type: ToastType) => void, 
  router: any
) => {
  const orderCode = order?.code || order?.orderCode || order?.id || 'đơn hàng';
  console.log('🔍 Order success response:', order);
  showToast(`Đặt hàng thành công! Mã ${orderCode}`, 'success');
  
  // Redirect to orders page after a short delay
  setTimeout(() => {
    router.push('/customer/orders');
  }, 2000);
};

/**
 * Get error toast type based on error status
 */
export const getErrorToastType = (status?: number): ToastType => {
  if (status === 401) return 'error';
  if (status === 400) return 'error';
  if (status === 404) return 'error';
  if (status === 500) return 'error';
  return 'error';
};

/**
 * Format error message for display
 */
export const formatErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'Đã xảy ra lỗi không xác định';
};