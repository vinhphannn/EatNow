'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { favoriteService } from '@/services/favorite.service';
import { useCustomerAuth } from './AuthContext';
import { useToast } from '@/components';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  isFavorite: (restaurantId: string) => boolean;
  toggleFavorite: (restaurantId: string) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useCustomerAuth();
  const { showToast } = useToast();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      if (user) {
        setLoading(true);
        try {
          const ids = await favoriteService.getFavoriteIds();
          setFavoriteIds(new Set(ids));
        } finally {
          setLoading(false);
        }
      } else {
        setFavoriteIds(new Set());
        setLoading(false);
      }
    }
    loadFavorites();
  }, [user]);

  const isFavorite = useCallback((restaurantId: string) => {
    return favoriteIds.has(restaurantId);
  }, [favoriteIds]);

  const toggleFavorite = useCallback(async (restaurantId: string) => {
    const isCurrentlyFavorite = favoriteIds.has(restaurantId);
    const newFavoriteIds = new Set(favoriteIds);

    // Optimistically update the UI
    if (isCurrentlyFavorite) {
      newFavoriteIds.delete(restaurantId);
    } else {
      newFavoriteIds.add(restaurantId);
    }
    setFavoriteIds(newFavoriteIds);

    try {
      if (isCurrentlyFavorite) {
        await favoriteService.removeFavorite(restaurantId);
        showToast('Đã xóa khỏi danh sách yêu thích', 'success');
      } else {
        await favoriteService.addFavorite(restaurantId);
        showToast('Đã thêm vào danh sách yêu thích', 'success');
      }
    } catch (error) {
      // Revert the UI change on error
      showToast('Đã có lỗi xảy ra, vui lòng thử lại.', 'error');
      setFavoriteIds(favoriteIds); // Revert to the original state
      console.error('Failed to toggle favorite:', error);
    }
  }, [favoriteIds, showToast]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

