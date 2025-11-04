import { apiClient } from './api.client';

class FavoriteApiService {
  async getFavoriteIds(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/api/v1/favorites/ids');
      return response || [];
    } catch (error) {
      console.error('Failed to fetch favorite IDs:', error);
      return [];
    }
  }

  async addFavorite(restaurantId: string): Promise<any> {
    return apiClient.post(`/api/v1/favorites/${restaurantId}`, {});
  }

  async removeFavorite(restaurantId: string): Promise<any> {
    return apiClient.delete(`/api/v1/favorites/${restaurantId}`);
  }

  async getFavoriteRestaurants(): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>('/api/v1/favorites');
      return response || [];
    } catch (error) {
      console.error('Failed to fetch favorite restaurants:', error);
      return [];
    }
  }
}

export const favoriteService = new FavoriteApiService();
