import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';

@Controller('restaurants/mine/wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
  ) {}

  @Get('balance')
  async getBalance(@Req() req: any) {
    // Get restaurant ID from user's restaurantId or find by ownerUserId
    let restaurantId = req.user.restaurantId;
    
    if (!restaurantId) {
      // If restaurantId not in user, find restaurant by ownerUserId
      const restaurant = await this.restaurantModel.findOne({ ownerUserId: req.user.id });
      if (restaurant) {
        restaurantId = restaurant._id.toString();
      }
    }
    
    if (!restaurantId) {
      throw new Error('Restaurant not found for this user');
    }
    
    return await this.walletService.getWalletBalance(restaurantId);
  }

  @Get('transactions')
  async getTransactions(@Req() req: any, @Query('limit') limit?: string) {
    // Get restaurant ID from user's restaurantId or find by ownerUserId
    let restaurantId = req.user.restaurantId;
    
    if (!restaurantId) {
      // If restaurantId not in user, find restaurant by ownerUserId
      const restaurant = await this.restaurantModel.findOne({ ownerUserId: req.user.id });
      if (restaurant) {
        restaurantId = restaurant._id.toString();
      }
    }
    
    if (!restaurantId) {
      throw new Error('Restaurant not found for this user');
    }
    
    const limitNum = limit ? parseInt(limit) : 50;
    return await this.walletService.getWalletTransactions(restaurantId, limitNum);
  }

  @Post('deposit')
  async deposit(@Req() req: any, @Body() body: { amount: number; description?: string }) {
    // Get restaurant ID from user's restaurantId or find by ownerUserId
    let restaurantId = req.user.restaurantId;
    
    if (!restaurantId) {
      // If restaurantId not in user, find restaurant by ownerUserId
      const restaurant = await this.restaurantModel.findOne({ ownerUserId: req.user.id });
      if (restaurant) {
        restaurantId = restaurant._id.toString();
      }
    }
    
    if (!restaurantId) {
      throw new Error('Restaurant not found for this user');
    }
    
    return await this.walletService.deposit(restaurantId, body.amount, body.description);
  }

  @Post('withdraw')
  async withdraw(@Req() req: any, @Body() body: { amount: number; description?: string }) {
    // Get restaurant ID from user's restaurantId or find by ownerUserId
    let restaurantId = req.user.restaurantId;
    
    if (!restaurantId) {
      // If restaurantId not in user, find restaurant by ownerUserId
      const restaurant = await this.restaurantModel.findOne({ ownerUserId: req.user.id });
      if (restaurant) {
        restaurantId = restaurant._id.toString();
      }
    }
    
    if (!restaurantId) {
      throw new Error('Restaurant not found for this user');
    }
    
    return await this.walletService.withdraw(restaurantId, body.amount, body.description);
  }
}