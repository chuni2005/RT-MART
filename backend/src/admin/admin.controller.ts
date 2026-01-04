import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AdminService, DashboardStats } from './admin.service';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { QueryDashboardDto } from './dto/query-dashboard.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Get('dashboard/stats')
  async getDashboardStats(
    @Query() queryDto: QueryDashboardDto,
  ): Promise<DashboardStats> {
    return await this.adminService.getDashboardStats(queryDto);
  }
}
