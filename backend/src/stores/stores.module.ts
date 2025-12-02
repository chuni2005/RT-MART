import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { Store } from './entities/store.entity';
import { SellersModule } from '../sellers/sellers.module';
import { Seller } from '../sellers/entities/seller.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Store, Seller]), SellersModule],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
