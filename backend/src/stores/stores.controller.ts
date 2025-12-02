import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import type { AuthRequest } from '../common/types';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  async create(@Req() req: AuthRequest, @Body() createDto: CreateStoreDto) {
    // Get seller ID from user
    const seller = await this.storesService['sellersService'].findByUserId(
      req.user.userId,
    );
    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }
    return await this.storesService.create(seller.sellerId, createDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryStoreDto) {
    const { data, total } = await this.storesService.findAll(queryDto);
    return {
      data,
      total,
      page: parseInt(queryDto.page || '1', 10),
      limit: parseInt(queryDto.limit || '10', 10),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.storesService.findOne(id);
  }

  @Get('seller/:sellerId')
  async findBySeller(@Param('sellerId') sellerId: string) {
    return await this.storesService.findBySeller(sellerId);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  async update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateDto: UpdateStoreDto,
  ) {
    const seller = await this.storesService['sellersService'].findByUserId(
      req.user.userId,
    );
    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }
    return await this.storesService.update(id, seller.sellerId, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  async remove(@Req() req: AuthRequest, @Param('id') id: string) {
    const seller = await this.storesService['sellersService'].findByUserId(
      req.user.userId,
    );
    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }
    await this.storesService.remove(id, seller.sellerId);
    return { message: 'Store deleted successfully' };
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Delete(':storeId/permanent')
  async hardRemove(@Param('storeId') storeId: string) {
    await this.storesService.permanentlyDelete(storeId);
    return { message: 'User permanently deleted successfully' };
  }

  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'stores',
      timestamp: new Date().toISOString(),
    };
  }
}
