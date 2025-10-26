import { Controller, Get, Patch, Param, Query, Req, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { NotificationService } from '../notification.service';
import { Driver, DriverDocument } from '../../driver/schemas/driver.schema';
import { NotificationActor } from '../schemas/notification.schema';

@ApiTags('driver-notifications')
@Controller('notifications/driver')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DriverNotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
  ) {}

  /**
   * Lấy danh sách notifications của driver
   */
  @Get()
  @Roles('driver')
  @ApiOperation({ summary: 'Get driver notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of notifications to return' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of notifications to skip' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, description: 'Only return unread notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getDriverNotifications(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    try {
      const userId = req.user.id;
      
      // Get driver by user ID
      const driver = await this.driverModel.findOne({ userId }).lean();
      if (!driver) {
        throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
      }

      const driverId = (driver as any)._id.toString();
      
      const result = await this.notificationService.getNotificationsByActor(
        NotificationActor.DRIVER,
        driverId,
        {
          limit: limit ? Number(limit) : 20,
          skip: skip ? Number(skip) : 0,
          unreadOnly: unreadOnly === true,
        }
      );

      return {
        success: true,
        data: result.notifications,
        pagination: {
          total: result.total,
          unreadCount: result.unreadCount,
          limit: limit ? Number(limit) : 20,
          skip: skip ? Number(skip) : 0,
        }
      };
    } catch (error) {
      console.error('Error getting driver notifications:', error);
      throw new HttpException(
        error.message || 'Failed to get notifications',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Đánh dấu notification là đã đọc
   */
  @Patch(':id/read')
  @Roles('driver')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(@Param('id') notificationId: string, @Req() req: any) {
    try {
      const userId = req.user.id;
      
      // Get driver by user ID
      const driver = await this.driverModel.findOne({ userId }).lean();
      if (!driver) {
        throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
      }

      const driverId = (driver as any)._id.toString();
      
      const success = await this.notificationService.markAsRead(
        notificationId, 
        NotificationActor.DRIVER, 
        driverId
      );
      
      if (!success) {
        throw new HttpException('Notification not found or already read', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new HttpException(
        error.message || 'Failed to mark notification as read',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Đánh dấu tất cả notifications là đã đọc
   */
  @Patch('read-all')
  @Roles('driver')
  @ApiOperation({ summary: 'Mark all driver notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req: any) {
    try {
      const userId = req.user.id;
      
      // Get driver by user ID
      const driver = await this.driverModel.findOne({ userId }).lean();
      if (!driver) {
        throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
      }

      const driverId = (driver as any)._id.toString();
      
      const markedCount = await this.notificationService.markAllAsRead(
        NotificationActor.DRIVER, 
        driverId
      );

      return {
        success: true,
        message: `Marked ${markedCount} notifications as read`,
        markedCount
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new HttpException(
        error.message || 'Failed to mark all notifications as read',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Lấy số lượng notifications chưa đọc
   */
  @Get('unread-count')
  @Roles('driver')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Req() req: any) {
    try {
      const userId = req.user.id;
      
      // Get driver by user ID
      const driver = await this.driverModel.findOne({ userId }).lean();
      if (!driver) {
        throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
      }

      const driverId = (driver as any)._id.toString();
      
      const result = await this.notificationService.getNotificationsByActor(
        NotificationActor.DRIVER,
        driverId,
        { limit: 1, unreadOnly: true }
      );

      return {
        success: true,
        unreadCount: result.unreadCount
      };
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw new HttpException(
        error.message || 'Failed to get unread count',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
