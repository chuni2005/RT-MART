import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { AuditMetadata } from '../decorators/audit.decorator';

/**
 * Audit Interceptor
 * 自動攔截標記了 @Audit 的 controller 方法，記錄所有 CUD 操作
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 從 decorator 獲取 audit metadata
    const auditMetadata = this.reflector.get<AuditMetadata>(
      'audit',
      context.getHandler(),
    );

    // 如果沒有 @Audit decorator，直接放行
    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, body, params, user, ip, userAgent, requestId } = request;

    // 只記錄寫入操作（CUD）
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // 判斷操作類型
    const action = this.getActionType(method);

    // 處理成功的請求
    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          // 提取 record ID
          const recordId = this.extractRecordId(params, responseData);

          // 準備審計數據
          const oldData = method === 'DELETE' ? responseData : null;
          const newData = method !== 'DELETE' ? responseData : null;

          // 排除敏感字段
          const sanitizedOldData = this.sanitizeData(
            oldData,
            auditMetadata.options?.excludeFields,
          );
          const sanitizedNewData = this.sanitizeData(
            newData,
            auditMetadata.options?.excludeFields,
          );

          // 非同步記錄 audit log（不阻塞主流程）
          await this.auditLogsService
            .log(
              action,
              auditMetadata.tableName,
              recordId,
              user?.userId,
              sanitizedOldData || undefined,
              sanitizedNewData || undefined,
              ip,
              userAgent,
              requestId,
              `${auditMetadata.tableName}Service`,
            )
            .catch((error) => {
              console.error('Failed to create audit log:', error);
            });
        } catch (error) {
          // Audit 失敗不影響業務操作
          console.error('Error in audit interceptor:', error);
        }
      }),
      catchError((error) => {
        // 即使操作失敗，也記錄嘗試
        this.auditLogsService
          .log(
            `${action}_FAILED`,
            auditMetadata.tableName,
            'failed',
            user?.userId,
            undefined,
            { error: error.message, request: { method, body, params } },
            ip,
            userAgent,
            requestId,
            `${auditMetadata.tableName}Service`,
          )
          .catch((logError) => {
            console.error('Failed to log failed operation:', logError);
          });

        return throwError(() => error);
      }),
    );
  }

  /**
   * 根據 HTTP method 判斷操作類型
   */
  private getActionType(method: string): string {
    switch (method) {
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * 從 params 或 response data 中提取 record ID
   */
  private extractRecordId(params: any, responseData: any): string {
    // 優先從 URL params 提取
    if (params?.id) return String(params.id);
    if (params?.userId) return String(params.userId);
    if (params?.productId) return String(params.productId);
    if (params?.orderId) return String(params.orderId);
    if (params?.storeId) return String(params.storeId);
    if (params?.sellerId) return String(params.sellerId);

    // 從 response data 提取（常見的 ID 字段名）
    if (responseData) {
      const idFields = [
        'id',
        'userId',
        'productId',
        'orderId',
        'storeId',
        'sellerId',
        'discountId',
        'reviewId',
        'cartItemId',
        'inventoryId',
      ];

      for (const field of idFields) {
        if (responseData[field]) {
          return String(responseData[field]);
        }
      }

      // 處理數組返回（如批量創建）
      if (Array.isArray(responseData) && responseData.length > 0) {
        const firstItem = responseData[0];
        for (const field of idFields) {
          if (firstItem[field]) {
            return String(firstItem[field]);
          }
        }
      }
    }

    return 'unknown';
  }

  /**
   * 清理敏感數據
   */
  private sanitizeData(
    data: any,
    excludeFields: string[] = [],
  ): object | null {
    if (!data) return null;

    // 默認排除的敏感字段
    const defaultExcludeFields = [
      'password',
      'passwordHash',
      'currentPassword',
      'newPassword',
      'accessToken',
      'refreshToken',
    ];

    const allExcludeFields = [
      ...defaultExcludeFields,
      ...(excludeFields || []),
    ];

    try {
      // 深拷貝以避免修改原始數據
      const sanitized = JSON.parse(JSON.stringify(data));

      // 遞歸清理敏感字段
      const clean = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map((item) => clean(item));
        }

        if (obj && typeof obj === 'object') {
          const cleaned: any = {};
          for (const key in obj) {
            if (allExcludeFields.includes(key)) {
              cleaned[key] = '***REDACTED***';
            } else {
              cleaned[key] = clean(obj[key]);
            }
          }
          return cleaned;
        }

        return obj;
      };

      return clean(sanitized);
    } catch (error) {
      console.error('Error sanitizing data:', error);
      return { error: 'Failed to sanitize data' };
    }
  }
}
