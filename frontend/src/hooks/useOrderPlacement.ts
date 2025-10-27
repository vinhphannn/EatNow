/**
 * Custom hook for order placement logic
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components';
import { apiClient } from '@/services/api.client';
import { validateOrder } from '@/utils/orderValidation';
import { createOrderData, debugCartItems, debugOrderItems } from '@/utils/orderDataUtils';
import { handleOrderError, handleOrderSuccess } from '@/utils/orderErrorHandling';

export interface UseOrderPlacementProps {
  restaurantId: string;
  cartItems: any[];
  paymentMethod: 'cash' | 'bank_transfer' | null;
  selectedAddress: any;
  deliveryAddress: string;
  recipientName: string;
  recipientPhone: string;
  specialInstructions?: string;
  deliveryMode: 'immediate' | 'scheduled';
  scheduledAt?: string;
  tip: number;
  doorFee: boolean;
  driverTip: number;
  voucherCode?: string;
  deliveryFee: number;
  restaurantCoords: any;
}

export const useOrderPlacement = (props: UseOrderPlacementProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const placeOrder = async () => {
    // Validate order data
    const validation = validateOrder({
      paymentMethod: props.paymentMethod,
      restaurantId: props.restaurantId,
      recipientName: props.recipientName,
      recipientPhone: props.recipientPhone,
      deliveryAddress: props.deliveryAddress,
      selectedAddress: props.selectedAddress,
      cartItems: props.cartItems,
      deliveryMode: props.deliveryMode,
      scheduledAt: props.scheduledAt
    }, props.restaurantCoords);

    if (!validation.isValid) {
      showToast(validation.errorMessage!, 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Debug cart items
      debugCartItems(props.cartItems, 'Cart items with options');

      // Create order data
      const orderData = createOrderData(
        props.restaurantId,
        props.cartItems,
        props.paymentMethod!,
        props.selectedAddress,
        props.deliveryAddress,
        props.recipientName,
        props.recipientPhone,
        props.specialInstructions,
        props.deliveryMode,
        props.scheduledAt,
        props.tip,
        props.doorFee,
        props.driverTip,
        props.voucherCode,
        props.deliveryFee
      );

      // Debug order items
      debugOrderItems(orderData.items, 'Items payload with options');
      
      // Debug order data
      console.log('🔍 Frontend order data:', {
        recipientName: orderData.recipient?.name,
        recipientPhone: orderData.recipient?.phone,
        selectedAddress: props.selectedAddress,
        recipientNameFromProps: props.recipientName,
        recipientPhoneFromProps: props.recipientPhone,
        driverTip: orderData.tip,
        doorFee: orderData.doorFee,
        voucherCode: orderData.voucherCode,
        orderData: orderData
      });

      // Submit order
      const order = await apiClient.post('/api/v1/orders', orderData);

      // Handle success
      handleOrderSuccess(order, showToast, router);

    } catch (error) {
      // Handle error
      handleOrderError(error, showToast, router);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    placeOrder,
    isLoading
  };
};