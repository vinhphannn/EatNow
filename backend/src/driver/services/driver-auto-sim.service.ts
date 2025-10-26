import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Driver, DriverDocument } from '../schemas/driver.schema';
import { Order, OrderDocument } from '../../order/schemas/order.schema';
import { DriverLocationService } from './driver-location.service';

type SimHandle = {
  timer: NodeJS.Timeout;
};

@Injectable()
export class DriverAutoSimService {
  private readonly logger = new Logger(DriverAutoSimService.name);
  private readonly sims = new Map<string, SimHandle>();

  constructor(
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly driverLocationService: DriverLocationService,
  ) {}

  async start(driverId: string) {
    if (this.sims.has(driverId)) return { ok: true };

    // Random point in HCMC bounding box (approx)
    const lat = 10.75 + Math.random() * 0.1; // 10.75 - 10.85
    const lng = 106.65 + Math.random() * 0.1; // 106.65 - 106.75

    await this.driverModel.findByIdAndUpdate(driverId, {
      status: 'active',
      isAuto: true,
      autoMeta: { city: 'HCM', currentTarget: null, speedKmh: 30 },
      location: [lng, lat],
      lastLocationAt: new Date(),
      locationType: 'Point'
    });

    // Tick every 10s to reduce load
    const timer = setInterval(async () => {
      try {
        const d = await this.driverModel.findById(driverId).lean();
        if (!d || !d.isAuto) {
          this.stop(driverId);
          return;
        }

        let curLat = (d.location?.[1] as number) || lat;
        let curLng = (d.location?.[0] as number) || lng;

        // Move toward a target: restaurant first, then customer if order assigned
        const current = await this.orderModel.findOne({ driverId: new Types.ObjectId(driverId), status: { $in: ['confirmed','preparing','ready'] } }).lean();
        let targetLat: number | null = null;
        let targetLng: number | null = null;
        if (current) {
          if (current.status === 'confirmed' || current.status === 'preparing') {
            // move toward restaurant (fallback to current location if missing)
            const rest = await this.driverModel.db.model('Restaurant').findById(current.restaurantId).lean();
            targetLat = (rest as any)?.latitude ?? curLat;
            targetLng = (rest as any)?.longitude ?? curLng;
          } else if (current.status === 'ready') {
            targetLat = (current as any).deliveryAddress?.latitude ?? curLat;
            targetLng = (current as any).deliveryAddress?.longitude ?? curLng;
          }
        }

        const stepMeters = 120; // fixed step per tick
        if (targetLat !== null && targetLng !== null) {
          // simple move toward target
          const toRad = (x: number) => x * Math.PI / 180;
          const toDeg = (x: number) => x * 180 / Math.PI;
          const dLat = toRad(targetLat - curLat);
          const dLng = toRad(targetLng - curLng);
          const angle = Math.atan2(Math.sin(dLng) * Math.cos(toRad(targetLat)), Math.cos(toRad(curLat)) * Math.sin(toRad(targetLat)) - Math.sin(toRad(curLat)) * Math.cos(toRad(targetLat)) * Math.cos(dLng));
          const dLatStep = (stepMeters / 111320) * Math.cos(angle);
          const dLngStep = (stepMeters / (111320 * Math.cos(curLat * Math.PI / 180))) * Math.sin(angle);
          curLat += dLatStep;
          curLng += dLngStep;
        } else {
          // random walk fallback
          const bearing = Math.random() * Math.PI * 2;
          const dLat = (stepMeters / 111320) * Math.cos(bearing);
          const dLng = (stepMeters / (111320 * Math.cos(curLat * Math.PI / 180))) * Math.sin(bearing);
          curLat += dLat;
          curLng += dLng;
        }

        await this.driverLocationService.updateDriverLocation(driverId, curLat, curLng);

        // Try to pick one pending order if driver has none
        const existing = await this.orderModel.findOne({ driverId: new Types.ObjectId(driverId), status: { $in: ['confirmed','preparing','ready'] } }).lean();
        if (!existing) {
          const pending = await this.orderModel.findOne({ status: 'pending', driverId: { $exists: false } }).sort({ createdAt: 1 }).lean();
          if (pending) {
            await this.orderModel.findByIdAndUpdate(pending._id, {
              driverId: new Types.ObjectId(driverId),
              assignedAt: new Date(),
              status: 'confirmed',
              $push: { trackingHistory: { status: 'confirmed', timestamp: new Date(), updatedBy: 'system' } }
            });
            this.logger.log(`Auto-assigned order ${pending._id} to driver ${driverId}`);
          }
        } else {
          // DISABLED: Progress order statuses over time
          // This was causing orders to automatically change status and complete
          // Commented out to prevent automatic order status changes
          /*
          if (existing.status === 'confirmed' && Math.random() < 0.3) {
            await this.orderModel.findByIdAndUpdate(existing._id, {
              status: 'preparing',
              $push: { trackingHistory: { status: 'preparing', timestamp: new Date(), updatedBy: 'system' } }
            });
          } else if (existing.status === 'preparing' && Math.random() < 0.3) {
            await this.orderModel.findByIdAndUpdate(existing._id, {
              status: 'ready',
              $push: { trackingHistory: { status: 'ready', timestamp: new Date(), updatedBy: 'system' } }
            });
          } else if (existing.status === 'ready' && Math.random() < 0.4) {
            await this.orderModel.findByIdAndUpdate(existing._id, {
              status: 'delivered',
              actualDeliveryTime: new Date(),
              $push: { trackingHistory: { status: 'delivered', timestamp: new Date(), updatedBy: 'system' } }
            });
          }
          */
        }
      } catch (e) {
        this.logger.error('Auto-sim tick error', e as any);
      }
    }, 10000);

    this.sims.set(driverId, { timer });
    return { ok: true };
  }

  stop(driverId: string) {
    const h = this.sims.get(driverId);
    if (h) {
      clearInterval(h.timer);
      this.sims.delete(driverId);
    }
  }
}


