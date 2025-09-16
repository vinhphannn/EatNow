import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from './schemas/driver.schema';
import { Order, OrderDocument } from '../order/schemas/order.schema';

@Injectable()
export class DriverService {
  constructor(
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
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
    const driver = await this.driverModel.findOne({ userId });
    if (!driver) throw new NotFoundException('Driver not found');

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
    const driver = await this.driverModel.findOne({ userId });
    if (!driver) throw new NotFoundException('Driver not found');

    const orders = await this.orderModel
      .find({
        driverId: driver._id,
        status: { $nin: ['delivered', 'cancelled'] }
      })
      .populate('restaurantId', 'name')
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return orders.map((order: any) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      restaurantName: order.restaurantId?.name || 'N/A',
      customerName: order.userId?.name || 'N/A',
      totalAmount: order.totalAmount,
    }));
  }
}


