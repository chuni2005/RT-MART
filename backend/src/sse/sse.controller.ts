import { Controller, Sse, Req, UseGuards, MessageEvent } from '@nestjs/common';
import { Observable, finalize } from 'rxjs';
import { SseService } from './sse.service';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthRequest } from '../common/types';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  /**
   * SSE events stream for notifications
   * 修改理由：
   * 1. 移除手動操作 Response (res) 物件，這會導致 "Cannot set headers after they are sent to the client" 錯誤。
   * 2. 使用 NestJS 推薦的 RxJS Observable 模式，讓 NestJS 自動管理 SSE Headers 和心跳。
   * 3. 使用 finalize 確保連線切斷時正確清理客戶端資源。
   */
  @Sse('events')
  @UseGuards(JwtAccessGuard)
  events(@Req() req: AuthRequest): Observable<MessageEvent> {
    const userId = req.user.userId;
    const clientId = `${userId}-${Date.now()}`;

    // 向 Service 註冊並獲取事件流
    return this.sseService.addClient(clientId, userId).pipe(
      finalize(() => {
        // 當 Observable 結束或訂閱取消時（連線切斷），移除客戶端
        this.sseService.removeClient(clientId);
      }),
    );
  }

  @Sse('health')
  health(): Observable<MessageEvent> {
    return new Observable((observer) => {
      const interval = setInterval(() => {
        observer.next({
          data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            clients: this.sseService.getClientCount(),
          },
        });
      }, 5000);

      return () => clearInterval(interval);
    });
  }
}
