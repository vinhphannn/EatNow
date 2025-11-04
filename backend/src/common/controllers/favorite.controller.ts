import { Controller, Get, Post, Delete, Param, UseGuards, Req, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { FavoriteService } from '../services/favorite.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  private readonly logger = new Logger(FavoriteController.name);

  constructor(private readonly favoriteService: FavoriteService) {}

  @Post(':restaurantId')
  async addFavorite(@Req() req: any, @Param('restaurantId') restaurantId: string) {
    try {
      const userId = req.user.id;
      return await this.favoriteService.addFavorite(userId, restaurantId);
    } catch (error) {
      this.logger.error(`Failed to add favorite for user ${req.user.id}`, error.stack);
      throw error; // Let NestJS handle the error response
    }
  }

  @Delete(':restaurantId')
  async removeFavorite(@Req() req: any, @Param('restaurantId') restaurantId: string) {
    try {
      const userId = req.user.id;
      return await this.favoriteService.removeFavorite(userId, restaurantId);
    } catch (error) {
      this.logger.error(`Failed to remove favorite for user ${req.user.id}`, error.stack);
      throw error;
    }
  }

  @Get()
  async getFavorites(@Req() req: any) {
    try {
      const userId = req.user.id;
      return await this.favoriteService.getFavoriteRestaurants(userId);
    } catch (error) {
      this.logger.error(`Failed to get favorite restaurants for user ${req.user.id}`, error.stack);
      return []; // Return empty array on error
    }
  }

  @Get('ids')
  async getFavoriteIds(@Req() req: any) {
    try {
      const userId = req.user.id;
      return await this.favoriteService.getFavoriteIds(userId);
    } catch (error) {
      this.logger.error(`Failed to get favorite ids for user ${req.user.id}`, error.stack);
      return []; // Return empty array on error to prevent frontend JSON parse errors
    }
  }
}

