import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { apiClient } from '../services/api.client';

// Generic hook cho API calls với loading states
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options.immediate !== false);
  const [error, setError] = useState<any>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err);
      options.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    if (options.immediate !== false) {
      execute();
    }
  }, [execute, ...dependencies]);

  return { data, loading, error, execute, refetch: execute };
}

// Specific hooks for common operations
export function useRestaurants() {
  return useApi(() => apiService.getRestaurants(), [], {
    onError: (error) => console.error('Failed to fetch restaurants:', error)
  });
}

export function useRestaurant(id: string) {
  return useApi(() => apiService.getRestaurant(id), [id], {
    onError: (error) => console.error('Failed to fetch restaurant:', error)
  });
}

export function useRestaurantItems(restaurantId: string) {
  return useApi(() => apiService.getRestaurantItems(restaurantId), [restaurantId], {
    onError: (error) => console.error('Failed to fetch restaurant items:', error)
  });
}

export function useAllItems() {
  return useApi(() => apiService.getAllItems(), [], {
    onError: (error) => console.error('Failed to fetch all items:', error)
  });
}

export function useCart(token: string | null) {
  return useApi(() => {
    if (!token) throw new Error('No token provided');
    return apiClient.get('/api/v1/cart');
  }, [token], {
    immediate: !!token,
    onError: (error) => console.error('Failed to fetch cart:', error)
  });
}

export function useOrder(id: string, token: string | null) {
  return useApi(() => {
    if (!token) throw new Error('No token provided');
    if (!id || id.trim() === '') throw new Error('No order ID provided');
    return apiService.getOrder(id, token);
  }, [id, token], {
    immediate: !!token && !!id && id.trim() !== '',
    onError: (error) => console.error('Failed to fetch order:', error)
  });
}

export function useOrders(token: string | null) {
  return useApi(() => {
    if (!token) throw new Error('No token provided');
    return apiService.getOrders(token);
  }, [token], {
    immediate: !!token,
    onError: (error) => console.error('Failed to fetch orders:', error)
  });
}

export function useSearchItems(query: string) {
  return useApi(() => {
    if (!query.trim()) return Promise.resolve([]);
    return apiService.searchItems(query);
  }, [query], {
    immediate: false,
    onError: (error) => console.error('Search failed:', error)
  });
}
