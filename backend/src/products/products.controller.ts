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
  UploadedFile,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AuthTokenResponseDto } from '@/auth/dto/auth-response.dto';
import type { AuthRequest } from '../common/types';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SortImagesDto, UpdateSortedImagesDto } from './dto/upate-sortedImages.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @UseInterceptors(FilesInterceptor('images'))
  @Post()
  async create(
    @Req() req: AuthRequest,
    @Body() createDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    return await this.productsService.create(req.user.userId, createDto, files);
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

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Patch(':id')
  async update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateDto: UpdateProductDto,
  ) {
    return await this.productsService.update(req.user.userId, id, updateDto);
  }

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @UseInterceptors(FilesInterceptor('images'))
  @Post(':id/images')
  async addImages(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.productsService.addImages(req.user.userId, id, files);
  }
  
  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Patch(':id/images/sort')
  async sortImages(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() sortImages: SortImagesDto,
  ) {
    return await this.productsService.sortImages(req.user.userId, id, sortImages);
  }

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Delete(':id/images/:imageId')
  async deleteImage(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return await this.productsService.deleteImage(req.user.userId, id, imageId);
  }

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Delete(':id')
  async remove(@Req() req: AuthRequest, @Param('id') id: string) {
    await this.productsService.remove(req.user.userId, id);
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
