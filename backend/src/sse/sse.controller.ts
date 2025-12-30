import { Controller, Sse, Req, UseGuards, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { SseService } from './sse.service';
import { JwtAccessGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthRequest } from '../common/types';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('events')
  @UseGuards(JwtAccessGuard)
  events(@Req() req: AuthRequest): Observable<MessageEvent> {
    return new Observable((observer) => {
      const clientId = `${req.user.userId}-${Date.now()}`;
      const userId = req.user.userId;

      // Set up SSE headers
      const response = (req as any).res;
      response.setHeader('Content-Type', 'text/event-stream');
      response.setHeader('Cache-Control', 'no-cache');
      response.setHeader('Connection', 'keep-alive');
      response.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      // Add client to SSE service
      this.sseService.addClient(clientId, response, userId);

      // Handle client disconnect
      req.on('close', () => {
        this.sseService.removeClient(clientId);
        observer.complete();
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        if (!response.writableEnded) {
          response.write(': heartbeat\n\n');
        } else {
          clearInterval(heartbeat);
        }
      }, 30000); // Send heartbeat every 30 seconds

      // Cleanup on unsubscribe
      return () => {
        clearInterval(heartbeat);
        this.sseService.removeClient(clientId);
      };
    });
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
