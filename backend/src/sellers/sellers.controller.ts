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
  Res,
  NotFoundException,
  ConflictException,
  Query,
} from '@nestjs/common';
import { SellersService, DashboardData } from './sellers.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { VerifySellerDto } from './dto/verify-seller.dto';
import { RejectSellerDto } from './dto/reject-seller.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { QuerySellerDto } from './dto/query-seller.dto';
import { QuerySellerDashboardDto } from './dto/query-seller-dashboard.dto';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Roles(UserRole.BUYER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Post()
  async create(@Req() req, createSellerDto: CreateSellerDto) {
    const userId = req.user.userId;
    return this.sellersService.create({
      ...createSellerDto,
      userId,
    });
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get()
  async findAll(@Query() queryDto: QuerySellerDto) {
    const { data, total } = await this.sellersService.findAll(queryDto);

    return {
      data,
      total,
      page: parseInt(queryDto.page || '1', 10),
      limit: parseInt(queryDto.limit || '10', 10),
    };
  }

  // @Get('users/:userId')
  // async findByUserId(@Param('userId') userId: string) {
  //   return await this.sellersService.findByUserId(userId);
  // }

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('dashboard')
  async getDashboardData(
    @Req() req: any,
    @Query() queryDto: QuerySellerDashboardDto,
  ): Promise<DashboardData> {
    const userId = req.user.userId;
    return await this.sellersService.getDashboardData(userId, queryDto);
  }

  @Roles(UserRole.SELLER)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('sales-report')
  async downloadSalesReport(
    @Req() req: any,
    @Query() queryDto: QuerySellerDashboardDto,
    @Res() res: any,
  ): Promise<void> {
    const userId = req.user.userId;
    const csv = await this.sellersService.generateSalesReport(userId, queryDto);

    const filename = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get(':sellerId')
  async findOne(@Param('sellerId') sellerId: string) {
    return await this.sellersService.findOne(sellerId);
  }

  @UseGuards(JwtAccessGuard)
  @Patch()
  async update(@Req() req: any, @Body() updateSellerDto: UpdateSellerDto) {
    const userId = req.user.userId;
    const seller = await this.sellersService.findByUserId(userId);
    if (!seller) {
      throw new NotFoundException('Seller record not found for this user');
    }
    return await this.sellersService.update(seller.sellerId, updateSellerDto);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Post(':sellerId/verify')
  async verify(@Req() req: any, @Param('sellerId') sellerId: string) {
    const verifier = req.user.userId;
    return await this.sellersService.verify(sellerId, verifier);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Post(':sellerId/reject')
  async reject(
    @Param('sellerId') sellerId: string,
    @Body() rejectDto: RejectSellerDto,
  ) {
    return await this.sellersService.reject(sellerId, rejectDto);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Delete(':sellerId')
  async remove(@Param('sellerId') sellerId: string) {
    await this.sellersService.remove(sellerId);
    return { message: 'Seller deleted successfully' };
  }

  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'sellers',
      timestamp: new Date().toISOString(),
    };
  }
}
