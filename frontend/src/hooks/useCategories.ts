import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api.client';

export interface Category {
  _id: string;
  name: string;
  icon?: string;
  position: number;
  restaurantId?: string;
  isActive?: boolean;
}

export interface CategoryResponse {
  categories: Category[];
  total: number;
}

export const usePublicCategories = () => {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get('/api/v1/categories/public');
        console.log('🔍 Categories API Response:', response);
        console.log('📊 Response type:', typeof response, 'Is array:', Array.isArray(response));
        // Backend returns array directly, not wrapped in data property
        const categories = Array.isArray(response) ? response : (response as any).data?.categories || [];
        console.log('✅ Processed categories:', categories);
        setData(categories);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError(err.message || 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { data, loading, error };
};

export const useCategoriesByRestaurant = (restaurantId: string) => {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get(`/api/v1/restaurants/${restaurantId}/categories`);
        console.log('Categories by restaurant response:', response);
        // Backend returns array directly, not wrapped in data property
        const categories = Array.isArray(response) ? response : (response as any).data?.categories || [];
        setData(categories);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError(err.message || 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchCategories();
    } else {
      setData([]);
      setLoading(false);
    }
  }, [restaurantId]);

  return { data, loading, error };
};