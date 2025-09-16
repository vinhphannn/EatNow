import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { RestaurantModule } from "./restaurant/restaurant.module";
import { OrderModule } from "./order/order.module";
import { PaymentModule } from "./payment/payment.module";
import { NotificationModule } from "./notification/notification.module";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { DriverModule } from "./driver/driver.module";
import { AdminModule } from "./admin/admin.module";
import { SearchModule } from "./database/mongo.module";
import { CommonModule } from "./common/common.module";
import { CartModule } from "./cart/cart.module";

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
    NotificationModule,
    SearchModule,
    CommonModule,
    CartModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
    