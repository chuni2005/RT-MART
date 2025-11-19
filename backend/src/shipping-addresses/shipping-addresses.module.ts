import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingAddressesService } from './shipping-addresses.service';
import { ShippingAddressesController } from './shipping-addresses.controller';
import { ShippingAddress } from './entities/shipping-address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShippingAddress])],
  controllers: [ShippingAddressesController],
  providers: [ShippingAddressesService],
  exports: [ShippingAddressesService],
})
export class ShippingAddressesModule {}
