import { Controller, Get, Post, Delete, Query, Param, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Favorite, FavoriteDocument, FavoriteType } from '../schemas/favorite.schema';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('favorites')
@Controller('favorites')
export class FavoriteController {
  constructor(
    @InjectModel(Favorite.name) private readonly favoriteModel: Model<FavoriteDocument>,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'type', required: false, enum: FavoriteType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getMyFavorites(
    @Request() req: any,
    @Query('type') type?: FavoriteType,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    const userId = req.user.id;
    const limitNum = limit ? Number(limit) : 20;
    const skipNum = skip ? Number(skip) : 0;

    const filter: any = { userId, isActive: true };
    if (type) filter.type = type;

    const [favorites, total] = await Promise.all([
      this.favoriteModel
        .find(filter)
        .populate('restaurantId', 'name imageUrl rating deliveryTime category')
        .populate('itemId', 'name imageUrl price rating')
        .populate('categoryId', 'name icon imageUrl')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum)
        .lean(),
      this.favoriteModel.countDocuments(filter),
    ]);

    return {
      favorites: favorites.map((fav: any) => {
        const result: any = {
          id: String(fav._id),
          type: fav.type,
          priority: fav.priority,
          note: fav.note,
          viewCount: fav.viewCount,
          lastViewedAt: fav.lastViewedAt,
          createdAt: fav.createdAt,
        };

        // Add type-specific data
        if (fav.type === FavoriteType.RESTAURANT && fav.restaurantId) {
          result.restaurant = {
            id: String(fav.restaurantId._id),
            name: fav.restaurantId.name,
            imageUrl: fav.restaurantId.imageUrl,
            rating: fav.restaurantId.rating,
            deliveryTime: fav.restaurantId.deliveryTime,
            category: fav.restaurantId.category,
          };
        } else if (fav.type === FavoriteType.ITEM && fav.itemId) {
          result.item = {
            id: String(fav.itemId._id),
            name: fav.itemId.name,
            imageUrl: fav.itemId.imageUrl,
            price: fav.itemId.price,
            rating: fav.itemId.rating,
          };
        } else if (fav.type === FavoriteType.CATEGORY && fav.categoryId) {
          result.category = {
            id: String(fav.categoryId._id),
            name: fav.categoryId.name,
            icon: fav.categoryId.icon,
            imageUrl: fav.categoryId.imageUrl,
          };
        }

        return result;
      }),
      pagination: {
        total,
        limit: limitNum,
        skip: skipNum,
        hasMore: total > skipNum + limitNum,
      },
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async addFavorite(@Request() req: any, @Body() body: any) {
    const userId = req.user.id;
    const { type, restaurantId, itemId, categoryId, note, priority } = body;

    // Check if already favorited
    const filter: any = { userId, type, isActive: true };
    if (type === FavoriteType.RESTAURANT) filter.restaurantId = restaurantId;
    if (type === FavoriteType.ITEM) filter.itemId = itemId;
    if (type === FavoriteType.CATEGORY) filter.categoryId = categoryId;

    const existingFavorite = await this.favoriteModel.findOne(filter);
    if (existingFavorite) {
      return { message: 'Already in favorites' };
    }

    const favorite = new this.favoriteModel({
      userId,
      type,
      restaurantId: type === FavoriteType.RESTAURANT ? restaurantId : undefined,
      itemId: type === FavoriteType.ITEM ? itemId : undefined,
      categoryId: type === FavoriteType.CATEGORY ? categoryId : undefined,
      note,
      priority: priority || 0,
    });

    await favorite.save();

    return {
      id: String(favorite._id),
      message: 'Added to favorites successfully',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  async removeFavorite(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;

    const favorite = await this.favoriteModel.findOneAndUpdate(
      { _id: id, userId },
      { isActive: false },
      { new: true }
    );

    if (!favorite) {
      return { message: 'Favorite not found' };
    }

    return { message: 'Removed from favorites successfully' };
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'type', required: false, enum: FavoriteType })
  @ApiQuery({ name: 'restaurantId', required: false, type: String })
  @ApiQuery({ name: 'itemId', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  async removeFavoriteByTarget(
    @Request() req: any,
    @Query('type') type?: FavoriteType,
    @Query('restaurantId') restaurantId?: string,
    @Query('itemId') itemId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const userId = req.user.id;

    const filter: any = { userId, isActive: true };
    if (type) filter.type = type;
    if (restaurantId) filter.restaurantId = restaurantId;
    if (itemId) filter.itemId = itemId;
    if (categoryId) filter.categoryId = categoryId;

    const result = await this.favoriteModel.updateMany(filter, { isActive: false });

    return {
      message: 'Removed from favorites successfully',
      modifiedCount: result.modifiedCount,
    };
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String })
  async trackView(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;

    const favorite = await this.favoriteModel.findOneAndUpdate(
      { _id: id, userId },
      {
        $inc: { viewCount: 1 },
        $set: { lastViewedAt: new Date() },
      },
      { new: true }
    );

    if (!favorite) {
      return { message: 'Favorite not found' };
    }

    return { viewCount: favorite.viewCount };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getFavoriteStats(@Request() req: any) {
    const userId = req.user.id;

    const stats = await this.favoriteModel.aggregate([
      { $match: { userId, isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
        }
      }
    ]);

    const result = {
      total: 0,
      byType: {} as any,
      totalViews: 0,
    };

    stats.forEach(stat => {
      result.byType[stat._id] = stat.count;
      result.total += stat.count;
      result.totalViews += stat.totalViews;
    });

    return result;
  }

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecommendations(@Request() req: any, @Query('limit') limit?: number) {
    const userId = req.user.id;
    const limitNum = limit ? Number(limit) : 10;

    // Get user's favorite categories
    const favoriteCategories = await this.favoriteModel
      .find({ userId, type: FavoriteType.CATEGORY, isActive: true })
      .populate('categoryId')
      .lean();

    const categoryIds = favoriteCategories.map(fav => fav.categoryId);

    // Get user's favorite restaurants
    const favoriteRestaurants = await this.favoriteModel
      .find({ userId, type: FavoriteType.RESTAURANT, isActive: true })
      .populate('restaurantId')
      .lean();

    const restaurantIds = favoriteRestaurants.map(fav => fav.restaurantId);

    // Simple recommendation logic based on favorites
    // In a real system, you'd use ML algorithms here
    const recommendations = {
      categories: categoryIds.slice(0, limitNum),
      restaurants: restaurantIds.slice(0, limitNum),
      message: 'Based on your favorite items',
    };

    return recommendations;
  }
}
