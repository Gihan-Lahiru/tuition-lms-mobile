import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('TuitionLMSBootstrap');
  const app = await NestFactory.create(AppModule);

  const corsOriginsRaw = process.env.CORS_ORIGINS || '';
  const allowedOrigins = corsOriginsRaw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: process.env.NODE_ENV === 'production' && allowedOrigins.length > 0
      ? allowedOrigins
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Health probe without exposing internal secrets or PII
  const http = app.getHttpAdapter().getInstance();
  http.get('/api/health', (_req: any, res: any) => {
    res.json({
      status: 'ok',
      service: 'tuition-lms-backend',
      timestamp: new Date().toISOString(),
    });
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tuition LMS API')
    .setDescription('Mobile-First Tuition LMS Backend API (Quizzes, Assignments, Results, Attendance, Papers)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, doc);

  const port = parseInt(process.env.PORT || '5001', 10);
  await app.listen(port);
  logger.log(`Tuition LMS Backend listening on http://localhost:${port}`);
  logger.log(`Swagger Docs available at http://localhost:${port}/api/docs`);
}

bootstrap();

