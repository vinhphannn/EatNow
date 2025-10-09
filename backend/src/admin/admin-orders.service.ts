import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../order/schemas/order.schema';

@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  async listOrders(params: { page?: number; limit?: number; status?: string; paymentStatus?: string; restaurantId?: string; driverId?: string; customerId?: string }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;

    const query: any = {};
    if (params.status) {
      // Map frontend synonyms to backend statuses
      const mapStatus = (s: string) => {
        if (s === 'accepted') return 'confirmed';
        if (s === 'delivering') return 'ready';
        if (s === 'completed') return 'delivered';
        return s;
      };
      const statuses = params.status
        .split(',')
        .map((s) => mapStatus(s.trim()))
        .filter(Boolean);
      if (statuses.length === 1) query.status = statuses[0];
      else if (statuses.length > 1) query.status = { $in: statuses };
    }
    if (params.restaurantId) query.restaurantId = new Types.ObjectId(params.restaurantId);
    if (params.driverId) query.driverId = new Types.ObjectId(params.driverId);
    if (params.customerId) query.customerId = new Types.ObjectId(params.customerId);

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('restaurantId', 'name address')
        .populate('customerId', 'name phone')
        .populate('driverId', '')
        .lean(),
      this.orderModel.countDocuments(query),
    ]);

    const data = orders.map((o: any) => ({
      id: String(o._id),
      code: o.code || String(o._id),
      customer: o.customerId ? { id: String(o.customerId._id || o.customerId), name: (o.customerId as any).name, email: undefined } : undefined,
      restaurant: o.restaurantId ? { id: String(o.restaurantId._id || o.restaurantId), name: (o.restaurantId as any).name } : undefined,
      driver: o.driverId ? { id: String(o.driverId._id || o.driverId), name: undefined } : undefined,
      total: o.finalTotal || o.total || 0,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    } as any;
  }
}


