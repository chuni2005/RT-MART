import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, FindOptionsWhere } from 'typeorm';
import {
  Discount,
  DiscountType,
  CreatedByType,
} from './entities/discount.entity';
import { SeasonalDiscount } from './entities/seasonal-discount.entity';
import { ShippingDiscount } from './entities/shipping-discount.entity';
import { SpecialDiscount } from './entities/special-discount.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { QueryDiscountDto } from './dto/query-discount.dto';

@Injectable()
export class DiscountsService {
  constructor(
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
    @InjectRepository(SeasonalDiscount)
    private readonly seasonalRepository: Repository<SeasonalDiscount>,
    @InjectRepository(ShippingDiscount)
    private readonly shippingRepository: Repository<ShippingDiscount>,
    @InjectRepository(SpecialDiscount)
    private readonly specialRepository: Repository<SpecialDiscount>,
  ) {}

  async adminCreate(
    createDto: CreateDiscountDto,
    createdById: string,
  ): Promise<Discount> {
    // Check if discount code already exists
    const existing = await this.discountRepository.findOne({
      where: { discountCode: createDto.discountCode },
    });

    if (existing) {
      throw new ConflictException('Discount code already exists');
    }

    // Validate dates
    if (new Date(createDto.startDatetime) >= new Date(createDto.endDatetime)) {
      throw new BadRequestException('End date must be after start date');
    }

    // Separate base discount data from specific details
    const {
      seasonalDetails,
      shippingDetails,
      specialDetails,
      ...baseDiscountData
    } = createDto;

    // Create base discount
    const discount = this.discountRepository.create({
      ...baseDiscountData,
      createdByType: CreatedByType.SYSTEM,
      createdById,
    });

    const savedDiscount = await this.discountRepository.save(discount);

    // Create type-specific discount
    switch (createDto.discountType) {
      case DiscountType.SEASONAL: {
        if (!seasonalDetails) {
          throw new BadRequestException(
            'Seasonal discount details are required',
          );
        }
        const seasonal = this.seasonalRepository.create({
          discountId: savedDiscount.discountId,
          ...seasonalDetails,
        });
        await this.seasonalRepository.save(seasonal);
        break;
      }

      case DiscountType.SHIPPING: {
        if (!shippingDetails) {
          throw new BadRequestException(
            'Shipping discount details are required',
          );
        }
        const shipping = this.shippingRepository.create({
          discountId: savedDiscount.discountId,
          ...shippingDetails,
        });
        await this.shippingRepository.save(shipping);
        break;
      }

      case DiscountType.SPECIAL: {
        if (!specialDetails) {
          throw new BadRequestException(
            'Special discount details are required',
          );
        }
        const special = this.specialRepository.create({
          discountId: savedDiscount.discountId,
          ...specialDetails,
        });
        await this.specialRepository.save(special);
        break;
      }
    }

    return await this.findOne(savedDiscount.discountId);
  }

  async sellerCreate(
    createDto: CreateDiscountDto,
    createdById: string,
  ): Promise<Discount> {
    // Check if discount code already exists
    const existing = await this.discountRepository.findOne({
      where: { discountCode: createDto.discountCode },
    });

    if (existing) {
      throw new ConflictException('Discount code already exists');
    }

    // Validate dates
    if (new Date(createDto.startDatetime) >= new Date(createDto.endDatetime)) {
      throw new BadRequestException('End date must be after start date');
    }

    if (createDto.discountType !== DiscountType.SPECIAL) {
      throw new ForbiddenException('Seller can only create special discount');
    }

    // Separate base discount data from specific details
    const { specialDetails, ...baseDiscountData } = createDto;

    // Create base discount
    const discount = this.discountRepository.create({
      ...baseDiscountData,
      createdByType: CreatedByType.SELLER,
      createdById,
    });

    const savedDiscount = await this.discountRepository.save(discount);

    // Create type-specific discount
    if (!specialDetails) {
      throw new BadRequestException('Special discount details are required');
    }
    const special = this.specialRepository.create({
      discountId: savedDiscount.discountId,
      ...specialDetails,
    });
    await this.specialRepository.save(special);
    return await this.findOne(savedDiscount.discountId);
  }

  async findAll(
    queryDto: QueryDiscountDto,
  ): Promise<{ data: Discount[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Discount> = {};

    if (queryDto.discountType) {
      where.discountType = queryDto.discountType;
    }

    if (queryDto.isActive !== undefined) {
      where.isActive = queryDto.isActive;
    }

    if (queryDto.createdById) {
      where.createdById = queryDto.createdById;
    }

    if (queryDto.storeId) {
      where.specialDiscount = { storeId: queryDto.storeId };
    }

    const [data, total] = await this.discountRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['seasonalDiscount', 'shippingDiscount', 'specialDiscount'],
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { discountId: id },
      relations: [
        'seasonalDiscount',
        'shippingDiscount',
        'specialDiscount',
        'specialDiscount.store',
        'specialDiscount.productType',
      ],
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    return discount;
  }

  async findByCode(code: string): Promise<Discount | null> {
    return await this.discountRepository.findOne({
      where: { discountCode: code },
      relations: ['seasonalDiscount', 'shippingDiscount', 'specialDiscount'],
    });
  }

  async findActiveDiscounts(): Promise<Discount[]> {
    const now = new Date();
    return await this.discountRepository.find({
      where: {
        isActive: true,
        startDatetime: LessThan(now),
        endDatetime: MoreThan(now),
      },
      relations: ['seasonalDiscount', 'shippingDiscount', 'specialDiscount'],
    });
  }

  async update(
    userId: string,
    id: string,
    updateDto: UpdateDiscountDto,
  ): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { discountId: id, createdById: userId },
      relations: [
        'seasonalDiscount',
        'shippingDiscount',
        'specialDiscount',
        'specialDiscount.store',
        'specialDiscount.productType',
      ],
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    if (updateDto.startDatetime && updateDto.endDatetime) {
      if (
        new Date(updateDto.startDatetime) >= new Date(updateDto.endDatetime)
      ) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Separate base discount data from specific details
    const {
      seasonalDetails,
      shippingDetails,
      specialDetails,
      ...baseDiscountData
    } = updateDto;

    Object.assign(discount, baseDiscountData);
    await this.discountRepository.save(discount);

    // Update type-specific discount if provided
    if (seasonalDetails && discount.seasonalDiscount) {
      Object.assign(discount.seasonalDiscount, seasonalDetails);
      await this.seasonalRepository.save(discount.seasonalDiscount);
    }

    if (shippingDetails && discount.shippingDiscount) {
      Object.assign(discount.shippingDiscount, shippingDetails);
      await this.shippingRepository.save(discount.shippingDiscount);
    }

    if (specialDetails && discount.specialDiscount) {
      Object.assign(discount.specialDiscount, specialDetails);
      await this.specialRepository.save(discount.specialDiscount);
    }

    return await this.findOne(id);
  }

  async adminUpdate(
    id: string,
    updateDto: UpdateDiscountDto,
  ): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { discountId: id },
      relations: [
        'seasonalDiscount',
        'shippingDiscount',
        'specialDiscount',
        'specialDiscount.store',
        'specialDiscount.productType',
      ],
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    if (updateDto.startDatetime && updateDto.endDatetime) {
      if (
        new Date(updateDto.startDatetime) >= new Date(updateDto.endDatetime)
      ) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Separate base discount data from specific details
    const {
      seasonalDetails,
      shippingDetails,
      specialDetails,
      ...baseDiscountData
    } = updateDto;

    Object.assign(discount, baseDiscountData);
    await this.discountRepository.save(discount);

    // Update type-specific discount if provided
    if (seasonalDetails && discount.seasonalDiscount) {
      Object.assign(discount.seasonalDiscount, seasonalDetails);
      await this.seasonalRepository.save(discount.seasonalDiscount);
    }

    if (shippingDetails && discount.shippingDiscount) {
      Object.assign(discount.shippingDiscount, shippingDetails);
      await this.shippingRepository.save(discount.shippingDiscount);
    }

    if (specialDetails && discount.specialDiscount) {
      Object.assign(discount.specialDiscount, specialDetails);
      await this.specialRepository.save(discount.specialDiscount);
    }

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const discount = await this.findOne(id);
    await this.discountRepository.remove(discount);
  }

  async incrementUsage(id: string): Promise<void> {
    await this.discountRepository.increment(
      { discountId: id },
      'usageCount',
      1,
    );
  }

  async validateDiscount(
    code: string,
    orderAmount: number,
  ): Promise<{
    valid: boolean;
    discount?: Discount;
    reason?: string;
  }> {
    const discount = await this.findByCode(code);

    if (!discount) {
      return { valid: false, reason: 'Discount code not found' };
    }

    if (!discount.isActive) {
      return { valid: false, reason: 'Discount is not active' };
    }

    const now = new Date();
    if (now < discount.startDatetime) {
      return { valid: false, reason: 'Discount has not started yet' };
    }

    if (now > discount.endDatetime) {
      return { valid: false, reason: 'Discount has expired' };
    }

    if (orderAmount < Number(discount.minPurchaseAmount)) {
      return {
        valid: false,
        reason: `Minimum purchase amount is ${discount.minPurchaseAmount}`,
      };
    }

    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return { valid: false, reason: 'Discount usage limit reached' };
    }

    return { valid: true, discount };
  }
}
