import { Module } from '@nestjs/common';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Restaurant, RestaurantSchema } from '../restaurant/schemas/restaurant.schema';
import { Item, ItemSchema } from '../restaurant/schemas/item.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Driver, DriverSchema } from '../driver/schemas/driver.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Item.name, schema: ItemSchema },
      { name: User.name, schema: UserSchema },
      { name: Driver.name, schema: DriverSchema },
    ]),
  ],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}


