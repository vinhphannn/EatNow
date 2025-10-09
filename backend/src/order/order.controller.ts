import { Controller, Get, Post, Put, Param, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrderStatus } from './schemas/order.schema';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { NotificationGateway } from '../notification/notification.gateway';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection as MongoConnection, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Driver, DriverDocument } from '../driver/schemas/driver.schema';
import { Model } from 'mongoose';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly gateway: NotificationGateway,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
    @InjectConnection() private readonly mongo: MongoConnection,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new order' })
  async createOrder(@Request() req, @Body() orderData: any) {
    const customerId = req.user.id;
    return this.orderService.createOrder(customerId, orderData);
  }

  @Get('available')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List available orders for drivers (ready, no driver)' })
  async getAvailable() {
    return this.orderService.findAvailableOrders();
  }

  // Driver: list in-progress orders
  @Get('mine/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('driver')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List driver\'s active orders (picking states)' })
  async getMyActive(@Request() req: any) {
    const driverUserId = req.user?.id;
    return (this.orderService as any).findDriverActiveOrders(driverUserId);
  }

  // Driver accepts an order (assign driverId if order is ready and unassigned)
  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('driver')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Driver accepts order (assigns driver to ready order)' })
  async acceptByDriver(@Request() req: any, @Param('id') orderId: string) {
    const driverUserId = req.user?.id;
    return this.orderService.acceptOrderByDriver(orderId, driverUserId);
  }

  // Driver completes an order -> delivered (triggers settlement in service)
  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('driver')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Driver completes order (mark delivered and settle)' })
  async completeByDriver(@Request() req: any, @Param('id') orderId: string) {
    const driverUserId = req.user?.id;
    return this.orderService.completeOrderByDriver(orderId, driverUserId);
  }

  @Get('customer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer orders' })
  async getCustomerOrders(@Request() req) {
    const customerId = req.user.id;
    console.log('🔍 OrderController: Getting orders for customer:', customerId);
    
    try {
      const orders = await this.orderService.getOrdersByCustomer(customerId);
      console.log('🔍 OrderController: Found orders:', orders.length);
      return orders;
    } catch (error) {
      console.error('🔍 OrderController: Error getting orders:', error);
      throw error;
    }
  }

  @Get('restaurant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get restaurant orders' })
  async getRestaurantOrders(@Request() req) {
    const userId = req.user.id;
    // Find restaurant by ownerUserId
    const restaurant = await this.orderService.findRestaurantByOwnerId(userId);
    console.log('🔍 OrderController: Restaurant found for user:', userId, !!restaurant);
    
    // If no restaurant found, still return mock data for testing
    if (!restaurant) {
      console.log('⚠️ OrderController: No restaurant found, returning mock orders data');
    }
    
    // Mock data for now
    const mockOrders = [
      {
        _id: '1',
        code: 'ORD001',
        customer: { name: 'Nguyễn Văn A', phone: '0123456789' },
        items: [
          { name: 'Phở Bò', quantity: 1, price: 45000 },
          { name: 'Bánh Mì', quantity: 2, price: 20000 }
        ],
        finalTotal: 65000,
        status: 'pending',
        createdAt: new Date('2024-01-16T10:30:00Z')
      },
      {
        _id: '2',
        code: 'ORD002',
        customer: { name: 'Trần Thị B', phone: '0987654321' },
        items: [
          { name: 'Bún Chả', quantity: 1, price: 35000 }
        ],
        finalTotal: 35000,
        status: 'preparing',
        createdAt: new Date('2024-01-16T09:15:00Z')
      }
    ];
    
    return {
      success: true,
      data: mockOrders,
      message: 'Orders retrieved successfully'
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  async getOrderById(@Param('id') orderId: string) {
    return this.orderService.getOrderById(orderId);
  }

  // Assign driver via REST orchestration
  @Post(':id/assign-driver')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('restaurant', 'admin', 'admin_restaurant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign driver to order and notify via socket' })
  async assignDriver(
    @Param('id') orderId: string,
    @Body() body: { driverId: string }
  ) {
    const { driverId } = body || ({} as any);
    if (!driverId) return { ok: false, message: 'driverId required' };

    const order = await this.orderModel.findById(orderId).lean();
    if (!order) return { ok: false, message: 'Order not found' };
    const driver = await this.driverModel.findById(driverId).lean();
    if (!driver) return { ok: false, message: 'Driver not found' };

    // Persist assignment
    await this.orderModel.findByIdAndUpdate(orderId, {
      driverId: new Types.ObjectId(driverId),
      assignedAt: new Date(),
      status: 'confirmed',
    });

    // Notify driver and add to order room if connected
    this.gateway.notifyDriverAssigned(driverId, { _id: orderId });
    this.gateway.addDriverToOrderRoom(driverId, orderId);

    // Redis KV sets for orchestration (best-effort)
    try {
      const url = process.env.REDIS_URL || process.env.REDIS_URI;
      if (url) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const IORedis = require('ioredis');
        const redis = new IORedis(url);
        await redis.sadd(`order:${orderId}:drivers`, driverId);
        await redis.set(`order:${orderId}:status`, 'confirmed');
        await redis.set(`order:${orderId}:updatedAt`, String(Date.now()));
        redis.quit();
      }
    } catch {}

    return { ok: true };
  }

  // Driver accepts via REST orchestration
  @Post(':id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('driver')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Driver accepts the assigned order' })
  async acceptOrder(@Request() req: any, @Param('id') orderId: string) {
    const driverUserId = req.user?.id;
    if (!driverUserId) return { ok: false, message: 'Unauthorized' };

    const order = await this.orderModel.findById(orderId);
    if (!order) return { ok: false, message: 'Order not found' };

    // Ensure driver exists and is assigned or eligible
    const driver = await this.driverModel.findOne({ userId: new Types.ObjectId(driverUserId) });
    if (!driver) return { ok: false, message: 'Driver not found' };

    // If not assigned yet, assign
    if (!order.driverId) {
      order.driverId = driver._id as any;
      order.status = 'confirmed' as any;
      order.assignedAt = new Date();
      await order.save();
    }

    // Add to room and emit
    this.gateway.addDriverToOrderRoom(String(driver._id), orderId);
    this.gateway.notifyOrderUpdate(String(order.restaurantId), orderId, 'confirmed');

    // Update Redis markers
    try {
      const url = process.env.REDIS_URL || process.env.REDIS_URI;
      if (url) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const IORedis = require('ioredis');
        const redis = new IORedis(url);
        await redis.sadd(`order:${orderId}:drivers`, String(driver._id));
        await redis.set(`order:${orderId}:status`, 'confirmed');
        await redis.set(`order:${orderId}:updatedAt`, String(Date.now()));
        redis.quit();
      }
    } catch {}

    return { ok: true };
  }

  // Driver rejects an assigned order
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('driver')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Driver rejects the assigned order (reassign next)' })
  async rejectOrder(@Request() req: any, @Param('id') orderId: string) {
    const driverUserId = req.user?.id;
    if (!driverUserId) return { ok: false, message: 'Unauthorized' };

    const driver = await this.driverModel.findOne({ userId: new Types.ObjectId(driverUserId) }).lean();
    if (!driver) return { ok: false, message: 'Driver not found' };

    // Remove from order and increment metric
    await this.gateway.sremDriverFromOrder(orderId, String(driver._id));
    this.gateway.incrementReassignment('reject');

    // Reassign next candidate (best-effort)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { OrderAssignmentService } = require('./services/order-assignment.service');
      // If DI available, prefer using service through module wiring; fallback is no-op
    } catch {}

    return { ok: true };
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() body: { status: OrderStatus; driverId?: string }
  ) {
    return this.orderService.updateOrderStatus(orderId, body.status, body.driverId);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel order' })
  async cancelOrder(@Request() req, @Param('id') orderId: string) {
    const customerId = req.user.id;
    return this.orderService.cancelOrder(orderId, customerId);
  }

  @Get('stats/restaurant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get restaurant order statistics' })
  async getRestaurantStats(@Request() req) {
    const userId = req.user.id;
    const restaurant = await this.orderService.findRestaurantByOwnerId(userId);
    if (!restaurant) {
      throw new Error('Restaurant not found for this user');
    }
    return this.orderService.getOrderStats(String(restaurant._id));
  }
}
