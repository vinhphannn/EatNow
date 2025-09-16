import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { Driver, DriverSchema } from '../driver/schemas/driver.schema';
import { OrderAssignmentService } from './services/order-assignment.service';
import { DriverPerformanceService } from '../driver/services/driver-performance.service';
import { DistanceService } from '../common/services/distance.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Driver.name, schema: DriverSchema },
    ]),
  ],
  providers: [OrderAssignmentService, DriverPerformanceService, DistanceService],
  exports: [OrderAssignmentService],
})
export class OrderAssignmentModule {}
