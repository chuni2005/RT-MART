import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  UpdateInventoryDto,
  ReserveInventoryDto,
  ReleaseInventoryDto,
} from './dto/update-inventory.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('product/:productId')
  async findByProduct(@Param('productId') productId: string) {
    return await this.inventoryService.findByProduct(productId);
  }

  @Get('product/:productId/available')
  async getAvailableStock(@Param('productId') productId: string) {
    const available = await this.inventoryService.getAvailableStock(productId);
    return { productId, availableStock: available };
  }

  @Patch('product/:productId')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async updateQuantity(
    @Param('productId') productId: string,
    @Body() updateDto: UpdateInventoryDto,
  ) {
    return await this.inventoryService.updateQuantity(productId, updateDto);
  }

  @Post('product/:productId/reserve')
  @UseGuards(JwtAccessGuard)
  async reserveStock(
    @Param('productId') productId: string,
    @Body() reserveDto: ReserveInventoryDto,
  ) {
    return await this.inventoryService.reserveStock(productId, reserveDto);
  }

  @Post('product/:productId/release')
  @UseGuards(JwtAccessGuard)
  async releaseReserved(
    @Param('productId') productId: string,
    @Body() releaseDto: ReleaseInventoryDto,
  ) {
    return await this.inventoryService.releaseReserved(productId, releaseDto);
  }

  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'inventory',
      timestamp: new Date().toISOString(),
    };
  }
}
