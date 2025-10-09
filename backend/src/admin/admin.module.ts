import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminRestaurantsController } from './admin-restaurants.controller';
import { AdminRestaurantsService } from './admin-restaurants.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { UserAdminLog, UserAdminLogSchema } from './admin-user-log.schema';
import { AdminDriversController } from './admin-drivers.controller';
import { AdminDriversService } from './admin-drivers.service';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminMapController } from './admin-map.controller';
import { AdminOrdersService } from './admin-orders.service';
import { Order, OrderSchema } from '../order/schemas/order.schema';
import { DriverAdminLog, DriverAdminLogSchema } from './admin-driver-log.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Restaurant, RestaurantSchema } from '../restaurant/schemas/restaurant.schema';
import { Item, ItemSchema } from '../restaurant/schemas/item.schema';
import { Driver, DriverSchema } from '../driver/schemas/driver.schema';
import { RestaurantAdminLog, RestaurantAdminLogSchema } from './admin-restaurant-log.schema';
import { DriverModule } from '../driver/driver.module';

@Module({
  imports: [
    DriverModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Item.name, schema: ItemSchema },
      { name: Driver.name, schema: DriverSchema },
      { name: Order.name, schema: OrderSchema },
      { name: DriverAdminLog.name, schema: DriverAdminLogSchema },
      { name: UserAdminLog.name, schema: UserAdminLogSchema },
      { name: RestaurantAdminLog.name, schema: RestaurantAdminLogSchema },
    ]),
  ],
  controllers: [AdminController, AdminRestaurantsController, AdminUsersController, AdminDriversController, AdminOrdersController, AdminMapController],
  providers: [AdminRestaurantsService, AdminUsersService, AdminDriversService, AdminOrdersService],
})
export class AdminModule {}


