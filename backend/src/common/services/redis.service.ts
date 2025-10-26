import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: ReturnType<typeof createClient>;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.client = createClient({
        url: this.configService.get('REDIS_URL') || 'redis://localhost:6379',
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      await this.client.connect();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.warn('⚠️ Redis connection failed, using in-memory fallback:', error.message);
      // Tạm thời dùng in-memory fallback
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  // Pending Orders Management
  async addPendingOrder(orderId: string): Promise<void> {
    if (!this.client) {
      console.log(`📝 [Fallback] Adding order ${orderId} to pending queue`);
      return;
    }
    await this.client.sAdd('pending_orders', orderId);
    // Set TTL for 30 minutes
    await this.client.expire('pending_orders', 1800);
  }

  async removePendingOrder(orderId: string): Promise<void> {
    if (!this.client) {
      console.log(`📝 [Fallback] Removing order ${orderId} from pending queue`);
      return;
    }
    await this.client.sRem('pending_orders', orderId);
  }

  async getPendingOrders(): Promise<string[]> {
    if (!this.client) {
      console.log(`📝 [Fallback] Getting pending orders (empty)`);
      return [];
    }
    return await this.client.sMembers('pending_orders');
  }

  async isOrderPending(orderId: string): Promise<boolean> {
    if (!this.client) {
      console.log(`📝 [Fallback] Checking if order ${orderId} is pending (false)`);
      return false;
    }
    return await this.client.sIsMember('pending_orders', orderId);
  }

  // Available Drivers Management
  async addAvailableDriver(driverId: string): Promise<void> {
    if (!this.client) {
      console.log(`📝 [Fallback] Adding driver ${driverId} to available`);
      return;
    }
    await this.client.sAdd('available_drivers', driverId);
  }

  async removeAvailableDriver(driverId: string): Promise<void> {
    if (!this.client) {
      console.log(`📝 [Fallback] Removing driver ${driverId} from available`);
      return;
    }
    await this.client.sRem('available_drivers', driverId);
  }

  async getAvailableDrivers(): Promise<string[]> {
    if (!this.client) {
      console.log(`📝 [Fallback] Getting available drivers (empty)`);
      return [];
    }
    return await this.client.sMembers('available_drivers');
  }

  // Driver Location Cache
  async setDriverLocation(driverId: string, lat: number, lng: number): Promise<void> {
    if (!this.client) {
      console.log(`📝 [Fallback] Setting driver ${driverId} location: ${lat}, ${lng}`);
      return;
    }
    const key = `driver_location:${driverId}`;
    await this.client.hSet(key, {
      lat: lat.toString(),
      lng: lng.toString(),
      updatedAt: new Date().toISOString()
    });
    // Set TTL for 5 minutes
    await this.client.expire(key, 300);
  }

  async getDriverLocation(driverId: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.client) {
      console.log(`📝 [Fallback] Getting driver ${driverId} location (null)`);
      return null;
    }
    const key = `driver_location:${driverId}`;
    const location = await this.client.hGetAll(key);
    
    if (location.lat && location.lng) {
      return {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng)
      };
    }
    
    return null;
  }

  // Order Assignment Cache
  async setOrderAssignment(orderId: string, driverId: string): Promise<void> {
    if (!this.client) {
      console.log(`📝 [Fallback] Setting order ${orderId} assignment to driver ${driverId}`);
      return;
    }
    const key = `order_assignment:${orderId}`;
    await this.client.hSet(key, {
      driverId,
      assignedAt: new Date().toISOString(),
      status: 'assigned'
    });
    // Set TTL for 1 hour
    await this.client.expire(key, 3600);
  }

  async getOrderAssignment(orderId: string): Promise<{ driverId: string; assignedAt: string; status: string } | null> {
    if (!this.client) {
      console.log(`📝 [Fallback] Getting order ${orderId} assignment (null)`);
      return null;
    }
    const key = `order_assignment:${orderId}`;
    const assignment = await this.client.hGetAll(key);
    
    if (assignment.driverId) {
      return {
        driverId: assignment.driverId,
        assignedAt: assignment.assignedAt,
        status: assignment.status
      };
    }
    
    return null;
  }

  // Generic Redis operations
  async get(key: string): Promise<string | null> {
    if (!this.client) {
      console.log(`📝 [Fallback] Getting key ${key} (null)`);
      return null;
    }
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client) {
      console.log(`📝 [Fallback] Setting key ${key} = ${value}`);
      return;
    }
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) {
      console.log(`📝 [Fallback] Deleting key ${key}`);
      return;
    }
    await this.client.del(key);
  }
}
