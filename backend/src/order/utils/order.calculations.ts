/**
 * Order calculation utilities
 */

import { ORDER_CONSTANTS } from '../constants/order.constants';

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  tip: number;
  doorFee: number;
  discount?: number;
  finalTotal: number;
}

export interface OrderItemCalculation {
  subtotal: number;
  totalPrice: number;
}

export class OrderCalculator {
  /**
   * Calculate order item totals
   */
  static calculateItemTotals(item: {
    price: number;
    quantity: number;
    options?: any[];
    subtotal?: number;
    totalPrice?: number;
  }): OrderItemCalculation {
    // Calculate subtotal
    const subtotal = item.subtotal || (item.price * item.quantity);
    
    // Calculate options total price
    const optionsTotalPrice = (item.options || []).reduce(
      (sum: number, opt: any) => sum + (opt.totalPrice || 0), 
      0
    );
    
    // Calculate total price
    const totalPrice = item.totalPrice || (subtotal + optionsTotalPrice);
    
    return { subtotal, totalPrice };
  }

  /**
   * Calculate order totals
   */
  static calculateOrderTotals(
    subtotal: number,
    deliveryFee: number = ORDER_CONSTANTS.DEFAULT_DELIVERY_FEE,
    tip: number = 0,
    doorFee: number = 0,
    discount: number = 0
  ): OrderTotals {
    const finalTotal = subtotal + deliveryFee + tip + doorFee - discount;
    
    return {
      subtotal,
      deliveryFee,
      tip,
      doorFee,
      discount,
      finalTotal
    };
  }

  /**
   * Calculate delivery fee (placeholder for distance-based calculation)
   */
  static calculateDeliveryFee(deliveryAddress: any): number {
    // TODO: Implement distance-based calculation
    return ORDER_CONSTANTS.DEFAULT_DELIVERY_FEE;
  }

  /**
   * Calculate estimated delivery time
   */
  static calculateEstimatedDeliveryTime(distanceKm: number): Date {
    const estimatedTime = new Date();
    // Simple calculation: 30 minutes base + 2 minutes per km
    const additionalMinutes = Math.max(0, (distanceKm - 5) * 2);
    estimatedTime.setMinutes(
      estimatedTime.getMinutes() + 
      ORDER_CONSTANTS.DEFAULT_DELIVERY_TIME_MINUTES + 
      additionalMinutes
    );
    return estimatedTime;
  }

  /**
   * Calculate commission
   */
  static calculateCommission(total: number, commissionRate: number = ORDER_CONSTANTS.DEFAULT_COMMISSION_RATE): number {
    return Math.round(total * commissionRate);
  }

  /**
   * Calculate net amount for restaurant
   */
  static calculateRestaurantNet(total: number, commission: number): number {
    return Math.max(0, total - commission);
  }
}
