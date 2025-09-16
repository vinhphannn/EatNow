import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Driver, DriverDocument } from '../driver/schemas/driver.schema';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { Cart, CartDocument } from '../cart/schemas/cart.schema';
import { Item, ItemDocument } from '../restaurant/schemas/item.schema';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { NotificationGateway } from '../notification/notification.gateway';
import { DistanceService } from '../common/services/distance.service';
import { OrderAssignmentService } from './services/order-assignment.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    private readonly notificationGateway: NotificationGateway,
    private readonly distanceService: DistanceService,
    private readonly orderAssignmentService: OrderAssignmentService,
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
    const { items, paymentMethod, deliveryAddress, specialInstructions, total, deliveryFee } = orderData;

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
      customerId: new Types.ObjectId(customerId),
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
      estimatedDeliveryTime,
      trackingHistory: [{
        status: OrderStatus.PENDING,
        timestamp: new Date(),
        note: 'Đơn hàng đã được tạo',
        updatedBy: 'customer'
      }],
    });

    const savedOrder = await order.save();

    // Try to assign order to best available driver
    try {
      await this.orderAssignmentService.assignOrderToDriver(savedOrder._id.toString());
    } catch (error) {
      console.error('Failed to assign order to driver:', error);
    }

    // Clear customer's cart
    await this.cartModel.deleteMany({ userId: new Types.ObjectId(customerId) });

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

  async getOrdersByCustomer(customerId: string) {
    return this.orderModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .populate('restaurantId', 'name address')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 })
      .lean();
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
      this.notificationGateway.notifyCustomer(
        String(updatedOrder.customerId._id),
        orderId,
        status,
        updatedOrder
      );
    }

    return updatedOrder;
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

  async findRestaurantByOwnerId(ownerId: string) {
    return this.restaurantModel.findOne({ ownerUserId: new Types.ObjectId(ownerId) }).lean();
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
}
