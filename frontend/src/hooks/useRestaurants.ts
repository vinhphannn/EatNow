import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api.client';

export interface Restaurant {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  address?: string;
  ward?: string;
  district?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  rating?: number;
  imageUrl?: string;
  deliveryFee?: number;
  minOrderAmount?: number;
  prepTime?: number;
  categories?: string[];
}

export interface RestaurantResponse {
  restaurants: Restaurant[];
  total: number;
  page: number;
  limit: number;
}

export const useRestaurants = (limit: number = 10, skip: number = 0) => {
  const [data, setData] = useState<RestaurantResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get(`/api/v1/restaurants/public?limit=${limit}&skip=${skip}`);
        console.log('Restaurants response:', response);
        // Backend returns array directly, not wrapped in data property
        const restaurants = Array.isArray(response) ? response : (response as any).data || [];
        setData({
          restaurants: restaurants,
          total: restaurants.length,
          page: 1,
          limit: limit
        } as RestaurantResponse);
      } catch (err: any) {
        console.error('Error fetching restaurants:', err);
        setError(err.message || 'Failed to fetch restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [limit, skip]);

  return { data, loading, error };
};

export const useRestaurantsByCategory = (category: string, limit: number = 10, skip: number = 0) => {
  const [data, setData] = useState<RestaurantResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get(`/api/v1/restaurants/public/by-category?category=${encodeURIComponent(category)}&limit=${limit}&skip=${skip}`);
        console.log('Restaurants by category response:', response);
        // Backend returns array directly, not wrapped in data property
        const restaurants = Array.isArray(response) ? response : (response as any).data || [];
        setData({
          restaurants: restaurants,
          total: restaurants.length,
          page: 1,
          limit: limit
        } as RestaurantResponse);
      } catch (err: any) {
        console.error('Error fetching restaurants by category:', err);
        setError(err.message || 'Failed to fetch restaurants');
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchRestaurants();
    } else {
      setData(null);
      setLoading(false);
    }
  }, [category, limit, skip]);

  return { data, loading, error };
};
