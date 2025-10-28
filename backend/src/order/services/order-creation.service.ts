/**
 * Order creation service - handles order creation logic
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../schemas/order.schema';
import { Cart, CartDocument } from '../../cart/schemas/cart.schema';
import { Item, ItemDocument } from '../../restaurant/schemas/item.schema';
import { Restaurant, RestaurantDocument } from '../../restaurant/schemas/restaurant.schema';
import { CustomerService } from '../../customer/customer.service';
import { OrderValidator } from '../utils/order.validation';
import { ORDER_CONSTANTS } from '../constants/order.constants';
import { PricingService, OrderPricingInput } from './pricing.service';
import { DistanceService } from '../../common/services/distance.service';


export interface CreateOrderFromCartData {
  deliveryAddress: any;
  recipient: { name: string; phone: string };
  paymentMethod: string;
  deliveryMode?: string;
  scheduledAt?: Date;
  tip?: number;
  doorFee?: number;
  deliveryFee?: number;
  specialInstructions?: string;
  items?: any[]; // For direct order creation from frontend
}

@Injectable()
export class OrderCreationService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    private readonly customerService: CustomerService,
    private readonly pricingService: PricingService,
    private readonly distanceService: DistanceService,
  ) {}


  /**
   * Create order from cart
   */
  async createOrderFromCart(
    customerId: string,
    restaurantId: string,
    orderData: CreateOrderFromCartData
  ): Promise<OrderDocument> {
    try {
      console.log('🔍 OrderCreationService.createOrderFromCart started');
      console.log('🔍 CustomerId:', customerId);
      console.log('🔍 RestaurantId:', restaurantId);
      console.log('🔍 OrderData:', JSON.stringify(orderData, null, 2));
      
      // Get cart (optional - for backward compatibility)
      const cart = await this.cartModel.findOne({
        userId: customerId,
        restaurantId: restaurantId
      }).lean();

      console.log('🔍 Cart found:', cart ? 'Yes' : 'No');
      if (cart) {
        console.log('🔍 Cart items count:', cart.items?.length || 0);
        console.log('🔍 Cart total amount:', cart.totalAmount);
      }

      // If no cart found, create order directly from orderData
      let orderItems;
      let subtotal;
      
      if (cart && cart.items && cart.items.length > 0) {
        // Use cart data
        orderItems = cart.items.map(cartItem => ({
          itemId: cartItem.itemId,
          name: cartItem.name,
          price: cartItem.price,
          imageUrl: cartItem.imageUrl,
          quantity: cartItem.quantity,
          options: cartItem.options || [],
          subtotal: cartItem.subtotal,
          totalPrice: cartItem.totalPrice,
          specialInstructions: ''
        }));
        subtotal = cart.totalAmount || 0;
        console.log('🔍 Using cart data for order creation');
      } else {
        // Create order directly from orderData (from frontend)
        console.log('🔍 No cart found, creating order directly from orderData');
        
        // Check if orderData has items
        if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
          throw new Error('Không có món ăn nào trong đơn hàng');
        }
        
        orderItems = orderData.items.map(item => ({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl || '',
          quantity: item.quantity,
          options: item.options || [],
          subtotal: item.subtotal || (item.price * item.quantity),
          totalPrice: item.totalPrice || (item.price * item.quantity),
          specialInstructions: item.specialInstructions || ''
        }));
        
        // Calculate subtotal from items
        subtotal = orderItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        console.log('🔍 Calculated subtotal from orderData items:', subtotal);
      }

      // Get customer
      const customer = await this.customerService.getCustomerByUserId(customerId);
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
      
      // Get recipient phone for purchaserPhone fallback
      const finalRecipientPhone = orderData.recipient?.phone || '';

      // Get restaurant info for coordinates
      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant) {
        throw new NotFoundException(ORDER_CONSTANTS.VALIDATION_MESSAGES.RESTAURANT_NOT_FOUND);
      }

      // Calculate totals using PricingService
      console.log('🔍 Order data from frontend:', orderData);
      console.log('🔍 Calculated subtotal:', subtotal);
      
      // Tính khoảng cách thực tế từ quán đến địa chỉ giao hàng (sử dụng OSRM routing API như frontend)
      const distanceKm = await this.distanceService.calculateRouteDistanceKm(
        { lat: restaurant.latitude, lng: restaurant.longitude },
        { lat: orderData.deliveryAddress.latitude, lng: orderData.deliveryAddress.longitude }
      );
      
      // Tính phí giao hàng từ khoảng cách (backend tính để xác minh)
      const calculatedDeliveryFee = this.pricingService.calculateDeliveryFee(distanceKm);
      
      // Xác minh deliveryFee từ frontend (nếu có)
      let deliveryFee = calculatedDeliveryFee;
      if (orderData.deliveryFee !== undefined && orderData.deliveryFee !== null) {
        const frontendFee = orderData.deliveryFee;
        const tolerance = 1000; // Cho phép sai số 1000đ (do làm tròn)
        
        if (Math.abs(frontendFee - calculatedDeliveryFee) <= tolerance) {
          deliveryFee = frontendFee; // Sử dụng phí từ frontend để đồng nhất
          console.log(`✅ Delivery fee verified: Frontend=${frontendFee}, Backend=${calculatedDeliveryFee}`);
        } else {
          console.warn(`⚠️ Delivery fee mismatch: Frontend=${frontendFee}, Backend=${calculatedDeliveryFee}`);
          console.warn(`Using backend calculated fee for security: ${calculatedDeliveryFee}`);
        }
      }
      
      // Tính toán pricing với PricingService
      const pricingInput: OrderPricingInput = {
        subtotal,
        deliveryFee,
        tip: orderData.tip || 0,
        doorFee: Boolean(orderData.doorFee),
      };
      
      const pricing = this.pricingService.calculateOrderPricing(pricingInput);
      
      console.log('🔍 Calculated pricing:', pricing);

      // Format delivery address
      const formattedDeliveryAddress = this.formatDeliveryAddress(orderData.deliveryAddress);
      console.log('🔍 Formatted delivery address:', formattedDeliveryAddress);

      // Calculate distances and estimated delivery time
      const { distanceToRestaurant, estimatedDeliveryTime } = await this.calculateDeliveryInfo(
        restaurant,
        formattedDeliveryAddress
      );

      // Generate order code
      const orderCode = await this.generateOrderCode();

      // Create order with new pricing fields
      const order = new this.orderModel({
        customerId: new Types.ObjectId(customerId),
        restaurantId: new Types.ObjectId(restaurantId),
        items: orderItems,
        
        // Các trường cơ bản
        subtotal: pricing.subtotal,
        deliveryFee: pricing.deliveryFee,
        tip: pricing.tip,
        doorFee: pricing.doorFee,
        finalTotal: pricing.finalTotal,
        
        // Các trường mới - tiền thu và chi trả
        customerPayment: pricing.customerPayment,
        restaurantRevenue: pricing.restaurantRevenue,
        driverPayment: pricing.driverPayment,
        
        // Phí platform
        platformFeeRate: pricing.platformFeeRate,
        platformFeeAmount: pricing.platformFeeAmount,
        
        // Chiết khấu tài xế
        driverCommissionRate: pricing.driverCommissionRate,
        driverCommissionAmount: pricing.driverCommissionAmount,
        
        deliveryAddress: {
          ...formattedDeliveryAddress,
          recipientName: formattedDeliveryAddress.recipientName || orderData.recipient.name,
          recipientPhone: formattedDeliveryAddress.recipientPhone || orderData.recipient.phone,
        },
        specialInstructions: orderData.specialInstructions || '',
        purchaserPhone: (() => {
          const customerPhone = (customer as any)?.phone;
          const recipientPhone = orderData.recipient?.phone;
          const finalPhone = finalRecipientPhone;
          const fallbackPhone = '0000000000';
          
          const result = customerPhone || recipientPhone || finalPhone || fallbackPhone;
          console.log('🔍 PurchaserPhone debug:', {
            customerPhone,
            recipientPhone, 
            finalPhone,
            fallbackPhone,
            result
          });
          return result;
        })(),
        paymentMethod: orderData.paymentMethod,
        status: OrderStatus.PENDING,
        deliveryMode: orderData.deliveryMode || 'immediate',
        scheduledAt: orderData.scheduledAt || null,
        voucherCode: '',
        code: orderCode,
        deliveryDistance: distanceToRestaurant / 1000,
        estimatedDeliveryTime,
        restaurantCoordinates: {
          latitude: restaurant.latitude,
          longitude: restaurant.longitude
        },
        trackingHistory: [{
          status: OrderStatus.PENDING,
          timestamp: new Date(),
          note: ORDER_CONSTANTS.STATUS_NOTES.pending,
          updatedBy: 'customer'
        }]
      });

      console.log('🔍 Order document before save:', {
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        driverTip: order.tip,
        customerPayment: order.customerPayment,
        restaurantRevenue: order.restaurantRevenue,
        driverPayment: order.driverPayment,
        recipientName: order.deliveryAddress?.recipientName,
        recipientPhone: order.deliveryAddress?.recipientPhone
      });
      
      const savedOrder = await order.save();

      // Clear cart - use deleteOne with proper filter
      try {
        const result = await this.cartModel.deleteOne({ 
          _id: cart._id,
          userId: customerId,
          restaurantId: restaurantId
        });
        console.log('🔍 Cart deletion result:', result);
      } catch (error) {
        console.error('⚠️ Failed to clear cart:', error);
        // Don't throw error, order already created
      }

      return savedOrder;
    } catch (error) {
      console.error('❌ Error in createOrderFromCart:', error);
      
      // Provide more detailed error information
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new Error(`Failed to create order: ${error.message}`);
      }
      
      throw new Error('Unknown error occurred while creating order');
    }
  }

  /**
   * Prepare order items from items data
   */
  private async prepareOrderItems(items: any[]): Promise<any[]> {
    const itemIds = items.map(item => new Types.ObjectId(item.itemId));
    const dbItems = await this.itemModel.find({ _id: { $in: itemIds } });
    const itemMap = new Map(dbItems.map(item => [String(item._id), item]));

    return items.map(item => {
      const dbItem = itemMap.get(item.itemId);
      
      return {
        itemId: new Types.ObjectId(item.itemId),
        name: dbItem?.name || item.name || 'Unknown Item',
        price: item.price,
        imageUrl: dbItem?.imageUrl || item.imageUrl,
        quantity: item.quantity,
        subtotal: item.subtotal || (item.price * item.quantity),
        totalPrice: item.totalPrice || (item.price * item.quantity),
        options: item.options || [],
        specialInstructions: item.specialInstructions || ''
      };
    });
  }

  /**
   * Format delivery address
   */
  private formatDeliveryAddress(deliveryAddress: any) {
    if (deliveryAddress && typeof deliveryAddress === 'object' && 
        deliveryAddress.label && deliveryAddress.addressLine && 
        deliveryAddress.latitude !== undefined && deliveryAddress.longitude !== undefined) {
      return {
        label: deliveryAddress.label,
        addressLine: deliveryAddress.addressLine,
        latitude: Number(deliveryAddress.latitude),
        longitude: Number(deliveryAddress.longitude),
        note: deliveryAddress.note || '',
        // Extract recipient info from delivery address
        recipientName: deliveryAddress.recipientName || deliveryAddress.recipient?.name || '',
        recipientPhone: deliveryAddress.recipientPhone || deliveryAddress.recipient?.phone || '',
      };
    }

    if (typeof deliveryAddress === 'string') {
      return {
        label: 'Địa chỉ giao hàng',
        addressLine: deliveryAddress,
        latitude: 0,
        longitude: 0,
        note: '',
        recipientName: '',
        recipientPhone: '',
      };
    }

    return {
      label: 'Địa chỉ giao hàng',
      addressLine: 'Địa chỉ không xác định',
      latitude: 0,
      longitude: 0,
      note: '',
      recipientName: '',
      recipientPhone: '',
    };
  }

  /**
   * Calculate delivery information
   */
  private async calculateDeliveryInfo(restaurant: any, deliveryAddress: any) {
    // Validate coordinates
    if (!restaurant?.latitude || !restaurant?.longitude) {
      console.warn('⚠️ Restaurant missing coordinates, using default 5km');
      const defaultDistanceKm = 5;
      return { 
        distanceToRestaurant: defaultDistanceKm * 1000, 
        estimatedDeliveryTime: this.pricingService.calculateEstimatedDeliveryTime(defaultDistanceKm)
      };
    }

    if (!deliveryAddress?.latitude || !deliveryAddress?.longitude) {
      console.warn('⚠️ Delivery address missing coordinates, using default 5km');
      const defaultDistanceKm = 5;
      return { 
        distanceToRestaurant: defaultDistanceKm * 1000, 
        estimatedDeliveryTime: this.pricingService.calculateEstimatedDeliveryTime(defaultDistanceKm)
      };
    }

    // Use OSRM routing API to get actual road distance
    const distanceKm = await this.distanceService.calculateRouteDistanceKm(
      { lat: restaurant.latitude, lng: restaurant.longitude },
      { lat: deliveryAddress.latitude, lng: deliveryAddress.longitude }
    );
    const distanceToRestaurant = distanceKm * 1000; // Convert to meters
    const estimatedDeliveryTime = this.pricingService.calculateEstimatedDeliveryTime(distanceKm);

    return { distanceToRestaurant, estimatedDeliveryTime };
  }


  /**
   * Generate order code
   */
  private async generateOrderCode(): Promise<string> {
    // Get the latest order to generate sequential number
    const latestOrder = await this.orderModel.findOne({}, {}, { sort: { createdAt: -1 } });
    let orderNumber = 1;
    
    if (latestOrder && latestOrder.code) {
      // Extract number from existing code (e.g., "ORD0001" -> 1)
      const match = latestOrder.code.match(/ORD(\d+)$/);
      if (match) {
        orderNumber = parseInt(match[1]) + 1;
      }
    }
    
    // Format as ORD + 4 digits (e.g., ORD0001, ORD0002, ...)
    return `ORD${orderNumber.toString().padStart(4, '0')}`;
  }
}
