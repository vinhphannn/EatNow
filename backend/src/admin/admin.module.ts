import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { Order, OrderSchema } from '../order/schemas/order.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Restaurant, RestaurantSchema } from '../restaurant/schemas/restaurant.schema';
import { Item, ItemSchema } from '../restaurant/schemas/item.schema';
import { Driver, DriverSchema } from '../driver/schemas/driver.schema';
import { DriverModule } from '../driver/driver.module';

// Users Module
import { AdminRestaurantsController } from './modules/users/admin-restaurants.controller';
import { AdminRestaurantsService } from './modules/users/admin-restaurants.service';
import { AdminUsersController } from './modules/users/admin-users.controller';
import { AdminUsersService } from './modules/users/admin-users.service';
import { AdminUsersManagementController } from './modules/users/admin-users-management.controller';
import { AdminDriversController } from './modules/users/admin-drivers.controller';
import { AdminDriversService } from './modules/users/admin-drivers.service';
import { UserAdminLog, UserAdminLogSchema } from './modules/users/admin-user-log.schema';
import { DriverAdminLog, DriverAdminLogSchema } from './modules/users/admin-driver-log.schema';
import { RestaurantAdminLog, RestaurantAdminLogSchema } from './modules/users/admin-restaurant-log.schema';

// Content Module
import { FeaturedCollection, FeaturedCollectionSchema } from './modules/content/featured-collection.schema';
import { FeaturedCollectionService } from './modules/content/featured-collection.service';
import { FeaturedCollectionController } from './modules/content/featured-collection.controller';
import { AdminSystemService } from './services/admin-system.service';
import { AdminSystemController } from './controllers/admin-system.controller';
import { AdminOrdersService } from './admin-orders.service';
import { AdminOrdersController } from './controllers/admin-orders.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    DriverModule,
    CommonModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Item.name, schema: ItemSchema },
      { name: Driver.name, schema: DriverSchema },
      { name: Order.name, schema: OrderSchema },
      { name: DriverAdminLog.name, schema: DriverAdminLogSchema },
      { name: UserAdminLog.name, schema: UserAdminLogSchema },
      { name: RestaurantAdminLog.name, schema: RestaurantAdminLogSchema },
      { name: FeaturedCollection.name, schema: FeaturedCollectionSchema },
    ]),
  ],
  controllers: [AdminController, AdminRestaurantsController, AdminUsersController, AdminUsersManagementController, AdminDriversController, FeaturedCollectionController, AdminSystemController, AdminOrdersController],
  providers: [AdminRestaurantsService, AdminUsersService, AdminDriversService, FeaturedCollectionService, AdminSystemService, AdminOrdersService],
})
export class AdminModule {}