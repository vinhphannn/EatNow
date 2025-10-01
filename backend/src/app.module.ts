import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { RestaurantModule } from "./restaurant/restaurant.module";
import { OrderModule } from "./order/order.module";
import { PaymentModule } from "./payment/payment.module";
import { NotificationModule as NotificationsModule } from "./notifications/notification.module";
import { NotificationModule as WsNotificationModule } from "./notification/notification.module";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { DriverModule } from "./driver/driver.module";
import { AdminModule } from "./admin/admin.module";
import { SearchModule } from "./database/mongo.module";
import { CommonModule } from "./common/common.module";
import { CartModule } from "./cart/cart.module";
import { CustomerModule } from "./customer/customer.module";
import { DemoModule } from "./demo/demo.module";
import { CategoryModule } from "./category/category.module";
import { APP_GUARD } from "@nestjs/core";
import { DbReadinessGuard } from "./common/guards/db-readiness.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UserModule,
    RestaurantModule,
    DriverModule,
    AdminModule,
    OrderModule,
    PaymentModule,
    NotificationsModule,
    WsNotificationModule,
    SearchModule,
    CommonModule,
    CartModule,
    CustomerModule,
    DemoModule,
    CategoryModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: DbReadinessGuard,
    },
  ],
})
export class AppModule {}
    