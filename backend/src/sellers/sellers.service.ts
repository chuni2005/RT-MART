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
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    private readonly usersService: UsersService,
  ) {}

  async create(createSellerDto: CreateSellerDto): Promise<Seller> {
    // Check if user exists and is not already a seller
    const user = await this.usersService.findOne(createSellerDto.userId);

    if (user.role !== UserRole.BUYER && user.role !== UserRole.SELLER) {
      throw new BadRequestException('Only buyers can become sellers');
    }

    const existingSeller = await this.sellerRepository.findOne({
      where: { userId: createSellerDto.userId },
    });

    if (existingSeller) {
      throw new ConflictException('User is already a seller');
    }

    const seller = this.sellerRepository.create(createSellerDto);
    const savedSeller = await this.sellerRepository.save(seller);

    // Update user role to seller using internal method
    await this.usersService.updateRole(createSellerDto.userId, UserRole.SELLER);

    return savedSeller;
  }

  async findAll(): Promise<Seller[]> {
    return await this.sellerRepository.find({
      relations: ['user'],
      order: { sellerId: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Seller> {
    const seller = await this.sellerRepository.findOne({
      where: { sellerId: id },
      relations: ['user', 'verifier'],
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${id} not found`);
    }

    return seller;
  }

  async findByUserId(userId: string): Promise<Seller | null> {
    return await this.sellerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async update(id: string, updateSellerDto: UpdateSellerDto): Promise<Seller> {
    const seller = await this.findOne(id);
    Object.assign(seller, updateSellerDto);
    return await this.sellerRepository.save(seller);
  }

  async verify(id: string, verifyDto: VerifySellerDto): Promise<Seller> {
    const seller = await this.findOne(id);

    if (seller.verified) {
      throw new ConflictException('Seller is already verified');
    }

    // Verify that the verifier is an admin
    const verifier = await this.usersService.findOne(verifyDto.verifiedBy);
    if (verifier.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only admins can verify sellers');
    }

    seller.verified = true;
    seller.verifiedAt = new Date();
    seller.verifiedBy = verifyDto.verifiedBy;

    return await this.sellerRepository.save(seller);
  }

  async remove(id: string): Promise<void> {
    const seller = await this.findOne(id);
    await this.sellerRepository.remove(seller);
  }
}
