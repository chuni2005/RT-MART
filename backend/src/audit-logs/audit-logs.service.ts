import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(createDto);
    return await this.auditLogRepository.save(auditLog);
  }

  async findAll(
    queryDto: QueryAuditLogDto,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '10', 10);
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user');

    if (queryDto.eventId) {
      queryBuilder.andWhere('auditLog.eventId = :eventId', {
        eventId: queryDto.eventId,
      });
    }

    if (queryDto.userId) {
      queryBuilder.andWhere('auditLog.userId = :userId', {
        userId: queryDto.userId,
      });
    }

    if (queryDto.action) {
      queryBuilder.andWhere('auditLog.action = :action', {
        action: queryDto.action,
      });
    }

    if (queryDto.tableName) {
      queryBuilder.andWhere('auditLog.tableName = :tableName', {
        tableName: queryDto.tableName,
      });
    }

    if (queryDto.recordId) {
      queryBuilder.andWhere('auditLog.recordId = :recordId', {
        recordId: queryDto.recordId,
      });
    }

    if (queryDto.requestId) {
      queryBuilder.andWhere('auditLog.requestId = :requestId', {
        requestId: queryDto.requestId,
      });
    }

    if (queryDto.serviceName) {
      queryBuilder.andWhere('auditLog.serviceName = :serviceName', {
        serviceName: queryDto.serviceName,
      });
    }

    if (queryDto.ipAddress) {
      queryBuilder.andWhere('auditLog.ipAddress = :ipAddress', {
        ipAddress: queryDto.ipAddress,
      });
    }

    // Date range filtering
    if (queryDto.startDate && queryDto.endDate) {
      queryBuilder.andWhere(
        'auditLog.eventTimestamp BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(queryDto.startDate),
          endDate: new Date(queryDto.endDate),
        },
      );
    } else if (queryDto.startDate) {
      queryBuilder.andWhere('auditLog.eventTimestamp >= :startDate', {
        startDate: new Date(queryDto.startDate),
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('auditLog.eventTimestamp', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<AuditLog> {
    const auditLog = await this.auditLogRepository.findOne({
      where: { auditId: id },
      relations: ['user'],
    });

    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return auditLog;
  }

  async findByEventId(eventId: string): Promise<AuditLog> {
    const auditLog = await this.auditLogRepository.findOne({
      where: { eventId },
      relations: ['user'],
    });

    if (!auditLog) {
      throw new NotFoundException(
        `Audit log with event ID ${eventId} not found`,
      );
    }

    return auditLog;
  }

  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: AuditLog[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.auditLogRepository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { eventTimestamp: 'DESC' },
    });

    return { data, total };
  }

  async findByEntity(tableName: string, recordId: string): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { tableName, recordId },
      order: { eventTimestamp: 'DESC' },
      relations: ['user'],
    });
  }

  async findByRequestId(requestId: string): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { requestId },
      order: { eventTimestamp: 'DESC' },
      relations: ['user'],
    });
  }

  async verifyChecksum(
    id: string,
  ): Promise<{ valid: boolean; message: string }> {
    const auditLog = await this.findOne(id);

    if (!auditLog.checksum) {
      return {
        valid: false,
        message: 'No checksum found for this audit log',
      };
    }

    const isValid = auditLog.verifyChecksum();

    return {
      valid: isValid,
      message: isValid
        ? 'Checksum is valid - data has not been tampered'
        : 'Checksum is invalid - data may have been tampered!',
    };
  }

  async getStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalLogs: number;
    byAction: Record<string, number>;
    byTable: Record<string, number>;
    byUser: Record<string, number>;
  }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('auditLog');

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'auditLog.eventTimestamp BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    } else if (startDate) {
      queryBuilder.andWhere('auditLog.eventTimestamp >= :startDate', {
        startDate,
      });
    }

    const logs = await queryBuilder.getMany();

    const byAction: Record<string, number> = {};
    const byTable: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    logs.forEach((log) => {
      // Count by action
      byAction[log.action] = (byAction[log.action] || 0) + 1;

      // Count by table
      byTable[log.tableName] = (byTable[log.tableName] || 0) + 1;

      // Count by user
      if (log.userId) {
        byUser[log.userId] = (byUser[log.userId] || 0) + 1;
      }
    });

    return {
      totalLogs: logs.length,
      byAction,
      byTable,
      byUser,
    };
  }

  async log(
    action: string,
    tableName: string,
    recordId: string,
    userId?: string,
    oldData?: object,
    newData?: object,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
    serviceName?: string,
  ): Promise<AuditLog> {
    return await this.create({
      userId,
      action,
      tableName,
      recordId,
      oldData,
      newData,
      ipAddress,
      userAgent,
      requestId,
      serviceName,
    });
  }
}
