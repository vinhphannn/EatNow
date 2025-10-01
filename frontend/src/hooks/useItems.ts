import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api.client';

export interface Item {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  type: 'food' | 'drink';
  imageUrl?: string;
  isActive: boolean;
  position: number;
  categoryId?: string;
  restaurantId?: string;
  popularityScore?: number;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemResponse {
  items: Item[];
  total: number;
  page: number;
  limit: number;
}

export const useItems = (restaurantId: string, options: {
  type?: 'food' | 'drink';
  categoryId?: string;
  isActive?: boolean;
  sortBy?: 'position' | 'createdAt' | 'price';
  order?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
} = {}) => {
  const [data, setData] = useState<ItemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (options.type) params.append('type', options.type);
        if (options.categoryId) params.append('categoryId', options.categoryId);
        if (options.isActive !== undefined) params.append('isActive', options.isActive.toString());
        if (options.sortBy) params.append('sortBy', options.sortBy);
        if (options.order) params.append('order', options.order);
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.skip) params.append('skip', options.skip.toString());

        const response = await apiClient.get(`/api/v1/restaurants/${restaurantId}/items?${params.toString()}`);
        console.log('Items response:', response);
        // Backend returns array directly, not wrapped in data property
        const items = Array.isArray(response) ? response : (response as any).data?.items || [];
        setData({
          items: items,
          total: items.length,
          page: 1,
          limit: options.limit || 10
        } as ItemResponse);
      } catch (err: any) {
        console.error('Error fetching items:', err);
        setError(err.message || 'Failed to fetch items');
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchItems();
    } else {
      setData(null);
      setLoading(false);
    }
  }, [restaurantId, options.type, options.categoryId, options.isActive, options.sortBy, options.order, options.limit, options.skip]);

  return { data, loading, error };
};

export const useAllItems = (limit: number = 20, skip: number = 0) => {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Prefer global search endpoint to aggregate items across restaurants
        try {
          const searchResponse = await apiClient.get(`/api/v1/search/items`, { params: { size: Math.max(limit + skip, 20) } });
          const searchItems = Array.isArray(searchResponse) ? searchResponse : (searchResponse as any).data || [];
          const sliced = searchItems.slice(skip, skip + limit);
          setData(sliced);
          return;
        } catch (searchErr) {
          console.warn('Global search fallback due to error:', searchErr);
        }
        
        // Fallback: fetch from public restaurants then aggregate
        const restaurantsResponse = await apiClient.get('/api/v1/restaurants/public?limit=50&skip=0');
        const restaurants = Array.isArray(restaurantsResponse) ? restaurantsResponse : (restaurantsResponse as any).data?.restaurants || [];
        
        const allItems: Item[] = [];
        for (const restaurant of restaurants) {
          try {
            const restaurantId = restaurant._id || restaurant.id;
            const itemsResponse = await apiClient.get(`/api/v1/restaurants/${restaurantId}/items?limit=50&skip=0`);
            const items = Array.isArray(itemsResponse) ? itemsResponse : (itemsResponse as any).data?.items || [];
            allItems.push(...items);
          } catch (err) {
            console.warn(`Failed to fetch items from restaurant ${restaurant._id || restaurant.id}:`, err);
          }
        }
        
        const sortedItems = allItems
          .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
          .slice(skip, skip + limit);
        
        setData(sortedItems);
      } catch (err: any) {
        console.error('Error fetching all items:', err);
        setError(err.message || 'Failed to fetch items');
      } finally {
        setLoading(false);
      }
    };

    fetchAllItems();
  }, [limit, skip]);

  return { data, loading, error };
};
