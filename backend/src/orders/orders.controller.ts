import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthRequest } from '../common/types';

@Controller('orders')
@UseGuards(JwtAccessGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Req() req: AuthRequest, @Body() createDto: CreateOrderDto) {
    const userId = req.user.userId;
    return await this.ordersService.create(userId, createDto);
  }

  @Get()
  async findAll(@Req() req: AuthRequest, @Query() queryDto: QueryOrderDto) {
    const userId = req.user.userId;
    const { data, total } = await this.ordersService.findAll(userId, queryDto);
    return {
      data,
      total,
      page: parseInt(queryDto.page || '1', 10),
      limit: parseInt(queryDto.limit || '10', 10),
    };
  }

  @Get(':id')
  async findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.userId;
    return await this.ordersService.findOne(id, userId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    const userId = req.user.userId;
    return await this.ordersService.updateStatus(id, userId, updateDto);
  }

  @Post(':id/cancel')
  async cancelOrder(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.userId;
    return await this.ordersService.cancelOrder(id, userId);
  }

  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'orders',
      timestamp: new Date().toISOString(),
    };
  }
}
