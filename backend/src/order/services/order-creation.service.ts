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
import { OrderCalculator, OrderTotals } from '../utils/order.calculations';
import { ORDER_CONSTANTS } from '../constants/order.constants';


export interface CreateOrderFromCartData {
  deliveryAddress: any;
  recipient: { name: string; phone: string };
  paymentMethod: string;
  deliveryMode?: string;
  scheduledAt?: Date;
  tip?: number;
  doorFee?: number;
  deliveryFee?: number;
  voucherCode?: string;
  specialInstructions?: string;
}

@Injectable()
export class OrderCreationService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    private readonly customerService: CustomerService,
  ) {}


  /**
   * Create order from cart
   */
  async createOrderFromCart(
    customerId: string,
    restaurantId: string,
    orderData: CreateOrderFromCartData
  ): Promise<OrderDocument> {
    // Get cart
    const cart = await this.cartModel.findOne({
      userId: customerId,
      restaurantId: restaurantId
    }).lean();

    const cartValidation = OrderValidator.validateCart(cart);
    if (!cartValidation.isValid) {
      throw new Error(cartValidation.errorMessage);
    }

    // Get customer
    const customer = await this.customerService.getCustomerByUserId(customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Get restaurant info for coordinates
    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException(ORDER_CONSTANTS.VALIDATION_MESSAGES.RESTAURANT_NOT_FOUND);
    }

    // Calculate totals
    const subtotal = cart.totalAmount || 0;
    console.log('🔍 Cart data:', { cart: cart, subtotal, totalAmount: cart.totalAmount });
    console.log('🔍 Order data from frontend:', orderData);
    
    // Use deliveryFee and driverTip from frontend instead of calculating
    const deliveryFee = orderData.deliveryFee || OrderCalculator.calculateDeliveryFee(orderData.deliveryAddress);
    const driverTip = orderData.tip || 0; // orderData.tip chứa driverTip từ frontend
    const doorFee = orderData.doorFee || 0;
    
    console.log('🔍 DriverTip values:', { 
      orderDataDriverTip: orderData.tip, 
      finalDriverTip: driverTip,
      orderData: orderData 
    });
    const discount = 0; // TODO: Calculate from voucher
    const totals = OrderCalculator.calculateOrderTotals(subtotal, deliveryFee, driverTip, doorFee, discount);
    
    console.log('🔍 Calculated totals:', totals);

    // Prepare order items from cart
    const orderItems = cart.items.map(cartItem => {
      const itemTotals = OrderCalculator.calculateItemTotals(cartItem);
      return {
        itemId: cartItem.itemId,
        name: cartItem.name,
        price: cartItem.price,
        imageUrl: cartItem.imageUrl,
        quantity: cartItem.quantity,
        options: cartItem.options || [],
        subtotal: itemTotals.subtotal,
        totalPrice: itemTotals.totalPrice,
        specialInstructions: ''
      };
    });

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

    // Create order
    const order = new this.orderModel({
      customerId: new Types.ObjectId(customerId), // Store as ObjectId for indexing
      restaurantId: new Types.ObjectId(restaurantId),
      items: orderItems,
      total: totals.subtotal, // Tổng tiền món ăn (chưa tính phí)
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      tip: totals.tip, // driverTip từ frontend (đã được tính trong totals)
      doorFee: totals.doorFee,
      discount: totals.discount || 0,
      finalTotal: totals.finalTotal,
      deliveryAddress: {
        ...formattedDeliveryAddress,
        recipientName: formattedDeliveryAddress.recipientName || orderData.recipient.name,
        recipientPhone: formattedDeliveryAddress.recipientPhone || orderData.recipient.phone,
      },
      specialInstructions: orderData.specialInstructions || '',
      // Purchaser info (customer who placed the order)
      purchaserPhone: (customer as any)?.phone || '',
      paymentMethod: orderData.paymentMethod,
      status: OrderStatus.PENDING,
      deliveryMode: orderData.deliveryMode || 'immediate',
      scheduledAt: orderData.scheduledAt || null,
      voucherCode: orderData.voucherCode || '',
      code: orderCode, // Add order code
      deliveryDistance: distanceToRestaurant / 1000, // Only one distance field
      estimatedDeliveryTime,
      // Restaurant coordinates for driver reference
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
      total: order.total,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      driverTip: order.tip, // Lưu driverTip vào field tip
      recipientName: order.deliveryAddress?.recipientName,
      recipientPhone: order.deliveryAddress?.recipientPhone
    });
    const savedOrder = await order.save();

    // Clear cart
    await this.cartModel.deleteOne({ _id: cart._id });

    return savedOrder;
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
      const itemTotals = OrderCalculator.calculateItemTotals(item);
      
      return {
        itemId: new Types.ObjectId(item.itemId),
        name: dbItem?.name || item.name || 'Unknown Item',
        price: item.price,
        imageUrl: dbItem?.imageUrl || item.imageUrl,
        quantity: item.quantity,
        subtotal: itemTotals.subtotal,
        totalPrice: itemTotals.totalPrice,
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
    // Mock distance calculation (should be replaced with real distance service)
    const distanceToRestaurant = 1000; // meters
    const estimatedDeliveryTime = OrderCalculator.calculateEstimatedDeliveryTime(distanceToRestaurant / 1000);

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
