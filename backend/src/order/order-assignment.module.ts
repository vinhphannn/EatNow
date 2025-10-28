import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { Driver, DriverSchema } from '../driver/schemas/driver.schema';
import { Restaurant, RestaurantSchema } from '../restaurant/schemas/restaurant.schema';
import { OrderAssignmentService } from './services/order-assignment.service';
import { DriverPerformanceService } from '../driver/services/driver-performance.service';
import { DistanceService } from '../common/services/distance.service';
import { OrderModule } from './order.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Driver.name, schema: DriverSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
    forwardRef(() => OrderModule),
  ],
  providers: [OrderAssignmentService, DriverPerformanceService, DistanceService],
  exports: [OrderAssignmentService],
})
export class OrderAssignmentModule {}
