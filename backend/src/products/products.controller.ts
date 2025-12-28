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
import { ProductsService, EnrichedProduct } from './products.service';
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
import {
  SortImagesDto,
  UpdateSortedImagesDto,
} from './dto/upate-sortedImages.dto';

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
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.productsService.create(req.user.userId, createDto, files);
  }

  @Get('storefront')
  async findStorefront(@Query() queryDto: QueryProductDto) {
    const { data, total } = await this.productsService.findStorefront(queryDto);
    return {
      success: true,
      message: 'Storefront products retrieved successfully',
      products: data,
      total,
      page: parseInt(queryDto.page || '1', 10),
      limit: parseInt(queryDto.limit || '20', 10),
    };
  }

  @Get('storefront/:id')
  async findStorefrontDetail(@Param('id') id: string) {
    const product: EnrichedProduct =
      await this.productsService.findStorefrontDetail(id);
    return {
      success: true,
      message: 'Product detail retrieved successfully',
      product,
    };
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

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('seller')
  async findAllBySeller(@Query() queryDto: QueryProductDto) {
    const { data, total } = await this.productsService.findAll(queryDto, true);
    return {
      data,
      total,
      page: parseInt(queryDto.page || '1', 10),
      limit: parseInt(queryDto.limit || '20', 10),
    };
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('admin')
  async findAllByAdmin(@Query() queryDto: QueryProductDto) {
    const { data, total } = await this.productsService.findAll(
      queryDto,
      true,
      true,
    );
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
  @Get('seller/:id')
  async findOneBySeller(@Param('id') id: string) {
    return await this.productsService.findOne(id, true);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('admin/:id')
  async findOneByAdmin(@Param('id') id: string) {
    return await this.productsService.findOne(id, true, true);
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
    return await this.productsService.sortImages(
      req.user.userId,
      id,
      sortImages,
    );
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
  async removeBySeller(@Req() req: AuthRequest, @Param('id') id: string) {
    await this.productsService.remove(req.user.userId, id);
    return { message: 'Product deleted successfully' };
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Delete(':id')
  async removeByAdmin(@Req() req: AuthRequest, @Param('id') id: string) {
    await this.productsService.remove(req.user.userId, id, true);
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
