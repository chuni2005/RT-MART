import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartHistoryService } from './cart-history.service';
import { CartHistoryController } from './cart-history.controller';
import { CartHistory } from './entities/cart-history.entity';
import { CartItemsModule } from '../carts-item/cart-items.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartHistory]),
    forwardRef(() => CartItemsModule),
    forwardRef(() => OrdersModule),
  ],
  controllers: [CartHistoryController],
  providers: [CartHistoryService],
  exports: [CartHistoryService],
})
export class CartHistoryModule {}
