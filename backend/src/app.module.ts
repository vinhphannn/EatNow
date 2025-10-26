import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./config/configuration";
// validation schema removed to avoid runtime dependency on joi
// import * as Joi from "joi";
// import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { RestaurantModule } from "./restaurant/restaurant.module";
import { OrderModule } from "./order/order.module";
import { PaymentModule } from "./payment/payment.module";
import { OptimizedNotificationModule } from "./notification/optimized-notification.module";
import { NotificationModule } from "./notifications/notification.module";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { DriverModule } from "./driver/driver.module";
import { AdminModule } from "./admin/admin.module";
import { MongoModule } from "./database/mongo.module";
import { CommonModule } from "./common/common.module";
import { WalletModule } from "./wallet/wallet.module";
import { CartModule } from "./cart/cart.module";
import { CustomerModule } from "./customer/customer.module";
import { DemoModule } from "./demo/demo.module";
import { CategoryModule } from "./category/category.module";
import { SearchModule } from "./search/search.module";
import { TestModule } from "./test/test.module";
import { APP_GUARD } from "@nestjs/core";
import { DbReadinessGuard } from "./common/guards/db-readiness.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
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
    // NotificationModule, // Old notification system
    OptimizedNotificationModule, // New optimized notification system
    NotificationModule, // API endpoints for notifications
    MongoModule,
    CommonModule,
    CartModule,
    CustomerModule,
    DemoModule,
    CategoryModule,
    SearchModule,
    TestModule,
    WalletModule,
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
    