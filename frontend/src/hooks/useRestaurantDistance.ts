import { useMemo } from 'react';
import { useDeliveryAddress } from '@/contexts/DeliveryAddressContext';
import { haversineKm } from '@/utils/geo';

/**
 * Hook tính khoảng cách từ user đến restaurant
 * Sử dụng userLocation từ DeliveryAddressContext để tránh gọi API nhiều lần
 * 
 * @param restaurant - Restaurant object có latitude và longitude
 * @returns Khoảng cách dạng string (ví dụ: "2.5 km") hoặc null nếu không có đủ thông tin
 */
export function useRestaurantDistance(restaurant: {
  latitude?: number;
  longitude?: number;
} | null | undefined): string | null {
  const { userLocation } = useDeliveryAddress();

  return useMemo(() => {
    if (!userLocation || !restaurant) return null;
    
    const { latitude, longitude } = restaurant;
    if (latitude == null || longitude == null) return null;

    const km = haversineKm(
      userLocation.latitude,
      userLocation.longitude,
      latitude,
      longitude
    );

    if (!isFinite(km)) return null;
    return `${km.toFixed(1)} km`;
  }, [userLocation, restaurant?.latitude, restaurant?.longitude]);
}

