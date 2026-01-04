import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import mailConfig from './mail.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(mailConfig)],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
