/**
 * Order validation utilities
 */

export interface OrderValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface OrderFormData {
  paymentMethod: 'cash' | 'bank_transfer' | null;
  restaurantId: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  selectedAddress: any;
  cartItems: any[];
  deliveryMode: 'immediate' | 'scheduled';
  scheduledAt?: string;
}

/**
 * Validate payment method
 */
export const validatePaymentMethod = (paymentMethod: 'cash' | 'bank_transfer' | null): OrderValidationResult => {
  if (!paymentMethod) {
    return { isValid: false, errorMessage: 'Vui lòng chọn phương thức thanh toán' };
  }
  
  if (paymentMethod === 'bank_transfer') {
    return { isValid: false, errorMessage: 'Chức năng chuyển khoản đang được phát triển' };
  }
  
  return { isValid: true };
};

/**
 * Validate restaurant ID
 */
export const validateRestaurantId = (restaurantId: string): OrderValidationResult => {
  if (!restaurantId) {
    return { isValid: false, errorMessage: 'Thiếu thông tin nhà hàng. Vui lòng quay lại.' };
  }
  
  return { isValid: true };
};

/**
 * Validate recipient name
 */
export const validateRecipientName = (name: string): OrderValidationResult => {
  if (!name.trim()) {
    return { isValid: false, errorMessage: 'Vui lòng nhập tên người nhận' };
  }
  
  return { isValid: true };
};

/**
 * Validate phone number (Vietnamese format)
 */
export const validatePhoneNumber = (phone: string): OrderValidationResult => {
  if (!phone.trim()) {
    return { isValid: false, errorMessage: 'Vui lòng nhập số điện thoại người nhận' };
  }
  
  const phoneRegex = /^0\d{9,10}$/;
  if (!phoneRegex.test(phone.trim())) {
    return { isValid: false, errorMessage: 'Số điện thoại người nhận không hợp lệ' };
  }
  
  return { isValid: true };
};

/**
 * Validate delivery address
 */
export const validateDeliveryAddress = (deliveryAddress: string, selectedAddress: any): OrderValidationResult => {
  if (!selectedAddress && !deliveryAddress.trim()) {
    return { isValid: false, errorMessage: 'Vui lòng chọn hoặc nhập địa chỉ giao hàng' };
  }
  
  if (!selectedAddress || typeof selectedAddress.latitude !== 'number' || typeof selectedAddress.longitude !== 'number') {
    return { isValid: false, errorMessage: 'Thiếu toạ độ giao hàng. Vui lòng chọn địa chỉ đã lưu có toạ độ.' };
  }
  
  return { isValid: true };
};

/**
 * Validate cart items
 */
export const validateCartItems = (cartItems: any[]): OrderValidationResult => {
  if (!cartItems.length) {
    return { isValid: false, errorMessage: 'Giỏ hàng trống' };
  }
  
  return { isValid: true };
};

/**
 * Validate scheduled delivery time
 */
export const validateScheduledTime = (deliveryMode: string, scheduledAt?: string): OrderValidationResult => {
  if (deliveryMode === 'scheduled') {
    if (!scheduledAt) {
      return { isValid: false, errorMessage: 'Vui lòng chọn thời gian hẹn giờ' };
    }
    
    const timestamp = Date.parse(scheduledAt);
    if (!Number.isFinite(timestamp) || timestamp < Date.now() + 10 * 60 * 1000) {
      return { isValid: false, errorMessage: 'Thời gian hẹn giờ phải lớn hơn hiện tại ít nhất 10 phút' };
    }
  }
  
  return { isValid: true };
};

/**
 * Validate restaurant coordinates
 */
export const validateRestaurantCoords = (restaurantCoords: any): OrderValidationResult => {
  if (!restaurantCoords) {
    return { isValid: false, errorMessage: 'Thiếu toạ độ nhà hàng. Không thể tính phí giao hàng.' };
  }
  
  return { isValid: true };
};

/**
 * Validate entire order form
 */
export const validateOrder = (formData: OrderFormData, restaurantCoords: any): OrderValidationResult => {
  const validations = [
    validatePaymentMethod(formData.paymentMethod),
    validateRestaurantId(formData.restaurantId),
    validateRecipientName(formData.recipientName),
    validatePhoneNumber(formData.recipientPhone),
    validateDeliveryAddress(formData.deliveryAddress, formData.selectedAddress),
    validateCartItems(formData.cartItems),
    validateScheduledTime(formData.deliveryMode, formData.scheduledAt),
    validateRestaurantCoords(restaurantCoords)
  ];
  
  for (const validation of validations) {
    if (!validation.isValid) {
      return validation;
    }
  }
  
  return { isValid: true };
};