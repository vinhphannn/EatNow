import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Restaurant, RestaurantDocument } from './schemas/restaurant.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Item, ItemDocument } from './schemas/item.schema';

@ApiTags('seed')
@Controller('seed')
export class SeedController {
  constructor(
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
  ) {}

  @Post('restaurant-basic')
  async seedBasic(@Body() body: { name?: string }) {
    const rest = await this.restaurantModel.create({ name: body.name || 'Demo Restaurant', status: 'active' });
    const cat1 = await this.categoryModel.create({ restaurantId: rest._id, name: 'Burgers', position: 1 });
    const cat2 = await this.categoryModel.create({ restaurantId: rest._id, name: 'Drinks', position: 2 });
    await this.itemModel.create({ restaurantId: rest._id, categoryId: cat1._id, name: 'Cheese Burger', price: 59000, type: 'food', position: 1 });
    await this.itemModel.create({ restaurantId: rest._id, categoryId: cat1._id, name: 'Chicken Burger', price: 69000, type: 'food', position: 2 });
    await this.itemModel.create({ restaurantId: rest._id, categoryId: cat2._id, name: 'Coke', price: 15000, type: 'drink', position: 1 });
    return { restaurantId: rest._id };
  }
}


