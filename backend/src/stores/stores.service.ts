import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { Product } from '../products/entities/product.entity';
import { UpdateStoreDto } from './dto/update-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import { SellersService } from '../sellers/sellers.service';
import { Seller } from '../sellers/entities/seller.entity';
import { formatPhoneNumber } from '../common/utils/string.utils';

@Injectable()
export class StoresService implements OnModuleInit {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    private readonly sellersService: SellersService,
  ) {}

  async onModuleInit() {
    // Synchronize product counts on startup to ensure consistency
    console.log('[StoresService] Synchronizing product counts...');
    await this.syncAllProductCounts();
    console.log('[StoresService] Product counts synchronized.');
  }

  // async create(sellerId: string, createDto: CreateStoreDto): Promise<Store> {
  //   // Verify seller exists and is verified
  //   const seller = await this.sellersService.findOne(sellerId);
  //   //   if (!seller.verified) {
  //     throw new ForbiddenException('Seller must be verified to create a store');
  //   }
  //   const store = this.storeRepository.create({
  //     ...createDto,
  //     sellerId,
  //   });
  //   return await this.storeRepository.save(store);
  // }

  async findAll(
    queryDto: QueryStoreDto,
  ): Promise<{ data: Store[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    const queryBuilder = this.storeRepository
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.seller', 'seller')
      .leftJoinAndSelect('seller.user', 'user')
      .skip(skip)
      .take(limit)
      .orderBy('store.createdAt', 'DESC');

    if (queryDto.search) {
      queryBuilder.andWhere('store.storeName LIKE :search', {
        search: `%${queryDto.search}%`,
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(storeId: string): Promise<Store> {
    const queryBuilder = this.storeRepository
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.seller', 'seller')
      .leftJoinAndSelect('seller.user', 'user')
      .where('store.storeId = :storeId', { storeId });

    const store = await queryBuilder.getOne();

    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    return store;
  }

  async findMyStore(userId: string): Promise<Store> {
    const seller = await this.sellersService.findByUserId(userId);
    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    const store = await this.storeRepository
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.seller', 'seller')
      .leftJoinAndSelect('seller.user', 'user')
      .where('store.sellerId = :sellerId', { sellerId: seller.sellerId })
      .getOne();

    if (!store) {
      throw new NotFoundException('Store not found for this seller');
    }

    return store;
  }

  async findBySeller(sellerId: string): Promise<Store | null> {
    const queryBuilder = this.storeRepository
      .createQueryBuilder('store')
      .where('store.sellerId = :sellerId', { sellerId })
      .orderBy('store.createdAt', 'DESC');
    return await queryBuilder.getOne();
  }

  async update(storeId: string, updateDto: UpdateStoreDto): Promise<Store> {
    const store = await this.findOne(storeId);
    const { bankAccountReference, ...storeData } = updateDto;

    if (bankAccountReference !== undefined) {
      await this.sellerRepository.update(store.sellerId, {
        bankAccountReference,
      });
    }

    if (storeData.storePhone) {
      storeData.storePhone = formatPhoneNumber(storeData.storePhone);
    }

    Object.assign(store, storeData);
    return await this.storeRepository.save(store);
  }

  async restore(storeId: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { storeId },
      withDeleted: true, // 包含已刪除的商店
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    if (!store.deletedAt) {
      throw new BadRequestException('Store is not deleted');
    }

    store.deletedAt = null;
    return await this.storeRepository.save(store);
  }

  async remove(id: string): Promise<void> {
    const store = await this.findOne(id);
    await this.storeRepository.softRemove(store);
  }

  async permanentlyDelete(storeId: string): Promise<void> {
    const store = await this.storeRepository.findOne({
      where: { storeId: storeId },
      withDeleted: true,
    });
    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }
    const seller = await this.sellersService.findOne(store.sellerId);
    if (!seller) {
      throw new NotFoundException("Can't find the seller");
    }

    await this.storeRepository.remove(store);
    await this.sellerRepository.remove(seller);
  }

  async updateRating(storeId: string, newRating: number): Promise<void> {
    // 驗證評分範圍 (0.0 ~ 5.0)
    if (newRating < 0.0 || newRating > 5.0) {
      throw new BadRequestException('Rating must be between 0.0 and 5.0');
    }

    const store = await this.findOne(storeId);

    const totalRatings = store.totalRatings + 1;
    const averageRating =
      (store.averageRating * store.totalRatings + newRating) / totalRatings;

    store.averageRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal
    store.totalRatings = totalRatings;

    await this.storeRepository.save(store);
  }

  /**
   * Increment product count for a store
   */
  async incrementProductCount(storeId: string): Promise<void> {
    await this.storeRepository.increment({ storeId }, 'productCount', 1);
  }

  /**
   * Decrement product count for a store
   */
  async decrementProductCount(storeId: string): Promise<void> {
    await this.storeRepository.decrement({ storeId }, 'productCount', 1);
  }

  /**
   * One-time synchronization of product count for all stores
   * This can be called during application startup or via an admin endpoint
   */
  async syncAllProductCounts(): Promise<void> {
    const stores = await this.storeRepository.find();
    for (const store of stores) {
      const count = await this.storeRepository.manager
        .getRepository(Product)
        .count({ where: { storeId: store.storeId } });
      await this.storeRepository.update(store.storeId, { productCount: count });
    }
  }
}
