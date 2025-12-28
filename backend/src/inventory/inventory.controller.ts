import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import type { AuthRequest } from '../common/types';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('product/:productId')
  async findByProduct(@Param('productId') productId: string) {
    return await this.inventoryService.findByProduct(productId);
  }

  @Get('product/:productId/quantity')
  async getAvailableStock(@Param('productId') productId: string) {
    const quantity = await this.inventoryService.getAvailableStock(productId);
    return { productId, availableStock: quantity };
  }

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Patch('product/:productId')
  async updateQuantity(
    @Req() req: AuthRequest,
    @Param('productId') productId: string,
    @Body() updateDto: UpdateInventoryDto,
  ) {
    return await this.inventoryService.updateQuantity(
      req.user.userId,
      productId,
      updateDto,
    );
  }

  // @UseGuards(JwtAccessGuard)
  // @Post('product/:productId/reserve')
  // async reserveStock(
  //   @Param('productId') productId: string,
  //   @Body() reserveDto: ReserveInventoryDto,
  // ) {
  //   return await this.inventoryService.reserveStock(productId, reserveDto);
  // }

  // @UseGuards(JwtAccessGuard)
  // @Post('product/:productId/release')
  // async releaseReserved(
  //   @Param('productId') productId: string,
  //   @Body() releaseDto: ReleaseInventoryDto,
  // ) {
  //   return await this.inventoryService.releaseReserved(productId, releaseDto);
  // }

  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'inventory',
      timestamp: new Date().toISOString(),
    };
  }
}
