import { Injectable, Logger } from '@nestjs/common';

interface LocationData {
  driverId: string;
  orderId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  orderId?: string;
}

interface LocationCluster {
  centerLat: number;
  centerLng: number;
  radius: number;
  driverIds: string[];
  lastUpdate: Date;
}

@Injectable()
export class LocationManager {
  private readonly logger = new Logger(LocationManager.name);
  
  // In-memory location cache với TTL
  private driverLocations = new Map<string, DriverLocation>();
  private orderDriverLocations = new Map<string, DriverLocation[]>(); // orderId -> locations[]
  
  // Geospatial clustering để giảm updates
  private locationClusters = new Map<string, LocationCluster>();
  private readonly CLUSTER_RADIUS = 100; // meters
  private readonly CLUSTER_MAX_SIZE = 10;
  
  // Rate limiting và throttling
  private rateLimits = new Map<string, { count: number; windowStart: number }>();
  private readonly RATE_WINDOW = 10_000; // 10 seconds
  private readonly MAX_LOCATION_UPDATES_PER_WINDOW = 20;
  
  // Distance-based throttling
  private lastKnownLocations = new Map<string, DriverLocation>();
  private readonly MIN_DISTANCE_THRESHOLD = 50; // meters
  private readonly MIN_TIME_THRESHOLD = 2000; // 2 seconds
  
  // TTL settings
  private readonly LOCATION_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly ORDER_LOCATION_TTL = 30 * 60 * 1000; // 30 minutes
  
  // Metrics
  private metrics = {
    totalLocationUpdates: 0,
    throttledUpdates: 0,
    clusteredUpdates: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Update driver location
   */
  updateDriverLocation(locationData: LocationData): boolean {
    const { driverId, orderId, latitude, longitude, timestamp } = locationData;

    // Rate limiting
    if (!this.checkRateLimit(driverId)) {
      this.metrics.throttledUpdates++;
      return false;
    }

    // Distance-based throttling
    if (this.shouldSkipLocationUpdate(driverId, latitude, longitude)) {
      this.metrics.throttledUpdates++;
      return false;
    }

    // Create location object
    const location: DriverLocation = {
      driverId,
      latitude,
      longitude,
      timestamp: timestamp.getTime(),
      orderId,
    };

    // Update driver location
    this.driverLocations.set(driverId, location);
    this.lastKnownLocations.set(driverId, location);

    // Update order-specific location history
    if (orderId) {
      this.updateOrderLocationHistory(orderId, location);
    }

    // Update geospatial clusters
    this.updateLocationClusters(location);

    this.metrics.totalLocationUpdates++;
    
    this.logger.debug(`Updated location for driver ${driverId}: ${latitude}, ${longitude}`);
    
    return true;
  }

  /**
   * Get current driver location
   */
  getDriverLocation(driverId: string): DriverLocation | null {
    const location = this.driverLocations.get(driverId);
    if (!location) {
      this.metrics.cacheMisses++;
      return null;
    }

    // Check if location is stale
    if (this.isLocationStale(location)) {
      this.driverLocations.delete(driverId);
      this.metrics.cacheMisses++;
      return null;
    }

    this.metrics.cacheHits++;
    return location;
  }

  /**
   * Get location history for an order
   */
  getOrderLocationHistory(orderId: string, limit: number = 50): DriverLocation[] {
    const locations = this.orderDriverLocations.get(orderId) || [];
    
    // Filter stale locations
    const validLocations = locations.filter(location => !this.isLocationStale(location));
    
    // Update cache with filtered locations
    if (validLocations.length !== locations.length) {
      this.orderDriverLocations.set(orderId, validLocations);
    }
    
    return validLocations.slice(-limit);
  }

  /**
   * Get drivers near a location
   */
  getDriversNearLocation(latitude: number, longitude: number, radiusKm: number = 5): DriverLocation[] {
    const nearbyDrivers: DriverLocation[] = [];
    const radiusMeters = radiusKm * 1000;

    for (const location of this.driverLocations.values()) {
      if (this.isLocationStale(location)) continue;

      const distance = this.calculateDistance(
        latitude, longitude,
        location.latitude, location.longitude
      );

      if (distance <= radiusMeters) {
        nearbyDrivers.push(location);
      }
    }

    return nearbyDrivers;
  }

  /**
   * Get location clusters
   */
  getLocationClusters(): LocationCluster[] {
    return Array.from(this.locationClusters.values());
  }

  /**
   * Get metrics
   */
  getMetrics() {
    const cacheHitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0 
      ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
      : 0;

    return {
      ...this.metrics,
      activeDrivers: this.driverLocations.size,
      activeOrders: this.orderDriverLocations.size,
      clusters: this.locationClusters.size,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      throttlingRate: this.metrics.totalLocationUpdates > 0 
        ? this.metrics.throttledUpdates / this.metrics.totalLocationUpdates 
        : 0,
    };
  }

  /**
   * Check rate limit for driver
   */
  private checkRateLimit(driverId: string): boolean {
    const now = Date.now();
    const rateLimit = this.rateLimits.get(driverId) || { count: 0, windowStart: now };

    // Reset window if expired
    if (now - rateLimit.windowStart > this.RATE_WINDOW) {
      rateLimit.windowStart = now;
      rateLimit.count = 0;
    }

    // Check limit
    if (rateLimit.count >= this.MAX_LOCATION_UPDATES_PER_WINDOW) {
      return false;
    }

    // Increment counter
    rateLimit.count++;
    this.rateLimits.set(driverId, rateLimit);

    return true;
  }

  /**
   * Check if location update should be skipped
   */
  private shouldSkipLocationUpdate(driverId: string, latitude: number, longitude: number): boolean {
    const lastLocation = this.lastKnownLocations.get(driverId);
    if (!lastLocation) return false;

    const distance = this.calculateDistance(
      lastLocation.latitude, lastLocation.longitude,
      latitude, longitude
    );

    const timeDiff = Date.now() - lastLocation.timestamp;

    return distance < this.MIN_DISTANCE_THRESHOLD && timeDiff < this.MIN_TIME_THRESHOLD;
  }

  /**
   * Update order location history
   */
  private updateOrderLocationHistory(orderId: string, location: DriverLocation): void {
    if (!this.orderDriverLocations.has(orderId)) {
      this.orderDriverLocations.set(orderId, []);
    }

    const locations = this.orderDriverLocations.get(orderId)!;
    locations.push(location);

    // Keep only recent locations
    const maxLocations = 100;
    if (locations.length > maxLocations) {
      locations.splice(0, locations.length - maxLocations);
    }
  }

  /**
   * Update geospatial clusters
   */
  private updateLocationClusters(location: DriverLocation): void {
    const clusterKey = this.findOrCreateCluster(location);
    const cluster = this.locationClusters.get(clusterKey)!;

    // Update cluster center
    this.updateClusterCenter(cluster, location);

    // Check if cluster needs splitting
    if (cluster.driverIds.length > this.CLUSTER_MAX_SIZE) {
      this.splitCluster(clusterKey, cluster);
    }
  }

  /**
   * Find or create cluster for location
   */
  private findOrCreateCluster(location: DriverLocation): string {
    for (const [key, cluster] of this.locationClusters.entries()) {
      const distance = this.calculateDistance(
        location.latitude, location.longitude,
        cluster.centerLat, cluster.centerLng
      );

      if (distance <= this.CLUSTER_RADIUS) {
        cluster.driverIds.push(location.driverId);
        cluster.lastUpdate = new Date();
        return key;
      }
    }

    // Create new cluster
    const clusterKey = `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cluster: LocationCluster = {
      centerLat: location.latitude,
      centerLng: location.longitude,
      radius: this.CLUSTER_RADIUS,
      driverIds: [location.driverId],
      lastUpdate: new Date(),
    };

    this.locationClusters.set(clusterKey, cluster);
    this.metrics.clusteredUpdates++;

    return clusterKey;
  }

  /**
   * Update cluster center
   */
  private updateClusterCenter(cluster: LocationCluster, location: DriverLocation): void {
    const totalDrivers = cluster.driverIds.length;
    
    // Weighted average for center calculation
    cluster.centerLat = (cluster.centerLat * (totalDrivers - 1) + location.latitude) / totalDrivers;
    cluster.centerLng = (cluster.centerLng * (totalDrivers - 1) + location.longitude) / totalDrivers;
  }

  /**
   * Split cluster when it gets too large
   */
  private splitCluster(clusterKey: string, cluster: LocationCluster): void {
    // Simple splitting: create two sub-clusters
    const midPoint = Math.floor(cluster.driverIds.length / 2);
    const firstHalf = cluster.driverIds.slice(0, midPoint);
    const secondHalf = cluster.driverIds.slice(midPoint);

    // Update original cluster
    cluster.driverIds = firstHalf;
    this.updateClusterCenterFromDrivers(cluster);

    // Create new cluster for second half
    const newClusterKey = `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newCluster: LocationCluster = {
      centerLat: cluster.centerLat,
      centerLng: cluster.centerLng,
      radius: this.CLUSTER_RADIUS,
      driverIds: secondHalf,
      lastUpdate: new Date(),
    };

    this.locationClusters.set(newClusterKey, newCluster);
    this.updateClusterCenterFromDrivers(newCluster);
  }

  /**
   * Update cluster center from driver locations
   */
  private updateClusterCenterFromDrivers(cluster: LocationCluster): void {
    if (cluster.driverIds.length === 0) return;

    let totalLat = 0;
    let totalLng = 0;

    for (const driverId of cluster.driverIds) {
      const location = this.driverLocations.get(driverId);
      if (location && !this.isLocationStale(location)) {
        totalLat += location.latitude;
        totalLng += location.longitude;
      }
    }

    cluster.centerLat = totalLat / cluster.driverIds.length;
    cluster.centerLng = totalLng / cluster.driverIds.length;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if location is stale
   */
  private isLocationStale(location: DriverLocation): boolean {
    const now = Date.now();
    return now - location.timestamp > this.LOCATION_TTL;
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupStaleLocations();
      this.cleanupStaleClusters();
      this.cleanupStaleRateLimits();
    }, 60_000); // Every minute
  }

  /**
   * Cleanup stale locations
   */
  private cleanupStaleLocations(): void {
    const staleDrivers: string[] = [];
    const staleOrders: string[] = [];

    // Cleanup driver locations
    for (const [driverId, location] of this.driverLocations.entries()) {
      if (this.isLocationStale(location)) {
        staleDrivers.push(driverId);
      }
    }

    // Cleanup order location histories
    for (const [orderId, locations] of this.orderDriverLocations.entries()) {
      const validLocations = locations.filter(location => !this.isLocationStale(location));
      
      if (validLocations.length === 0) {
        staleOrders.push(orderId);
      } else if (validLocations.length !== locations.length) {
        this.orderDriverLocations.set(orderId, validLocations);
      }
    }

    // Remove stale data
    staleDrivers.forEach(driverId => {
      this.driverLocations.delete(driverId);
      this.lastKnownLocations.delete(driverId);
    });

    staleOrders.forEach(orderId => {
      this.orderDriverLocations.delete(orderId);
    });

    if (staleDrivers.length > 0 || staleOrders.length > 0) {
      this.logger.log(`Cleaned up ${staleDrivers.length} stale drivers and ${staleOrders.length} stale orders`);
    }
  }

  /**
   * Cleanup stale clusters
   */
  private cleanupStaleClusters(): void {
    const now = Date.now();
    const staleClusters: string[] = [];

    for (const [key, cluster] of this.locationClusters.entries()) {
      const timeSinceUpdate = now - cluster.lastUpdate.getTime();
      
      if (timeSinceUpdate > this.LOCATION_TTL) {
        staleClusters.push(key);
      }
    }

    staleClusters.forEach(key => {
      this.locationClusters.delete(key);
    });

    if (staleClusters.length > 0) {
      this.logger.log(`Cleaned up ${staleClusters.length} stale clusters`);
    }
  }

  /**
   * Cleanup stale rate limits
   */
  private cleanupStaleRateLimits(): void {
    const now = Date.now();
    const staleRateLimits: string[] = [];

    for (const [driverId, rateLimit] of this.rateLimits.entries()) {
      if (now - rateLimit.windowStart > this.RATE_WINDOW * 2) {
        staleRateLimits.push(driverId);
      }
    }

    staleRateLimits.forEach(driverId => {
      this.rateLimits.delete(driverId);
    });
  }

  /**
   * Get location statistics
   */
  getLocationStats() {
    return {
      activeDrivers: this.driverLocations.size,
      activeOrders: this.orderDriverLocations.size,
      clusters: this.locationClusters.size,
      averageLocationsPerOrder: this.calculateAverageLocationsPerOrder(),
      topClusters: this.getTopClusters(5),
    };
  }

  /**
   * Calculate average locations per order
   */
  private calculateAverageLocationsPerOrder(): number {
    if (this.orderDriverLocations.size === 0) return 0;
    
    const totalLocations = Array.from(this.orderDriverLocations.values())
      .reduce((sum, locations) => sum + locations.length, 0);
    
    return totalLocations / this.orderDriverLocations.size;
  }

  /**
   * Get top clusters by driver count
   */
  private getTopClusters(limit: number): Array<{ centerLat: number; centerLng: number; driverCount: number }> {
    return Array.from(this.locationClusters.values())
      .map(cluster => ({
        centerLat: cluster.centerLat,
        centerLng: cluster.centerLng,
        driverCount: cluster.driverIds.length,
      }))
      .sort((a, b) => b.driverCount - a.driverCount)
      .slice(0, limit);
  }

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    this.driverLocations.clear();
    this.orderDriverLocations.clear();
    this.locationClusters.clear();
    this.rateLimits.clear();
    this.lastKnownLocations.clear();
    
    this.metrics = {
      totalLocationUpdates: 0,
      throttledUpdates: 0,
      clusteredUpdates: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
}

