import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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

  private readonly logger = new Logger(OrderService.name);

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
    const { items, paymentMethod, deliveryAddress, specialInstructions, total, deliveryFee, deliveryDistance,
      recipientName, recipientPhonePrimary, recipientPhoneSecondary, purchaserPhone } = orderData;

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
      recipientName: recipientName || customer?.name || '',
      recipientPhonePrimary: recipientPhonePrimary || customer?.phone || '',
      recipientPhoneSecondary: recipientPhoneSecondary || '',
      purchaserPhone: purchaserPhone || customer?.phone || '',
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
    // debug log removed

    // Try to assign order to best available driver
    try {
      await this.orderAssignmentService.assignOrderToDriver(savedOrder._id.toString());
    } catch (error) {
      this.logger.error('Failed to assign order to driver', error as any);
    }

    // Decrement only ordered items in customer's cart; keep others intact
    try {
      for (const it of orderItems) {
        const itemId = (it as any).itemId as Types.ObjectId;
        const qty = Number((it as any).quantity || 1);
        if (itemId && qty > 0) {
          await this.cartModel.updateOne(
            { userId: new Types.ObjectId(customerId), itemId: new Types.ObjectId(itemId), isActive: true },
            { $inc: { quantity: -qty } }
          );
        }
      }
      // Soft-remove any items that reach zero or below
      await this.cartModel.updateMany(
        { userId: new Types.ObjectId(customerId), isActive: true, quantity: { $lte: 0 } },
        { $set: { isActive: false } }
      );
      // cart items adjusted after order
    } catch (e) {
      this.logger.error('Failed to adjust cart after order', e as any);
    }

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
        this.logger.warn(`No customer profile found for user ${userId}`);
        return [];
      }

      const orders = await this.orderModel
        .find({ customerId: (customer as any)._id })
        .populate('restaurantId', 'name address phone imageUrl')
        .populate('driverId', 'name phone vehicleType licensePlate')
        .sort({ createdAt: -1 })
        .lean();

      // debug removed
      
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
      this.logger.error('Error getting customer orders', error as any);
      throw error;
    }
  }

  async getOrdersByRestaurantOwner(userId: string, params: { status?: string; page?: number; limit?: number } = {}) {
    const restaurant = await this.findRestaurantByOwnerId(userId);
    if (!restaurant) {
      return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } } as any;
    }
    const page = params.page || 1;
    const limit = params.limit || 20;
    const query: any = { restaurantId: (restaurant as any)._id };
    if (params.status) query.status = params.status;

    const [items, total] = await Promise.all([
      this.orderModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('customerId', 'name phone')
        .populate('driverId', 'name phone')
        .lean(),
      this.orderModel.countDocuments(query),
    ]);

    return {
      data: items.map((o: any) => ({
        _id: o._id,
        orderCode: o.code || String(o._id),
        customer: o.customerId ? { name: (o.customerId as any)?.name, phone: (o.customerId as any)?.phone } : undefined,
        items: o.items,
        status: o.status,
        finalTotal: o.finalTotal || o.total || 0,
        createdAt: o.createdAt,
        driverId: o.driverId ? { _id: (o.driverId as any)._id, name: (o.driverId as any).name, phone: (o.driverId as any).phone } : undefined,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
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

  async findAvailableOrders(limit = 50) {
    // Orders available for drivers to accept: ready for pickup, no driver assigned
    const docs = await this.orderModel
      .find({ status: 'ready', driverId: { $exists: false } })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
    return docs.map((d: any) => ({
      id: String(d._id),
      restaurantId: String(d.restaurantId),
      status: d.status,
      total: d.total,
      deliveryFee: d.deliveryFee,
      createdAt: d.createdAt,
    }));
  }

  async findDriverActiveOrders(driverUserId: string) {
    const driver = await this.driverModel.findOne({ userId: new Types.ObjectId(driverUserId) }).lean();
    if (!driver) return [];
    const docs = await this.orderModel
      .find({ driverId: (driver as any)._id, status: { $in: ['picking_up'] } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return docs.map((d: any) => ({
      id: String(d._id),
      restaurantId: String(d.restaurantId),
      status: d.status,
      total: d.total,
      deliveryFee: d.deliveryFee,
      createdAt: d.createdAt,
    }));
  }

  // Driver accepts: assign driver if order is ready and unassigned (atomic to avoid race)
  async acceptOrderByDriver(orderId: string, driverUserId: string) {
    // Resolve driver document by userId
    const driver = await this.driverModel.findOne({ userId: new Types.ObjectId(driverUserId) }).lean();
    if (!driver) throw new NotFoundException('Driver not found');

    const updated = await this.orderModel.findOneAndUpdate(
      { _id: new Types.ObjectId(orderId), status: 'ready', driverId: { $exists: false } },
      { $set: { status: 'picking_up', driverId: (driver as any)._id, assignedAt: new Date() } },
      { new: true }
    ).lean();

    if (!updated) {
      const e: any = new Error('Order not available or already assigned');
      e.status = 400;
      throw e;
    }

    // Realtime notifications (minimal status to driver/restaurant rooms)
    try {
      this.orderRealtime.notifyCustomer(String(updated.customerId), String(updated._id), 'picking_up', updated);
    } catch {}
    try {
      (this.orderRealtime as any).emitOrderStatusChangedMinimal?.({
        driverId: String(updated.driverId || ''),
        restaurantId: String(updated.restaurantId || ''),
        orderId: String(updated._id),
        status: 'picking_up',
        updatedAt: new Date().toISOString(),
      });
    } catch {}

    return updated;
  }

  // Driver completes order -> delivered and settle
  async completeOrderByDriver(orderId: string, driverUserId: string) {
    const driver = await this.driverModel.findOne({ userId: new Types.ObjectId(driverUserId) }).lean();
    if (!driver) throw new NotFoundException('Driver not found');

    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (!order.driverId || String(order.driverId) !== String((driver as any)._id)) {
      const e: any = new Error('Forbidden: Not your order');
      e.status = 403;
      throw e;
    }
    if (order.status !== ('picking_up' as any)) {
      const e: any = new Error('Order not in picking_up state');
      e.status = 400;
      throw e;
    }

    // Use existing updateOrderStatus to ensure settlement & teardown happen
    const updated = await this.updateOrderStatus(orderId, 'delivered' as any, String((driver as any)._id));
    try {
      (this.orderRealtime as any).emitOrderStatusChangedMinimal?.({
        driverId: String((driver as any)._id),
        restaurantId: String(updated?.restaurantId || ''),
        orderId: String(orderId),
        status: 'delivered',
        updatedAt: new Date().toISOString(),
      });
    } catch {}

    // Realtime wallet update could be emitted here if needed; orderRealtime already notifies
    return updated;
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

      // Also notify restaurant and order room (v1) so any order subscribers update
      try {
        this.notificationGateway.notifyOrderUpdate(
          String((updatedOrder as any).restaurantId?._id || updatedOrder.restaurantId),
          String(updatedOrder._id),
          String(status)
        );
      } catch {}

      // If terminal state, handle settlement and teardown
      if (status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED) {
        if (status === OrderStatus.DELIVERED) {
          try {
            // Settle minimal wallets: restaurant gets net (total - commission), driver gets deliveryFee
            const order: any = updatedOrder;
            const restaurantId = order.restaurantId?._id || order.restaurantId;
            const driverIdObj = order.driverId?._id || order.driverId;

            // Load restaurant to get commissionRate & wallet
            const restaurant = await this.restaurantModel.findById(restaurantId);
            if (restaurant) {
              const commissionRate = Math.max(0, Math.min(1, Number((restaurant as any).commissionRate ?? 0.15)));
              const commission = Math.round(Number(order.total || 0) * commissionRate);
              const netToRestaurant = Math.max(0, Math.round(Number(order.total || 0) - commission));
              await this.restaurantModel.updateOne(
                { _id: restaurant._id },
                { 
                  $inc: { walletBalance: netToRestaurant, totalRevenue: Number(order.total || 0) },
                }
              );
              // Append wallet transaction for restaurant (credit)
              try {
                // dynamic import to avoid circular deps
                const { WalletTransaction } = require('../wallet/schemas/wallet-transaction.schema');
                const { getModelToken } = require('@nestjs/mongoose');
                const token = getModelToken(WalletTransaction.name);
                const model = (this as any).moduleRef?.get?.(token) || null;
                if (model?.create) {
                  await model.create({ userType: 'restaurant', userId: restaurant._id, type: 'credit', amount: netToRestaurant, orderId: order._id, createdAt: new Date() });
                }
              } catch {}
            }

            // Credit driver delivery fee
            if (driverIdObj) {
              await this.driverModel.updateOne(
                { _id: driverIdObj },
                { $inc: { walletBalance: Number(order.deliveryFee || 0), ordersCompleted: 1 } }
              );
              // Append wallet transaction for driver (credit)
              try {
                const { WalletTransaction } = require('../wallet/schemas/wallet-transaction.schema');
                const { getModelToken } = require('@nestjs/mongoose');
                const token = getModelToken(WalletTransaction.name);
                const model = (this as any).moduleRef?.get?.(token) || null;
                if (model?.create) {
                  await model.create({ userType: 'driver', userId: driverIdObj, type: 'credit', amount: Number(order.deliveryFee || 0), orderId: order._id, createdAt: new Date() });
                }
              } catch {}
            }
          } catch (e) {
            this.logger?.error?.('Settlement update failed', e);
          }
        }
        await this.orderRealtime.teardownOrder(orderId);
        this.orderRealtime.incrementOrdersMetric(status === OrderStatus.DELIVERED ? 'completed' : 'cancelled');
      }

      // Emit minimal status event to driver and restaurant rooms for realtime UI
      try {
        (this.orderRealtime as any).emitOrderStatusChangedMinimal?.({
          driverId: updatedOrder.driverId ? String((updatedOrder as any).driverId?._id || updatedOrder.driverId) : null,
          restaurantId: String((updatedOrder as any).restaurantId?._id || updatedOrder.restaurantId),
          orderId: String(updatedOrder._id),
          status: String(status),
          updatedAt: new Date().toISOString(),
        });
      } catch {}
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
