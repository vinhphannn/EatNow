import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from '../schemas/favorite.schema';
import { Restaurant, RestaurantDocument } from '../../restaurant/schemas/restaurant.schema';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
  ) {}

  async addFavorite(userId: string, restaurantId: string): Promise<Favorite> {
    const existing = await this.favoriteModel.findOne({ userId, restaurantId });
    if (existing) {
      throw new ConflictException('Restaurant already favorited');
    }
    const favorite = new this.favoriteModel({ userId, restaurantId });
    return favorite.save();
  }

  async removeFavorite(userId: string, restaurantId: string): Promise<{ ok: boolean }> {
    const result = await this.favoriteModel.deleteOne({ userId, restaurantId });
    return { ok: result.deletedCount > 0 };
  }

  async getFavoriteIds(userId: string): Promise<string[]> {
    const favorites = await this.favoriteModel.find({ userId }).select('restaurantId').lean();
    return favorites.map(fav => fav.restaurantId.toString());
  }

  async getFavoriteRestaurants(userId: string): Promise<any[]> {
    const favoriteIds = await this.getFavoriteIds(userId);
    if (favoriteIds.length === 0) {
      return [];
    }

    const restaurants = await this.restaurantModel.find({
      _id: { $in: favoriteIds }
    }).lean();

    return restaurants.map(r => ({
        _id: r._id,
        name: r.name,
        address: r.address,
        imageUrl: r.imageUrl,
        rating: r.rating,
        cuisine: r.category, // Assuming category can be used as cuisine
    }));
  }
}

