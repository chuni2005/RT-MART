import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { StoresModule } from '../stores/stores.module';
import { OrdersModule } from '../orders/orders.module';
import { SellersModule } from '../sellers/sellers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => StoresModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => SellersModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
