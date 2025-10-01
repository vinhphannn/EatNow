import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Restaurant, RestaurantDocument } from '../restaurant/schemas/restaurant.schema';
import { Item, ItemDocument } from '../restaurant/schemas/item.schema';
import { Driver, DriverDocument } from '../driver/schemas/driver.schema';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
  ) {}

  @Get('stats')
  async stats() {
    const [users, restaurants, items, drivers] = await Promise.all([
      this.userModel.estimatedDocumentCount(),
      this.restaurantModel.estimatedDocumentCount(),
      this.itemModel.estimatedDocumentCount(),
      this.driverModel.estimatedDocumentCount(),
    ]);
    return { users, restaurants, items, drivers };
  }
}


