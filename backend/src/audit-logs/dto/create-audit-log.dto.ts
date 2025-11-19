import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAuditLogDto {
  @IsUUID()
  @IsOptional()
  eventId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsNotEmpty()
  tableName: string;

  @IsString()
  @IsNotEmpty()
  recordId: string;

  // Request tracking
  @IsString()
  @IsOptional()
  requestId?: string;

  @IsString()
  @IsOptional()
  serviceName?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  // Data changes
  @IsObject()
  @IsOptional()
  oldData?: object;

  @IsObject()
  @IsOptional()
  newData?: object;
}
