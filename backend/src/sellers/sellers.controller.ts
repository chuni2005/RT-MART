import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SellersService } from './sellers.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { VerifySellerDto } from './dto/verify-seller.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('sellers')
@UseGuards(JwtAccessGuard)
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post()
  async create(@Body() createSellerDto: CreateSellerDto) {
    return await this.sellersService.create(createSellerDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    return await this.sellersService.findAll();
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return await this.sellersService.findByUserId(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.sellersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSellerDto: UpdateSellerDto,
  ) {
    return await this.sellersService.update(id, updateSellerDto);
  }

  @Post(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async verify(@Param('id') id: string, @Body() verifyDto: VerifySellerDto) {
    return await this.sellersService.verify(id, verifyDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.sellersService.remove(id);
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
