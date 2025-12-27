import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductType } from '../product-types/entities/product-type.entity';
import { ProductTypesModule } from '../product-types/product-types.module';
import { StoresModule } from '../stores/stores.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SellersModule } from '../sellers/sellers.module';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage, ProductType]),
    StoresModule,
    ProductTypesModule,
    SellersModule,
    CloudinaryModule,
    forwardRef(() => InventoryModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, CloudinaryService],
  exports: [ProductsService],
})
export class ProductsModule {}
