import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Driver, DriverSchema } from './schemas/driver.schema';
import { Order, OrderSchema } from '../order/schemas/order.schema';
import { DriverService } from './driver.service';
import { User, UserSchema } from '../user/schemas/user.schema';
import { DriverController } from './driver.controller';
import { DriverLocationService } from './services/driver-location.service';
import { DriverPerformanceService } from './services/driver-performance.service';
import { DriverOrderService } from './services/driver-order.service';
import { DriverLocationController } from './controllers/driver-location.controller';
import { DriverOrderController } from './controllers/driver-order.controller';
import { OrderAssignmentModule } from '../order/order-assignment.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Driver.name, schema: DriverSchema },
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
    OrderAssignmentModule,
    NotificationModule,
  ],
  controllers: [DriverController, DriverLocationController, DriverOrderController],
  providers: [DriverService, DriverLocationService, DriverPerformanceService, DriverOrderService],
  exports: [DriverService, DriverLocationService, DriverPerformanceService, DriverOrderService],
})
export class DriverModule {}


