import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { StoresService } from '../stores/stores.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SellersService } from '../sellers/sellers.service';
import { SortImagesDto, UpdateSortedImagesDto } from './dto/upate-sortedImages.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
    private readonly storesService: StoresService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly sellerService: SellersService
  ) { }

  async create(userId: string, createDto: CreateProductDto, files: Express.Multer.File[]): Promise<Product> {
    // Verify store exists and belongs to seller
    const seller = await this.sellerService.findByUserId(userId);
    if (!seller) {
      throw new ForbiddenException('Not a seller role account');
    }

    const store = await this.storesService.findBySeller(seller.sellerId);
    if (!store) {
      throw new NotFoundException('Can\'t find the store of this seller acount')
    }

    const product = this.productRepository.create({
      ...createDto,
      storeId: store.storeId,
    });

    const savedProduct = await this.productRepository.save(product);

    // Create images if provided
    if (files && files.length > 0) {
      const images = await Promise.all(
        files.map(async (file, index) => {
          const result = await this.cloudinaryService.uploadImage(file);

          return this.imageRepository.create({
            productId: savedProduct.productId,
            imageUrl: result.url,               // URL
            publicId: result.publicId,
            displayOrder: index + 1
          });
        }));
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

  async getProductAfterVerification(userId: string, productId: string) {
    const seller = await this.sellerService.findByUserId(userId);
    if (!seller) {
      throw new ForbiddenException('Not a seller role account');
    }

    const store = await this.storesService.findBySeller(seller.sellerId);
    if (!store) {
      throw new NotFoundException('Can\'t find the store of this seller account');
    }

    const product = await this.findOne(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (product.storeId != store.storeId) {
      throw new ForbiddenException(`You do not own this product`);
    }

    return product;
  }

  async update(
    userId: string,
    id: string,
    updateDto: UpdateProductDto,
  ): Promise<Product> {

    const product = await this.getProductAfterVerification(userId, id);

    Object.assign(product, updateDto);
    return await this.productRepository.save(product);
  }

  async addImages(userId: string, productId: string, files: Express.Multer.File[]): Promise<Product> {
    const product = await this.getProductAfterVerification(userId, productId);
    const currentMaxOrder =
      (product.images ?? []).length > 0
        ? Math.max(...(product.images ?? []).map(img => img.displayOrder))
        : 0;

    if (files && files.length > 0) {
      const newImages = await Promise.all(
        files.map(async (file, index) => {
          const result = await this.cloudinaryService.uploadImage(file);

          return this.imageRepository.create({
            productId: product.productId,
            imageUrl: result.url,
            publicId: result.publicId,
            displayOrder: currentMaxOrder + index + 1,
          });
        })
      );

      await this.imageRepository.save(newImages);
    }

    return await this.findOne(product.productId);
  }

  async sortImages(userId: string, productId: string, sortImages: SortImagesDto): Promise<Product> {
    const product = await this.getProductAfterVerification(userId, productId);
    const productImageIds = new Set(
      (product.images ?? []).map(img => img.imageId)
    );

    console.log(productImageIds);
    for (const item of sortImages.images) {
      if (!productImageIds.has(item.imageId)) {
        throw new BadRequestException(
          `Image ID ${item.imageId} does not belong to product ${productId}`,
        );
      }
    }

    const sortOrders = sortImages.images.map(i => i.order);
    const uniqueSortOrders = new Set(sortOrders);

    if (uniqueSortOrders.size !== sortOrders.length) {
      throw new BadRequestException('sortOrder values cannot be duplicated');
    }

    for (const item of sortImages.images) {
      await this.imageRepository.update(
        { imageId: item.imageId },
        { displayOrder: item.order },
      );
    }

    const updatedImages = await this.imageRepository.find({
      where: { productId },
      order: { displayOrder: 'ASC' },
    });

    updatedImages.forEach((img, index) => {
      img.displayOrder = index + 1;
    });

    await this.imageRepository.save(updatedImages);
    return await this.findOne(productId);
  }

  async deleteImage(userId: string, productId: string, imageId: string) {
    const product = await this.getProductAfterVerification(userId, productId);
    const image = (product.images ?? []).find(
      img => img.imageId === imageId,
    );

    if (!image) {
      throw new NotFoundException(
        `Image ID ${imageId} does not belong to product ${productId}`,
      );
    }

    if (image.publicId) {
      await this.cloudinaryService.deleteImage(image.publicId);
    }
    await this.imageRepository.delete({ imageId: image.imageId });

    const remainingImages = await this.imageRepository.find({
      where: { productId },
      order: { displayOrder: 'ASC' },
    });

    remainingImages.forEach((img, index) => {
      img.displayOrder = index + 1;
    });

    await this.imageRepository.save(remainingImages);
    return await this.findOne(productId);
  }

  async remove(userId: string, id: string): Promise<void> {
    const product = await this.getProductAfterVerification(userId, id);
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
