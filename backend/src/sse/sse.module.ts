import { Module, Global } from '@nestjs/common';
import { SseController } from './sse.controller';
import { SseService } from './sse.service';

@Global() // Make SSE service available globally
@Module({
  controllers: [SseController],
  providers: [SseService],
  exports: [SseService], // Export so other modules can use it
})
export class SseModule {}
