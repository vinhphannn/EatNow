import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderStatus } from '../../order/schemas/order.schema';

@Injectable()
export class DriverOrderService {
  private readonly logger = new Logger(DriverOrderService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  async listOrdersByDriver(
    driverId: string,
    params: { status?: string; page?: number; limit?: number }
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const query: any = { driverId: new Types.ObjectId(driverId) };
    if (params.status) {
      query.status = params.status;
    }

    const [items, total] = await Promise.all([
      this.orderModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('restaurantId', 'name address')
        .populate('customerId', 'name phone')
        .lean(),
      this.orderModel.countDocuments(query),
    ]);

    return {
      orders: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, driverId: string) {
    // Validate allowed transitions for driver
    // Driver can: accept, arrived-restaurant, picked-up, arrived-customer, delivered, cancel
    const current = await this.orderModel.findById(orderId).lean();
    if (!current) throw new NotFoundException('Order not found');
    const from = (current.status as any) as OrderStatus;
    const to = status;
    const driverAllowed: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PENDING],
      [OrderStatus.CONFIRMED]: [OrderStatus.READY],     // ready to pickup
      [OrderStatus.READY]: [OrderStatus.DELIVERED],     // delivered
      [OrderStatus.DELIVERED]: [OrderStatus.DELIVERED],
      [OrderStatus.CANCELLED]: [OrderStatus.CANCELLED],
    } as any;
    if (!driverAllowed[from] || !driverAllowed[from].includes(to)) {
      const e: any = new Error(`Invalid driver transition: ${from} -> ${to}`);
      e.status = 400;
      throw e;
    }

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
      updatedBy: 'driver'
    };

    updateData.$push = { trackingHistory: trackingEntry };

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate('driverId', 'name phone')
     .populate('restaurantId', 'name address')
     .populate('customerId', 'name phone');

    if (!updatedOrder) {
      throw new NotFoundException('Order not found');
    }

    this.logger.log(`Order ${orderId} status updated to ${status} by driver ${driverId}`);
    return updatedOrder;
  }

  async getOrderById(orderId: string) {
    const order = await this.orderModel.findById(orderId)
      .populate('driverId', 'name phone')
      .populate('restaurantId', 'name address')
      .populate('customerId', 'name phone');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private getStatusNote(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.CONFIRMED:
        return 'Nhà hàng đã xác nhận và đang chuẩn bị';
      case OrderStatus.READY:
        return 'Sẵn sàng lấy đơn hàng';
      case OrderStatus.DELIVERED:
        return 'Tài xế đã giao hàng thành công';
      default:
        return 'Trạng thái đã được cập nhật';
    }
  }
}
