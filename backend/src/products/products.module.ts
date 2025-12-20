import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { StoresModule } from '../stores/stores.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SellersModule } from '../sellers/sellers.module';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage]), StoresModule, SellersModule, CloudinaryModule],
  controllers: [ProductsController],
  providers: [ProductsService, CloudinaryService],
  exports: [ProductsService],
})
export class ProductsModule {}
