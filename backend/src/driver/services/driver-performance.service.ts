import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from '../schemas/driver.schema';

@Injectable()
export class DriverPerformanceService {
  constructor(
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
  ) {}

  /**
   * Calculate performance score for a driver (0-100)
   * This score is hidden from drivers
   */
  async calculatePerformanceScore(driverId: string): Promise<number> {
    const driver = await this.driverModel.findById(driverId);
    if (!driver) return 0;

    let score = 0;

    // 1. Completion Rate (40 points)
    const totalOrders = driver.ordersCompleted + driver.ordersRejected + driver.ordersSkipped;
    if (totalOrders > 0) {
      const completionRate = driver.ordersCompleted / totalOrders;
      score += completionRate * 40;
    }

    // 2. Customer Rating (30 points)
    if (driver.ratingCount > 0) {
      const normalizedRating = (driver.rating / 5) * 30; // Convert 0-5 to 0-30
      score += normalizedRating;
    }

    // 3. On-time Delivery Rate (20 points)
    const totalDeliveries = driver.onTimeDeliveries + driver.lateDeliveries;
    if (totalDeliveries > 0) {
      const onTimeRate = driver.onTimeDeliveries / totalDeliveries;
      score += onTimeRate * 20;
    }

    // 4. Activity Level (10 points)
    // More active drivers get higher scores
    const activityScore = Math.min(driver.ordersCompleted / 10, 1) * 10; // Max 10 points
    score += activityScore;

    // 5. Penalty for rejections and skips
    const rejectionPenalty = (driver.ordersRejected + driver.ordersSkipped) * 2;
    score = Math.max(0, score - rejectionPenalty);

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Update driver performance metrics
   */
  async updatePerformanceMetrics(
    driverId: string,
    metrics: {
      orderCompleted?: boolean;
      orderRejected?: boolean;
      orderSkipped?: boolean;
      deliveryTime?: number; // in minutes
      wasOnTime?: boolean;
      customerRating?: number;
    }
  ): Promise<void> {
    const updateData: any = {};

    if (metrics.orderCompleted) {
      updateData.$inc = { ordersCompleted: 1, totalDeliveries: 1 };
    }

    if (metrics.orderRejected) {
      updateData.$inc = { ordersRejected: 1 };
    }

    if (metrics.orderSkipped) {
      updateData.$inc = { ordersSkipped: 1 };
    }

    if (metrics.wasOnTime !== undefined) {
      if (metrics.wasOnTime) {
        updateData.$inc = { onTimeDeliveries: 1 };
      } else {
        updateData.$inc = { lateDeliveries: 1 };
      }
    }

    if (metrics.customerRating) {
      // Update average rating
      const driver = await this.driverModel.findById(driverId);
      if (driver) {
        const newRatingCount = driver.ratingCount + 1;
        const newRating = ((driver.rating * driver.ratingCount) + metrics.customerRating) / newRatingCount;
        updateData.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal
        updateData.ratingCount = newRatingCount;
      }
    }

    if (metrics.deliveryTime) {
      // Update average delivery time
      const driver = await this.driverModel.findById(driverId);
      if (driver) {
        const totalDeliveries = driver.ordersCompleted + 1;
        const newAverageTime = ((driver.averageDeliveryTime * driver.ordersCompleted) + metrics.deliveryTime) / totalDeliveries;
        updateData.averageDeliveryTime = Math.round(newAverageTime * 10) / 10;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await this.driverModel.findByIdAndUpdate(driverId, updateData);
    }

    // Recalculate performance score
    const newScore = await this.calculatePerformanceScore(driverId);
    await this.driverModel.findByIdAndUpdate(driverId, { performanceScore: newScore });
  }

  /**
   * Get available drivers within range sorted by performance
   */
  async getAvailableDriversInRange(
    restaurantLat: number,
    restaurantLon: number,
    maxDistanceKm: number = 2
  ): Promise<DriverDocument[]> {
    // Find drivers who are available and not currently on an order
    const availableDrivers = await this.driverModel.find({
      isAvailable: true,
      currentOrderId: { $exists: false },
      status: 'active',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [restaurantLon, restaurantLat]
          },
          $maxDistance: maxDistanceKm * 1000 // Convert km to meters
        }
      }
    }).sort({ performanceScore: -1, lastLocationAt: -1 });

    return availableDrivers;
  }
}
