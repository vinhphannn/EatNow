import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Driver, DriverDocument } from '../driver/schemas/driver.schema';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { Cart, CartDocument } from '../cart/schemas/cart.schema';
import { Item, ItemDocument } from '../restaurant/schemas/item.schema';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { NotificationGateway } from '../notification/notification.gateway';
import { OrderRealtimeService } from './services/order-realtime.service';
import { DistanceService } from '../common/services/distance.service';
import { OrderAssignmentService } from './services/order-assignment.service';
import { CustomerService } from '../customer/customer.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    private readonly notificationGateway: NotificationGateway,
    private readonly orderRealtime: OrderRealtimeService,
    private readonly distanceService: DistanceService,
    private readonly orderAssignmentService: OrderAssignmentService,
    private readonly customerService: CustomerService,
  ) {}

  private generateOrderCode(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ORD${timestamp}${random}`;
  }

  private formatDeliveryAddress(deliveryAddress: any) {
    // If deliveryAddress is already in the correct format
    if (deliveryAddress && typeof deliveryAddress === 'object' && 
        deliveryAddress.label && deliveryAddress.addressLine && 
        deliveryAddress.latitude !== undefined && deliveryAddress.longitude !== undefined) {
      return {
        label: deliveryAddress.label,
        addressLine: deliveryAddress.addressLine,
        latitude: Number(deliveryAddress.latitude),
        longitude: Number(deliveryAddress.longitude),
        note: deliveryAddress.note || '',
      };
    }

    // If deliveryAddress is a string (legacy format), try to parse it
    if (typeof deliveryAddress === 'string') {
      return {
        label: 'Địa chỉ giao hàng',
        addressLine: deliveryAddress,
        latitude: 0, // Default values - should be provided by frontend
        longitude: 0,
        note: '',
      };
    }

    // Default fallback
    return {
      label: 'Địa chỉ giao hàng',
      addressLine: 'Địa chỉ không xác định',
      latitude: 0,
      longitude: 0,
      note: '',
    };
  }

  async createOrder(customerId: string, orderData: any) {
    const { items, paymentMethod, deliveryAddress, specialInstructions, total, deliveryFee, deliveryDistance } = orderData;

    // Resolve Customer document by userId to ensure orders link to Customer._id
    const customer = await this.customerService.getCustomerByUserId(customerId);
    const customerDocId = new Types.ObjectId((customer as any)._id);

    // Get restaurant ID from first item
    const firstItem = await this.itemModel.findById(items[0].itemId);
    if (!firstItem) {
      throw new NotFoundException('Item not found');
    }

    const restaurantId = firstItem.restaurantId;

    // Get all items to get their names
    const itemIds = items.map(item => new Types.ObjectId(item.itemId));
    const dbItems = await this.itemModel.find({ _id: { $in: itemIds } });
    const itemMap = new Map(dbItems.map(item => [String(item._id), item]));

    // Prepare order items
    const orderItems = items.map(item => {
      const dbItem = itemMap.get(item.itemId);
      return {
        itemId: new Types.ObjectId(item.itemId),
        name: dbItem?.name || 'Unknown Item',
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      };
    });

    // Validate and format delivery address
    const formattedDeliveryAddress = this.formatDeliveryAddress(deliveryAddress);

    // Get restaurant location for distance calculation
    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Calculate distances (mock restaurant coordinates for now)
    const restaurantLat = restaurant.latitude || 10.7769; // Mock coordinates
    const restaurantLon = restaurant.longitude || 106.7009;
    
    const distanceToRestaurant = this.distanceService.calculateDistance(
      restaurantLat,
      restaurantLon,
      formattedDeliveryAddress.latitude,
      formattedDeliveryAddress.longitude
    );

    const distanceToCustomer = distanceToRestaurant; // Same distance for now

    // Calculate estimated delivery time
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(
      estimatedDeliveryTime.getMinutes() + 
      this.distanceService.calculateEstimatedDeliveryTime(distanceToRestaurant / 1000)
    );

    // Create order
    const order = new this.orderModel({
      customerId: customerDocId,
      restaurantId: new Types.ObjectId(restaurantId),
      items: orderItems,
      total,
      deliveryFee,
      finalTotal: total + deliveryFee,
      deliveryAddress: formattedDeliveryAddress,
      specialInstructions: specialInstructions || '',
      paymentMethod,
      status: OrderStatus.PENDING,
      code: this.generateOrderCode(),
      distanceToRestaurant,
      distanceToCustomer,
      deliveryDistance: deliveryDistance || (distanceToRestaurant / 1000), // Convert meters to km
      estimatedDeliveryTime,
      trackingHistory: [{
        status: OrderStatus.PENDING,
        timestamp: new Date(),
        note: 'Đơn hàng đã được tạo',
        updatedBy: 'customer'
      }],
    });

    const savedOrder = await order.save();
    console.log('🔍 OrderService: Order created successfully:', {
      orderId: savedOrder._id,
      customerUserId: customerId,
      customerId: customerDocId,
      restaurantId: restaurantId,
      total: savedOrder.finalTotal,
      status: savedOrder.status
    });

    // Try to assign order to best available driver
    try {
      await this.orderAssignmentService.assignOrderToDriver(savedOrder._id.toString());
    } catch (error) {
      console.error('Failed to assign order to driver:', error);
    }

    // Clear customer's cart (cart keyed by userId)
    await this.cartModel.deleteMany({ userId: new Types.ObjectId(customerId) });
    console.log('🔍 OrderService: Cleared cart for customer:', customerId);

    // Notify restaurant about new order
    this.notificationGateway.notifyNewOrder(
      String(restaurantId),
      {
        id: savedOrder._id,
        customerId: customerId,
        total: savedOrder.finalTotal,
        items: savedOrder.items.length,
        createdAt: (savedOrder as any).createdAt
      }
    );

    return savedOrder;
  }

  async getOrdersByCustomer(userId: string) {
    try {
      // First, find the customer profile for this user
      const customer = await this.customerService.getCustomerByUserId(userId);
      if (!customer) {
        console.log(`No customer profile found for user ${userId}`);
        return [];
      }

      const orders = await this.orderModel
        .find({ customerId: (customer as any)._id })
        .populate('restaurantId', 'name address phone imageUrl')
        .populate('driverId', 'name phone vehicleType licensePlate')
        .sort({ createdAt: -1 })
        .lean();

      console.log(`Found ${orders.length} orders for customer ${(customer as any)._id} (user ${userId})`);
      
      // Transform the data to match frontend expectations
      const transformedOrders = orders.map((order: any) => ({
        ...order,
        _id: order._id,
        orderCode: order.orderCode || `ORD${order._id.toString().slice(-8).toUpperCase()}`,
        restaurantId: {
          _id: order.restaurantId._id,
          name: order.restaurantId.name || 'Nhà hàng',
          address: order.restaurantId.address || 'Chưa có địa chỉ',
          phone: order.restaurantId.phone,
          imageUrl: order.restaurantId.imageUrl
        },
        driverId: order.driverId ? {
          _id: order.driverId._id,
          name: order.driverId.name,
          phone: order.driverId.phone,
          vehicleType: order.driverId.vehicleType,
          licensePlate: order.driverId.licensePlate
        } : undefined
      }));

      return transformedOrders;
    } catch (error) {
      console.error('Error getting customer orders:', error);
      throw error;
    }
  }

  async getOrdersByRestaurant(restaurantId: string) {
    return this.orderModel
      .find({ restaurantId: new Types.ObjectId(restaurantId) })
      .populate('customerId', 'name phone')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getOrderById(orderId: string) {
    if (!orderId || orderId === 'undefined') {
      throw new NotFoundException('Order ID is required');
    }

    const order = await this.orderModel
      .findById(orderId)
      .populate('customerId', 'name phone email')
      .populate('restaurantId', 'name address phone')
      .populate('driverId', 'name phone')
      .lean();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, driverId?: string) {
    const updateData: any = { status };
    
    if (driverId) {
      updateData.driverId = new Types.ObjectId(driverId);
    }

    if (status === OrderStatus.DELIVERED) {
      updateData.actualDeliveryTime = new Date();
    }

    // Add tracking history entry
    const trackingEntry = {
      status: status,
      timestamp: new Date(),
      note: this.getStatusNote(status),
      updatedBy: 'restaurant'
    };

    updateData.$push = { trackingHistory: trackingEntry };

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate('customerId', 'name phone')
     .populate('restaurantId', 'name address')
     .populate('driverId', 'name phone');

    if (updatedOrder) {
      // Notify customer about order status update
      this.orderRealtime.notifyCustomer(
        String(updatedOrder.customerId._id),
        orderId,
        status,
        updatedOrder
      );

      // If terminal state, teardown order room and Redis keys
      if (status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED) {
        await this.orderRealtime.teardownOrder(orderId);
        this.orderRealtime.incrementOrdersMetric(status === OrderStatus.DELIVERED ? 'completed' : 'cancelled');
      }
    }

    return updatedOrder;
  }

  // Timeout handler to remove driver and reassign next candidate
  async handleDriverTimeout(orderId: string, driverId: string) {
    try {
      await this.orderRealtime.sremDriverFromOrder(orderId, driverId);
      this.orderRealtime.incrementReassignment('timeout');
      // Attempt reassignment using existing service
      await this.orderAssignmentService.assignOrderToDriver(orderId);
    } catch (e) {
      // Best-effort; log and continue
      // eslint-disable-next-line no-console
      console.warn('Driver timeout handling failed', e?.message || e);
    }
  }

  private getStatusNote(status: OrderStatus): string {
    const statusNotes = {
      [OrderStatus.PENDING]: 'Đơn hàng đang chờ xác nhận',
      [OrderStatus.CONFIRMED]: 'Đơn hàng đã được xác nhận',
      [OrderStatus.PREPARING]: 'Đơn hàng đang được chuẩn bị',
      [OrderStatus.READY]: 'Đơn hàng đã sẵn sàng giao',
      [OrderStatus.DELIVERED]: 'Đơn hàng đã được giao thành công',
      [OrderStatus.CANCELLED]: 'Đơn hàng đã bị hủy'
    };
    return statusNotes[status] || 'Trạng thái đã được cập nhật';
  }

  async getOrderStats(restaurantId?: string) {
    const filter = restaurantId ? { restaurantId: new Types.ObjectId(restaurantId) } : {};
    
    const stats = await this.orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$finalTotal' }
        }
      }
    ]);

    const totalOrders = await this.orderModel.countDocuments(filter);
    const totalRevenue = await this.orderModel.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$finalTotal' } } }
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusBreakdown: stats
    };
  }

  // Find restaurant by owner user ID (copied from RestaurantService)
  async findRestaurantByOwnerId(ownerId: string) {
    console.log('🔍 OrderService: Finding restaurant for user ID:', ownerId);
    
    // Try different formats of the user ID
    let restaurant = null;
    
    // Try as ObjectId first
    if (Types.ObjectId.isValid(ownerId)) {
      restaurant = await this.restaurantModel.findOne({ ownerUserId: new Types.ObjectId(ownerId) }).lean();
      console.log('🔍 OrderService: Found with ObjectId:', !!restaurant);
    }
    
    // If not found, try as string
    if (!restaurant) {
      restaurant = await this.restaurantModel.findOne({ ownerUserId: ownerId }).lean();
      console.log('🔍 OrderService: Found with string:', !!restaurant);
    }
    
    // If still not found, try to find any restaurant for this user (fallback)
    if (!restaurant) {
      restaurant = await this.restaurantModel.findOne({}).lean();
      console.log('🔍 OrderService: Using fallback restaurant:', !!restaurant);
    }
    
    console.log('🔍 OrderService: Final restaurant:', restaurant ? { id: restaurant._id, name: restaurant.name } : null);
    return restaurant;
  }

  async cancelOrder(orderId: string, customerId: string) {
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      customerId: new Types.ObjectId(customerId)
    });

    if (!order) {
      throw new NotFoundException('Order not found or you are not authorized to cancel this order');
    }

    // Only allow cancellation for pending or confirmed orders
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new Error('Order cannot be cancelled at this stage');
    }

    // Update order status to cancelled
    order.status = OrderStatus.CANCELLED;
    order.trackingHistory.push({
      status: OrderStatus.CANCELLED,
      timestamp: new Date(),
      note: 'Đơn hàng đã được hủy bởi khách hàng',
      updatedBy: 'customer'
    });

    await order.save();

    // Notify restaurant about order cancellation
    this.notificationGateway.notifyOrderCancellation(
      String(order.restaurantId),
      {
        id: order._id,
        customerId: customerId,
        total: order.finalTotal,
        items: order.items.length,
        cancelledAt: new Date()
      }
    );

    return {
      success: true,
      message: 'Order cancelled successfully',
      order: order
    };
  }
}
