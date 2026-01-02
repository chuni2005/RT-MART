import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  Post,
  Body,
} from '@nestjs/common';
import { CartHistoryService } from './cart-history.service';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthRequest } from '../common/types/request.types';
import { CartItemsService } from '../carts-item/cart-items.service';
import { OrdersService } from '../orders/orders.service';

@Controller('cart-history')
@UseGuards(JwtAccessGuard)
export class CartHistoryController {
  constructor(
    private readonly cartHistoryService: CartHistoryService,
    private readonly cartsService: CartItemsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get()
  async findAll(
    @Req() req: AuthRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    // JwtAccessGuard ensures req.user exists and has userId
    const userId = req.user.userId;

    const { data, total } = await this.cartHistoryService.findAllByUser(
      userId,
      pageNum,
      limitNum,
    );

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  @Get(':id')
  async findOne(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ): Promise<unknown> {
    // JwtAccessGuard ensures req.user exists and has userId
    const userId = req.user.userId;
    return await this.cartHistoryService.findOne(id, userId);
  }

  @Post(':id/restore')
  async restoreToCart(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.userId;
    const history = await this.cartHistoryService.findOne(id, userId);

    const snapshot: any = history.cartSnapshot as any;
    const items = snapshot.items || [];

    for (const it of items) {
      await this.cartsService.addToCart(userId, {
        productId: String(it.productId || it.product?.productId),
        quantity: Number(it.quantity || 1),
        selected: false,
      });
    }

    return { message: 'Restored to cart', restored: items.length };
  }

  @Post(':id/to-order')
  async toOrder(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = req.user.userId;
    const history = await this.cartHistoryService.findOne(id, userId);
    const cartSnapshot: any = history.cartSnapshot;

    // 將資料庫中的 cartSnapshot 與請求中的其他資訊合併成 DTO
    const orders = await this.ordersService.createFromSnapshot(userId, {
      ...body,
      cartSnapshot,
    });

    const orderIds = orders.map((o) => o.orderId);
    await this.cartHistoryService.linkOrdersToSnapshot(
      history.cartHistoryId,
      orderIds,
    );

    return { message: 'Orders created', orders: orderIds };
  }

  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'cart-history',
      timestamp: new Date().toISOString(),
    };
  }
}
