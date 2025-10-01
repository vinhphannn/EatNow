"use client";

import { useState, useEffect } from "react";
import { favoriteService, Favorite } from "@/services/favorite.service";
import { useAuth } from "@/contexts/AuthContext";

interface FavoriteButtonProps {
  type: 'restaurant' | 'item' | 'category';
  targetId: string;
  targetName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onToggle?: (isFavorited: boolean) => void;
}

export default function FavoriteButton({
  type,
  targetId,
  targetName,
  className = "",
  size = 'md',
  showText = false,
  onToggle,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const { isAuthenticated } = useAuth();

  // Load user's favorites
  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
    }
  }, [isAuthenticated]);

  // Check if item is favorited
  useEffect(() => {
    if (favorites.length > 0) {
      const isFav = favoriteService[`is${type.charAt(0).toUpperCase() + type.slice(1)}Favorited`](targetId, favorites);
      setIsFavorited(isFav);
    }
  }, [favorites, targetId, type]);

  const loadFavorites = async () => {
    try {
      const response = await favoriteService.getFavorites({ type });
      setFavorites(response.favorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const handleToggle = async () => {
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      alert('Vui lòng đăng nhập để thêm vào yêu thích');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isFavorited) {
        // Remove from favorites
        const favorite = favoriteService.getFavoriteByTarget(type, targetId, favorites);
        if (favorite) {
          await favoriteService.removeFavorite(favorite.id);
          setFavorites(prev => prev.filter(fav => fav.id !== favorite.id));
          setIsFavorited(false);
          onToggle?.(false);
        }
      } else {
        // Add to favorites
        const favoriteData = {
          type,
          [`${type}Id`]: targetId,
        };
        
        const result = await favoriteService.addFavorite(favoriteData);
        
        // Add to local state (simplified version for immediate UI update)
        const newFavorite: Favorite = {
          id: result.id,
          type,
          priority: 0,
          viewCount: 0,
          createdAt: new Date().toISOString(),
          [type]: {
            id: targetId,
            name: targetName,
          },
        } as Favorite;
        
        setFavorites(prev => [...prev, newFavorite]);
        setIsFavorited(true);
        onToggle?.(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        flex items-center justify-center rounded-full transition-all duration-200
        ${isFavorited 
          ? 'bg-red-500 text-white hover:bg-red-600' 
          : 'bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-300'
        }
        ${sizeClasses[size]}
        ${className}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        shadow-sm hover:shadow-md
      `}
      title={isFavorited ? `Bỏ yêu thích ${targetName}` : `Thêm ${targetName} vào yêu thích`}
    >
      {isLoading ? (
        <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSize[size]}`} />
      ) : (
        <svg
          className={iconSize[size]}
          fill={isFavorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
      
      {showText && (
        <span className="ml-2 text-sm font-medium">
          {isFavorited ? 'Đã yêu thích' : 'Yêu thích'}
        </span>
      )}
    </button>
  );
}
