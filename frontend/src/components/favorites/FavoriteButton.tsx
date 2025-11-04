'use client';

import { useFavorites } from '@/contexts/FavoritesContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';

interface FavoriteButtonProps {
  restaurantId: string;
  className?: string;
}

export function FavoriteButton({ restaurantId, className }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const favorited = isFavorite(restaurantId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the button inside a Link
    e.stopPropagation();
    if (!loading) {
      toggleFavorite(restaurantId);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md transition-transform transform hover:scale-110 z-10 ${className}`}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <FontAwesomeIcon
        icon={favorited ? faHeartSolid : faHeartRegular}
        className={`transition-all duration-300 ${favorited ? 'text-red-500 scale-110' : 'text-gray-500'}`}
      />
    </button>
  );
}
