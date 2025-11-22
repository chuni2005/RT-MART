import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { CartHistoryService } from './cart-history.service';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthRequest } from '../common/types';

@Controller('cart-history')
@UseGuards(JwtAccessGuard)
export class CartHistoryController {
  constructor(private readonly cartHistoryService: CartHistoryService) {}

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
    const userId = req.user.userId as string;

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
    const userId = req.user.userId as string;
    return await this.cartHistoryService.findOne(id, userId);
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
