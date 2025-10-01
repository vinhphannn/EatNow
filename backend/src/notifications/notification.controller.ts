import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('unreadOnly') unreadOnly?: boolean
  ) {
    const userId = req.user.id;
    return await this.notificationService.getNotifications(userId, {
      type,
      priority,
      status,
      page: page || 1,
      limit: limit || 20,
      unreadOnly: unreadOnly === true
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.id;
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const userId = req.user.id;
    return await this.notificationService.getStats(userId);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') notificationId: string, @Request() req: any) {
    const userId = req.user.id;
    return await this.notificationService.markAsRead(userId, notificationId);
  }

  @Post('mark-all-read')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.id;
    return await this.notificationService.markAllAsRead(userId);
  }

  @Get('preferences')
  async getPreferences(@Request() req: any) {
    const userId = req.user.id;
    return await this.notificationService.getPreferences(userId);
  }

  @Put('preferences')
  async updatePreferences(@Request() req: any, @Body() preferences: any) {
    const userId = req.user.id;
    return await this.notificationService.updatePreferences(userId, preferences);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') notificationId: string, @Request() req: any) {
    const userId = req.user.id;
    return await this.notificationService.deleteNotification(userId, notificationId);
  }
}
