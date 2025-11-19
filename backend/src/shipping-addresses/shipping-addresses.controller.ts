import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ShippingAddressesService } from './shipping-addresses.service';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthRequest } from '../common/types';

@Controller('shipping-addresses')
@UseGuards(JwtAuthGuard)
export class ShippingAddressesController {
  constructor(
    private readonly shippingAddressesService: ShippingAddressesService,
  ) {}

  @Post()
  async create(
    @Req() req: AuthRequest,
    @Body() createDto: CreateShippingAddressDto,
  ) {
    return await this.shippingAddressesService.create(
      req.user.userId,
      createDto,
    );
  }

  @Get()
  async findAll(@Req() req: AuthRequest) {
    return await this.shippingAddressesService.findAllByUser(req.user.userId);
  }

  @Get('default')
  async findDefault(@Req() req: AuthRequest) {
    return await this.shippingAddressesService.findDefaultAddress(
      req.user.userId,
    );
  }

  @Get(':id')
  async findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return await this.shippingAddressesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateDto: UpdateShippingAddressDto,
  ) {
    return await this.shippingAddressesService.update(
      id,
      req.user.userId,
      updateDto,
    );
  }

  @Post(':id/set-default')
  async setAsDefault(@Req() req: AuthRequest, @Param('id') id: string) {
    return await this.shippingAddressesService.setAsDefault(
      id,
      req.user.userId,
    );
  }

  @Delete(':id')
  async remove(@Req() req: AuthRequest, @Param('id') id: string) {
    await this.shippingAddressesService.remove(id, req.user.userId);
    return { message: 'Shipping address deleted successfully' };
  }

  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'shipping-addresses',
      timestamp: new Date().toISOString(),
    };
  }
}
