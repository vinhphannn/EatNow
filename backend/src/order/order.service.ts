import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Driver, DriverDocument } from '../driver/schemas/driver.schema';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { Cart, CartDocument } from '../cart/schemas/cart.schema';
import { Item, ItemDocument } from '../restaurant/schemas/item.schema';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { OptimizedNotificationGateway } from '../notification/optimized-notification.gateway';
import { OrderRealtimeService } from './services/order-realtime.service';
import { RedisService } from '../common/services/redis.service';
import { DistanceService } from '../common/services/distance.service';
import { OrderAssignmentService } from './services/order-assignment.service';
import { CustomerService } from '../customer/customer.service';
import { OrderCreationService } from './services/order-creation.service';
import { SmartDriverAssignmentService } from '../driver/services/smart-driver-assignment.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    private readonly notificationGateway: OptimizedNotificationGateway,
    private readonly orderRealtime: OrderRealtimeService,
    private readonly distanceService: DistanceService,
    private readonly orderAssignmentService: OrderAssignmentService,
    private readonly customerService: CustomerService,
    private readonly orderCreationService: OrderCreationService,
    private readonly redisService: RedisService,
    private readonly smartDriverAssignmentService: SmartDriverAssignmentService,
    private readonly walletService: WalletService, // Thêm WalletService
  ) {}

  private readonly logger = new Logger(OrderService.name);

  // Tạo đơn hàng từ giỏ hàng
  async createOrderFromCart(
    customerId: string,
    restaurantId: string,
    orderData: {
      deliveryAddress: any;
      recipient: { name: string; phone: string };
      paymentMethod: string;
      deliveryMode?: string;
      scheduledAt?: Date;
      tip?: number;
      doorFee?: number;
      voucherCode?: string;
      specialInstructions?: string;
    }
  ) {
    try {
      const savedOrder = await this.orderCreationService.createOrderFromCart(
        customerId,
        restaurantId,
        orderData
      );

      // TÌM TÀI XẾ NGAY KHI TẠO ĐƠN
      // Vì nhiều quán không dùng app - tài xế sẽ đến đọc món mới làm
      try {
        this.logger.log(`Order ${savedOrder._id} created - starting immediate driver search`);
        
        // Thêm vào Redis queue để tìm tài xế
        await this.redisService.addPendingOrder(savedOrder._id.toString());
        this.logger.log(`Order ${savedOrder._id} added to pending orders queue for driver assignment`);
        
        // Trigger smart assignment ngay lập tức
        await this.smartDriverAssignmentService.processPendingOrders();
        
      } catch (error) {
        this.logger.error(`Failed to start driver assignment for order ${savedOrder._id}:`, error);
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

      return {
        ...savedOrder.toObject(),
        orderCode: savedOrder.code
      };

    } catch (error) {
      console.error('Error creating order from cart:', error);
      throw error;
    }
  }


  async createOrder(customerId: string, orderData: any) {
    console.log('🔍 Backend received order data:', JSON.stringify(orderData, null, 2));
    
    // Handle both old and new format
    const { items, paymentMethod, deliveryAddress, specialInstructions, deliveryDistance,
      recipient, recipientName, recipientPhonePrimary, recipientPhoneSecondary, purchaserPhone } = orderData;

    // Extract recipient data from frontend (handle both old and new format)
    const finalRecipientName = recipient?.name || recipientName || '';
    const finalRecipientPhone = recipient?.phone || recipientPhonePrimary || recipientPhoneSecondary || '';
    
    if (!finalRecipientPhone) {
      throw new Error('Thiếu số điện thoại người nhận');
    }
    if (!finalRecipientName) {
      throw new Error('Thiếu tên người nhận');
    }

    // Prepare delivery address with recipient info
    const formattedDeliveryAddress = {
      ...deliveryAddress,
      recipientName: finalRecipientName,
      recipientPhone: finalRecipientPhone,
    };

    try {
      // Get restaurantId from orderData
      const restaurantId = orderData.restaurantId;
      
      const savedOrder = await this.orderCreationService.createOrderFromCart(customerId, restaurantId, {
        deliveryAddress: formattedDeliveryAddress,
        recipient: {
          name: finalRecipientName,
          phone: finalRecipientPhone
        },
        paymentMethod,
        deliveryMode: orderData.mode || 'immediate',
        scheduledAt: orderData.scheduledAt ? new Date(orderData.scheduledAt) : null,
        tip: orderData.tip || 0,
        doorFee: orderData.doorFee || false,
        deliveryFee: orderData.deliveryFee, // Pass deliveryFee from frontend for verification
        specialInstructions: specialInstructions || ''
      });

      // TÌM TÀI XẾ NGAY KHI TẠO ĐƠN
      // Vì nhiều quán không dùng app - tài xế sẽ đến đọc món mới làm
      try {
        this.logger.log(`Order ${savedOrder._id} created - starting immediate driver search`);
        
        // Thêm vào Redis queue để tìm tài xế
        await this.redisService.addPendingOrder(savedOrder._id.toString());
        this.logger.log(`Order ${savedOrder._id} added to pending orders queue for driver assignment`);
        
        // Trigger smart assignment ngay lập tức
        await this.smartDriverAssignmentService.processPendingOrders();
        
      } catch (error) {
        this.logger.error(`Failed to start driver assignment for order ${savedOrder._id}:`, error);
      }

      // Notify restaurant about new order
      this.notificationGateway.notifyNewOrder(
        String(savedOrder.restaurantId),
        {
          id: savedOrder._id,
          customerId: customerId,
          total: savedOrder.finalTotal,
          items: savedOrder.items.length,
          createdAt: (savedOrder as any).createdAt
        }
      );

      return savedOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getOrdersByCustomer(userId: string) {
    try {
      console.log('🔍 OrderService.getOrdersByCustomer - userId:', userId);
      
      // First, find the customer profile for this user
      const customer = await this.customerService.getCustomerByUserId(userId);
      console.log('🔍 OrderService - Found customer:', !!customer);
      
      if (!customer) {
        this.logger.warn(`No customer profile found for user ${userId}`);
        return [];
      }

      const customerId = (customer as any)._id;
      console.log('🔍 OrderService - customerId (from customer._id):', customerId);
      
      // Query with BOTH customerId (correct) and userId (wrong data in old orders)
      const orders = await this.orderModel
        .find({ 
          $or: [
            { customerId: new Types.ObjectId(customerId) },
            { customerId: new Types.ObjectId(userId) }
          ]
        })
        .populate('restaurantId', 'name address phone imageUrl')
        .populate('driverId', 'name phone vehicleType licensePlate')
        .sort({ createdAt: -1 })
        .lean();
      
      console.log('🔍 OrderService - Found orders count:', orders.length);
      if (orders.length > 0) {
        console.log('🔍 OrderService - First order customerId:', orders[0].customerId);
      }

      console.log('🔍 OrderService: Found orders for customer:', orders.length);
      if (orders.length > 0) {
        console.log('🔍 OrderService: First order:', {
          _id: orders[0]._id,
          code: orders[0].code,
          status: orders[0].status,
          createdAt: (orders[0] as any).createdAt
        });
      }
      
      // Transform the data to match frontend expectations
      const transformedOrders = orders.map((order: any) => ({
        ...order,
        _id: order._id,
        orderCode: order.code || order.orderCode || `ORD${order._id.toString().slice(-8).toUpperCase()}`,
        // Map recipient info from deliveryAddress to root level for frontend
        recipientName: order.deliveryAddress?.recipientName || '',
        recipientPhonePrimary: order.deliveryAddress?.recipientPhone || '',
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

    // Ẩn platform fee khỏi response cho user/nhà hàng
    // Platform fee chỉ hiển thị cho Admin
    const orderResponse = this.hidePlatformFee(order as any);
    
    return orderResponse;
  }

  /**
   * Ẩn platform fee khỏi response cho user/nhà hàng
   * Chỉ Admin mới thấy platformFeeAmount và platformFeeRate
   */
  private hidePlatformFee(order: any): any {
    // Hoàn toàn xóa platform fee info khỏi response cho user/restaurant
    const cleanedOrder = { ...order };
    delete cleanedOrder.platformFeeAmount;
    delete cleanedOrder.platformFeeRate;
    delete cleanedOrder.driverCommissionRate;
    return cleanedOrder;
  }

  /**
   * Lấy order với đầy đủ thông tin platform fee (chỉ dùng cho Admin)
   */
  async getOrderByIdWithPlatformFee(orderId: string) {
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

    // Trả về đầy đủ thông tin, không ẩn platform fee
    return order;
  }

  async updateOrderStatus(orderId: string, updateData: any) {
    // Special handling for cancellation - reset driverId to null
    const updatePayload: any = { ...updateData };
    if (updateData.status === 'cancelled' && updateData.driverId === null) {
      updatePayload.driverId = null;
      updatePayload.assignedAt = null;
    }

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      { 
        $set: updatePayload,
        $push: {
          trackingHistory: {
            status: updateData.status,
            timestamp: new Date(),
            note: this.getStatusNote(updateData.status),
            updatedBy: 'driver'
          }
        }
      },
      { new: true }
    ).populate('customerId', 'name phone email')
     .populate('restaurantId', 'name address phone')
     .populate('driverId', 'name phone');

    if (!updatedOrder) {
      throw new NotFoundException('Order not found');
    }

    // If order is cancelled, update driver status back to available
    if (updateData.status === 'cancelled' && updateData.driverId === null) {
      try {
        await this.driverModel.findByIdAndUpdate(updatedOrder.driverId, {
          $set: { 
            status: 'available',
            currentOrderId: null,
            currentOrderStartedAt: null
          },
          $inc: { activeOrdersCount: -1 }
        });
      } catch (err) {
        console.error('Failed to update driver status after cancellation:', err);
      }
    }

    // TÌM TÀI XẾ KHI ĐƠN HÀNG SẴN SÀNG GIAO
    if (updateData.status === 'ready') {
      try {
        this.logger.log(`Order ${orderId} is ready - starting driver assignment`);
        
        // Thêm vào Redis queue để tìm tài xế
        await this.redisService.addPendingOrder(orderId);
        this.logger.log(`Order ${orderId} added to pending orders queue for driver assignment`);
        
        // Trigger smart assignment ngay lập tức
        await this.smartDriverAssignmentService.processPendingOrders();
        
      } catch (error) {
        this.logger.error(`Failed to start driver assignment for order ${orderId}:`, error);
      }
    }

    // PHÂN CHIA TIỀN KHI ĐƠN ĐÃ GIAO THÀNH CÔNG
    if (updateData.status === 'delivered') {
      try {
        this.logger.log(`Order ${orderId} delivered - distributing earnings`);
        await this.distributeOrderEarnings(updatedOrder);
        this.logger.log(`Order ${orderId} earnings distributed successfully`);
      } catch (error) {
        this.logger.error(`Failed to distribute earnings for order ${orderId}:`, error);
        // Không throw error để không block việc update order status
      }
    }

    return updatedOrder;
  }

  /**
   * Phân chia tiền khi đơn hàng delivered
   * 
   * Lưu ý quan trọng:
   * - Không hiển thị platformFee cho user/nhà hàng
   * - Chỉ hiển thị số tiền họ nhận được hoặc phải trả
   * - Platform fee chỉ hiện ở Admin dashboard
   * 
   * Phân chia:
   * - Restaurant: nhận restaurantRevenue (subtotal - platformFee) 
   * - Driver: nhận driverPayment (deliveryFee + tip + doorFee - commission)
   * - Platform: thu platformFeeAmount (được tính trong order schema)
   */
  private async distributeOrderEarnings(order: any) {
    try {
      // Lấy các giá trị từ order (đã được tính sẵn khi tạo đơn)
      const subtotal = order.subtotal || 0;
      const deliveryFee = order.deliveryFee || 0;
      const tip = order.driverTip || order.tip || 0;
      const doorFee = order.doorFee || 0;
      
      // Platform fee rate và amount (từ order schema)
      const platformFeeRate = order.platformFeeRate || 10; // Default 10%
      const platformFeeAmount = order.platformFeeAmount || Math.floor(subtotal * platformFeeRate / 100);
      
      // Driver commission rate
      const driverCommissionRate = order.driverCommissionRate || 30; // Default 30%
      const driverCommissionAmount = Math.floor((deliveryFee + doorFee) * driverCommissionRate / 100);
      
      // Tính toán tiền phân chia
      // Restaurant: subtotal - platformFee
      const restaurantRevenue = subtotal - platformFeeAmount;
      
      // Driver: deliveryFee + tip + doorFee - driverCommission
      const driverPayment = (deliveryFee + tip + doorFee) - driverCommissionAmount;

      this.logger.log(`💰 Distributing earnings for order ${order._id}:`);
      this.logger.log(`   - Restaurant revenue: ${restaurantRevenue.toLocaleString('vi-VN')} VND`);
      this.logger.log(`   - Driver payment: ${driverPayment.toLocaleString('vi-VN')} VND`);
      this.logger.log(`   - Platform fee: ${platformFeeAmount.toLocaleString('vi-VN')} VND (hidden from users)`);

      // Cập nhật order với thông tin earnings
      await this.orderModel.findByIdAndUpdate(order._id, {
        $set: {
          restaurantRevenue,
          driverPayment,
          platformFeeAmount, // Lưu nhưng không hiển thị cho user/restaurant
        }
      });

      // Release escrow của customer (nếu có)
      try {
        await this.walletService.releaseEscrowForOrder('customer', (order.customerId || order.userId).toString(), order._id.toString(), order.customerPayment || order.finalTotal);
      } catch (e) {
        this.logger.warn(`Release escrow failed or not applicable for order ${order._id}: ${e?.message || e}`);
      }

      // Phân chia tiền vào ví
      const distributionResults = await this.walletService.distributeOrderEarnings({
        _id: order._id,
        restaurantId: order.restaurantId,
        driverId: order.driverId,
        code: order.code,
        restaurantRevenue,
        driverPayment,
        platformFeeAmount,
      });

      this.logger.log(`✅ Earnings distributed for order ${order._id}:`, distributionResults);
      return distributionResults;

    } catch (error) {
      this.logger.error(`Error distributing earnings for order ${order._id}:`, error);
      throw error;
    }
  }

  private getStatusNote(status: string): string {
    const statusNotes = {
      'picking_up': 'Tài xế đã nhận đơn và đang đến lấy hàng',
      'arrived_at_restaurant': 'Tài xế đã đến nhà hàng',
      'picked_up': 'Tài xế đã lấy đơn hàng',
      'arrived_at_customer': 'Tài xế đã đến vị trí giao hàng',
      'delivered': 'Đơn hàng đã giao thành công',
      'cancelled': 'Đơn hàng đã bị hủy'
    };
    return statusNotes[status] || 'Trạng thái đơn hàng đã được cập nhật';
  }

  async findAvailableOrders(limit = 50) {
    // Orders available for drivers to accept: ready for pickup, no driver assigned
    const docs = await this.orderModel
      .find({ 
        status: 'ready', 
        $or: [{ driverId: null }, { driverId: { $exists: false } }]
      })
      .populate('restaurantId', 'name address coordinates')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs.map((d: any) => ({
      id: String(d._id),
      orderCode: d.code || `#${d._id.toString().slice(-6)}`,
      restaurantId: String(d.restaurantId),
      restaurantName: d.restaurantId?.name || 'Nhà hàng',
      restaurantAddress: d.restaurantId?.address || '',
      restaurantLat: d.restaurantCoordinates?.latitude || d.restaurantId?.coordinates?.latitude,
      restaurantLng: d.restaurantCoordinates?.longitude || d.restaurantId?.coordinates?.longitude,
      customerName: d.deliveryAddress?.recipientName || 'Khách hàng',
      customerAddress: d.deliveryAddress?.addressLine || '',
      customerLat: d.deliveryAddress?.latitude,
      customerLng: d.deliveryAddress?.longitude,
      status: d.status,
      total: d.finalTotal || d.total || 0,
      deliveryFee: d.deliveryFee || 0,
      tip: d.driverTip || 0,
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

    const driverId = (driver as any)._id;
    const now = new Date();

    // Update order with tracking history
    const updated = await this.orderModel.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(orderId), 
        status: 'ready',
        $or: [{ driverId: null }, { driverId: { $exists: false } }]
      },
      { 
        $set: { 
          status: 'picking_up', 
          driverId: driverId, 
          assignedAt: now 
        },
        $push: {
          trackingHistory: {
            status: 'picking_up',
            timestamp: now,
            note: 'Tài xế đã nhận đơn và đang đến lấy hàng',
            updatedBy: 'driver'
          }
        }
      },
      { new: true }
    ).lean();

    if (!updated) {
      const e: any = new Error('Order not available or already assigned');
      e.status = 400;
      throw e;
    }

    // Update driver status to "delivering"
    try {
      await this.driverModel.findByIdAndUpdate(driverId, {
        $set: { 
          status: 'delivering',
          currentOrderId: updated._id,
          currentOrderStartedAt: now
        },
        $inc: { activeOrdersCount: 1 }
      });
    } catch (err) {
      console.error('Failed to update driver status:', err);
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
    const updated = await this.updateOrderStatus(orderId, { status: 'delivered', driverId: String((driver as any)._id) });
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

  // Pass-through to CustomerService to fetch customer by user ID for controllers needing it
  async findCustomerByUserId(userId: string) {
    return this.customerService.getCustomerByUserId(userId);
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

    // Notify restaurant and driver about order cancellation
    try {
      // Notify restaurant detailed cancel event
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
      // Canonical status update to restaurant room
      this.notificationGateway.notifyOrderUpdate(String(order.restaurantId), String(order._id), 'cancelled');
      // Minimal status to both restaurant and driver rooms
      (this.orderRealtime as any).emitOrderStatusChangedMinimal?.({
        restaurantId: String(order.restaurantId),
        driverId: order.driverId ? String(order.driverId) : null,
        orderId: String(order._id),
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      });
    } catch {}

    return {
      success: true,
      message: 'Order cancelled successfully',
      order: order
    };
  }
}
