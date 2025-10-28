import { Controller, Get, Post, Body, UseGuards, Req, Query, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { resolveActorRefFromReq } from './actor.utils';

@Controller('restaurants/mine/wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
  ) {}

  private async resolveRestaurantIdByOwner(userId: string): Promise<string | null> {
    // Thử tìm theo ObjectId
    if (Types.ObjectId.isValid(userId)) {
      const r1 = await this.restaurantModel.findOne({ ownerUserId: new Types.ObjectId(userId) }).lean();
      if (r1?._id) return r1._id.toString();
    }
    // Thử theo string
    const r2 = await this.restaurantModel.findOne({ ownerUserId: userId }).lean();
    if (r2?._id) return r2._id.toString();
    return null;
  }

  @Get('balance')
  async getBalance(@Req() req: any) {
    try {
      // Resolve actor theo restaurant
      let actor = resolveActorRefFromReq(req, 'restaurant');
      if (!actor.actorId) {
        const rid = await this.resolveRestaurantIdByOwner(req.user?.id);
        if (rid) actor = { ...actor, actorId: rid };
      }

      if (!actor.actorId) {
        return { balance: 0, pendingBalance: 0, totalDeposits: 0, totalWithdrawals: 0, isActive: true };
      }

      await this.walletService.getWalletForActor('restaurant', actor.actorId);
      return await this.walletService.getBalanceForActor(actor);
    } catch (e) {
      // Không để 500 làm vỡ UI ví
      return { balance: 0, pendingBalance: 0, totalDeposits: 0, totalWithdrawals: 0, isActive: true };
    }
  }

  @Get('transactions')
  async getTransactions(@Req() req: any, @Query('limit') limit?: string) {
    try {
      let actor = resolveActorRefFromReq(req, 'restaurant');
      if (!actor.actorId) {
        const rid = await this.resolveRestaurantIdByOwner(req.user?.id);
        if (rid) actor = { ...actor, actorId: rid };
      }

      if (!actor.actorId) {
        return [];
      }

      await this.walletService.getWalletForActor('restaurant', actor.actorId);
      const limitNum = limit ? parseInt(limit) : 50;
      return await this.walletService.getTransactionsForActor(actor, limitNum);
    } catch (e) {
      return [];
    }
  }

  @Post('deposit')
  async deposit(@Req() req: any, @Body() body: { amount: number; description?: string }) {
    // Get restaurant ID from user's restaurantId or find by ownerUserId
    let restaurantId = req.user.restaurantId;
    if (!restaurantId) {
      restaurantId = await this.resolveRestaurantIdByOwner(req.user.id);
    }
    
    if (!restaurantId) {
      throw new NotFoundException('Restaurant not found for this user');
    }
    
    return await this.walletService.deposit(restaurantId, body.amount, body.description);
  }

  @Post('withdraw')
  async withdraw(@Req() req: any, @Body() body: { amount: number; description?: string }) {
    // Get restaurant ID from user's restaurantId or find by ownerUserId
    let restaurantId = req.user.restaurantId;
    if (!restaurantId) {
      restaurantId = await this.resolveRestaurantIdByOwner(req.user.id);
    }
    
    if (!restaurantId) {
      throw new NotFoundException('Restaurant not found for this user');
    }
    
    return await this.walletService.withdraw(restaurantId, body.amount, body.description);
  }
}