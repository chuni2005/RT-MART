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
    if (!createSellerDto.userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.usersService.findOne(createSellerDto.userId);

    if (!user || user.role == UserRole.ADMIN || user.role == UserRole.SELLER) {
      throw new BadRequestException('Only buyers can become sellers');
    }

    const existingSeller = await this.findByUserId(createSellerDto.userId);

    // If existing seller found
    if (existingSeller) {
      // If already verified, can't apply again
      if (existingSeller.verified) {
        throw new ConflictException('您已經是賣家了');
      }

      // If rejected, check if 30 days have passed
      if (existingSeller.rejectedAt) {
        const daysSinceRejection = Math.floor(
          (Date.now() - new Date(existingSeller.rejectedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (daysSinceRejection < 30) {
          throw new BadRequestException(
            `您的申請已被拒絕，請於 ${30 - daysSinceRejection} 天後重新申請`,
          );
        }

        // Reuse existing record - reset status
        existingSeller.verified = false;
        existingSeller.verifiedAt = null;
        existingSeller.verifiedBy = null;
        existingSeller.rejectedAt = null;
        existingSeller.bankAccountReference =
          createSellerDto.bankAccountReference || null;
        existingSeller.updatedAt = new Date();

        return await this.sellerRepository.save(existingSeller);
      }

      // Already has pending application
      throw new ConflictException('您已經有一個待審核的申請，請等待審核結果');
    }

    // Create new seller
    const seller = this.sellerRepository.create(createSellerDto);
    const savedSeller = await this.sellerRepository.save(seller);

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
      .orderBy('seller.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (queryDto.loginId) {
      query.andWhere('user.loginId = :loginId', { loginId: queryDto.loginId });
    }

    // Filter by status
    if (queryDto.status) {
      if (queryDto.status === 'pending') {
        query.andWhere('seller.verified = :verified', { verified: false });
        query.andWhere('seller.rejectedAt IS NULL');
      } else if (queryDto.status === 'approved') {
        query.andWhere('seller.verified = :verified', { verified: true });
      } else if (queryDto.status === 'rejected') {
        query.andWhere('seller.rejectedAt IS NOT NULL');
      }
    }

    // Legacy support for verified parameter
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

    if (seller.rejectedAt) {
      throw new ConflictException('Seller application has been rejected');
    }

    user.role = UserRole.SELLER;
    seller.verified = true;
    seller.verifiedAt = new Date();
    seller.verifiedBy = verifier;
    seller.updatedAt = new Date();

    // 创建默认商店
    const storeName = `${user.name}'s Store`;

    const defaultStore = this.storeRepository.create({
      sellerId: seller.sellerId,
      storeName: storeName,
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

  async reject(sellerId: string): Promise<Seller> {
    const seller = await this.findOne(sellerId);

    if (seller.verified) {
      throw new ConflictException('Seller is already verified');
    }

    if (seller.rejectedAt) {
      throw new ConflictException('Seller is already rejected');
    }

    seller.rejectedAt = new Date();
    seller.updatedAt = new Date();

    // TODO: Send rejection email via NodeMail (future implementation)

    return await this.sellerRepository.save(seller);
  }

  async remove(sellerId: string): Promise<void> {
    const seller = await this.findOne(sellerId);
    if (seller.verified) {
      throw new ConflictException('Seller is already verified'); //already have a store
    }

    await this.sellerRepository.remove(seller);
  }
}
