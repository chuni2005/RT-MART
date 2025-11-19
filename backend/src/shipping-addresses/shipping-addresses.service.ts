import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingAddress } from './entities/shipping-address.entity';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';

@Injectable()
export class ShippingAddressesService {
  constructor(
    @InjectRepository(ShippingAddress)
    private readonly addressRepository: Repository<ShippingAddress>,
  ) {}

  async create(
    userId: string,
    createDto: CreateShippingAddressDto,
  ): Promise<ShippingAddress> {
    // If this is set as default, unset other default addresses
    if (createDto.isDefault) {
      await this.unsetDefaultAddresses(userId);
    }

    const address = this.addressRepository.create({
      ...createDto,
      userId,
    });

    return await this.addressRepository.save(address);
  }

  async findAllByUser(userId: string): Promise<ShippingAddress[]> {
    return await this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', addressId: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<ShippingAddress> {
    const address = await this.addressRepository.findOne({
      where: { addressId: id, userId },
    });

    if (!address) {
      throw new NotFoundException(`Shipping address with ID ${id} not found`);
    }

    return address;
  }

  async findDefaultAddress(userId: string): Promise<ShippingAddress | null> {
    return await this.addressRepository.findOne({
      where: { userId, isDefault: true },
    });
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateShippingAddressDto,
  ): Promise<ShippingAddress> {
    const address = await this.findOne(id, userId);

    // If setting as default, unset other default addresses
    if (updateDto.isDefault) {
      await this.unsetDefaultAddresses(userId);
    }

    Object.assign(address, updateDto);
    return await this.addressRepository.save(address);
  }

  async setAsDefault(id: string, userId: string): Promise<ShippingAddress> {
    const address = await this.findOne(id, userId);

    // Unset other default addresses
    await this.unsetDefaultAddresses(userId);

    address.isDefault = true;
    return await this.addressRepository.save(address);
  }

  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findOne(id, userId);
    await this.addressRepository.remove(address);
  }

  private async unsetDefaultAddresses(userId: string): Promise<void> {
    await this.addressRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
  }
}
