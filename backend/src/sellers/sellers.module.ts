import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellersService } from './sellers.service';
import { SellersController } from './sellers.controller';
import { Seller } from './entities/seller.entity';
import { UsersModule } from '../users/users.module';
import { Store } from '../stores/entities/store.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { ProductType } from '../product-types/entities/product-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Seller,
      Store,
      User,
      Order,
      Product,
      ProductType,
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [SellersController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}
