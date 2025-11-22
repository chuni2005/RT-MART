import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProductTypesService } from './product-types.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('product-types')
export class ProductTypesController {
  constructor(private readonly productTypesService: ProductTypesService) {}

  @Post()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createDto: CreateProductTypeDto) {
    return await this.productTypesService.create(createDto);
  }

  @Get()
  async findAll() {
    return await this.productTypesService.findAll();
  }

  @Get('tree')
  async findTree() {
    return await this.productTypesService.findTree();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.productTypesService.findOne(id);
  }

  @Get(':id/children')
  async findChildren(@Param('id') id: string) {
    return await this.productTypesService.findChildren(id);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductTypeDto,
  ) {
    return await this.productTypesService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.productTypesService.remove(id);
    return { message: 'Product type deleted successfully' };
  }

  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'product-types',
      timestamp: new Date().toISOString(),
    };
  }
}
