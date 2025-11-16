import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductTypesService } from './product-types.service';
import { ProductTypesController } from './product-types.controller';
import { ProductType } from './entities/product-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductType])],
  controllers: [ProductTypesController],
  providers: [ProductTypesService],
  exports: [ProductTypesService],
})
export class ProductTypesModule {}
