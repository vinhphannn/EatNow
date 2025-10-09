import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { Driver, DriverDocument } from '../driver/schemas/driver.schema';
import { Order, OrderDocument } from '../order/schemas/order.schema';

@Controller('admin/map')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminMapController {
  constructor(
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  @Get()
  async getActiveLocations() {
    // Include customers with active orders (pending/confirmed/preparing/ready)
    const [restaurants, drivers, orders] = await Promise.all([
      this.restaurantModel
        .find({ status: 'active', latitude: { $ne: null }, longitude: { $ne: null } })
        .select({ name: 1, latitude: 1, longitude: 1 })
        .limit(1000)
        .lean(),
      this.driverModel
        .find({ status: { $in: ['active'] } })
        .select({ location: 1, status: 1, isAuto: 1 })
        .limit(2000)
        .lean(),
      this.orderModel
        .find({ status: { $in: ['pending','confirmed','preparing','ready'] } })
        .select({ deliveryAddress: 1 })
        .limit(5000)
        .lean(),
    ]);

    const customers = orders
      .map((o: any) => ({ lat: o?.deliveryAddress?.latitude, lng: o?.deliveryAddress?.longitude }))
      .filter((p: any) => typeof p.lat === 'number' && typeof p.lng === 'number');

    return {
      restaurants: restaurants.map((r: any) => ({ id: String(r._id), name: r.name, lat: r.latitude, lng: r.longitude })),
      drivers: drivers
        .map((d: any) => ({ id: String(d._id), lat: Array.isArray(d.location) ? d.location[1] : null, lng: Array.isArray(d.location) ? d.location[0] : null, status: d.status, isAuto: !!d.isAuto }))
        .filter((d: any) => typeof d.lat === 'number' && typeof d.lng === 'number'),
      customers,
    };
  }
}


