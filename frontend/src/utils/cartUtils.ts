/**
 * Utility functions for cart calculations
 */

export interface CartItem {
  id: string;
  item: {
    id: string;
    name: string;
    price: number;
    type: string;
    description?: string;
    imageUrl?: string;
    imageId?: string;
    rating: number;
  };
  restaurant: {
    id: string;
    name: string;
    address?: string;
  };
  quantity: number;
  specialInstructions?: string;
  subtotal: number;
  totalPrice?: number;
  options?: Array<{
    name: string;
    choices: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
  }>;
}

export interface CartSummary {
  count: number;
  total: number;
}

/**
 * Tính toán cart summary từ cart data
 * @param cart - Cart object từ API
 * @returns CartSummary với count (tổng số lượng món) và total (tổng tiền)
 */
export const calculateCartSummary = (cart: any): CartSummary => {
  if (!cart || !cart.items || !Array.isArray(cart.items)) {
    return { count: 0, total: 0 };
  }
  
  // Đếm tổng số lượng món (quantity của từng item)
  const count = cart.items.reduce((sum: number, item: any) => {
    return sum + Number(item.quantity || 1);
  }, 0);
  
  // Tính tổng tiền
  const total = cart.items.reduce((sum: number, item: any) => {
    return sum + Number(item.totalPrice || item.subtotal || 0);
  }, 0);
  
  return { count, total };
};

/**
 * Tính toán cart summary từ cart items array
 * @param items - Array of cart items
 * @returns CartSummary với count (tổng số lượng món) và total (tổng tiền)
 */
export const calculateCartSummaryFromItems = (items: CartItem[]): CartSummary => {
  if (!Array.isArray(items)) {
    return { count: 0, total: 0 };
  }
  
  // Đếm tổng số lượng món (quantity của từng item)
  const count = items.reduce((sum: number, item: CartItem) => {
    return sum + Number(item.quantity || 1);
  }, 0);
  
  // Tính tổng tiền
  const total = items.reduce((sum: number, item: CartItem) => {
    return sum + Number(item.totalPrice || item.subtotal || 0);
  }, 0);
  
  return { count, total };
};

/**
 * Lấy thông tin hiển thị cart từ cart data
 * @param cart - Cart object từ API
 * @returns Object với các thông tin hiển thị
 */
export const getCartDisplayInfo = (cart: any) => {
  const summary = calculateCartSummary(cart);
  
  return {
    ...summary,
    itemCount: cart?.items?.length || 0, // Số loại món khác nhau
    totalItems: summary.count, // Tổng số lượng món
    totalAmount: summary.total,
    isEmpty: summary.count === 0,
    hasItems: summary.count > 0
  };
};

/**
 * Format số tiền theo định dạng Việt Nam
 * @param amount - Số tiền
 * @returns String đã format
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

/**
 * Format số lượng món
 * @param count - Số lượng
 * @returns String đã format
 */
export const formatItemCount = (count: number): string => {
  if (count === 0) return '0 món';
  if (count === 1) return '1 món';
  return `${count} món`;
};

/**
 * Kiểm tra cart có hợp lệ không
 * @param cart - Cart object
 * @returns boolean
 */
export const isValidCart = (cart: any): boolean => {
  return cart && 
         Array.isArray(cart.items) && 
         cart.items.length > 0 &&
         cart.items.every((item: any) => item.quantity > 0);
};