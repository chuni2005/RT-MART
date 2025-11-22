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
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('store/:storeId')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  async create(
    @Param('storeId') storeId: string,
    @Body() createDto: CreateProductDto,
  ) {
    return await this.productsService.create(storeId, createDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryProductDto) {
    const { data, total } = await this.productsService.findAll(queryDto);
    return {
      data,
      total,
      page: parseInt(queryDto.page || '1', 10),
      limit: parseInt(queryDto.limit || '20', 10),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.productsService.findOne(id);
  }

  @Patch(':id/store/:storeId')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  async update(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() updateDto: UpdateProductDto,
  ) {
    return await this.productsService.update(id, storeId, updateDto);
  }

  @Delete(':id/store/:storeId')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  async remove(@Param('id') id: string, @Param('storeId') storeId: string) {
    await this.productsService.remove(id, storeId);
    return { message: 'Product deleted successfully' };
  }

  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'products',
      timestamp: new Date().toISOString(),
    };
  }
}
