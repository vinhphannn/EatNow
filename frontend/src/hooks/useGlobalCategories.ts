import { useState, useEffect } from 'react';
import { globalCategoriesService, GlobalCategory } from '@/services/global-categories.service';

export const useGlobalCategories = (featured?: boolean, limit?: number, skip?: number) => {
  const [data, setData] = useState<GlobalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await globalCategoriesService.getPublicCategories(featured, limit, skip);
        setData(response);
      } catch (err: any) {
        console.error('Error fetching global categories:', err);
        setError(err.message || 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [featured, limit, skip]);

  return { data, loading, error };
};

export const usePopularCategories = (limit?: number) => {
  const [data, setData] = useState<GlobalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await globalCategoriesService.getPopularCategories(limit);
        setData(response);
      } catch (err: any) {
        console.error('Error fetching popular categories:', err);
        setError(err.message || 'Failed to fetch popular categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [limit]);

  return { data, loading, error };
};

export const useGlobalCategoryBySlug = (slug: string) => {
  const [data, setData] = useState<GlobalCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) {
        setData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await globalCategoriesService.getCategoryBySlug(slug);
        setData(response);
      } catch (err: any) {
        console.error('Error fetching category by slug:', err);
        setError(err.message || 'Failed to fetch category');
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [slug]);

  return { data, loading, error };
};
