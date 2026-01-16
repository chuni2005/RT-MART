import { SetMetadata } from '@nestjs/common';

/**
 * Audit Decorator Options
 */
export interface AuditOptions {
  /**
   * 排除的敏感字段（不記錄到 audit log 中）
   * 例如：['password', 'passwordHash', 'bankAccountReference']
   */
  excludeFields?: string[];

  /**
   * 是否捕獲 request body（用於 CREATE 和 UPDATE 操作）
   * 默認為 true
   */
  captureBody?: boolean;
}

/**
 * Audit Metadata Interface
 */
export interface AuditMetadata {
  tableName: string;
  options?: AuditOptions;
}

/**
 * Audit Decorator
 * 標記需要審計的 controller 方法
 *
 * @param tableName - 實體表名稱（如 'User', 'Product', 'Order'）
 * @param options - 可選配置
 *
 * @example
 * ```typescript
 * @Post()
 * @Audit('User', { excludeFields: ['password'] })
 * async create(@Body() createDto: CreateUserDto) {
 *   return await this.usersService.create(createDto);
 * }
 * ```
 */
export const Audit = (tableName: string, options?: AuditOptions) =>
  SetMetadata('audit', { tableName, options } as AuditMetadata);
