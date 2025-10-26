import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from '../schemas/driver.schema';

/**
 * Driver Presence Service
 * 
 * Quản lý sự hiện diện của tài xế trên Redis
 * 
 * Cấu trúc Redis:
 * - driver:presence:{driverId} -> { status, location, lastSeen }
 * - driver:available:geo -> Sorted Set (GeoHash) of available drivers
 * - driver:current_orders:{driverId} -> List of order IDs
 */

interface DriverPresence {
  status: 'available' | 'delivering' | 'offline';
  location: {
    latitude: number;
    longitude: number;
  };
  lastSeen: string;
  socketId?: string;
}

@Injectable()
export class DriverPresenceService {
  private readonly logger = new Logger(DriverPresenceService.name);
  private redis: any = null;

  constructor(
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
  ) {
    this.initRedis();
  }

  private async initRedis() {
    try {
      const url = process.env.REDIS_URL || process.env.REDIS_URI;
      if (!url) {
        this.logger.warn('Redis not configured, driver presence tracking will be limited');
        return;
      }

      const IORedis = require('ioredis');
      
      // Connection với options để tối ưu performance
      this.redis = new IORedis(url, {
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        commandTimeout: 5000,
        lazyConnect: false,
        // Enable keep-alive
        keepAlive: 30000,
        // Connection pool settings
        enableReadyCheck: true,
        enableOfflineQueue: true
      });

      // Error handling
      this.redis.on('error', (err: any) => {
        this.logger.error('Redis connection error:', err);
      });

      this.redis.on('connect', () => {
        this.logger.log('✅ Redis connected for driver presence tracking');
      });

      this.logger.log('✅ Redis initialized for driver presence tracking');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
    }
  }

  /**
   * Gắn driver vào hệ thống (khi driver online)
   */
  async registerDriver(driverId: string, location: { latitude: number; longitude: number }, socketId?: string): Promise<void> {
    if (!this.redis) return;

    try {
      const presence: DriverPresence = {
        status: 'available',
        location,
        lastSeen: new Date().toISOString(),
        socketId
      };

      // Lưu thông tin presence
      await this.redis.set(
        `driver:presence:${driverId}`,
        JSON.stringify(presence),
        'EX',
        3600 // TTL 1 giờ
      );

      // Thêm vào geospatial index (Sorted Set với GeoHash)
      await this.redis.geoadd(
        'driver:available:geo',
        location.longitude,
        location.latitude, // Redis Geo uses [longitude, latitude]
        driverId
      );

      // Lưu driverId vào set available drivers
      await this.redis.sadd('driver:available:set', driverId);

      this.logger.log(`✅ Driver ${driverId} registered for assignment`);
    } catch (error) {
      this.logger.error(`Failed to register driver ${driverId}:`, error);
    }
  }

  /**
   * Cập nhật vị trí driver
   */
  async updateDriverLocation(driverId: string, location: { latitude: number; longitude: number }): Promise<void> {
    if (!this.redis) return;

    try {
      // Cập nhật position trong Redis Geo
      await this.redis.geoadd(
        'driver:available:geo',
        location.longitude,
        location.latitude,
        driverId
      );

      // Cập nhật presence
      const presenceStr = await this.redis.get(`driver:presence:${driverId}`);
      if (presenceStr) {
        const presence: DriverPresence = JSON.parse(presenceStr);
        presence.location = location;
        presence.lastSeen = new Date().toISOString();
        await this.redis.set(`driver:presence:${driverId}`, JSON.stringify(presence), 'EX', 3600);
      }

    } catch (error) {
      this.logger.error(`Failed to update location for driver ${driverId}:`, error);
    }
  }

  /**
   * Tìm drivers trong phạm vi bán kính với caching
   */
  async findNearbyDrivers(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<Array<{ driverId: string; distance: number; presence: DriverPresence }>> {
    if (!this.redis) return [];

    try {
      // Sử dụng GEORADIUS với COUNT để giới hạn kết quả (tối ưu performance)
      const results = await this.redis.georadius(
        'driver:available:geo',
        longitude,
        latitude,
        radiusKm,
        'km',
        'WITHCOORD',
        'WITHDIST',
        'COUNT',
        20 // Chỉ lấy 20 drivers gần nhất
      );

      const drivers = [];
      const pipeline = this.redis.pipeline();

      // Tạo pipeline để get tất cả presence cùng lúc (giảm số lần gọi)
      const driverIds = [];
      for (let i = 0; i < results.length; i += 4) { // Mỗi result có 4 elements
        const driverId = results[i];
        if (driverId) {
          driverIds.push(driverId);
          pipeline.get(`driver:presence:${driverId}`);
        }
      }

      // Execute pipeline (1 request thay vì N requests)
      const presences = await pipeline.exec();
      const presenceMap = new Map<string, DriverPresence>();

      presences.forEach(([err, value], index) => {
        if (!err && value) {
          try {
            const presence = JSON.parse(value as string) as DriverPresence;
            presenceMap.set(driverIds[index], presence);
          } catch (e) {
            // Ignore parse errors
          }
        }
      });

      // Parse kết quả với batch
      for (let i = 0; i < results.length; i += 4) {
        const driverId = results[i];
        const distance = parseFloat(results[i + 1]); // Distance in km
        
        const presence = presenceMap.get(driverId);

        if (presence && presence.status === 'available') {
          drivers.push({
            driverId,
            distance,
            presence
          });
        }
      }

      // Sort by distance
      drivers.sort((a, b) => a.distance - b.distance);

      this.logger.log(`Found ${drivers.length} nearby drivers in ${radiusKm}km radius`);

      return drivers;

    } catch (error) {
      this.logger.error('Failed to find nearby drivers:', error);
      return [];
    }
  }

  /**
   * Đánh dấu driver đang giao hàng
   */
  async markDriverDelivering(driverId: string, orderId: string): Promise<void> {
    if (!this.redis) return;

    try {
      // Update presence status
      const presenceStr = await this.redis.get(`driver:presence:${driverId}`);
      if (presenceStr) {
        const presence: DriverPresence = JSON.parse(presenceStr);
        presence.status = 'delivering';
        presence.lastSeen = new Date().toISOString();
        await this.redis.set(`driver:presence:${driverId}`, JSON.stringify(presence), 'EX', 3600);
      }

      // Remove from available geo set
      await this.redis.zrem('driver:available:geo', driverId);
      await this.redis.srem('driver:available:set', driverId);

      // Add to current orders
      await this.redis.rpush(`driver:current_orders:${driverId}`, orderId);
      await this.redis.expire(`driver:current_orders:${driverId}`, 86400); // 24 hours

      this.logger.log(`✅ Driver ${driverId} marked as delivering order ${orderId}`);

    } catch (error) {
      this.logger.error(`Failed to mark driver ${driverId} as delivering:`, error);
    }
  }

  /**
   * Đánh dấu driver sẵn sàng nhận đơn
   */
  async markDriverAvailable(driverId: string, location: { latitude: number; longitude: number }): Promise<void> {
    if (!this.redis) return;

    try {
      // Update presence status
      const presenceStr = await this.redis.get(`driver:presence:${driverId}`);
      if (presenceStr) {
        const presence: DriverPresence = JSON.parse(presenceStr);
        presence.status = 'available';
        presence.location = location;
        presence.lastSeen = new Date().toISOString();
        await this.redis.set(`driver:presence:${driverId}`, JSON.stringify(presence), 'EX', 3600);
      }

      // Re-add to available geo set
      await this.redis.geoadd('driver:available:geo', location.longitude, location.latitude, driverId);
      await this.redis.sadd('driver:available:set', driverId);

      this.logger.log(`✅ Driver ${driverId} marked as available`);

    } catch (error) {
      this.logger.error(`Failed to mark driver ${driverId} as available:`, error);
    }
  }

  /**
   * Hủy đăng ký driver (khi offline)
   */
  async unregisterDriver(driverId: string): Promise<void> {
    if (!this.redis) return;

    try {
      // Remove from geo index
      await this.redis.zrem('driver:available:geo', driverId);
      await this.redis.srem('driver:available:set', driverId);

      // Delete presence
      await this.redis.del(`driver:presence:${driverId}`);

      // Delete current orders
      await this.redis.del(`driver:current_orders:${driverId}`);

      this.logger.log(`✅ Driver ${driverId} unregistered`);

    } catch (error) {
      this.logger.error(`Failed to unregister driver ${driverId}:`, error);
    }
  }

  /**
   * Lấy trạng thái driver
   */
  async getDriverPresence(driverId: string): Promise<DriverPresence | null> {
    if (!this.redis) return null;

    try {
      const presenceStr = await this.redis.get(`driver:presence:${driverId}`);
      if (!presenceStr) return null;

      return JSON.parse(presenceStr) as DriverPresence;

    } catch (error) {
      this.logger.error(`Failed to get presence for driver ${driverId}:`, error);
      return null;
    }
  }

  /**
   * Lấy số lượng drivers available
   */
  async getAvailableDriversCount(): Promise<number> {
    if (!this.redis) return 0;

    try {
      const count = await this.redis.scard('driver:available:set');
      return count;
    } catch (error) {
      this.logger.error('Failed to get available drivers count:', error);
      return 0;
    }
  }
}
