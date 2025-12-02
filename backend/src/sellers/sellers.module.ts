import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellersService } from './sellers.service';
import { SellersController } from './sellers.controller';
import { Seller } from './entities/seller.entity';
import { UsersModule } from '../users/users.module';
import { Store } from '../stores/entities/store.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Seller, Store, User]), UsersModule],
  controllers: [SellersController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}
