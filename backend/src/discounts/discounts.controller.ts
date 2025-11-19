import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { QueryDiscountDto } from './dto/query-discount.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async create(@Body() createDto: CreateDiscountDto) {
    return await this.discountsService.create(createDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryDiscountDto) {
    const { data, total } = await this.discountsService.findAll(queryDto);
    return {
      data,
      total,
      page: parseInt(queryDto.page || '1', 10),
      limit: parseInt(queryDto.limit || '10', 10),
    };
  }

  @Get('active')
  async findActive() {
    return await this.discountsService.findActiveDiscounts();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.discountsService.findOne(id);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    return await this.discountsService.findByCode(code);
  }

  @Post('validate/:code')
  async validateDiscount(
    @Param('code') code: string,
    @Body() body: { orderAmount: number },
  ) {
    return await this.discountsService.validateDiscount(code, body.orderAmount);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async update(@Param('id') id: string, @Body() updateDto: UpdateDiscountDto) {
    return await this.discountsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.discountsService.remove(id);
    return { message: 'Discount deleted successfully' };
  }

  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'discounts',
      timestamp: new Date().toISOString(),
    };
  }
}
