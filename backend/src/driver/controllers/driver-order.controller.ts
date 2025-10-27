import { Controller, Post, Body, UseGuards, Request, Logger, Param, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OrderAssignmentService } from '../../order/services/order-assignment.service';
import { DriverOrderService } from '../services/driver-order.service';
import { OrderStatus } from '../../order/schemas/order.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver } from '../schemas/driver.schema';
import { DriverPresenceService } from '../services/driver-presence.service';

@Controller('driver/orders')
@UseGuards(JwtAuthGuard)
export class DriverOrderController {
  private readonly logger = new Logger(DriverOrderController.name);

  constructor(
    private readonly orderAssignmentService: OrderAssignmentService,
    private readonly driverOrderService: DriverOrderService,
    @InjectModel(Driver.name) private driverModel: Model<Driver>,
    private readonly driverPresenceService: DriverPresenceService,
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
      await this.driverOrderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED, driverId);

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

  /**
   * Driver cập nhật vị trí
   * POST /api/v1/driver/orders/location
   */
  @Post('location')
  async updateLocation(@Body() locationDto: { latitude: number; longitude: number }, @Request() req) {
    try {
      const driverId = req.user.id;
      const { latitude, longitude } = locationDto;

      // Validate input
      if (!latitude || !longitude || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return {
          success: false,
          message: 'Invalid location data. Latitude and longitude must be numbers.'
        };
      }

      // Validate coordinate ranges
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return {
          success: false,
          message: 'Invalid coordinate values. Latitude must be between -90 and 90, longitude between -180 and 180.'
        };
      }

      // Cập nhật vị trí driver trong Redis và DB
      await this.driverPresenceService.updateDriverLocation(driverId, { latitude, longitude });

      this.logger.log(`Driver ${driverId} location updated: ${latitude}, ${longitude}`);

      return {
        success: true,
        message: 'Location updated successfully',
        data: { latitude, longitude }
      };

    } catch (error) {
      this.logger.error('Failed to update driver location:', error);
      return {
        success: false,
        message: 'Failed to update location'
      };
    }
  }

  /**
   * Driver check in/check out
   * POST /api/v1/driver/orders/checkin
   * POST /api/v1/driver/orders/checkout
   */
  @Post('checkin')
  async checkIn(@Request() req) {
    try {
      const driverId = req.user.id;

      // Tìm driver theo userId
      const driver = await this.driverModel.findOne({ userId: driverId });
      if (!driver) {
        return {
          success: false,
          message: 'Driver not found'
        };
      }

      // Kiểm tra trạng thái hiện tại
      this.logger.log(`Current driver status: ${driver.status}`);
      
      if (driver.status === 'checkin') {
        this.logger.log('Driver is already checked in, returning current status');
        return {
          success: true,
          message: 'Driver is already checked in',
          status: 'checkin'
        };
      }

      if (driver.status === 'ban') {
        return {
          success: false,
          message: 'Driver is banned and cannot check in'
        };
      }

      // Cập nhật trạng thái checkin
      await this.driverModel.findByIdAndUpdate(driver._id, {
        status: 'checkin',
        lastCheckinAt: new Date()
      });

      // Register driver trên Redis GEO nếu có location
      if (driver.location && driver.location.length === 2) {
        const [lng, lat] = driver.location;
        await this.driverPresenceService.registerDriver(
          driver._id.toString(),
          { latitude: lat, longitude: lng }
        );
        this.logger.log(`✅ Driver ${driverId} registered to Redis GEO at ${lat}, ${lng}`);
      } else {
        this.logger.warn(`⚠️ Driver ${driverId} checked in but has no location. Please update location first.`);
      }

      this.logger.log(`Driver ${driverId} checked in`);

      return {
        success: true,
        message: 'Checked in successfully',
        status: 'checkin'
      };

    } catch (error) {
      this.logger.error('Failed to check in driver:', error);
      return {
        success: false,
        message: 'Failed to check in'
      };
    }
  }

  @Post('checkout')
  async checkOut(@Request() req) {
    try {
      const driverId = req.user.id;

      // Tìm driver theo userId
      const driver = await this.driverModel.findOne({ userId: driverId });
      if (!driver) {
        return {
          success: false,
          message: 'Driver not found'
        };
      }

      // Kiểm tra trạng thái hiện tại
      this.logger.log(`Current driver status: ${driver.status}`);
      
      if (driver.status === 'checkout') {
        this.logger.log('Driver is already checked out, returning current status');
        return {
          success: true,
          message: 'Driver is already checked out',
          status: 'checkout'
        };
      }

      // Kiểm tra tài xế có đang giao hàng không
      if (driver.deliveryStatus === 'delivering' || driver.currentOrderId) {
        return {
          success: false,
          message: 'Cannot check out while delivering an order'
        };
      }

      // Cập nhật trạng thái checkout
      await this.driverModel.findByIdAndUpdate(driver._id, {
        status: 'checkout',
        lastCheckoutAt: new Date()
      });

      this.logger.log(`Driver ${driverId} checked out`);

      return {
        success: true,
        message: 'Checked out successfully',
        status: 'checkout'
      };

    } catch (error) {
      this.logger.error('Failed to check out driver:', error);
      return {
        success: false,
        message: 'Failed to check out'
      };
    }
  }

  /**
   * Lấy trạng thái hiện tại của driver
   * GET /api/v1/driver/orders/get-status
   */
  @Get('get-status')
  async getStatus(@Request() req) {
    try {
      const driverId = req.user.id;
      this.logger.log(`Getting status for driver userId: ${driverId}`);

      // Tìm driver theo userId
      const driver = await this.driverModel.findOne({ userId: driverId });
      this.logger.log(`Driver found: ${!!driver}, status: ${driver?.status}`);
      
      if (!driver) {
        this.logger.warn(`Driver not found for userId: ${driverId}, creating new driver profile`);
        
        // Tự động tạo driver profile nếu chưa có
        const newDriver = await this.driverModel.create({
          userId: driverId,
          status: 'checkout', // Mặc định checkout
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

        this.logger.log(`Created new driver profile: ${newDriver._id}`);
        
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

      const statusData = {
        status: driver.status,
        deliveryStatus: driver.deliveryStatus,
        currentOrderId: driver.currentOrderId ? String(driver.currentOrderId) : null,
        lastCheckinAt: driver.lastCheckinAt,
        lastCheckoutAt: driver.lastCheckoutAt
      };

      this.logger.log(`Returning status data:`, statusData);

      return {
        success: true,
        data: statusData
      };

    } catch (error) {
      this.logger.error('Failed to get driver status:', error);
      return {
        success: false,
        message: 'Failed to get status'
      };
    }
  }
}
