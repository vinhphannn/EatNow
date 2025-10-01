import { apiCall } from './api.service';

export interface Favorite {
  id: string;
  type: 'restaurant' | 'item' | 'category';
  priority: number;
  note?: string;
  viewCount: number;
  lastViewedAt?: string;
  createdAt: string;
  restaurantId?: string;
  itemId?: string;
  categoryId?: string;
  restaurant?: {
    id: string;
    name: string;
    imageUrl: string;
    rating: number;
    deliveryTime: string;
    category: string;
  };
  item?: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    rating: number;
  };
  category?: {
    id: string;
    name: string;
    icon?: string;
    imageUrl?: string;
  };
}

export interface FavoriteStats {
  total: number;
  byType: {
    restaurant?: number;
    item?: number;
    category?: number;
  };
  totalViews: number;
}

class FavoriteService {
  private API_ENDPOINTS = {
    FAVORITES: '/favorites',
    ADD: '/favorites',
    REMOVE: '/favorites',
    STATS: '/favorites/stats',
    RECOMMENDATIONS: '/favorites/recommendations',
  };

  async getFavorites(options?: {
    type?: 'restaurant' | 'item' | 'category';
    limit?: number;
    skip?: number;
  }): Promise<{ favorites: Favorite[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (options?.type) params.append('type', options.type);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.skip) params.append('skip', options.skip.toString());

      const endpoint = `${this.API_ENDPOINTS.FAVORITES}?${params.toString()}`;
      const data = await apiCall(endpoint, 'GET', null, true);
      return data;
    } catch (error) {
      console.warn('Could not fetch favorites:', error);
      return { favorites: [], pagination: { total: 0, limit: 0, skip: 0, hasMore: false } };
    }
  }

  async addFavorite(favoriteData: {
    type: 'restaurant' | 'item' | 'category';
    restaurantId?: string;
    itemId?: string;
    categoryId?: string;
    note?: string;
    priority?: number;
  }): Promise<any> {
    try {
      const data = await apiCall(this.API_ENDPOINTS.ADD, 'POST', favoriteData, true);
      return data;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  async removeFavorite(favoriteId: string): Promise<any> {
    try {
      const data = await apiCall(`${this.API_ENDPOINTS.REMOVE}/${favoriteId}`, 'DELETE', null, true);
      return data;
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  async removeFavoriteByTarget(options: {
    type: 'restaurant' | 'item';
    restaurantId?: string;
    itemId?: string;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (options.type) params.append('type', options.type);
      if (options.restaurantId) params.append('restaurantId', options.restaurantId);
      if (options.itemId) params.append('itemId', options.itemId);

      const endpoint = `${this.API_ENDPOINTS.REMOVE}?${params.toString()}`;
      const data = await apiCall(endpoint, 'DELETE', null, true);
      return data;
    } catch (error) {
      console.error('Error removing favorite by target:', error);
      throw error;
    }
  }

  async getStats(): Promise<FavoriteStats> {
    try {
      const data = await apiCall(this.API_ENDPOINTS.STATS, 'GET', null, true);
      return data as FavoriteStats;
    } catch (error) {
      console.warn('Could not fetch favorite stats:', error);
      return { total: 0, byType: {}, totalViews: 0 };
    }
  }

  async getRecommendations(limit?: number): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());

      const endpoint = `${this.API_ENDPOINTS.RECOMMENDATIONS}?${params.toString()}`;
      const data = await apiCall(endpoint, 'GET', null, true);
      return data;
    } catch (error) {
      console.warn('Could not fetch recommendations:', error);
      return { categories: [], restaurants: [], message: 'Không có gợi ý' };
    }
  }

  // Helper methods
  getFavoriteIcon(type: string): string {
    return type === 'restaurant' ? '🍽️' : '🍕';
  }

  getFavoriteColor(type: string): string {
    return type === 'restaurant' ? 'text-orange-600' : 'text-green-600';
  }

  getFavoriteBgColor(type: string): string {
    return type === 'restaurant' ? 'bg-orange-100' : 'bg-green-100';
  }

  formatFavoriteDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // Helper methods for local state management
  getFavoriteByTarget(type: 'restaurant' | 'item' | 'category', targetId: string, favorites: Favorite[]): Favorite | null {
    return favorites.find(fav => {
      if (type === 'restaurant') return fav.restaurantId === targetId;
      if (type === 'item') return fav.itemId === targetId;
      if (type === 'category') return fav.categoryId === targetId;
      return false;
    }) || null;
  }

  isRestaurantFavorited(restaurantId: string, favorites: Favorite[]): boolean {
    return favorites.some(fav => fav.type === 'restaurant' && fav.restaurantId === restaurantId);
  }

  isItemFavorited(itemId: string, favorites: Favorite[]): boolean {
    return favorites.some(fav => fav.type === 'item' && fav.itemId === itemId);
  }

  isCategoryFavorited(categoryId: string, favorites: Favorite[]): boolean {
    return favorites.some(fav => fav.type === 'category' && fav.categoryId === categoryId);
  }
}

export const favoriteService = new FavoriteService();