import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserService } from '../user/user.service';
import { Driver, DriverDocument } from './schemas/driver.schema';
import { Order, OrderDocument } from '../order/schemas/order.schema';

@Injectable()
export class DriverService {
  constructor(
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly users: UserService,
  ) {}

  async findAll() {
    const docs = await this.driverModel
      .find({}, { name: 1, phone: 1, status: 1, userId: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return docs.map((d: any) => ({
      id: d._id,
      name: d.name,
      phone: d.phone,
      status: d.status,
      userId: d.userId,
      createdAt: d.createdAt,
    }));
  }

  async getWalletForUser(userId: string) {
    if (!userId) throw new NotFoundException('User not found');
    const d = await this.driverModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!d) return { walletBalance: 0, ordersCompleted: 0, recentOrders: [] };
    const recent = await this.orderModel
      .find({ driverId: (d as any)._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    return {
      walletBalance: (d as any).walletBalance || 0,
      ordersCompleted: (d as any).ordersCompleted || 0,
      recentOrders: recent.map((o: any) => ({ id: String(o._id), total: o.total, deliveryFee: o.deliveryFee, status: o.status })),
    };
  }

  async updateLocationByUser(userId: string, lat: number, lng: number) {
    if (!userId) throw new NotFoundException('User not found');
    const res = await this.driverModel.findOneAndUpdate(
      { userId },
      {
        locationType: 'Point',
        location: [lng, lat],
        lastLocationAt: new Date(),
        status: 'active',
      },
      { new: true }
    );
    if (!res) throw new NotFoundException('Driver not found');
    return { ok: true };
  }

  async getDriverStats(userId: string) {
    // Ensure driver exists (lazy create) to avoid 404 loop on fresh accounts
    let driver = await this.driverModel.findOne({ userId });
    if (!driver) {
      driver = await this.driverModel.create({ userId, status: 'inactive' } as any);
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count current orders (not delivered)
    const currentOrdersCount = await this.orderModel.countDocuments({
      driverId: driver._id,
      status: { $nin: ['delivered', 'cancelled'] }
    });

    // Calculate today's earnings
    const todayOrders = await this.orderModel.find({
      driverId: driver._id,
      status: 'delivered',
      actualDeliveryTime: { $gte: today, $lt: tomorrow }
    });

    const todayEarnings = todayOrders.reduce((sum, order) => {
      return sum + (order.deliveryFee || 0);
    }, 0);

    return {
      totalDeliveries: driver.totalDeliveries || 0,
      currentOrders: currentOrdersCount,
      todayEarnings,
      rating: driver.rating || 0,
      ratingCount: driver.ratingCount || 0,
    };
  }

  async getCurrentOrders(userId: string) {
    const driver = await this.driverModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!driver) throw new NotFoundException('Driver not found');

    console.log('🔍 Loading current orders for driver:', driver._id);
    console.log('🔍 Driver userId:', userId);
    console.log('🔍 Driver _id:', driver._id);

    // Find orders where driverId matches this driver's _id (as ObjectId)
    const driverId = (driver as any)._id;
    console.log('🔍 Searching for orders with driverId:', driverId);
    
    const orders = await this.orderModel
      .find({
        driverId: driverId,
        status: { $nin: ['delivered', 'cancelled'] }
      })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('🔍 Orders after query:', orders.length);
    console.log('🔍 First order data:', orders[0]?.restaurantId);

    console.log('🔍 Found orders:', orders.length);
    
    // Debug: Check all orders with this driverId
    const allOrdersWithDriverId = await this.orderModel
      .find({ driverId: driverId })
      .select('_id status driverId')
      .lean();
    console.log('🔍 All orders with driverId (any status):', allOrdersWithDriverId.length);
    if (allOrdersWithDriverId.length > 0) {
      console.log('🔍 Order details:', allOrdersWithDriverId.map(o => ({ 
        _id: o._id, 
        status: o.status, 
        driverId: o.driverId 
      })));
    }
    
    if (orders.length > 0) {
      console.log('🔍 Order statuses:', orders.map(o => o.status));
      console.log('🔍 Order driverIds:', orders.map(o => o.driverId));
    }

    return orders.map((order: any) => ({
      _id: order._id,
      id: String(order._id),
      orderNumber: order.orderNumber || order.code,
      code: order.code,
      status: order.status,
      restaurantName: order.restaurantId?.name || 'N/A',
      restaurantAddress: order.restaurantId?.address || '',
      customerName: order.customerId?.name || order.deliveryAddress?.recipientName || 'N/A',
      customerPhone: order.customerId?.phone || order.deliveryAddress?.recipientPhone || '',
      customerAddress: order.deliveryAddress?.addressLine || '',
      totalAmount: order.finalTotal || order.customerPayment || order.total || order.totalAmount,
      subtotal: order.subtotal || order.total || 0,
      deliveryFee: order.deliveryFee,
      createdAt: order.createdAt,
      assignedAt: order.assignedAt,
      items: order.items || [],
      deliveryAddress: order.deliveryAddress
    }));
  }

  async getDriverByUserId(userId: string) {
    console.log('🔍 getDriverByUserId called with:', userId);
    
    // Ensure driver doc exists
    let driver = await this.driverModel.findOne({ userId }).lean();
    console.log('🔍 Found driver:', driver ? { _id: driver._id, userId: driver.userId } : null);
    
    if (!driver) {
      const created = await this.driverModel.create({ userId, status: 'inactive' } as any);
      driver = created?.toObject?.() || (created as any);
      console.log('🔍 Created new driver:', { _id: driver._id, userId: driver.userId });
    }
    return driver;
  }

  async getDriverHistory(userId: string, page = 1, limit = 20) {
    console.log('🔍 getDriverHistory called with:', { userId, page, limit });
    
    const driver = await this.driverModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    console.log('🔍 Found driver:', driver ? { _id: driver._id, userId: driver.userId } : null);
    
    if (!driver) throw new NotFoundException('Driver not found');

    console.log('🔍 Loading driver history for driver:', driver._id);

    const skip = (page - 1) * limit;
    
    const orders = await this.orderModel
      .find({
        driverId: (driver as any)._id,
        status: { $in: ['delivered', 'cancelled'] }
      })
      .populate('restaurantId', 'name address coordinates')
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.orderModel.countDocuments({
      driverId: (driver as any)._id,
      status: { $in: ['delivered', 'cancelled'] }
    });

    console.log('🔍 Found history orders:', orders.length, 'Total:', total);

    return {
      orders: orders.map((order: any) => ({
        _id: order._id,
        id: String(order._id),
        code: order.orderNumber || order.code,
        status: order.status,
        restaurantName: order.restaurantId?.name || 'N/A',
        restaurantAddress: order.restaurantId?.address || '',
        customerName: order.customerId?.name || order.deliveryAddress?.recipientName || 'N/A',
        customerPhone: order.customerId?.phone || order.deliveryAddress?.recipientPhone || '',
        customerAddress: order.deliveryAddress?.addressLine || '',
        totalAmount: order.total || order.finalTotal || order.totalAmount,
        deliveryFee: order.deliveryFee,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt || order.updatedAt,
        items: order.items || [],
        deliveryAddress: order.deliveryAddress
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async updateDriverStatus(driverId: string, updateData: any) {
    return await this.driverModel.findByIdAndUpdate(
      driverId,
      { $set: updateData },
      { new: true }
    );
  }

  async getMyProfile(userId: string) {
    // Ensure driver doc exists
    let driver = await this.driverModel.findOne({ userId }).lean();
    if (!driver) {
      const created = await this.driverModel.create({ userId, status: 'inactive' } as any);
      driver = created?.toObject?.() || (created as any);
    }
    const user = await this.users.findByIdLean(userId);
    return {
      id: driver._id,
      // common fields from user
      name: (user as any)?.name,
      email: (user as any)?.email,
      phone: (user as any)?.phone,
      // driver-specific
      status: (driver as any).status,
      vehicleType: (driver as any).vehicleType,
      licensePlate: (driver as any).licensePlate,
      bankAccount: (driver as any).bankAccount,
      bankName: (driver as any).bankName,
      rating: (driver as any).rating || 0,
      totalDeliveries: (driver as any).totalDeliveries || 0,
      averageDeliveryTime: (driver as any).averageDeliveryTime || 0,
    };
  }

  async updateMyProfile(userId: string, payload: any) {
    // Split common vs driver-specific fields
    const userUpdate: any = {};
    if (payload?.name !== undefined) userUpdate.name = payload.name;
    if (payload?.phone !== undefined) userUpdate.phone = payload.phone;

    const driverUpdate: any = { ...payload };
    delete driverUpdate.name;
    delete driverUpdate.phone;

    if (Object.keys(userUpdate).length > 0) {
      await this.users.setById(userId, userUpdate);
    }

    const updated = await this.driverModel.findOneAndUpdate(
      { userId },
      { $set: driverUpdate },
      { new: true, upsert: true }
    ).lean();
    if (!updated) throw new NotFoundException('Driver not found');
    return { ok: true };
  }

  async getEarningsSummary(userId: string) {
    // Aggregate from orders delivered by this driver
    const driver = await this.driverModel.findOne({ userId }).lean();
    if (!driver) throw new NotFoundException('Driver not found');

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [todayAgg, totalAgg] = await Promise.all([
      this.orderModel.aggregate([
        { $match: { driverId: new Types.ObjectId(driver._id), status: 'delivered', actualDeliveryTime: { $gte: startOfDay } } },
        { $group: { _id: null, earnings: { $sum: '$deliveryFee' }, count: { $sum: 1 } } }
      ]),
      this.orderModel.aggregate([
        { $match: { driverId: new Types.ObjectId(driver._id), status: 'delivered' } },
        { $group: { _id: null, earnings: { $sum: '$deliveryFee' }, count: { $sum: 1 } } }
      ]),
    ]);

    return {
      todayEarnings: todayAgg[0]?.earnings || 0,
      todayOrders: todayAgg[0]?.count || 0,
      totalEarnings: totalAgg[0]?.earnings || 0,
      completedOrders: totalAgg[0]?.count || 0,
      availableBalance: totalAgg[0]?.earnings || 0,
    };
  }

  async getEarnings(userId: string, params: { page: number; limit: number; fromDate?: string; toDate?: string }) {
    const driver = await this.driverModel.findOne({ userId }).lean();
    if (!driver) throw new NotFoundException('Driver not found');
    const page = params.page || 1;
    const limit = params.limit || 20;
    const query: any = { driverId: new Types.ObjectId(driver._id), status: 'delivered' };
    if (params.fromDate) query.actualDeliveryTime = { ...(query.actualDeliveryTime || {}), $gte: new Date(params.fromDate) };
    if (params.toDate) query.actualDeliveryTime = { ...(query.actualDeliveryTime || {}), $lte: new Date(params.toDate) };

    const [items, total] = await Promise.all([
      this.orderModel
        .find(query)
        .sort({ actualDeliveryTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('orderNumber deliveryFee actualDeliveryTime finalTotal')
        .lean(),
      this.orderModel.countDocuments(query),
    ]);

    return {
      data: items.map((o: any) => ({
        id: o._id,
        orderNumber: o.orderNumber,
        deliveryFee: o.deliveryFee || 0,
        deliveredAt: o.actualDeliveryTime,
        finalTotal: o.finalTotal || 0,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async getOrderHistory(userId: string, params: { page: number; limit: number; status?: string }) {
    const driver = await this.driverModel.findOne({ userId }).lean();
    if (!driver) throw new NotFoundException('Driver not found');
    const page = params.page || 1;
    const limit = params.limit || 20;
    const query: any = { driverId: new Types.ObjectId(driver._id) };
    if (params.status) query.status = params.status;

    const [items, total] = await Promise.all([
      this.orderModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('orderNumber status finalTotal createdAt')
        .lean(),
      this.orderModel.countDocuments(query),
    ]);

    return {
      orders: items.map((o: any) => ({
        id: o._id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.finalTotal || 0,
        createdAt: o.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async getDriverStatus(userId: string) {
    try {
      const driver = await this.driverModel.findOne({ userId });
      
      if (!driver) {
        // Tự động tạo driver profile
        const newDriver = await this.driverModel.create({
          userId,
          status: 'checkout',
          deliveryStatus: null,
          location: [0, 0],
          lastLocationAt: new Date(),
          ordersCompleted: 0,
          ordersRejected: 0,
          ordersSkipped: 0,
          rating: 0,
          ratingCount: 0,
          onTimeDeliveries: 0,
          lateDeliveries: 0,
          totalDeliveries: 0,
          averageDeliveryTime: 0,
          performanceScore: 0,
          activeOrdersCount: 0,
          maxConcurrentOrders: 1,
          averageDistancePerOrder: 0,
          totalDistanceTraveled: 0,
          walletBalance: 0
        });

        return {
          success: true,
          data: {
            status: newDriver.status,
            deliveryStatus: newDriver.deliveryStatus,
            currentOrderId: null,
            lastCheckinAt: null,
            lastCheckoutAt: null
          }
        };
      }

      return {
        success: true,
        data: {
          status: driver.status,
          deliveryStatus: driver.deliveryStatus,
          currentOrderId: driver.currentOrderId ? String(driver.currentOrderId) : null,
          lastCheckinAt: driver.lastCheckinAt,
          lastCheckoutAt: driver.lastCheckoutAt
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get driver status'
      };
    }
  }
}


