import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import {
  UpdateInventoryDto,
  ReserveInventoryDto,
  ReleaseInventoryDto,
} from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  async createForProduct(
    productId: string,
    initialQuantity: number = 0,
  ): Promise<Inventory> {
    const inventory = this.inventoryRepository.create({
      productId,
      quantity: initialQuantity,
      reserved: 0,
    });

    return await this.inventoryRepository.save(inventory);
  }

  async findByProduct(productId: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { productId },
      relations: ['product'],
    });

    if (!inventory) {
      throw new NotFoundException(
        `Inventory for product ${productId} not found`,
      );
    }

    return inventory;
  }

  async updateQuantity(
    productId: string,
    updateDto: UpdateInventoryDto,
  ): Promise<Inventory> {
    const inventory = await this.findByProduct(productId);
    inventory.quantity = updateDto.quantity;
    return await this.inventoryRepository.save(inventory);
  }

  async reserveStock(
    productId: string,
    reserveDto: ReserveInventoryDto,
  ): Promise<Inventory> {
    const inventory = await this.findByProduct(productId);

    // Check if enough stock is available
    const availableStock = inventory.quantity - inventory.reserved;
    if (availableStock < reserveDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${availableStock}, Requested: ${reserveDto.quantity}`,
      );
    }

    inventory.reserved += reserveDto.quantity;
    return await this.inventoryRepository.save(inventory);
  }

  async releaseReserved(
    productId: string,
    releaseDto: ReleaseInventoryDto,
  ): Promise<Inventory> {
    const inventory = await this.findByProduct(productId);

    if (inventory.reserved < releaseDto.quantity) {
      throw new BadRequestException(
        'Cannot release more than reserved quantity',
      );
    }

    inventory.reserved -= releaseDto.quantity;
    return await this.inventoryRepository.save(inventory);
  }

  async commitReserved(
    productId: string,
    quantity: number,
  ): Promise<Inventory> {
    const inventory = await this.findByProduct(productId);

    if (inventory.reserved < quantity) {
      throw new BadRequestException(
        'Cannot commit more than reserved quantity',
      );
    }

    inventory.quantity -= quantity;
    inventory.reserved -= quantity;

    if (inventory.quantity < 0) {
      throw new BadRequestException('Inventory quantity cannot be negative');
    }

    return await this.inventoryRepository.save(inventory);
  }

  async getAvailableStock(productId: string): Promise<number> {
    const inventory = await this.findByProduct(productId);
    return inventory.quantity - inventory.reserved;
  }

  async checkStockAvailability(
    productId: string,
    requestedQuantity: number,
  ): Promise<boolean> {
    const availableStock = await this.getAvailableStock(productId);
    return availableStock >= requestedQuantity;
  }
}
