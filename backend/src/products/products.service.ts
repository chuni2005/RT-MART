import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { StoresService } from '../stores/stores.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SellersService } from '../sellers/sellers.service';
import { SortImagesDto } from './dto/upate-sortedImages.dto';

import { SpecialDiscount } from '../discounts/entities/special-discount.entity';

import { ProductTypesService } from '../product-types/product-types.service';

export interface EnrichedProduct extends Product {
  originalPrice: number;
  currentPrice: number;
  discountRate: number;
}
import { Inventory } from '../inventory/entities/inventory.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly storesService: StoresService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly sellerService: SellersService,
    private readonly productTypesService: ProductTypesService,
  ) {}

  async findStorefront(
    queryDto: QueryProductDto,
  ): Promise<{ data: EnrichedProduct[]; total: number }> {
    // console.log(queryDto, '=>', queryDto.productTypeId);
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '20', 10);
    const skip = (page - 1) * limit;

    // Step 1: Query for IDs and Discount Info with Filtering
    // This query handles filtering, sorting, and pagination
    const subQueryBuilder =
      this.productRepository.createQueryBuilder('product');

    // Only join tables needed for filtering/sorting
    subQueryBuilder
      .leftJoin(
        SpecialDiscount,
        'discount',
        'discount.storeId = product.storeId AND (discount.productTypeId IS NULL OR discount.productTypeId = product.productTypeId)',
      )
      .leftJoin(
        'discount.discount',
        'discountInfo',
        'discountInfo.isActive = true AND discountInfo.startDatetime <= NOW() AND discountInfo.endDatetime >= NOW()',
      );

    // --- Sorting ---
    const sortBy = queryDto.sortBy || 'createdAt';
    const sortOrder =
      (queryDto.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    // Select ID and Max Discount Rate and Sort Column
    subQueryBuilder
      .select('product.productId', 'id')
      .addSelect('MAX(discount.discountRate)', 'maxDiscountRate')
      .groupBy('product.productId');

    if (sortBy === 'price') {
      const priceCalc =
        'MAX(product.price) * (1 - COALESCE(MAX(discount.discountRate), 0))';
      subQueryBuilder.addSelect(priceCalc, 'sortPrice');
      subQueryBuilder.addOrderBy('sortPrice', sortOrder);
    } else {
      // For strict mode, we should use an aggregate or include in GROUP BY
      // Since productId is the primary key, product.any_column is functionally dependent on it
      // but some DB modes still complain. Using MAX() is a safe workaround for non-aggregate columns.
      subQueryBuilder.addSelect(`MAX(product.${sortBy})`, 'sortVal');
      subQueryBuilder.addOrderBy('sortVal', sortOrder);
    }

    // --- Filters ---
    subQueryBuilder.andWhere('product.isActive = :isActive', {
      isActive: true,
    });

    if (queryDto.storeId) {
      subQueryBuilder.andWhere('product.storeId = :storeId', {
        storeId: queryDto.storeId,
      });
    }

    if (queryDto.productTypeId) {
      const typeIds = await this.productTypesService.getDescendantIds(
        queryDto.productTypeId,
      );

      subQueryBuilder.andWhere('product.productTypeId IN (:...typeIds)', {
        typeIds,
      });
    }

    const keyword = queryDto.keyword || queryDto.search;
    if (keyword) {
      subQueryBuilder
        .leftJoin('product.productType', 'pt_search')
        .andWhere(
          '(product.productName LIKE :keyword OR pt_search.typeName LIKE :keyword)',
          {
            keyword: `%${keyword}%`,
          },
        );
    }

    if (queryDto.minRating) {
      subQueryBuilder.andWhere('product.averageRating >= :minRating', {
        minRating: parseFloat(queryDto.minRating),
      });
    }

    // --- Price Filtering (HAVING) ---
    const effectivePrice =
      'MAX(product.price) * (1 - COALESCE(MAX(discount.discountRate), 0))';

    if (queryDto.minPrice && queryDto.maxPrice) {
      subQueryBuilder.having(
        `${effectivePrice} >= :minPrice AND ${effectivePrice} <= :maxPrice`,
        {
          minPrice: parseFloat(queryDto.minPrice),
          maxPrice: parseFloat(queryDto.maxPrice),
        },
      );
    } else if (queryDto.minPrice) {
      subQueryBuilder.having(`${effectivePrice} >= :minPrice`, {
        minPrice: parseFloat(queryDto.minPrice),
      });
    } else if (queryDto.maxPrice) {
      subQueryBuilder.having(`${effectivePrice} <= :maxPrice`, {
        maxPrice: parseFloat(queryDto.maxPrice),
      });
    }

    // --- Total Count (Before Pagination) ---
    // We need to count the raw results because of GROUP BY
    const countResult = await subQueryBuilder.getRawMany();
    const total = countResult.length;

    // --- Pagination ---
    subQueryBuilder.limit(limit).offset(skip);
    const paginatedResults = await subQueryBuilder.getRawMany();

    if (paginatedResults.length === 0) {
      return { data: [], total: 0 };
    }

    // Step 2: Fetch Full Data for selected IDs
    const productIds = paginatedResults.map((r) => String(r.id));
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .leftJoinAndSelect('product.productType', 'productType')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .whereInIds(productIds)
      .getMany();

    // Step 3: Merge Data (Attach Discount info and Sort)
    // The 'products' array from getMany() is NOT guaranteed to be in the same order as 'productIds'
    // So we map based on the paginatedResults which preserves the sort order
    const enrichedProducts = paginatedResults
      .map((rawItem) => {
        const product = products.find(
          (p) => String(p.productId) === String(rawItem.id),
        );
        if (!product) return null; // Should not happen

        const maxDiscountRate = rawItem.maxDiscountRate
          ? parseFloat(rawItem.maxDiscountRate as string)
          : 0;
        const currentPrice = Math.round(product.price * (1 - maxDiscountRate));

        return {
          ...product,
          originalPrice: product.price,
          currentPrice: currentPrice,
          discountRate: maxDiscountRate,
        };
      })
      .filter((p) => p !== null);

    return { data: enrichedProducts, total };
  }

  async findStorefrontDetail(id: string): Promise<EnrichedProduct> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .leftJoinAndSelect('product.productType', 'productType')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .where('product.productId = :id', { id })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .getOne();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Get active discount
    const discountResult = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin(
        SpecialDiscount,
        'discount',
        'discount.storeId = product.storeId AND (discount.productTypeId IS NULL OR discount.productTypeId = product.productTypeId)',
      )
      .leftJoin(
        'discount.discount',
        'discountInfo',
        'discountInfo.isActive = true AND discountInfo.startDatetime <= NOW() AND discountInfo.endDatetime >= NOW()',
      )
      .select('MAX(discount.discountRate)', 'maxDiscountRate')
      .where('product.productId = :id', { id })
      .getRawOne<{ maxDiscountRate: string }>();

    // Calculate prices
    const maxDiscountRate = discountResult?.maxDiscountRate
      ? parseFloat(discountResult.maxDiscountRate)
      : 0;
    const currentPrice = Math.round(product.price * (1 - maxDiscountRate));

    // Construct response
    return {
      ...product,
      originalPrice: product.price,
      currentPrice: currentPrice,
      discountRate: maxDiscountRate,
    };
  }

  async create(
    userId: string,
    createDto: CreateProductDto,
    files: Express.Multer.File[],
  ): Promise<Product> {
    // Verify store exists and belongs to seller
    const seller = await this.sellerService.findByUserId(userId);
    if (!seller) {
      throw new ForbiddenException('Not a seller role account');
    }

    const store = await this.storesService.findBySeller(seller.sellerId);
    if (!store) {
      throw new NotFoundException("Can't find the store of this seller acount");
    }

    const { initialStock, ...productData } = createDto;

    const product = this.productRepository.create({
      ...productData,
      storeId: store.storeId,
    });

    const savedProduct = await this.productRepository.save(product);

    const inventory = this.inventoryRepository.create({
      quantity: initialStock,
      productId: savedProduct.productId,
    });
    await this.inventoryRepository.save(inventory);

    // Create images if provided
    if (files && files.length > 0) {
      const images = await Promise.all(
        files.map(async (file, index) => {
          const result = await this.cloudinaryService.uploadImage(file);
          console.log('Cloudinary result:', result);

          if (!result.url || !result.publicId) {
            throw new BadRequestException(
              'Cloudinary error: missing url or publicId',
            );
          }

          const imageData = {
            productId: savedProduct.productId,
            imageUrl: result.url,
            publicId: result.publicId,
            displayOrder: index + 1,
          };
          return this.imageRepository.create(imageData);
        }),
      );
      await this.imageRepository.save(images);
    }
    return await this.findOne(savedProduct.productId, true);
  }

  async findAll(
    queryDto: QueryProductDto,
    withActive: boolean = false,
    withDeleted: boolean = false,
  ): Promise<{ data: Product[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (!withActive) {
      where.isActive = true;
    }

    if (queryDto.storeId) {
      where.storeId = queryDto.storeId;
    }

    if (queryDto.productTypeId) {
      const typeIds = await this.productTypesService.getDescendantIds(
        queryDto.productTypeId,
      );
      (where as any).productTypeId = In(typeIds);
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
      withDeleted: withDeleted,
    });

    return { data, total };
  }

  async findOne(
    id: string,
    withActive: boolean = false,
    withDeleted: boolean = false,
  ): Promise<Product> {
    const whereCondition: Record<string, any> = { productId: id };

    if (!withActive) {
      whereCondition.isActive = true;
    }

    const product = await this.productRepository.findOne({
      where: whereCondition,
      relations: ['store', 'productType', 'images', 'inventory'],
      withDeleted: withDeleted,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async getProductAfterVerification(userId: string, productId: string) {
    const seller = await this.sellerService.findByUserId(userId);
    if (!seller) {
      throw new ForbiddenException('Not a seller role account');
    }

    const store = await this.storesService.findBySeller(seller.sellerId);
    if (!store) {
      throw new NotFoundException(
        "Can't find the store of this seller account",
      );
    }

    const product = await this.findOne(productId, true);
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

  async addImages(
    userId: string,
    productId: string,
    files: Express.Multer.File[],
  ): Promise<Product> {
    const product = await this.getProductAfterVerification(userId, productId);
    const currentMaxOrder =
      (product.images ?? []).length > 0
        ? Math.max(...(product.images ?? []).map((img) => img.displayOrder))
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
        }),
      );

      await this.imageRepository.save(newImages);
    }

    return await this.findOne(product.productId, true);
  }

  async sortImages(
    userId: string,
    productId: string,
    sortImages: SortImagesDto,
  ): Promise<Product> {
    const product = await this.getProductAfterVerification(userId, productId);
    const productImageIds = new Set(
      (product.images ?? []).map((img) => img.imageId),
    );

    for (const item of sortImages.images) {
      if (!productImageIds.has(item.imageId)) {
        throw new BadRequestException(
          `Image ID ${item.imageId} does not belong to product ${productId}`,
        );
      }
    }

    const sortOrders = sortImages.images.map((i) => i.order);
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
    return await this.findOne(productId, true);
  }

  async discontinued(userId: string, productId: string) {
    const product = await this.getProductAfterVerification(userId, productId);
    if (!product.isActive) {
      throw new BadRequestException('product is already discontinued');
    }
    product.isActive = false;
    return await this.productRepository.save(product);
  }

  async continued(userId: string, productId: string) {
    const product = await this.getProductAfterVerification(userId, productId);
    if (product.isActive) {
      throw new BadRequestException('product is already continued');
    }
    product.isActive = true;
    return await this.productRepository.save(product);
  }

  async deleteImage(userId: string, productId: string, imageId: string) {
    const product = await this.getProductAfterVerification(userId, productId);
    const image = (product.images ?? []).find((img) => img.imageId === imageId);

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
    return await this.findOne(productId, true);
  }

  async remove(
    userId: string,
    id: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    const product = isAdmin
      ? await this.findOne(id, true, true)
      : await this.getProductAfterVerification(userId, id);
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
