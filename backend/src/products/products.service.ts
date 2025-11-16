import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { StoresService } from '../stores/stores.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
    private readonly storesService: StoresService,
  ) {}

  async create(storeId: string, createDto: CreateProductDto): Promise<Product> {
    // Verify store exists and belongs to seller
    await this.storesService.findOne(storeId);

    const product = this.productRepository.create({
      ...createDto,
      storeId,
    });

    const savedProduct = await this.productRepository.save(product);

    // Create images if provided
    if (createDto.images && createDto.images.length > 0) {
      const images = createDto.images.map((img, index) =>
        this.imageRepository.create({
          productId: savedProduct.productId,
          imageUrl: img.imageUrl,
          displayOrder: img.displayOrder || index + 1,
        }),
      );
      await this.imageRepository.save(images);
    }

    return await this.findOne(savedProduct.productId);
  }

  async findAll(
    queryDto: QueryProductDto,
  ): Promise<{ data: Product[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, string | ReturnType<typeof Like>> = {};

    if (queryDto.storeId) {
      where.storeId = queryDto.storeId;
    }

    if (queryDto.productTypeId) {
      where.productTypeId = queryDto.productTypeId;
    }

    if (queryDto.search) {
      where.productName = Like(`%${queryDto.search}%`);
    }

    if (queryDto.minPrice || queryDto.maxPrice) {
      const min = parseFloat(queryDto.minPrice || '0');
      const max = parseFloat(queryDto.maxPrice || '999999999');
      where.price = Between(min, max);
    }

    const sortBy = queryDto.sortBy || 'createdAt';
    const sortOrder: 'ASC' | 'DESC' =
      (queryDto.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const [data, total] = await this.productRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['store', 'productType', 'images', 'inventory'],
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { productId: id },
      relations: ['store', 'productType', 'images', 'inventory'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Increment view count
    await this.productRepository.increment({ productId: id }, 'viewCount', 1);

    return product;
  }

  async update(
    id: string,
    storeId: string,
    updateDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Verify ownership
    if (product.storeId !== storeId) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Handle images update
    if (updateDto.images) {
      // Remove old images
      await this.imageRepository.delete({ productId: id });

      // Add new images
      const images = updateDto.images.map((img, index) =>
        this.imageRepository.create({
          productId: id,
          imageUrl: img.imageUrl,
          displayOrder: img.displayOrder || index + 1,
        }),
      );
      await this.imageRepository.save(images);
    }

    Object.assign(product, updateDto);
    return await this.productRepository.save(product);
  }

  async remove(id: string, storeId: string): Promise<void> {
    const product = await this.findOne(id);

    // Verify ownership
    if (product.storeId !== storeId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.productRepository.softRemove(product);
  }

  async updateRating(productId: string, newRating: number): Promise<void> {
    const product = await this.findOne(productId);

    const totalReviews = product.totalReviews + 1;
    const averageRating =
      (product.averageRating * product.totalReviews + newRating) / totalReviews;

    product.averageRating = Math.round(averageRating * 10) / 10;
    product.totalReviews = totalReviews;

    await this.productRepository.save(product);
  }
}
