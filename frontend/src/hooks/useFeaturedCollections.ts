import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api.client';

export interface FeaturedCollection {
  _id: string;
  name: string;
  description?: string;
  subtitle?: string;
  layout: 'grid' | 'carousel' | 'list';
  maxItems: number;
  icon?: string;
  color?: string;
  isFeatured: boolean;
  restaurants: Array<{
    _id: string;
    name: string;
    imageUrl?: string;
    rating?: number;
    deliveryFee?: number;
    isOpen?: boolean;
    description?: string;
    address?: string;
    ward?: string;
    district?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  }>;
}

export const useFeaturedCollections = () => {
  const [data, setData] = useState<FeaturedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedCollections = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get('/api/v1/restaurants/featured-collections');
        console.log('🔍 Featured Collections API Response:', response);
        console.log('📊 Response type:', typeof response, 'Is array:', Array.isArray(response));
        
        const collections = Array.isArray(response) ? response : (response as any).data?.collections || [];
        console.log('✅ Processed featured collections:', collections);
        setData(collections);
      } catch (err: any) {
        console.error('Error fetching featured collections:', err);
        setError(err.message || 'Failed to fetch featured collections');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCollections();
  }, []);

  return { data, loading, error };
};



