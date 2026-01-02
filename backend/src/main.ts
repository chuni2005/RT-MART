import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // use helmet for security headers
  // Configure helmet to allow SSE connections
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP to allow SSE
      crossOriginEmbedderPolicy: false, // Allow cross-origin resources
    }),
  );
  app.use(cookieParser());

  // set global API prefix (so all routes will be /api/v1/...)
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');

  // enable global exception filter for detailed error logging
  app.useGlobalFilters(new AllExceptionsFilter());

  // enable global validation pipe to automatically validate all incoming requests
  // whitelist: strip properties that don't have decorators
  // forbidNonWhitelisted: throw error if non-whitelisted properties exist
  // transform: automatically transform payloads to DTO instances
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // enable CORS for your frontend to communicate with the backend
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
void bootstrap();
