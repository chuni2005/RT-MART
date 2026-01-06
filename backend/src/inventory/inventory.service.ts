import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
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

  async findByProduct(productId: string, manager?: any): Promise<Inventory> {
    const repo = manager
      ? manager.getRepository(Inventory)
      : this.inventoryRepository;
    const inventory = await repo.findOne({
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

  async orderCreated(
    productId: string,
    numOfOrderItems: number,
    manager?: any,
  ): Promise<Inventory> {
    const inventory = await this.findByProduct(productId, manager);

    if (inventory.quantity < numOfOrderItems) {
      throw new BadRequestException('Quantity is not enough');
    }

    inventory.quantity -= numOfOrderItems;
    inventory.reserved += numOfOrderItems;

    const repo = manager
      ? manager.getRepository(Inventory)
      : this.inventoryRepository;
    return await repo.save(inventory);
  }

  async orderShipped(
    productId: string,
    numOfOrderItems: number,
    manager?: any,
  ): Promise<Inventory> {
    const inventory = await this.findByProduct(productId, manager);

    if (inventory.reserved < numOfOrderItems) {
      // 如果預留數量不足，且現貨也不足，才報錯（容錯處理：可能是歷史數據或同步問題）
      if (inventory.reserved + inventory.quantity < numOfOrderItems) {
        throw new BadRequestException('Reserved quantity is not enough');
      }
      // 容錯：如果 reserved 不足但總庫存夠，直接從總庫存扣除剩餘部分
      const diff = numOfOrderItems - inventory.reserved;
      inventory.reserved = 0;
      inventory.quantity -= diff;
    } else {
      inventory.reserved -= numOfOrderItems;
    }

    const repo = manager
      ? manager.getRepository(Inventory)
      : this.inventoryRepository;
    return await repo.save(inventory);
  }

  async orderCancel(
    productId: string,
    numOfOrderItems: number,
    manager?: any,
  ): Promise<Inventory> {
    const inventory = await this.findByProduct(productId, manager);

    // 修正：取消訂單時檢查的是預留數量，而不是可用庫存
    if (inventory.reserved < numOfOrderItems) {
      // 容錯處理：如果預留不足，至少也要退回現有預留
      inventory.quantity += inventory.reserved;
      inventory.reserved = 0;
    } else {
      inventory.reserved -= numOfOrderItems;
      inventory.quantity += numOfOrderItems;
    }

    const repo = manager
      ? manager.getRepository(Inventory)
      : this.inventoryRepository;
    return await repo.save(inventory);
  }

  async getAvailableStock(
    productId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const inventory = await this.findByProduct(productId, manager);
    return inventory.quantity;
  }

  async checkStockAvailability(
    productId: string,
    requestedQuantity: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    const availableStock = await this.getAvailableStock(productId, manager);
    return availableStock >= requestedQuantity;
  }
}
