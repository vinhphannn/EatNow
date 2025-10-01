import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from '../schemas/driver.schema';
import { Order, OrderDocument } from '../../order/schemas/order.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationGateway } from '../../notification/notification.gateway';

@Injectable()
export class DriverLocationService {
  private readonly logger = new Logger(DriverLocationService.name);

  constructor(
    @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private notificationGateway: NotificationGateway,
  ) {}

  /**
   * Update driver location and send to customer if delivering
   */
  async updateDriverLocation(
    driverId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    try {
      await this.driverModel.findByIdAndUpdate(driverId, {
        location: [longitude, latitude], // MongoDB uses [lng, lat] format
        lastLocationAt: new Date(),
        locationType: 'Point'
      });

      this.logger.log(`Updated location for driver ${driverId}: ${latitude}, ${longitude}`);

      // Check if driver is currently delivering an order
      const currentOrder = await this.orderModel.findOne({
        driverId: driverId,
        status: { $in: ['confirmed', 'preparing', 'ready'] }
      }).populate('userId', 'name');

      if (currentOrder && (currentOrder as any).userId) {
        // Send location update to customer
        this.notificationGateway.sendLocationUpdate(
          ((currentOrder as any).userId as any)._id.toString(),
          {
            driverId: driverId,
            latitude: latitude,
            longitude: longitude,
            orderId: currentOrder._id.toString(),
            timestamp: new Date()
          }
        );
      }
    } catch (error) {
      this.logger.error(`Failed to update location for driver ${driverId}:`, error);
    }
  }

  /**
   * Get driver current location
   */
  async getDriverLocation(driverId: string): Promise<{ lat: number; lng: number } | null> {
    const driver = await this.driverModel.findById(driverId).select('location');
    if (!driver || !driver.location) return null;

    return {
      lat: driver.location[1], // MongoDB stores [lng, lat]
      lng: driver.location[0]
    };
  }

  /**
   * Mark driver as online/offline
   */
  async setDriverStatus(driverId: string, isOnline: boolean): Promise<void> {
    await this.driverModel.findByIdAndUpdate(driverId, {
      status: isOnline ? 'active' : 'offline',
      isAvailable: isOnline
    });
  }

  /**
   * Clean up old location data (run daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldLocations(): Promise<void> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // This would be implemented if we store location history
    this.logger.log('Cleaning up old location data...');
  }

  /**
   * Get drivers near a specific location
   */
  async getDriversNearLocation(
    latitude: number,
    longitude: number,
    maxDistanceKm: number = 5
  ): Promise<DriverDocument[]> {
    return this.driverModel.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistanceKm * 1000 // Convert km to meters
        }
      },
      isAvailable: true,
      status: 'active'
    });
  }

  /**
   * Check if driver is still active (has sent location recently)
   */
  async checkDriverActivity(driverId: string): Promise<boolean> {
    const driver = await this.driverModel.findById(driverId).select('lastLocationAt');
    if (!driver || !driver.lastLocationAt) return false;

    const now = new Date();
    const timeDiff = now.getTime() - driver.lastLocationAt.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    // If no location update in 5 minutes, consider inactive
    return minutesDiff < 5;
  }

  /**
   * Mark inactive drivers as offline
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async markInactiveDriversOffline(): Promise<void> {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const result = await this.driverModel.updateMany(
      {
        status: 'active',
        lastLocationAt: { $lt: fiveMinutesAgo }
      },
      {
        status: 'offline',
        isAvailable: false
      }
    );

    if (result.modifiedCount > 0) {
      this.logger.log(`Marked ${result.modifiedCount} drivers as offline due to inactivity`);
    }
  }
}
