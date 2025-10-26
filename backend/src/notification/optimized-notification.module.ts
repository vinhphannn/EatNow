import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Restaurant, RestaurantSchema } from '../restaurant/schemas/restaurant.schema';
import { Customer, CustomerSchema } from '../customer/schemas/customer.schema';
import { Driver, DriverSchema } from '../driver/schemas/driver.schema';
import { Order, OrderSchema } from '../order/schemas/order.schema';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { OptimizedNotificationGateway } from './optimized-notification.gateway';
import { NotificationService } from './notification.service';
import { RestaurantNotificationController } from './controllers/restaurant-notification.controller';
import { CustomerNotificationController } from './controllers/customer-notification.controller';
import { DriverNotificationController } from './controllers/driver-notification.controller';
import { AdminNotificationController } from './controllers/admin-notification.controller';
import { ConnectionManager } from './services/connection-manager.service';
import { ChatManager } from './services/chat-manager.service';
import { LocationManager } from './services/location-manager.service';
import { MonitoringService } from './services/monitoring.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Driver.name, schema: DriverSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [
    OptimizedNotificationGateway,
    NotificationService,
    ConnectionManager,
    ChatManager,
    LocationManager,
    MonitoringService,
  ],
  controllers: [
    HealthController, 
    RestaurantNotificationController,
    CustomerNotificationController,
    DriverNotificationController,
    AdminNotificationController
  ],
  exports: [
    OptimizedNotificationGateway,
    NotificationService,
    ConnectionManager,
    ChatManager,
    LocationManager,
    MonitoringService,
  ],
})
export class OptimizedNotificationModule {}
