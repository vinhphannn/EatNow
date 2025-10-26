import { useState, useCallback } from 'react';
import { calculateDistanceKm, calculateDeliveryFee, estimateDeliveryTime } from '@/utils/deliveryUtils';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface RouteResult {
  distance: number; // km
  duration: number; // minutes
  route?: any; // Leaflet polyline object
  success: boolean;
  error?: string;
}

interface DistanceCalculatorOptions {
  // Chỉ sử dụng API routing thực tế - không có fallback
}

export const useDistanceCalculator = () => {
  const [loading, setLoading] = useState(false);

  // Use unified distance calculation
  const calculateStraightLineDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    return calculateDistanceKm(lat1, lon1, lat2, lon2);
  }, []);

  // Reverse geocoding - lấy địa chỉ từ tọa độ
  const getAddressFromCoords = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name.split(',').slice(0, -3).join(',').trim();
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  // Forward geocoding - lấy tọa độ từ địa chỉ
  const getCoordsFromAddress = useCallback(async (address: string): Promise<Location | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=vn`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }, []);

  // Tính khoảng cách và đường đi chính - chỉ sử dụng API routing thực tế
  const calculateDistance = useCallback(async (
    startLocation: Location,
    endLocation: Location,
    options: DistanceCalculatorOptions = {}
  ): Promise<RouteResult> => {
    setLoading(true);

    try {
      // Sử dụng OSRM API để lấy route thực tế
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLocation.lng},${startLocation.lat};${endLocation.lng},${endLocation.lat}?overview=full&geometries=geojson`
      );
      
      if (!response.ok) {
        throw new Error(`Route API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        
        return {
          distance: routeData.distance / 1000, // Convert to km
          duration: routeData.duration / 60, // Convert to minutes
          route: routeData.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]), // Convert to [lat, lng]
          success: true
        };
      }

      return {
        distance: 0,
        duration: 0,
        success: false,
        error: 'No route found'
      };

    } catch (error) {
      console.error('Distance calculation error:', error);
      return {
        distance: 0,
        duration: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Use unified delivery fee calculation
  const calculateDeliveryFeeHook = useCallback((distance: number): number => {
    return calculateDeliveryFee(distance);
  }, []);

  // Use unified delivery time estimation
  const estimateDeliveryTimeHook = useCallback((distance: number): number => {
    return estimateDeliveryTime(distance);
  }, []);

  // Tính khoảng cách nhanh (chỉ đường thẳng, không API)
  const quickDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    return calculateStraightLineDistance(lat1, lng1, lat2, lng2);
  }, [calculateStraightLineDistance]);

  return {
    // Main functions
    calculateDistance,
    quickDistance,
    
    // Geocoding
    getAddressFromCoords,
    getCoordsFromAddress,
    
    // Utilities
    calculateDeliveryFee: calculateDeliveryFeeHook,
    estimateDeliveryTime: estimateDeliveryTimeHook,
    
    // State
    loading
  };
};
