import { Injectable } from '@nestjs/common';

@Injectable()
export class DistanceService {
  /**
   * Calculate distance between two points using Haversine formula
   * @param lat1 Latitude of first point
   * @param lon1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lon2 Longitude of second point
   * @returns Distance in meters
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  }

  /**
   * Calculate distance between two points and return in kilometers
   */
  calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return this.calculateDistance(lat1, lon1, lat2, lon2) / 1000;
  }

  /**
   * Check if driver is within delivery range (2km)
   */
  isWithinDeliveryRange(
    driverLat: number,
    driverLon: number,
    restaurantLat: number,
    restaurantLon: number,
    maxDistanceKm: number = 2
  ): boolean {
    const distanceKm = this.calculateDistanceKm(driverLat, driverLon, restaurantLat, restaurantLon);
    return distanceKm <= maxDistanceKm;
  }

  /**
   * Calculate estimated delivery time based on distance
   * @param distanceKm Distance in kilometers
   * @returns Estimated time in minutes
   */
  calculateEstimatedDeliveryTime(distanceKm: number): number {
    // Average speed: 25 km/h in city
    const averageSpeedKmh = 25;
    const timeHours = distanceKm / averageSpeedKmh;
    return Math.ceil(timeHours * 60); // Convert to minutes and round up
  }
}
