import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from './entities/seller.entity';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { VerifySellerDto } from './dto/verify-seller.dto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { QuerySellerDto } from './dto/query-seller.dto';

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<Store>,
    private readonly usersService: UsersService,
  ) {}

  async create(createSellerDto: CreateSellerDto): Promise<Seller> {
    const user = await this.usersService.findOne(createSellerDto.userId);

    if (!user || user.role == UserRole.ADMIN || user.role == UserRole.SELLER) {
      throw new BadRequestException('Only buyers can become sellers');
    }

    const existingSeller = await this.findByUserId(createSellerDto.userId);
    // console.log(existingSeller);
    if (existingSeller) {
      throw new ConflictException('User is already a seller');
    }

    const seller = this.sellerRepository.create(createSellerDto);
    const savedSeller = await this.sellerRepository.save(seller);

    // Update user role to seller using internal method
    await this.usersService.updateRole(createSellerDto.userId, UserRole.SELLER);

    return savedSeller;
  }

  async findAll(
    queryDto: QuerySellerDto,
  ): Promise<{ data: Seller[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    const query = this.sellerRepository
      .createQueryBuilder('seller')
      .leftJoinAndSelect('seller.user', 'user')
      .orderBy('seller.sellerId', 'DESC')
      .skip(skip)
      .take(limit);

    if (queryDto.loginId) {
      query.andWhere('user.loginId = :loginId', { loginId: queryDto.loginId });
    }

    if (queryDto.verified !== undefined) {
      query.andWhere('seller.verified = :verified', {
        verified: queryDto.verified,
      });
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findOne(sellerId: string): Promise<Seller> {
    const seller = await this.sellerRepository.findOne({
      where: { sellerId: sellerId },
      relations: ['user', 'verifier'],
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    return seller;
  }

  async findByUserId(userId: string): Promise<Seller | null> {
    return await this.sellerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async update(
    sellerId: string,
    updateSellerDto: UpdateSellerDto,
  ): Promise<Seller> {
    const seller = await this.findOne(sellerId);
    Object.assign(seller, updateSellerDto);
    return await this.sellerRepository.save(seller);
  }

  async verify(sellerId: string, verifier: string) {
    const seller = await this.findOne(sellerId);
    const user = await this.usersService.findOne(seller.userId);

    if (seller.verified) {
      throw new ConflictException('Seller is already verified');
    }

    user.role = UserRole.SELLER;
    seller.verified = true;
    seller.verifiedAt = new Date();
    seller.verifiedBy = verifier;

    const defaultStore = this.storeRepository.create({
      sellerId: seller.sellerId,
      storeName: `${(await this.usersService.findOne(seller.userId)).name}'s Store`,
      storeDescription: 'Default store created upon seller verification',
      storeAddress: null,
      storeEmail: null,
      storePhone: null,
      averageRating: 0,
      totalRatings: 0,
    });

    await this.sellerRepository.save(seller);
    await this.userRepository.save(user);
    return await this.storeRepository.save(defaultStore);
  }

  async remove(sellerId: string): Promise<void> {
    const seller = await this.findOne(sellerId);
    if (seller.verified) {
      throw new ConflictException('Seller is already verified'); //already have a store
    }

    await this.sellerRepository.remove(seller);
  }
}
