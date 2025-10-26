/**
 * Unified delivery calculation utilities
 * Centralized logic for distance, fees, and time estimation
 */

export interface DeliveryCalculation {
  distance: number; // km
  deliveryFee: number; // VND
  estimatedTime: number; // minutes
}

export interface Location {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point  
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Calculate delivery fee based on distance
 * @param distanceKm Distance in kilometers
 * @returns Delivery fee in VND
 */
export const calculateDeliveryFee = (distanceKm: number): number => {
  const baseFee = 15000; // Base fee for first 4km
  const perKmFee = 5000; // Fee per km after 4km
  
  if (distanceKm <= 4) {
    return baseFee;
  }
  
  const extraKm = Math.ceil(distanceKm - 4);
  return baseFee + (extraKm * perKmFee);
};

/**
 * Estimate delivery time based on distance
 * @param distanceKm Distance in kilometers
 * @returns Estimated time in minutes
 */
export const estimateDeliveryTime = (distanceKm: number): number => {
  const averageSpeedKmh = 30; // Average speed in city
  const preparationTime = 10; // Preparation time in minutes
  
  const travelTime = Math.round((distanceKm / averageSpeedKmh) * 60);
  return travelTime + preparationTime;
};

/**
 * Calculate complete delivery information
 * @param from Starting location
 * @param to Destination location
 * @returns Complete delivery calculation
 */
export const calculateDelivery = (from: Location, to: Location): DeliveryCalculation => {
  const distance = calculateDistanceKm(from.lat, from.lng, to.lat, to.lng);
  const deliveryFee = calculateDeliveryFee(distance);
  const estimatedTime = estimateDeliveryTime(distance);
  
  return {
    distance,
    deliveryFee,
    estimatedTime
  };
};

/**
 * Check if delivery is within range
 * @param distanceKm Distance in kilometers
 * @param maxDistanceKm Maximum delivery range (default: 10km)
 * @returns Whether delivery is possible
 */
export const isWithinDeliveryRange = (distanceKm: number, maxDistanceKm: number = 10): boolean => {
  return distanceKm <= maxDistanceKm;
};

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

/**
 * Format delivery fee for display
 * @param fee Delivery fee in VND
 * @returns Formatted fee string
 */
export const formatDeliveryFee = (fee: number): string => {
  return `${fee.toLocaleString('vi-VN')}đ`;
};

/**
 * Format delivery time for display
 * @param timeMinutes Time in minutes
 * @returns Formatted time string
 */
export const formatDeliveryTime = (timeMinutes: number): string => {
  if (timeMinutes < 60) {
    return `${timeMinutes} phút`;
  }
  
  const hours = Math.floor(timeMinutes / 60);
  const minutes = timeMinutes % 60;
  
  if (minutes === 0) {
    return `${hours} giờ`;
  }
  
  return `${hours} giờ ${minutes} phút`;
};
