import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SellersModule } from './sellers/sellers.module';
import { ShippingAddressesModule } from './shipping-addresses/shipping-addresses.module';
import { StoresModule } from './stores/stores.module';
import { ProductTypesModule } from './product-types/product-types.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { CartItemsModule } from './carts-item/cart-items.module';
import { OrdersModule } from './orders/orders.module';
import { DiscountsModule } from './discounts/discounts.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { CartHistoryModule } from './cart-history/cart-history.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // allow the app to read `.env` properly
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // connects to db
    TypeOrmModule.forRoot(databaseConfig()),

    // rate limit
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10) || 60000,
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10) || 100,
      },
    ]),

    // scheduled tasks (cron jobs)
    ScheduleModule.forRoot(),

    // Phase 1: User & Auth modules
    UsersModule,
    AuthModule,
    SellersModule,
    ShippingAddressesModule,

    // Phase 2: Store & Product modules
    StoresModule,
    ProductTypesModule,
    ProductsModule,
    InventoryModule,

    // Phase 3: Cart & Order modules
    CartItemsModule,
    OrdersModule,

    // Phase 4: Discount modules
    DiscountsModule,

    // Phase 5: System management modules
    AuditLogsModule,
    CartHistoryModule,

    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
