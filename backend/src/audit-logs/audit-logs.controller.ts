import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  async create(@Body() createDto: CreateAuditLogDto) {
    return await this.auditLogsService.create(createDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryAuditLogDto) {
    const { data, total } = await this.auditLogsService.findAll(queryDto);
    return {
      data,
      total,
      page: parseInt(queryDto.page || '1', 10),
      limit: parseInt(queryDto.limit || '10', 10),
    };
  }

  @Get('statistics')
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.auditLogsService.getStatistics(start, end);
  }

  @Get('event/:eventId')
  async findByEventId(@Param('eventId') eventId: string) {
    return await this.auditLogsService.findByEventId(eventId);
  }

  @Get('request/:requestId')
  async findByRequestId(@Param('requestId') requestId: string) {
    return await this.auditLogsService.findByRequestId(requestId);
  }

  @Get('verify/:id')
  async verifyChecksum(@Param('id') id: string) {
    return await this.auditLogsService.verifyChecksum(id);
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);

    const { data, total } = await this.auditLogsService.findByUser(
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

  @Get('entity/:tableName/:recordId')
  async findByEntity(
    @Param('tableName') tableName: string,
    @Param('recordId') recordId: string,
  ) {
    return await this.auditLogsService.findByEntity(tableName, recordId);
  }

  @Get('test/health')
  getHealth(): object {
    return {
      status: 'ok',
      module: 'audit-logs',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.auditLogsService.findOne(id);
  }
}
