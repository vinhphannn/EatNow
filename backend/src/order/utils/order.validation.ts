/**
 * Order validation utilities
 */

import { ORDER_CONSTANTS } from '../constants/order.constants';

export interface OrderValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export class OrderValidator {
  /**
   * Validate order items
   */
  static validateItems(items: any[]): OrderValidationResult {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        isValid: false,
        errorMessage: ORDER_CONSTANTS.VALIDATION_MESSAGES.NO_ITEMS
      };
    }
    return { isValid: true };
  }

  /**
   * Validate payment method
   */
  static validatePaymentMethod(paymentMethod: string): OrderValidationResult {
    if (!paymentMethod) {
      return {
        isValid: false,
        errorMessage: ORDER_CONSTANTS.VALIDATION_MESSAGES.NO_PAYMENT_METHOD
      };
    }
    return { isValid: true };
  }

  /**
   * Validate total amount
   */
  static validateTotal(total: number): OrderValidationResult {
    if (total <= 0) {
      return {
        isValid: false,
        errorMessage: ORDER_CONSTANTS.VALIDATION_MESSAGES.INVALID_TOTAL
      };
    }
    return { isValid: true };
  }

  /**
   * Validate delivery address
   */
  static validateDeliveryAddress(deliveryAddress: any): OrderValidationResult {
    if (!deliveryAddress) {
      return {
        isValid: false,
        errorMessage: ORDER_CONSTANTS.VALIDATION_MESSAGES.NO_DELIVERY_ADDRESS
      };
    }

    if (!deliveryAddress.addressLine || 
        deliveryAddress.latitude === undefined || 
        deliveryAddress.longitude === undefined) {
      return {
        isValid: false,
        errorMessage: ORDER_CONSTANTS.VALIDATION_MESSAGES.INVALID_DELIVERY_ADDRESS
      };
    }

    return { isValid: true };
  }

  /**
   * Validate recipient information
   */
  static validateRecipient(recipientName: string, recipientPhone: string): OrderValidationResult {
    if (!recipientPhone) {
      return {
        isValid: false,
        errorMessage: ORDER_CONSTANTS.VALIDATION_MESSAGES.NO_RECIPIENT_PHONE
      };
    }

    if (!recipientName) {
      return {
        isValid: false,
        errorMessage: ORDER_CONSTANTS.VALIDATION_MESSAGES.NO_RECIPIENT_NAME
      };
    }

    return { isValid: true };
  }

  /**
   * Validate cart data
   */
  static validateCart(cart: any): OrderValidationResult {
    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        isValid: false,
        errorMessage: ORDER_CONSTANTS.VALIDATION_MESSAGES.EMPTY_CART
      };
    }
    return { isValid: true };
  }

  /**
   * Validate complete order data
   */
  static validateOrderData(orderData: {
    items: any[];
    paymentMethod: string;
    deliveryAddress: any;
    recipientName: string;
    recipientPhone: string;
    total: number;
  }): OrderValidationResult {
    // Validate items
    const itemsValidation = this.validateItems(orderData.items);
    if (!itemsValidation.isValid) return itemsValidation;

    // Validate payment method
    const paymentValidation = this.validatePaymentMethod(orderData.paymentMethod);
    if (!paymentValidation.isValid) return paymentValidation;

    // Validate total
    const totalValidation = this.validateTotal(orderData.total);
    if (!totalValidation.isValid) return totalValidation;

    // Validate delivery address
    const addressValidation = this.validateDeliveryAddress(orderData.deliveryAddress);
    if (!addressValidation.isValid) return addressValidation;

    // Validate recipient
    const recipientValidation = this.validateRecipient(orderData.recipientName, orderData.recipientPhone);
    if (!recipientValidation.isValid) return recipientValidation;

    return { isValid: true };
  }
}
