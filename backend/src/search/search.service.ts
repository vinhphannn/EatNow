import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { Item, ItemDocument } from '../restaurant/schemas/item.schema';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Item.name) private itemModel: Model<ItemDocument>,
  ) {}

  async searchRestaurants(query: string, limit: number = 10, offset: number = 0): Promise<any> {
    if (!query || query.trim().length === 0) {
      return { restaurants: [], total: 0 };
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    
    const restaurants = await this.restaurantModel
      .find({
        $and: [
          { status: 'active' },
          {
            $or: [
              { name: searchRegex },
              { description: searchRegex },
              { address: searchRegex },
              { tags: { $in: [searchRegex] } }
            ]
          }
        ]
      })
      .select('name description imageUrl rating deliveryFee address tags')
      .sort({ rating: -1, name: 1 })
      .skip(offset)
      .limit(limit)
      .lean();

    // Calculate relevance score
    const restaurantsWithScore = restaurants.map(restaurant => ({
      ...restaurant,
      relevanceScore: this.calculateRelevanceScore(restaurant, query)
    }));

    // Sort by relevance score
    restaurantsWithScore.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const total = await this.restaurantModel.countDocuments({
      $and: [
        { status: 'active' },
        {
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { address: searchRegex },
            { tags: { $in: [searchRegex] } }
          ]
        }
      ]
    });

    return {
      restaurants: restaurantsWithScore,
      total,
      limit,
      offset
    };
  }

  async searchItems(query: string, limit: number = 20, offset: number = 0): Promise<any> {
    if (!query || query.trim().length === 0) {
      return { items: [], total: 0 };
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    
    const items = await this.itemModel
      .find({
        $and: [
          { isActive: true },
          {
            $or: [
              { name: searchRegex },
              { description: searchRegex },
              { nameSearch: searchRegex }
            ]
          }
        ]
      })
      .populate('restaurantId', 'name description imageUrl rating deliveryFee address')
      .select('name description price imageUrl restaurantId')
      .sort({ popularityScore: -1, name: 1 })
      .skip(offset)
      .limit(limit)
      .lean();

    // Calculate relevance score
    const itemsWithScore = items.map(item => ({
      ...item,
      relevanceScore: this.calculateItemRelevanceScore(item, query)
    }));

    // Sort by relevance score
    itemsWithScore.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const total = await this.itemModel.countDocuments({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { nameSearch: searchRegex }
          ]
        }
      ]
    });

    return {
      items: itemsWithScore,
      total,
      limit,
      offset
    };
  }

  async searchAll(query: string, limit: number = 20, offset: number = 0): Promise<any> {
    const [restaurantsResult, itemsResult] = await Promise.all([
      this.searchRestaurants(query, Math.ceil(limit / 2), 0),
      this.searchItems(query, Math.ceil(limit / 2), 0)
    ]);

    // Combine and sort all results
    const allResults = [
      ...restaurantsResult.restaurants.map(r => ({ type: 'restaurant', ...r })),
      ...itemsResult.items.map(i => ({ type: 'item', ...i }))
    ];

    allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      results: allResults.slice(offset, offset + limit),
      total: restaurantsResult.total + itemsResult.total,
      restaurants: restaurantsResult.restaurants,
      items: itemsResult.items,
      limit,
      offset
    };
  }

  private calculateRelevanceScore(restaurant: any, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Name match (highest priority)
    if (restaurant.name && restaurant.name.toLowerCase().includes(queryLower)) {
      score += 100;
      // Exact match gets bonus
      if (restaurant.name.toLowerCase() === queryLower) {
        score += 50;
      }
      // Starts with query gets bonus
      if (restaurant.name.toLowerCase().startsWith(queryLower)) {
        score += 25;
      }
    }

    // Description match
    if (restaurant.description && restaurant.description.toLowerCase().includes(queryLower)) {
      score += 30;
    }

    // Address match
    if (restaurant.address && restaurant.address.toLowerCase().includes(queryLower)) {
      score += 20;
    }

    // Tags match
    if (restaurant.tags && Array.isArray(restaurant.tags)) {
      const tagMatches = restaurant.tags.filter((tag: string) => 
        tag.toLowerCase().includes(queryLower)
      ).length;
      score += tagMatches * 15;
    }

    // Rating bonus
    if (restaurant.rating) {
      score += restaurant.rating * 2;
    }

    return score;
  }

  private calculateItemRelevanceScore(item: any, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Name match (highest priority)
    if (item.name && item.name.toLowerCase().includes(queryLower)) {
      score += 100;
      // Exact match gets bonus
      if (item.name.toLowerCase() === queryLower) {
        score += 50;
      }
      // Starts with query gets bonus
      if (item.name.toLowerCase().startsWith(queryLower)) {
        score += 25;
      }
    }

    // Description match
    if (item.description && item.description.toLowerCase().includes(queryLower)) {
      score += 30;
    }

    // Name search field match (optimized search field)
    if (item.nameSearch && item.nameSearch.toLowerCase().includes(queryLower)) {
      score += 25;
    }

    // Popularity bonus
    if (item.popularityScore) {
      score += item.popularityScore * 0.1;
    }

    return score;
  }
}