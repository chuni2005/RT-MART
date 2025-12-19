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
  Req,
} from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto, SpecialDiscountDetailsDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { QueryDiscountDto } from './dto/query-discount.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SpecialDiscount } from './entities/special-discount.entity';
import type { AuthRequest } from '../common/types';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}
  
  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Post()
  async createSpecial(@Req() req, @Body() createDto: CreateDiscountDto) {
    return await this.discountsService.sellerCreate(createDto, req.user);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Post('admin')
  async create(@Req() req, @Body() createDto: CreateDiscountDto) {
    return await this.discountsService.adminCreate(createDto, req.user);
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

  // @Get('active')
  // async findActive() {
  //   return await this.discountsService.findActiveDiscounts();
  // }

  // @Get(':id')
  // async findOne(@Param('id') id: string) {
  //   return await this.discountsService.findOne(id);
  // }

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

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Patch(':id')
  async update(@Req() req: AuthRequest, @Param('id') id: string, @Body() updateDto: UpdateDiscountDto) {
    return await this.discountsService.update(req.user.userId, id, updateDto);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Patch('admin/:id')
  async adminUpdate(@Param('id') id: string, @Body() updateDto: UpdateDiscountDto) {
    return await this.discountsService.adminUpdate(id, updateDto);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Delete(':id')
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
