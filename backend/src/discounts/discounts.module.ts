import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountsService } from './discounts.service';
import { DiscountsController } from './discounts.controller';
import { Discount } from './entities/discount.entity';
import { SeasonalDiscount } from './entities/seasonal-discount.entity';
import { ShippingDiscount } from './entities/shipping-discount.entity';
import { SpecialDiscount } from './entities/special-discount.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Discount,
      SeasonalDiscount,
      ShippingDiscount,
      SpecialDiscount,
    ]),
  ],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
