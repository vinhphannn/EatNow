import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { Category, CategoryDocument } from '../restaurant/schemas/category.schema';
import { Item, ItemDocument } from '../restaurant/schemas/item.schema';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { id?: string; role?: string } | undefined;
    if (!user?.id) throw new ForbiddenException('Unauthenticated');
    if (user.role === 'admin') return true;

    // Determine restaurant id from route
    const params = req.params || {};
    let restaurantId: string | undefined = params['restaurantId'];

    if (!restaurantId && params['id']) {
      // this could be restaurant id for /restaurants/:id
      const maybeRestaurant = await this.restaurantModel.findById(params['id']).lean();
      if (maybeRestaurant) restaurantId = (maybeRestaurant as any)._id?.toString();
    }

    if (!restaurantId && params['id']) {
      // category or item id
      const cat = await this.categoryModel.findById(params['id']).lean();
      if (cat) restaurantId = (cat as any).restaurantId?.toString();
      if (!restaurantId) {
        const item = await this.itemModel.findById(params['id']).lean();
        if (item) restaurantId = (item as any).restaurantId?.toString();
      }
    }

    if (!restaurantId) throw new ForbiddenException('Cannot resolve restaurant context');

    const rest = await this.restaurantModel.findById(restaurantId).lean();
    if (!rest) throw new ForbiddenException('Restaurant not found');
    if (((rest as any).ownerUserId?.toString() || '') !== user.id) {
      throw new ForbiddenException('You do not own this restaurant');
    }
    return true;
  }
}


