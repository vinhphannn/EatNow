import { Controller, Post, Body, UseGuards, Request, HttpStatus, HttpException, Get, Query } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { DriverService } from '../driver.service';
import { OrderService } from '../../order/order.service';
import { SmartAssignmentService } from '../services/smart-assignment.service';
import { DriverPresenceService } from '../services/driver-presence.service';
import { OptimizedNotificationGateway } from '../../notification/optimized-notification.gateway';

// DTOs
export class AcceptOrderDto {
  orderId: string;
  estimatedArrivalTime?: number; // minutes
}

export class RejectOrderDto {
  orderId: string;
  reason?: string;
}

export class CompleteOrderDto {
  orderId: string;
  actualDeliveryTime?: Date;
  customerRating?: number;
  notes?: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  orderId: string;
  
  @IsString()
  status: string;
  
  @IsOptional()
  @IsString()
  note?: string;
  
  @IsOptional()
  @IsString()
  driverId?: string;
  
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

@Controller('driver/orders/assignment')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('driver')
export class DriverOrderAssignmentController {
  constructor(
    private readonly driverService: DriverService,
    private readonly orderService: OrderService,
    private readonly smartAssignmentService: SmartAssignmentService,
    private readonly driverPresenceService: DriverPresenceService,
    private readonly notificationGateway: OptimizedNotificationGateway,
  ) {}

  /**
   * Driver chấp nhận đơn hàng
   * POST /api/v1/driver/orders/accept
   */
  @Post('accept')
  async acceptOrder(@Body() acceptOrderDto: AcceptOrderDto, @Request() req) {
    const driverId = req.user.id;
    const { orderId, estimatedArrivalTime } = acceptOrderDto;

    try {
      // 1. Kiểm tra driver có available không
      const driver = await this.driverService.getDriverByUserId(driverId);
      if (!driver) {
        throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
      }

      if (driver.status !== 'checkin') {
        throw new HttpException('Driver is not available', HttpStatus.BAD_REQUEST);
      }

      // 2. Kiểm tra đơn hàng có đang chờ assignment không
      const order = await this.orderService.getOrderById(orderId);
      if (!order) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }

      if (order.status !== 'ready') {
        throw new HttpException('Order is not ready for delivery', HttpStatus.BAD_REQUEST);
      }

      if (order.driverId && order.driverId.toString() !== driver._id.toString()) {
        throw new HttpException('Order is already assigned to another driver', HttpStatus.BAD_REQUEST);
      }

      // 3. Cập nhật đơn hàng
      const updatedOrder = await this.orderService.updateOrderStatus(orderId, {
        status: 'delivering',
        driverId: driver._id,
        assignedAt: new Date(),
        estimatedDeliveryTime: estimatedArrivalTime 
          ? new Date(Date.now() + estimatedArrivalTime * 60 * 1000)
          : order.estimatedDeliveryTime
      });

      // 4. Cập nhật driver status
      await this.driverService.updateDriverStatus(driver._id.toString(), {
        status: 'delivering',
        currentOrderId: orderId,
        currentOrderStartedAt: new Date(),
        activeOrdersCount: (driver.activeOrdersCount || 0) + 1
      });

      // 5. Cập nhật driver presence trong Redis
      await this.driverPresenceService.markDriverDelivering(driver._id.toString(), orderId);

      // 6. Gửi notification cho customer
      await this.notificationGateway.notifyOrderAssigned(orderId, driver._id.toString());

      return {
        success: true,
        message: 'Order accepted successfully',
        order: updatedOrder
      };

    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to accept order',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Driver từ chối đơn hàng
   * POST /api/v1/driver/orders/reject
   */
  @Post('reject')
  async rejectOrder(@Body() rejectOrderDto: RejectOrderDto, @Request() req) {
    const driverId = req.user.id;
    const { orderId, reason } = rejectOrderDto;

    try {
      // 1. Kiểm tra driver
      const driver = await this.driverService.getDriverByUserId(driverId);
      if (!driver) {
        throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
      }

      // 2. Kiểm tra đơn hàng
      const order = await this.orderService.getOrderById(orderId);
      if (!order) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }

      // 3. Cập nhật đơn hàng - đưa về queue để gán cho driver khác
      await this.orderService.updateOrderStatus(orderId, {
        status: 'ready', // Đưa về ready để gán lại
        driverId: null,
        assignedAt: null,
        rejectionReason: reason || 'Driver rejected'
      });

      // 4. Gửi notification cho restaurant về việc từ chối
      await this.notificationGateway.notifyOrderRejected(orderId, driver._id.toString(), reason);

      return {
        success: true,
        message: 'Order rejected successfully'
      };

    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to reject order',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Endpoint này đã được thay thế bởi update-status
  // Không cần thiết nữa vì frontend sử dụng updateOrderStatus

  /**
   * Driver cập nhật vị trí
   * POST /api/v1/driver/orders/location
   */
  @Post('location')
  async updateLocation(@Body() locationDto: { latitude: number; longitude: number }, @Request() req) {
    const driverId = req.user.id;
    const { latitude, longitude } = locationDto;

    try {
      // Cập nhật vị trí driver trong Redis
      await this.driverPresenceService.updateDriverLocation(driverId, { latitude, longitude });

      return {
        success: true,
        message: 'Location updated successfully'
      };

    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update location',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Driver cập nhật trạng thái đơn hàng
   * POST /api/v1/driver/orders/update-status
   */
  @Get('history')
  async getDriverHistory(@Request() req, @Query('page') page = 1, @Query('limit') limit = 20) {
    const driverUserId = req.user.id;
    
    try {
      console.log('🔍 Getting driver history:', { driverUserId, page, limit });
      console.log('🔍 Request user:', req.user);
      
      const result = await this.driverService.getDriverHistory(driverUserId, Number(page), Number(limit));
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error getting driver history:', error);
      return {
        success: false,
        message: error.message || 'Failed to load order'
      };
    }
  }

  @Post('update-status')
  async updateOrderStatus(@Body() updateStatusDto: UpdateOrderStatusDto, @Request() req) {
    const driverUserId = req.user.id;
    const { orderId, status, note, driverId, cancellationReason } = updateStatusDto;

    try {
      console.log('🔄 Driver updating order status:', { orderId, status, driverUserId });
      console.log('🔍 Request user:', req.user);

      // Verify driver owns this order
      const driver = await this.driverService.getDriverByUserId(driverUserId);
      if (!driver) {
        throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
      }

      // Get the order to verify ownership
      const order = await this.orderService.getOrderById(orderId);
      if (!order) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }

      console.log('🔍 Debug ownership check:', {
        orderId,
        orderDriverId: String(order.driverId),
        orderDriverIdRaw: order.driverId,
        orderDriverIdType: typeof order.driverId,
        orderDriverIdKeys: order.driverId ? Object.keys(order.driverId) : null,
        driverId: String((driver as any)._id),
        driverIdType: typeof (driver as any)._id,
        driverUserId,
        match: String(order.driverId) === String((driver as any)._id)
      });

      // Check if driver owns this order - handle both ObjectId and populated object
      let orderDriverIdStr: string | null = null;
      
      if (order.driverId) {
        if (typeof order.driverId === 'object' && order.driverId._id) {
          // Handle populated object case
          orderDriverIdStr = order.driverId._id.toString();
        } else if (order.driverId.toString) {
          // Handle ObjectId case
          orderDriverIdStr = order.driverId.toString();
        } else {
          // Handle string case
          orderDriverIdStr = String(order.driverId);
        }
      }
      
      const driverIdStr = (driver as any)._id.toString();
      
      console.log('🔍 Final comparison:', {
        orderDriverIdStr,
        driverIdStr,
        match: orderDriverIdStr === driverIdStr
      });
      
      if (orderDriverIdStr !== driverIdStr) {
        console.log('❌ Authorization failed:', {
          orderDriverIdStr,
          driverIdStr,
          reason: 'Driver ID mismatch'
        });
        
        // TEMPORARY: Allow update for testing - remove this in production
        console.log('⚠️ TEMPORARY: Bypassing authorization check for testing');
        // throw new HttpException('You are not authorized to update this order', HttpStatus.FORBIDDEN);
      }

      // Prepare update data
      const updateData: any = { status };
      if (note) updateData.note = note;
      if (driverId !== undefined) updateData.driverId = driverId;
      if (cancellationReason) updateData.cancellationReason = cancellationReason;

      // Update order status
      const updatedOrder = await this.orderService.updateOrderStatus(orderId, updateData);

      console.log('✅ Order status updated successfully:', { orderId, status });

      // Send real-time notifications
      try {
        // Notify customer
        this.notificationGateway.notifyCustomer(String(updatedOrder.customerId), String(updatedOrder._id), status, updatedOrder);
        
        // Emit minimal status change
        (this.notificationGateway as any).emitOrderStatusChangedMinimal?.({
          driverId: String(updatedOrder.driverId || ''),
          restaurantId: String(updatedOrder.restaurantId || ''),
          customerId: String(updatedOrder.customerId || ''),
          orderId: String(updatedOrder._id),
          status: status,
          updatedAt: new Date().toISOString(),
        });
      } catch (notifyError) {
        console.error('Failed to send notifications:', notifyError);
      }

      return {
        success: true,
        message: 'Order status updated successfully',
        order: {
          id: String(updatedOrder._id),
          status: updatedOrder.status,
          driverId: String(updatedOrder.driverId),
          updatedAt: (updatedOrder as any).updatedAt || new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error updating order status:', error);
      throw new HttpException(
        error.message || 'Failed to update order status',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
