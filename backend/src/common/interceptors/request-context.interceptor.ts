import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';

/**
 * Request Context Interceptor
 * 為每個請求添加上下文信息：requestId, IP, userAgent
 * 這些信息將被 AuditInterceptor 使用來記錄審計日誌
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // 生成唯一的 request ID
    if (!request.requestId) {
      request.requestId = crypto.randomUUID();
    }

    // 提取 IP 地址（支持代理和直連）
    if (!request.ip) {
      request.ip =
        request.headers['x-forwarded-for']?.split(',')[0] ||
        request.connection?.remoteAddress ||
        request.socket?.remoteAddress ||
        'unknown';
    }

    // 提取 User Agent
    if (!request.userAgent) {
      request.userAgent = request.get('user-agent') || 'unknown';
    }

    return next.handle();
  }
}
