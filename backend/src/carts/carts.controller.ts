import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthRequest } from '../common/types';

@Controller('carts')
@UseGuards(JwtAccessGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  async getCart(@Req() req: AuthRequest) {
    return await this.cartsService.getOrCreateCart(req.user.userId);
  }

  @Get('summary')
  async getCartSummary(@Req() req: AuthRequest) {
    return await this.cartsService.getCartSummary(req.user.userId);
  }

  @Post('items')
  async addToCart(@Req() req: AuthRequest, @Body() addToCartDto: AddToCartDto) {
    return await this.cartsService.addToCart(req.user.userId, addToCartDto);
  }

  @Patch('items/:cartItemId')
  async updateCartItem(
    @Req() req: AuthRequest,
    @Param('cartItemId') cartItemId: string,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    return await this.cartsService.updateCartItem(
      req.user.userId,
      cartItemId,
      updateDto,
    );
  }

  @Delete('items/:cartItemId')
  async removeFromCart(
    @Req() req: AuthRequest,
    @Param('cartItemId') cartItemId: string,
  ) {
    return await this.cartsService.removeFromCart(req.user.userId, cartItemId);
  }

  @Delete()
  async clearCart(@Req() req: AuthRequest) {
    await this.cartsService.clearCart(req.user.userId);
    return { message: 'Cart cleared successfully' };
  }

  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'carts',
      timestamp: new Date().toISOString(),
    };
  }
}
