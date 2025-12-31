import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItemsService } from './cart-items.service';
import { CartItemsController } from './cart-items.controller';
import { CartItem } from './entities/cart-item.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { CartHistoryModule } from '../cart-history/cart-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartItem]),
    InventoryModule,
    forwardRef(() => CartHistoryModule),
  ],
  controllers: [CartItemsController],
  providers: [CartItemsService],
  exports: [CartItemsService],
})
export class CartItemsModule {}
