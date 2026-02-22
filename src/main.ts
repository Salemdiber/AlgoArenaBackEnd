import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 🔓 CORS configuration
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5180,http://127.0.0.1:5173,http://127.0.0.1:5180,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization', 'X-Total-Count'],
    credentials: true,
    maxAge: 86400,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  console.log(`✅ Application running on http://localhost:${PORT}`);
}
bootstrap();
