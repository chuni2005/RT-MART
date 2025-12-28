import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductType } from './entities/product-type.entity';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';

@Injectable()
export class ProductTypesService {
  constructor(
    @InjectRepository(ProductType)
    private readonly productTypeRepository: Repository<ProductType>,
  ) {}

  async create(createDto: CreateProductTypeDto): Promise<ProductType> {
    // Check if typeCode already exists
    const existing = await this.productTypeRepository.findOne({
      where: { typeCode: createDto.typeCode },
    });

    if (existing) {
      throw new ConflictException('Product type code already exists');
    }

    // Verify parent exists if provided
    if (createDto.parentTypeId) {
      const parent = await this.findOne(createDto.parentTypeId);
      if (!parent) {
        throw new NotFoundException('Parent product type not found');
      }
    }

    const productType = this.productTypeRepository.create(createDto);
    return await this.productTypeRepository.save(productType);
  }

  async findAll(queryDto: any): Promise<ProductType[]> {
    const productTypes = await this.productTypeRepository.find({
      order: { typeCode: 'ASC' },
      where: { isActive: true },
    });

    if (queryDto.typeName) {
      return productTypes.filter((pt) =>
        pt.typeName.includes(queryDto.typeName),
      );
    }

    if (queryDto.typeCode) {
      return productTypes.filter((pt) =>
        pt.typeCode.includes(queryDto.typeCode),
      );
    }

    return productTypes;
  }

  async adminFindAll(): Promise<ProductType[]> {
    return await this.productTypeRepository.find({
      order: { typeCode: 'ASC' },
      relations: ['parent', 'children'],
    });
  }

  async adminFindOne(id: string): Promise<ProductType> {
    const productType = await this.productTypeRepository.findOne({
      where: { productTypeId: id },
      relations: ['parent', 'children'],
    });

    if (!productType) {
      throw new NotFoundException(`Product type with ID ${id} not found`);
    }

    return productType;
  }

  /**
   * 取得單一分類，並遞迴取得所有父級分類 (疊代實現以防止堆疊溢出)
   */
  async findOne(id: string): Promise<ProductType> {
    const MAX_DEPTH = 10;
    const visited = new Set<string>([id]);

    const productType = await this.productTypeRepository.findOne({
      where: { productTypeId: id, isActive: true },
      relations: ['parent'],
    });

    if (!productType) {
      throw new NotFoundException(`Product type with ID ${id} not found`);
    }

    let current = productType;
    let depth = 0;

    while (current.parent && depth < MAX_DEPTH) {
      const parentId = current.parent.productTypeId;

      if (visited.has(parentId)) {
        // 偵測到循環引用，中斷關聯以防止無限循環
        current.parent = undefined;
        break;
      }
      visited.add(parentId);

      const parent = await this.productTypeRepository.findOne({
        where: { productTypeId: parentId, isActive: true },
        relations: ['parent'],
      });

      if (!parent) {
        current.parent = undefined;
        break;
      }

      current.parent = parent;
      current = parent;
      depth++;
    }

    // 若達到最大深度仍有父級，則切斷關聯以避免過深
    if (current.parent && depth >= MAX_DEPTH) {
      current.parent = undefined;
    }

    return productType;
  }

  /**
   * 獲取所有子分類的 ID (包含自己) (疊代實現以防止堆疊溢出)
   */
  async getDescendantIds(id: string): Promise<string[]> {
    const ids: string[] = [];
    const stack: string[] = [id];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const currentId = stack.pop()!;

      if (visited.has(currentId)) continue;
      visited.add(currentId);
      ids.push(currentId);

      const children = await this.productTypeRepository.find({
        where: { parentTypeId: currentId, isActive: true },
        select: ['productTypeId'],
      });

      for (const child of children) {
        stack.push(child.productTypeId);
      }
    }

    return ids;
  }

  async findByCode(code: string): Promise<ProductType | null> {
    return await this.productTypeRepository.findOne({
      where: { typeCode: code },
    });
  }

  async findChildren(id: string): Promise<ProductType[]> {
    // 檢查該分類是否存在，但不使用遞迴或抓取過多關聯
    const productType = await this.productTypeRepository.findOne({
      where: { productTypeId: id },
      select: ['productTypeId'],
    });

    if (!productType) {
      throw new NotFoundException(`Product type with ID ${id} not found`);
    }

    return await this.productTypeRepository.find({
      where: { parentTypeId: id, isActive: true },
    });
  }

  async update(
    id: string,
    updateDto: UpdateProductTypeDto,
  ): Promise<ProductType> {
    const productType = await this.findOne(id);

    // Verify parent exists if being updated
    if (updateDto.parentTypeId) {
      const parent = await this.adminFindOne(updateDto.parentTypeId);
      if (!parent) {
        throw new NotFoundException('Parent product type not found');
      }

      // Prevent circular reference
      if (updateDto.parentTypeId === id) {
        throw new ConflictException('Product type cannot be its own parent');
      }
    }

    Object.assign(productType, updateDto);
    return await this.productTypeRepository.save(productType);
  }

  async remove(id: string): Promise<void> {
    const productType = await this.adminFindOne(id);
    await this.productTypeRepository.remove(productType);
  }
}
