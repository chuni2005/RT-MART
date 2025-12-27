import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItemsService } from './cart-items.service';
import { CartItemsController } from './cart-items.controller';
import { CartItem } from './entities/cart-item.entity';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem]), InventoryModule],
  controllers: [CartItemsController],
  providers: [CartItemsService],
  exports: [CartItemsService],
})
export class CartItemsModule {}
