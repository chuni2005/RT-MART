import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { SellersService } from '../sellers/sellers.service';
import { StoresService } from '../stores/stores.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly storesService: StoresService,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
    private readonly sellerService: SellersService,
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
    userId: string,
    productId: string,
    updateDto: UpdateInventoryDto,
  ): Promise<Inventory> {
    const seller = await this.sellerService.findByUserId(userId);
    if (!seller) {
      throw new ForbiddenException('Not a seller role account');
    }

    const store = await this.storesService.findBySeller(seller.sellerId);
    if (!store) {
      throw new NotFoundException("Can't find the store of this seller acount");
    }

    const product = await this.productsService.findOne(productId, true);
    if (product.storeId != store.storeId) {
      throw new ForbiddenException('Not own this product');
    }

    const inventory = await this.findByProduct(productId);
    inventory.quantity = updateDto.quantity;
    return await this.inventoryRepository.save(inventory);
  }

  // async reserveStock(
  //   productId: string,
  //   reserveDto: ReserveInventoryDto,
  // ): Promise<Inventory> {
  //   const inventory = await this.findByProduct(productId);

  //   // Check if enough stock is available
  //   const availableStock = inventory.quantity - inventory.reserved;
  //   if (availableStock < reserveDto.quantity) {
  //     throw new BadRequestException(
  //       `Insufficient stock. Available: ${availableStock}, Requested: ${reserveDto.quantity}`,
  //     );
  //   }

  //   inventory.reserved += reserveDto.quantity;
  //   return await this.inventoryRepository.save(inventory);
  // }

  // async releaseReserved(
  //   productId: string,
  //   releaseDto: ReleaseInventoryDto,
  // ): Promise<Inventory> {
  //   const inventory = await this.findByProduct(productId);

  //   if (inventory.reserved < releaseDto.quantity) {
  //     throw new BadRequestException(
  //       'Cannot release more than reserved quantity',
  //     );
  //   }

  //   inventory.reserved -= releaseDto.quantity;
  //   return await this.inventoryRepository.save(inventory);
  // }

  async orderCreated(
    productId: string,
    numOfOrderItems: number,
  ): Promise<Inventory> {
    const inventory = await this.findByProduct(productId);

    if (inventory.quantity < numOfOrderItems) {
      throw new BadRequestException('Quentity is not enough');
    }

    inventory.quantity -= numOfOrderItems;
    inventory.reserved += numOfOrderItems;
    return await this.inventoryRepository.save(inventory);
  }

  async orderShipped(
    productId: string,
    numOfOrderItems: number,
  ): Promise<Inventory> {
    const inventory = await this.findByProduct(productId);

    if (inventory.reserved < numOfOrderItems) {
      throw new BadRequestException('Reserved quantity is not enougth');
    }
    inventory.reserved -= numOfOrderItems;
    return await this.inventoryRepository.save(inventory);
  }

  async orderCancel(
    productId: string,
    numOfOrderItems: number,
  ): Promise<Inventory> {
    const inventory = await this.findByProduct(productId);

    if (inventory.quantity < numOfOrderItems) {
      throw new BadRequestException('Quentity is not enough');
    }

    inventory.reserved -= numOfOrderItems;
    inventory.quantity += numOfOrderItems;
    return await this.inventoryRepository.save(inventory);
  }

  async getAvailableStock(productId: string): Promise<number> {
    const inventory = await this.findByProduct(productId);
    return inventory.quantity;
  }

  async checkStockAvailability(
    productId: string,
    requestedQuantity: number,
  ): Promise<boolean> {
    const availableStock = await this.getAvailableStock(productId);
    return availableStock >= requestedQuantity;
  }
}
