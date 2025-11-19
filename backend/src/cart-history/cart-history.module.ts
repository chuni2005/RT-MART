import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartHistoryService } from './cart-history.service';
import { CartHistoryController } from './cart-history.controller';
import { CartHistory } from './entities/cart-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CartHistory])],
  controllers: [CartHistoryController],
  providers: [CartHistoryService],
  exports: [CartHistoryService],
})
export class CartHistoryModule {}
