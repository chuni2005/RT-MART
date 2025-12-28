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
import { QueryAdminOrderDto } from './dto/query-admin-order.dto';
import { UpdateAdminOrderStatusDto } from './dto/update-admin-order-status.dto';
import { AdminCancelOrderDto } from './dto/admin-cancel-order.dto';
import { UpdateSellerOrderStatusDto } from './dto/update-seller-order-status.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SellersService } from '../sellers/sellers.service';
import type { AuthRequest } from '../common/types';

@Controller('orders')
@UseGuards(JwtAccessGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly sellersService: SellersService,
  ) {}

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

  // ========== Admin Endpoints ==========

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('admin/all')
  async findAllAdmin(@Query() queryDto: QueryAdminOrderDto) {
    const { data, total } = await this.ordersService.findAllAdmin(queryDto);
    return {
      data,
      total,
      page: parseInt(queryDto.page || '1', 10),
      limit: parseInt(queryDto.limit || '20', 10),
    };
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('admin/:id')
  async findOneAdmin(@Param('id') id: string) {
    return await this.ordersService.findOneAdmin(id);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Post('admin/:id/cancel')
  async adminCancelOrder(
    @Param('id') id: string,
    @Body() cancelDto: AdminCancelOrderDto,
  ) {
    return await this.ordersService.adminCancelOrder(id, cancelDto.reason);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Patch('admin/:id/status')
  async updateAdminOrderStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateAdminOrderStatusDto,
  ) {
    return await this.ordersService.updateAdminOrderStatus(id, updateDto);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('admin/anomalies')
  async findAnomalies() {
    return await this.ordersService.findAnomalies();
  }

  // ========== Seller Endpoints ==========

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('seller/orders')
  async findSellerOrders(
    @Req() req: AuthRequest,
    @Query() queryDto: QueryOrderDto,
  ) {
    const userId = req.user.userId;
    const seller = await this.sellersService.findByUserId(userId);

    if (!seller) {
      throw new Error('Seller not found');
    }

    const { data, total } = await this.ordersService.findSellerOrders(
      seller.sellerId,
      queryDto,
    );

    return {
      data,
      total,
      page: parseInt(queryDto.page || '1', 10),
      limit: parseInt(queryDto.limit || '10', 10),
    };
  }

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('seller/orders/:id')
  async findSellerOrder(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = req.user.userId;
    const seller = await this.sellersService.findByUserId(userId);

    if (!seller) {
      throw new Error('Seller not found');
    }

    return await this.ordersService.findSellerOrder(seller.sellerId, id);
  }

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Patch('seller/orders/:id/status')
  async updateSellerOrderStatus(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateDto: UpdateSellerOrderStatusDto,
  ) {
    const userId = req.user.userId;
    const seller = await this.sellersService.findByUserId(userId);

    if (!seller) {
      throw new Error('Seller not found');
    }

    return await this.ordersService.updateSellerOrderStatus(
      seller.sellerId,
      id,
      updateDto.status,
      updateDto.note,
    );
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
