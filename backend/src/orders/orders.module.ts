import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderDiscount } from './entities/order-discount.entity';
import { CartsModule } from '../carts/carts.module';
import { ShippingAddressesModule } from '../shipping-addresses/shipping-addresses.module';
import { InventoryModule } from '../inventory/inventory.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderDiscount]),
    CartsModule,
    ShippingAddressesModule,
    InventoryModule,
    DiscountsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
