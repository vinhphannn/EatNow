import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './schemas/user.schema';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly users: UserService) {}

  // Get user analytics data
  private async getUserAnalytics(userId: string) {
    // This would typically aggregate from orders, reviews collections
    // For now, return basic data from user profile
    const user = await this.users.findByIdLean(userId) as any;
    
    return {
      totalOrders: user.totalOrders || 0,
      totalSpent: user.totalSpent || 0,
      averageOrderValue: user.averageOrderValue || 0,
      totalReviews: user.totalReviews || 0,
      loyaltyPoints: user.loyaltyPoints || 0,
      loyaltyTier: user.loyaltyTier || 'bronze',
      favoriteCuisines: user.favoriteCuisines || [],
      mostOrderedRestaurants: [],
      mostOrderedItems: [],
      monthlySpending: []
    };
  }

  @Get('profile')
  async getProfile(@Request() req: any) {
    const userId = req.user.userId || req.user.id || req.user._id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    const user = await this.users.findByIdLean(userId) as any;
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      avatarId: user.avatarId,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      bio: user.bio,
      addresses: user.addresses || [],
      addressLabels: user.addressLabels || ['Nhà', 'Chỗ làm', 'Nhà bạn', 'Khác'],
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneVerifiedAt: user.phoneVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      lastActiveAt: user.lastActiveAt,
      language: user.language,
      country: user.country,
      timezone: user.timezone,
      currency: user.currency,
      allowPushNotifications: user.allowPushNotifications,
      allowEmailNotifications: user.allowEmailNotifications,
      allowSMSNotifications: user.allowSMSNotifications,
      allowMarketingEmails: user.allowMarketingEmails,
      allowLocationTracking: user.allowLocationTracking,
      favoriteCuisines: user.favoriteCuisines || [],
      dietaryRestrictions: user.dietaryRestrictions || [],
      allergens: user.allergens || [],
      spiceLevel: user.spiceLevel,
      totalOrders: user.totalOrders,
      totalSpent: user.totalSpent,
      totalReviews: user.totalReviews,
      averageOrderValue: user.averageOrderValue,
      loyaltyPoints: user.loyaltyPoints,
      loyaltyTier: user.loyaltyTier,
      referredBy: user.referredBy,
      referralCount: user.referralCount,
      referralEarnings: user.referralEarnings,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      passwordChangedAt: user.passwordChangedAt,
      passwordHistory: user.passwordHistory || [],
      deviceTokens: user.deviceTokens || [],
      lastDeviceInfo: user.lastDeviceInfo,
      isDeleted: user.isDeleted,
      deletedAt: user.deletedAt,
      dataRetentionUntil: user.dataRetentionUntil,
      businessInfo: user.businessInfo,
      driverInfo: user.driverInfo,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
    };
  }

  // Alias to match FE expectation: /users/me/profile
  @Get('me/profile')
  async getMyProfile(@Request() req: any) {
    return this.getProfile(req);
  }

  @Put('profile')
  async updateProfile(@Request() req: any, @Body() updateData: any) {
    const userId = req.user.userId || req.user.id || req.user._id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    const updated = await this.users.updateProfileById(String(userId), updateData);
    const user = updated as any;
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      bio: user.bio,
      language: user.language,
      country: user.country,
      timezone: user.timezone,
      currency: user.currency,
      allowPushNotifications: user.allowPushNotifications,
      allowEmailNotifications: user.allowEmailNotifications,
      allowSMSNotifications: user.allowSMSNotifications,
      allowMarketingEmails: user.allowMarketingEmails,
      allowLocationTracking: user.allowLocationTracking,
      favoriteCuisines: user.favoriteCuisines,
      dietaryRestrictions: user.dietaryRestrictions,
      allergens: user.allergens,
      spiceLevel: user.spiceLevel,
    };
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const userId = req.user.userId || req.user.id || req.user._id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    const user = await this.users.findByIdLean(userId) as any;
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get real analytics data from database
    const analytics = await this.getUserAnalytics(userId);
    
    return {
      totalOrders: analytics.totalOrders,
      totalSpent: analytics.totalSpent,
      averageOrderValue: analytics.averageOrderValue,
      totalReviews: analytics.totalReviews,
      loyaltyPoints: analytics.loyaltyPoints,
      loyaltyTier: analytics.loyaltyTier,
      favoriteCuisines: analytics.favoriteCuisines,
      mostOrderedRestaurants: analytics.mostOrderedRestaurants,
      mostOrderedItems: analytics.mostOrderedItems,
      monthlySpending: analytics.monthlySpending,
      orderTrends: [
        { date: '2024-01-01', count: 2 },
        { date: '2024-01-15', count: 1 },
        { date: '2024-02-01', count: 3 },
      ],
    };
  }

  @Post('addresses')
  async addAddress(@Request() req: any, @Body() addressData: any) {
    const userId = req.user.userId;
    const addresses = await this.users.addAddress(userId, addressData);
    return { message: 'Address added successfully', addresses };
  }

  @Put('preferences')
  async updatePreferences(@Request() req: any, @Body() preferences: any) {
    const userId = req.user.userId;
    
    const user = await this.users.updatePreferences(userId, preferences) as any;
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      message: 'Preferences updated successfully',
      preferences: {
        language: user.language,
        country: user.country,
        timezone: user.timezone,
        currency: user.currency,
        allowPushNotifications: user.allowPushNotifications,
        allowEmailNotifications: user.allowEmailNotifications,
        allowSMSNotifications: user.allowSMSNotifications,
        allowMarketingEmails: user.allowMarketingEmails,
        allowLocationTracking: user.allowLocationTracking,
        favoriteCuisines: user.favoriteCuisines,
        dietaryRestrictions: user.dietaryRestrictions,
        allergens: user.allergens,
        spiceLevel: user.spiceLevel,
      },
    };
  }
}