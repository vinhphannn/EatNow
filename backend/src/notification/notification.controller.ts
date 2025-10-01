import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  async getNotifications(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    const userId = req.user.userId;
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { userId };

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (unreadOnly) {
      filter.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      this.notificationModel.countDocuments(filter),
    ]);

    return {
      notifications: notifications.map((notif: any) => ({
        id: String(notif._id),
        ...notif,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: skip + limitNum < total,
      },
    };
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.userId;
    const count = await this.notificationModel.countDocuments({
      userId,
      isRead: false,
    });

    return { count };
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const userId = req.user.userId;
    
    const [
      total,
      unread,
      byType,
      byPriority,
      byStatus,
    ] = await Promise.all([
      this.notificationModel.countDocuments({ userId }),
      this.notificationModel.countDocuments({ userId, isRead: false }),
      this.notificationModel.aggregate([
        { $match: { userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      this.notificationModel.aggregate([
        { $match: { userId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      this.notificationModel.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      total,
      unread,
      byType: byType.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  }

  @Put(':id/read')
  @ApiParam({ name: 'id', type: String })
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return { message: 'Notification not found' };
    }

    return { message: 'Notification marked as read' };
  }

  @Post('mark-all-read')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.userId;
    
    const result = await this.notificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return { 
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount 
    };
  }

  @Get('preferences')
  async getPreferences(@Request() req: any) {
    // Return user notification preferences
    // This should be integrated with User service
    return {
      allowPushNotifications: true,
      allowEmailNotifications: true,
      allowSMSNotifications: true,
      allowMarketingEmails: true,
      allowLocationTracking: true,
      language: 'vi',
      country: 'VN',
    };
  }

  @Put('preferences')
  async updatePreferences(@Request() req: any, @Body() preferences: any) {
    // Update user notification preferences
    // This should be integrated with User service
    return {
      message: 'Preferences updated successfully',
      preferences,
    };
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllNotifications(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 50;
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (userId) {
      filter.userId = userId;
    }

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      this.notificationModel.countDocuments(filter),
    ]);

    return {
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  @Post('admin/send')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async sendNotification(@Body() notificationData: any) {
    const notification = new this.notificationModel({
      ...notificationData,
      createdAt: new Date(),
    });
    
    await notification.save();

    return {
      message: 'Notification sent successfully',
      notification: {
        id: String(notification._id),
        ...notification.toObject(),
      },
    };
  }
}
