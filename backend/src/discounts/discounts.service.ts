import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  LessThanOrEqual,
  MoreThan,
  FindOptionsWhere,
} from 'typeorm';
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
import { generateDiscountCode } from './utils/discount-code.generator';
import { SseService } from '../sse/sse.service';

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
    private readonly sseService: SseService,
  ) {}

  async adminCreate(
    createDto: CreateDiscountDto,
    createdById: string,
  ): Promise<Discount> {
    // Generate discount code with retry mechanism
    let discountCode: string;
    let retries = 0;
    const MAX_RETRIES = 5;

    do {
      discountCode = generateDiscountCode(createDto.discountType);
      const existing = await this.discountRepository.findOne({
        where: { discountCode },
      });

      if (!existing) break;

      retries++;
      if (retries >= MAX_RETRIES) {
        throw new ConflictException('Failed to generate unique discount code');
      }
    } while (retries < MAX_RETRIES);

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
      discountCode,
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
    // Generate discount code with retry mechanism
    let discountCode: string;
    let retries = 0;
    const MAX_RETRIES = 5;

    do {
      discountCode = generateDiscountCode(DiscountType.SPECIAL);
      const existing = await this.discountRepository.findOne({
        where: { discountCode },
      });

      if (!existing) break;

      retries++;
      if (retries >= MAX_RETRIES) {
        throw new ConflictException('Failed to generate unique discount code');
      }
    } while (retries < MAX_RETRIES);

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
      discountCode,
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
        startDatetime: LessThanOrEqual(now),
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

    const oldIsActive = discount.isActive;
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

    const updatedDiscount = await this.findOne(id);

    // Send SSE notification if isActive status changed
    if (oldIsActive !== updatedDiscount.isActive) {
      try {
        this.sseService.notifyDiscountStatusChange(
          updatedDiscount.discountId,
          updatedDiscount.isActive ? 'activated' : 'deactivated',
          {
            discountCode: updatedDiscount.discountCode,
            name: updatedDiscount.name,
            discountType: updatedDiscount.discountType,
          },
        );
      } catch (error) {
        console.error(
          'Failed to send SSE notification for discount update:',
          error,
        );
      }
    }

    return updatedDiscount;
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

    const oldIsActive = discount.isActive;
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

    const updatedDiscount = await this.findOne(id);

    // Send SSE notification if isActive status changed
    if (oldIsActive !== updatedDiscount.isActive) {
      try {
        this.sseService.notifyDiscountStatusChange(
          updatedDiscount.discountId,
          updatedDiscount.isActive ? 'activated' : 'deactivated',
          {
            discountCode: updatedDiscount.discountCode,
            name: updatedDiscount.name,
            discountType: updatedDiscount.discountType,
          },
        );
      } catch (error) {
        console.error(
          'Failed to send SSE notification for discount update:',
          error,
        );
      }
    }

    return updatedDiscount;
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

  /**
   * Get active shipping discount amount
   * Returns the shipping discount amount if there's an active shipping discount
   */
  async getActiveShippingDiscount(subtotal: number): Promise<number> {
    const now = new Date();

    const activeShippingDiscounts = await this.discountRepository.find({
      where: {
        discountType: DiscountType.SHIPPING,
        isActive: true,
        startDatetime: LessThanOrEqual(now),
        endDatetime: MoreThan(now),
      },
      relations: ['shippingDiscount'],
    });

    if (activeShippingDiscounts.length === 0) {
      return 0;
    }

    // Find the best shipping discount (highest amount) that applies
    let maxDiscount = 0;
    for (const discount of activeShippingDiscounts) {
      // Check if order meets minimum purchase requirement
      if (subtotal >= Number(discount.minPurchaseAmount)) {
        const discountAmount = Number(
          discount.shippingDiscount?.discountAmount || 0,
        );
        if (discountAmount > maxDiscount) {
          maxDiscount = discountAmount;
        }
      }
    }

    return maxDiscount;
  }

  /**
   * Get all available discounts for the given order
   * Returns all active discounts that meet the minimum purchase requirement
   */
  async getAvailableDiscounts(
    subtotal: number,
    storeIds: string[],
  ): Promise<Discount[]> {
    const now = new Date();

    // Get all active discounts meeting minimum purchase
    const activeDiscounts = await this.discountRepository.find({
      where: {
        isActive: true,
        startDatetime: LessThanOrEqual(now),
        endDatetime: MoreThan(now),
        minPurchaseAmount: LessThanOrEqual(subtotal),
      },
      relations: [
        'seasonalDiscount',
        'shippingDiscount',
        'specialDiscount',
        'specialDiscount.store',
      ],
    });

    // Filter by usage limits
    const available = activeDiscounts.filter(
      (d) => !d.usageLimit || d.usageCount < d.usageLimit,
    );

    // Filter special discounts (only return those matching current cart stores)
    return available.filter((d) => {
      if (d.discountType === DiscountType.SPECIAL) {
        return (
          d.specialDiscount?.storeId &&
          storeIds.includes(d.specialDiscount.storeId)
        );
      }
      return true;
    });
  }

  /**
   * Get recommended discount combination
   * Returns the best shipping and product discount for the given order
   */
  async getRecommendedDiscounts(
    subtotal: number,
    storeIds: string[],
  ): Promise<{
    shipping: { code: string; name: string; amount: number } | null;
    product: {
      code: string;
      name: string;
      amount: number;
      type: string;
    } | null;
    totalSavings: number;
  }> {
    const now = new Date();

    // Get all active discounts meeting minimum purchase
    const activeDiscounts = await this.discountRepository.find({
      where: {
        isActive: true,
        startDatetime: LessThanOrEqual(now),
        endDatetime: MoreThan(now),
        minPurchaseAmount: LessThanOrEqual(subtotal),
      },
      relations: [
        'seasonalDiscount',
        'shippingDiscount',
        'specialDiscount',
        'specialDiscount.store',
      ],
    });

    // Filter by usage limits
    const available = activeDiscounts.filter(
      (d) => !d.usageLimit || d.usageCount < d.usageLimit,
    );

    // Find best shipping discount (highest amount)
    const shippingDiscounts = available.filter(
      (d) => d.discountType === DiscountType.SHIPPING,
    );
    const bestShipping = shippingDiscounts.reduce<Discount | null>(
      (best, current) => {
        const currentAmount = Number(
          current.shippingDiscount?.discountAmount || 0,
        );
        const bestAmount = Number(best?.shippingDiscount?.discountAmount || 0);
        return currentAmount > bestAmount ? current : best;
      },
      null,
    );

    // Calculate best product discount
    const productDiscounts = available.filter(
      (d) =>
        d.discountType === DiscountType.SEASONAL ||
        (d.discountType === DiscountType.SPECIAL &&
          d.specialDiscount?.storeId &&
          storeIds.includes(d.specialDiscount.storeId)),
    );

    let bestProduct: Discount | null = null;
    let bestProductAmount = 0;

    for (const discount of productDiscounts) {
      let amount = 0;

      if (discount.discountType === DiscountType.SEASONAL) {
        const rate = Number(discount.seasonalDiscount?.discountRate || 0);
        const max = Number(
          discount.seasonalDiscount?.maxDiscountAmount || Infinity,
        );
        amount = Math.floor(Math.min(subtotal * rate, max));
      } else if (discount.discountType === DiscountType.SPECIAL) {
        // For SPECIAL, we approximate with full subtotal (frontend will calculate per-store)
        const rate = Number(discount.specialDiscount?.discountRate || 0);
        const max = Number(
          discount.specialDiscount?.maxDiscountAmount || Infinity,
        );
        amount = Math.floor(Math.min(subtotal * rate, max));
      }

      if (amount > bestProductAmount) {
        bestProduct = discount;
        bestProductAmount = amount;
      }
    }

    const shippingAmount = bestShipping
      ? Number(bestShipping.shippingDiscount?.discountAmount || 0)
      : 0;

    return {
      shipping: bestShipping
        ? {
            code: bestShipping.discountCode,
            name: bestShipping.name,
            amount: shippingAmount,
          }
        : null,
      product: bestProduct
        ? {
            code: bestProduct.discountCode,
            name: bestProduct.name,
            amount: bestProductAmount,
            type: bestProduct.discountType.toLowerCase(),
          }
        : null,
      totalSavings: shippingAmount + bestProductAmount,
    };
  }
}
