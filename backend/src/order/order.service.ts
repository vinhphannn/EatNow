import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { Cart, CartDocument } from '../cart/schemas/cart.schema';
import { Item, ItemDocument } from '../restaurant/schemas/item.schema';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  private generateOrderCode(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ORD${timestamp}${random}`;
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

    // Create order
    const order = new this.orderModel({
      customerId: new Types.ObjectId(customerId),
      restaurantId: new Types.ObjectId(restaurantId),
      items: orderItems,
      total,
      deliveryFee,
      finalTotal: total + deliveryFee,
      deliveryAddress,
      specialInstructions,
      paymentMethod,
      status: OrderStatus.PENDING,
      code: this.generateOrderCode(),
    });

    const savedOrder = await order.save();

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
