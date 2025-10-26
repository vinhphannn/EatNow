import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Driver, DriverSchema } from './schemas/driver.schema';
import { Order, OrderSchema } from '../order/schemas/order.schema';
import { DriverService } from './driver.service';
import { UserModule } from '../user/user.module';
import { DriverController } from './driver.controller';
import { DriverLocationService } from './services/driver-location.service';
import { DriverPerformanceService } from './services/driver-performance.service';
import { DriverOrderService } from './services/driver-order.service';
import { SmartAssignmentService } from './services/smart-assignment.service';
import { DriverPresenceService } from './services/driver-presence.service';
import { SmartDriverAssignmentService } from './services/smart-driver-assignment.service';
import { DriverAssignmentSchedulerService } from './services/driver-assignment-scheduler.service';
import { DriverLocationController } from './controllers/driver-location.controller';
import { DriverOrderController } from './controllers/driver-order.controller';
import { DriverOrderAssignmentController } from './controllers/driver-order-assignment.controller';
import { DriverTestController } from './controllers/driver-test.controller';
import { OrderAssignmentModule } from '../order/order-assignment.module';
import { OrderModule } from '../order/order.module';
import { OptimizedNotificationModule } from '../notification/optimized-notification.module';
import { CommonModule } from '../common/common.module';
import { DriverAutoSimService } from './services/driver-auto-sim.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Driver.name, schema: DriverSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    UserModule,
    forwardRef(() => OrderModule),
    OrderAssignmentModule,
    OptimizedNotificationModule,
    CommonModule,
  ],
  controllers: [DriverController, DriverLocationController, DriverOrderController, DriverOrderAssignmentController, DriverTestController],
  providers: [
    DriverService, 
    DriverLocationService, 
    DriverPerformanceService, 
    DriverOrderService, 
    DriverAutoSimService,
    SmartAssignmentService,
    DriverPresenceService,
    SmartDriverAssignmentService,
    DriverAssignmentSchedulerService
  ],
  exports: [
    DriverService, 
    DriverLocationService, 
    DriverPerformanceService, 
    DriverOrderService, 
    DriverAutoSimService,
    SmartAssignmentService,
    DriverPresenceService,
    SmartDriverAssignmentService,
    DriverAssignmentSchedulerService
  ],
})
export class DriverModule {}


