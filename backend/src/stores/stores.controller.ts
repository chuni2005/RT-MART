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
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { StoresService } from './stores.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import type { AuthRequest } from '../common/types';
import { SellersService } from '../sellers/sellers.service';

@Controller('stores')
@UseInterceptors(ClassSerializerInterceptor)
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    private readonly sellersService: SellersService,
  ) {}

  //Administrators can only create a store by establishing and verifying a seller's application.
  // @Post()
  // @UseGuards(JwtAccessGuard, RolesGuard)
  // @Roles(UserRole.SELLER)
  // async create(@Req() req: AuthRequest, @Body() createDto: CreateStoreDto) {
  //   // Get seller ID from user
  //   const seller = await this.storesService['sellersService'].findByUserId(
  //     req.user.userId,
  //   );
  //   if (!seller) {
  //     throw new NotFoundException('Seller profile not found');
  //   }
  //   return await this.storesService.create(seller.sellerId, createDto);
  // }

  @Get()
  async findAll(@Query() queryDto: QueryStoreDto) {
    const { data, total } = await this.storesService.findAll(queryDto);
    console.log(
      '[StoresController] findAll - first store:',
      data[0]
        ? {
            storeId: data[0].storeId,
            storeName: data[0].storeName,
            deletedAt: data[0].deletedAt,
          }
        : 'No stores found',
    );
    return {
      data: plainToInstance(StoreResponseDto, data),
      total,
      page: parseInt(queryDto.page || '1', 10),
      limit: parseInt(queryDto.limit || '10', 10),
    };
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Get('me')
  async findMine(@Req() req: AuthRequest) {
    return await this.storesService.findMyStore(req.user.userId);
  }

  @Get(':storeId')
  async findOne(@Param('storeId') storeId: string) {
    return await this.storesService.findOne(storeId);
  }

  // @Get('seller/:sellerId')
  // async findBySeller(@Param('sellerId') sellerId: string) {
  //   return await this.storesService.findBySeller(sellerId);
  // }

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Patch()
  async update(@Req() req: AuthRequest, @Body() updateDto: UpdateStoreDto) {
    const seller = await this.sellersService.findByUserId(req.user.userId);
    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }
    const store = await this.storesService.findBySeller(seller.sellerId);
    if (!store) {
      throw new NotFoundException('Store not found for this seller');
    }
    return await this.storesService.update(store.storeId, updateDto);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Post(':storeId/restore')
  async restoreStore(@Param('storeId') storeId: string) {
    return await this.storesService.restore(storeId);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Patch(':storeId')
  async updateByAdmin(
    @Param('storeId') storeId: string,
    @Body() updateDto: UpdateStoreDto,
  ) {
    return await this.storesService.update(storeId, updateDto);
  }

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Delete()
  async remove(@Req() req: AuthRequest) {
    const seller = await this.sellersService.findByUserId(req.user.userId);
    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }
    const store = await this.storesService.findBySeller(seller.sellerId);
    if (!store) {
      throw new NotFoundException('Store not found for this seller');
    }
    await this.storesService.remove(store.storeId);
    return { message: 'Store deleted successfully' };
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Delete(':storeId')
  async softRemove(@Param('storeId') storeId: string) {
    await this.storesService.remove(storeId);
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
