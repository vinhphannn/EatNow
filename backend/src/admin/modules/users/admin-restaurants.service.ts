import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Restaurant, RestaurantDocument } from '../../../restaurant/schemas/restaurant.schema';

@Injectable()
export class AdminRestaurantsService {
  constructor(
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
  ) {}

  async list({ page = 1, limit = 20, q, status, city, sort }: any) {
    const filter: any = {};
    if (status) filter.status = status;
    if (city) filter.city = city;
    if (q) {
      const rx = new RegExp(String(q), 'i');
      filter.$or = [
        { name: { $regex: rx } },
        { city: { $regex: rx } },
      ];
    }

    const sortSpec = (() => {
      if (!sort) return { createdAt: -1 } as any;
      const [field, dir] = String(sort).split(':');
      return { [field]: dir === 'desc' ? -1 : 1 } as any;
    })();

    const [docs, total] = await Promise.all([
      this.restaurantModel
        .find(filter, { name: 1, status: 1, rating: 1, ownerUserId: 1, city: 1, createdAt: 1, imageUrl: 1 })
        .sort(sortSpec)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      this.restaurantModel.countDocuments(filter),
    ]);

    const data = docs.map((d: any) => ({
      id: String(d._id),
      name: d.name,
      status: d.status,
      rating: d.rating || 0,
      ownerUserId: d.ownerUserId,
      city: d.city,
      imageUrl: d.imageUrl,
      createdAt: d.createdAt,
    }));

    return { data, page: Number(page), limit: Number(limit), total };
  }
}


