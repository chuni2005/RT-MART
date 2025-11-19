import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartHistory } from './entities/cart-history.entity';
import { CreateCartHistoryDto } from './dto/create-cart-history.dto';

@Injectable()
export class CartHistoryService {
  constructor(
    @InjectRepository(CartHistory)
    private readonly cartHistoryRepository: Repository<CartHistory>,
  ) {}

  async create(
    userId: string,
    createDto: CreateCartHistoryDto,
  ): Promise<CartHistory> {
    const cartHistory = this.cartHistoryRepository.create({
      userId,
      ...createDto,
    });

    return await this.cartHistoryRepository.save(cartHistory);
  }

  async findAllByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: CartHistory[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.cartHistoryRepository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findOne(id: string, userId: string): Promise<CartHistory> {
    const cartHistory = await this.cartHistoryRepository.findOne({
      where: { cartHistoryId: id, userId },
    });

    if (!cartHistory) {
      throw new NotFoundException(`Cart history with ID ${id} not found`);
    }

    return cartHistory;
  }

  async saveCartSnapshot(
    userId: string,
    cartSnapshot: object,
    itemCount: number,
  ): Promise<CartHistory> {
    return await this.create(userId, {
      cartSnapshot,
      itemCount,
    });
  }

  async linkOrdersToSnapshot(
    id: string,
    orderIds: string[],
  ): Promise<CartHistory> {
    const cartHistory = await this.cartHistoryRepository.findOne({
      where: { cartHistoryId: id },
    });

    if (!cartHistory) {
      throw new NotFoundException(`Cart history with ID ${id} not found`);
    }

    cartHistory.orderIds = orderIds;
    return await this.cartHistoryRepository.save(cartHistory);
  }
}
