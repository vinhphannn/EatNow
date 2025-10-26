/**
 * Order data transformation utilities
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
  };
  restaurant: {
    id: string;
    name: string;
    address?: string;
  };
  quantity: number;
  subtotal: number;
  totalPrice: number;
  options?: Array<{
    name: string;
    choices: Array<{
      name: string;
      price: number;
      quantity: number;
    }>;
  }>;
  specialInstructions?: string;
}

export interface DeliveryAddress {
  label: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  note?: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  totalPrice: number;
  options: any[];
  specialInstructions: string;
}

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  tip: number;
  doorFee: number;
  finalTotal: number;
}

export interface OrderData {
  restaurantId: string;
  items: OrderItem[];
  paymentMethod: 'cash' | 'bank_transfer';
  deliveryAddress: DeliveryAddress;
  recipient: {
    name: string;
    phone: string;
  };
  specialInstructions?: string;
  mode: 'immediate' | 'scheduled';
  scheduledAt?: string;
  tip: number;
  doorFee: number;
  voucherCode?: string;
  totals: OrderTotals;
}

/**
 * Transform cart items to order items
 */
export const transformCartItemsToOrderItems = (cartItems: CartItem[]): OrderItem[] => {
  return cartItems.map(item => ({
    itemId: item.item.id,
    name: item.item.name,
    price: item.item.price,
    quantity: item.quantity,
    subtotal: item.subtotal,
    totalPrice: item.totalPrice,
    options: item.options || [],
    specialInstructions: item.specialInstructions || ''
  }));
};

/**
 * Format delivery address
 */
export const formatDeliveryAddress = (
  selectedAddress: any, 
  deliveryAddress: string
): DeliveryAddress => {
  if (selectedAddress) {
    return {
      label: selectedAddress.label || 'Địa chỉ giao hàng',
      addressLine: selectedAddress.addressLine || deliveryAddress.trim(),
      latitude: selectedAddress.latitude || 0,
      longitude: selectedAddress.longitude || 0,
      note: selectedAddress.note || ''
    };
  } else {
    return {
      label: 'Địa chỉ giao hàng',
      addressLine: deliveryAddress.trim(),
      latitude: 0,
      longitude: 0,
      note: ''
    };
  }
};

/**
 * Calculate order totals
 */
export const calculateOrderTotals = (
  cartItems: CartItem[],
  deliveryFee: number,
  tip: number,
  doorFee: boolean,
  driverTip: number = 0
): OrderTotals => {
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const doorFeeAmount = doorFee ? 5000 : 0;
  // Chỉ có một trường tip cho tài xế (driverTip)
  const totalTip = driverTip;
  const finalTotal = subtotal + deliveryFee + totalTip + doorFeeAmount;
  
  return {
    subtotal,
    deliveryFee,
    tip: totalTip, // Chỉ lưu driverTip
    doorFee: doorFeeAmount,
    finalTotal
  };
};

/**
 * Create complete order data
 */
export const createOrderData = (
  restaurantId: string,
  cartItems: CartItem[],
  paymentMethod: 'cash' | 'bank_transfer',
  selectedAddress: any,
  deliveryAddress: string,
  recipientName: string,
  recipientPhone: string,
  specialInstructions: string | undefined,
  deliveryMode: 'immediate' | 'scheduled',
  scheduledAt: string | undefined,
  tip: number,
  doorFee: boolean,
  driverTip: number,
  voucherCode: string | undefined,
  deliveryFee: number
): OrderData => {
  const items = transformCartItemsToOrderItems(cartItems);
  const formattedDeliveryAddress = formatDeliveryAddress(selectedAddress, deliveryAddress);
  const totals = calculateOrderTotals(cartItems, deliveryFee, tip, doorFee, driverTip);
  
  return {
    restaurantId,
    items,
    paymentMethod,
    deliveryAddress: formattedDeliveryAddress,
    recipient: {
      name: recipientName.trim(),
      phone: recipientPhone.trim()
    },
    specialInstructions: specialInstructions || undefined,
    mode: deliveryMode,
    scheduledAt: deliveryMode === 'scheduled' ? scheduledAt : undefined,
    tip: driverTip, // Sử dụng driverTip thay vì tip
    doorFee: doorFee ? 5000 : 0,
    voucherCode: voucherCode || undefined,
    totals
  };
};

/**
 * Debug cart items with options
 */
export const debugCartItems = (cartItems: CartItem[], label: string) => {
  console.log(`🔍 ${label}:`, cartItems.map(item => ({
    name: item.item.name,
    options: item.options,
    totalPrice: item.totalPrice
  })));
};

/**
 * Debug order items with options
 */
export const debugOrderItems = (orderItems: OrderItem[], label: string) => {
  console.log(`🔍 ${label}:`, orderItems.map(item => ({
    name: item.name,
    options: item.options,
    totalPrice: item.totalPrice
  })));
};