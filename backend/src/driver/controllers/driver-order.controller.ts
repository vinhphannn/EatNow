import { Controller, Post, Body, UseGuards, Request, Logger, Param, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OrderAssignmentService } from '../../order/services/order-assignment.service';
import { DriverOrderService } from '../services/driver-order.service';
import { OrderStatus } from '../../order/schemas/order.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver } from '../schemas/driver.schema';

@Controller('driver/orders')
@UseGuards(JwtAuthGuard)
export class DriverOrderController {
  private readonly logger = new Logger(DriverOrderController.name);

  constructor(
    private readonly orderAssignmentService: OrderAssignmentService,
    private readonly driverOrderService: DriverOrderService,
    @InjectModel(Driver.name) private driverModel: Model<Driver>,
  ) {}

  @Get()
  async listMyOrders(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    try {
      const userId = req.user.id;
      
      // Find driver document by userId
      const driver = await this.driverModel.findOne({ userId }).lean();
      if (!driver) {
        return { orders: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      }
      
      return this.driverOrderService.listOrdersByDriver(String(driver._id), {
        status,
        page: parseInt(page as any, 10) || 1,
        limit: Math.min(parseInt(limit as any, 10) || 20, 100)
      });
    } catch (error) {
      this.logger.error('Failed to list driver orders:', error);
      return { success: false, message: 'Failed to load orders' };
    }
  }

  @Get(':orderId')
  async getOrder(
    @Request() req: any,
    @Param('orderId') orderId: string
  ) {
    try {
      const userId = req.user.id;
      
      // Find driver document by userId
      const driver = await this.driverModel.findOne({ userId }).lean();
      if (!driver) {
        return { success: false, message: 'Driver not found' };
      }
      
      const order = await this.driverOrderService.getOrderById(orderId);
      console.log('Order found:', !!order);
      console.log('Order driverId:', order?.driverId);
      console.log('Driver _id:', driver._id);
      console.log('Driver comparison:', order?.driverId?.toString(), '===', String(driver._id));
      
      if (!order || order.driverId?.toString() !== String(driver._id)) {
        return { success: false, message: 'Order not found or not assigned to you' };
      }
      return order;
    } catch (error) {
      this.logger.error('Failed to get order:', error);
      return { success: false, message: 'Failed to load order' };
    }
  }

  @Post(':orderId/accept')
  async acceptOrder(
    @Request() req: any,
    @Param('orderId') orderId: string
  ) {
    try {
      const driverId = req.user.id;
      
      // Verify driver is assigned to this order
      const order = await this.driverOrderService.getOrderById(orderId);
      if (!order || order.driverId?.toString() !== driverId) {
        return {
          success: false,
          message: 'Order not found or not assigned to you'
        };
      }

      // Update order status to confirmed
      await this.driverOrderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED, driverId);

      this.logger.log(`Driver ${driverId} accepted order ${orderId}`);

      return {
        success: true,
        message: 'Order accepted successfully'
      };
    } catch (error) {
      this.logger.error('Failed to accept order:', error);
      return {
        success: false,
        message: 'Failed to accept order'
      };
    }
  }

  @Post(':orderId/reject')
  async rejectOrder(
    @Request() req: any,
    @Param('orderId') orderId: string
  ) {
    try {
      const driverId = req.user.id;
      
      // Reject order assignment
      await this.orderAssignmentService.rejectOrderAssignment(driverId, orderId);

      this.logger.log(`Driver ${driverId} rejected order ${orderId}`);

      return {
        success: true,
        message: 'Order rejected successfully'
      };
    } catch (error) {
      this.logger.error('Failed to reject order:', error);
      return {
        success: false,
        message: 'Failed to reject order'
      };
    }
  }

  @Post(':orderId/arrived-restaurant')
  async arrivedAtRestaurant(
    @Request() req: any,
    @Param('orderId') orderId: string
  ) {
    try {
      const driverId = req.user.id;
      
      // Verify driver is assigned to this order
      const order = await this.driverOrderService.getOrderById(orderId);
      if (!order || order.driverId?.toString() !== driverId) {
        return {
          success: false,
          message: 'Order not found or not assigned to you'
        };
      }

      // Update order status
      await this.driverOrderService.updateOrderStatus(orderId, OrderStatus.PREPARING, driverId);

      this.logger.log(`Driver ${driverId} arrived at restaurant for order ${orderId}`);

      return {
        success: true,
        message: 'Status updated: Arrived at restaurant'
      };
    } catch (error) {
      this.logger.error('Failed to update order status:', error);
      return {
        success: false,
        message: 'Failed to update status'
      };
    }
  }

  @Post(':orderId/picked-up')
  async pickedUpOrder(
    @Request() req: any,
    @Param('orderId') orderId: string
  ) {
    try {
      const driverId = req.user.id;
      
      // Verify driver is assigned to this order
      const order = await this.driverOrderService.getOrderById(orderId);
      if (!order || order.driverId?.toString() !== driverId) {
        return {
          success: false,
          message: 'Order not found or not assigned to you'
        };
      }

      // Update order status
      await this.driverOrderService.updateOrderStatus(orderId, OrderStatus.READY, driverId);

      this.logger.log(`Driver ${driverId} picked up order ${orderId}`);

      return {
        success: true,
        message: 'Status updated: Order picked up'
      };
    } catch (error) {
      this.logger.error('Failed to update order status:', error);
      return {
        success: false,
        message: 'Failed to update status'
      };
    }
  }

  @Post(':orderId/arrived-customer')
  async arrivedAtCustomer(
    @Request() req: any,
    @Param('orderId') orderId: string
  ) {
    try {
      const driverId = req.user.id;
      
      // Verify driver is assigned to this order
      const order = await this.driverOrderService.getOrderById(orderId);
      if (!order || order.driverId?.toString() !== driverId) {
        return {
          success: false,
          message: 'Order not found or not assigned to you'
        };
      }

      // Update to READY->DELIVERED should happen via delivered endpoint; here we can leave as no-op or validate arrival
      // For clearer flow, do not mark DELIVERED here. Keep finalization in /delivered endpoint.

      this.logger.log(`Driver ${driverId} arrived at customer for order ${orderId}`);

      return {
        success: true,
        message: 'Arrived at customer location'
      };
    } catch (error) {
      this.logger.error('Failed to update order status:', error);
      return {
        success: false,
        message: 'Failed to update status'
      };
    }
  }

  @Post(':orderId/delivered')
  async deliveredOrder(
    @Request() req: any,
    @Param('orderId') orderId: string
  ) {
    try {
      const driverId = req.user.id;
      
      // Complete order delivery
      await this.orderAssignmentService.completeOrderDelivery(driverId, orderId);

      this.logger.log(`Driver ${driverId} completed delivery for order ${orderId}`);

      return {
        success: true,
        message: 'Order delivered successfully'
      };
    } catch (error) {
      this.logger.error('Failed to complete order delivery:', error);
      return {
        success: false,
        message: 'Failed to complete delivery'
      };
    }
  }

  @Post(':orderId/status')
  async updateOrderStatus(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body() body: { status: OrderStatus }
  ) {
    try {
      const driverId = req.user.id;
      const order = await this.driverOrderService.getOrderById(orderId);
      if (!order || order.driverId?.toString() !== driverId) {
        return { success: false, message: 'Order not found or not assigned to you' };
      }

      const updated = await this.driverOrderService.updateOrderStatus(orderId, body.status, driverId);
      return { success: true, order: updated };
    } catch (error) {
      this.logger.error('Failed to update order status:', error);
      return { success: false, message: 'Failed to update status' };
    }
  }
}
