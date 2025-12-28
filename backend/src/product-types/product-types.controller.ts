import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
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

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Post()
  async create(@Body() createDto: CreateProductTypeDto) {
    return await this.productTypesService.create(createDto);
  }

  @Get()
  async findAll(@Query() queryDto: any) {
    return await this.productTypesService.findAll(queryDto);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('admin')
  async adminFindAll() {
    return await this.productTypesService.adminFindAll();
  }

  @Get(':id/descendant-ids')
  async getDescendantIds(@Param('id') id: string) {
    return await this.productTypesService.getDescendantIds(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.productTypesService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('admin/:id')
  async adminFindOne(@Param('id') id: string) {
    return await this.productTypesService.adminFindOne(id);
  }

  // @Get('tree')
  // async findTree() {
  //   return await this.productTypesService.findTree();
  // }

  // @Get(':id/children')
  // async findChildren(@Param('id') id: string) {
  //   return await this.productTypesService.findChildren(id);
  // }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductTypeDto,
  ) {
    return await this.productTypesService.update(id, updateDto);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Delete(':id')
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
