import { Controller, Get, Patch, Param, Query, Req, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { NotificationService } from '../notification.service';
import { Customer, CustomerDocument } from '../../customer/schemas/customer.schema';
import { NotificationActor } from '../schemas/notification.schema';

@ApiTags('customer-notifications')
@Controller('notifications/customer')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomerNotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    @InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>,
  ) {}

  /**
   * Lấy danh sách notifications của customer
   */
  @Get()
  @Roles('customer')
  @ApiOperation({ summary: 'Get customer notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of notifications to return' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of notifications to skip' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, description: 'Only return unread notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getCustomerNotifications(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    try {
      const userId = req.user.id;
      
      // Get customer by user ID
      const customer = await this.customerModel.findOne({ userId }).lean();
      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      const customerId = (customer as any)._id.toString();
      
      const result = await this.notificationService.getNotificationsByActor(
        NotificationActor.CUSTOMER,
        customerId,
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
      console.error('Error getting customer notifications:', error);
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
  @Roles('customer')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(@Param('id') notificationId: string, @Req() req: any) {
    try {
      const userId = req.user.id;
      
      // Get customer by user ID
      const customer = await this.customerModel.findOne({ userId }).lean();
      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      const customerId = (customer as any)._id.toString();
      
      const success = await this.notificationService.markAsRead(
        notificationId, 
        NotificationActor.CUSTOMER, 
        customerId
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
  @Roles('customer')
  @ApiOperation({ summary: 'Mark all customer notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req: any) {
    try {
      const userId = req.user.id;
      
      // Get customer by user ID
      const customer = await this.customerModel.findOne({ userId }).lean();
      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      const customerId = (customer as any)._id.toString();
      
      const markedCount = await this.notificationService.markAllAsRead(
        NotificationActor.CUSTOMER, 
        customerId
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
  @Roles('customer')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Req() req: any) {
    try {
      const userId = req.user.id;
      
      // Get customer by user ID
      const customer = await this.customerModel.findOne({ userId }).lean();
      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }

      const customerId = (customer as any)._id.toString();
      
      const result = await this.notificationService.getNotificationsByActor(
        NotificationActor.CUSTOMER,
        customerId,
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
