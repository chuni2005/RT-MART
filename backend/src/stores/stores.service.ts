import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import { SellersService } from '../sellers/sellers.service';
import { Seller } from '../sellers/entities/seller.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    private readonly sellersService: SellersService,
  ) { }

  // async create(sellerId: string, createDto: CreateStoreDto): Promise<Store> {
  //   // Verify seller exists and is verified
  //   const seller = await this.sellersService.findOne(sellerId);

  //   if (!seller.verified) {
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

    const where: Record<string, string | ReturnType<typeof Like>> = {};

    if (queryDto.search) {
      where.storeName = Like(`%${queryDto.search}%`);
    }

    const [data, total] = await this.storeRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['seller', 'seller.user'],
      withDeleted: false, // 過濾軟刪除的商店
    });

    return { data, total };
  }

  async findOne(storeId: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { storeId: storeId },
      relations: ['seller', 'seller.user'],
      withDeleted: false, // 過濾軟刪除的商店
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    return store;
  }

  async findBySeller(sellerId: string): Promise<Store | null> {
    return await this.storeRepository.findOne({
      where: { sellerId },
      order: { createdAt: 'DESC' },
      withDeleted: false, // 過濾軟刪除的商店
    });
  }

  async update(
    storeId: string,
    updateDto: UpdateStoreDto,
  ): Promise<Store> {
    const store = await this.findOne(storeId);
    Object.assign(store, updateDto);
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
      throw new NotFoundException('Can\'t find the seller');
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
}
