import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { ProductType } from './entities/product-type.entity';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';

@Injectable()
export class ProductTypesService {
  constructor(
    @InjectRepository(ProductType)
    private readonly productTypeRepository: TreeRepository<ProductType>,
  ) { }

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
      return productTypes.filter(pt => pt.typeName.includes(queryDto.typeName));
    }

    if (queryDto.typeCode) {
      return productTypes.filter(pt => pt.typeCode.includes(queryDto.typeCode));
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

  // async findTree(): Promise<ProductType[]> {
  //   return await this.productTypeRepository.findTrees();
  // }

  async findOne(id: string): Promise<ProductType> {
    const productType = await this.productTypeRepository.findOne({
      where: { productTypeId: id, isActive: true },
      relations: ['parent', 'children'],
    });

    if (!productType) {
      throw new NotFoundException(`Product type with ID ${id} not found`);
    }

    return productType;
  }

  async findByCode(code: string): Promise<ProductType | null> {
    return await this.productTypeRepository.findOne({
      where: { typeCode: code },
    });
  }

  async findChildren(id: string): Promise<ProductType[]> {
    const productType = await this.findOne(id);
    return await this.productTypeRepository.findDescendants(productType);
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
