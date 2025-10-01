import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Restaurant, RestaurantSchema } from '../restaurant/schemas/restaurant.schema';
import { Item, ItemSchema } from '../restaurant/schemas/item.schema';
import { Driver, DriverSchema } from '../driver/schemas/driver.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Item.name, schema: ItemSchema },
      { name: Driver.name, schema: DriverSchema },
    ]),
  ],
  controllers: [AdminController],
})
export class AdminModule {}


