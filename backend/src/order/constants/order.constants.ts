/**
 * Order-related constants
 */

export const ORDER_CONSTANTS = {
  // Default values
  DEFAULT_DELIVERY_FEE: 15000,
  DEFAULT_DELIVERY_TIME_MINUTES: 30,
  DEFAULT_COMMISSION_RATE: 0.15,
  
  // Order code format
  ORDER_CODE_PREFIX: 'ORD',
  ORDER_CODE_PADDING: 4,
  
  // Status notes
  STATUS_NOTES: {
    pending: 'Đơn hàng đang chờ xác nhận',
    confirmed: 'Đơn hàng đã được xác nhận',
    preparing: 'Đơn hàng đang được chuẩn bị',
    ready: 'Đơn hàng đã sẵn sàng giao',
    delivered: 'Đơn hàng đã được giao thành công',
    cancelled: 'Đơn hàng đã bị hủy'
  },
  
  // Validation messages
  VALIDATION_MESSAGES: {
    EMPTY_CART: 'Giỏ hàng trống',
    NO_ITEMS: 'Vui lòng chọn món trước khi đặt hàng',
    NO_PAYMENT_METHOD: 'Thiếu phương thức thanh toán',
    INVALID_TOTAL: 'Tổng tiền không hợp lệ',
    NO_DELIVERY_ADDRESS: 'Thiếu địa chỉ giao hàng',
    INVALID_DELIVERY_ADDRESS: 'Địa chỉ giao hàng không hợp lệ',
    NO_RECIPIENT_PHONE: 'Thiếu số điện thoại người nhận',
    NO_RECIPIENT_NAME: 'Thiếu tên người nhận',
    ITEM_NOT_FOUND: 'Item not found',
    RESTAURANT_NOT_FOUND: 'Restaurant not found',
    ORDER_NOT_FOUND: 'Order not found',
    DRIVER_NOT_FOUND: 'Driver not found',
    ORDER_NOT_AVAILABLE: 'Order not available or already assigned',
    FORBIDDEN_ORDER: 'Forbidden: Not your order',
    INVALID_ORDER_STATE: 'Order not in picking_up state',
    INVALID_STATUS_TRANSITION: 'Invalid status transition',
    ORDER_CANNOT_BE_CANCELLED: 'Order cannot be cancelled at this stage'
  }
} as const;
