import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔓 Configuration CORS améliorée
  app.enableCors({
    origin: [
      'http://localhost:5180',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5180',
      'http://localhost:5174',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
    exposedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Total-Count',
    ],
    maxAge: 86400, // 24 heures
  });

    // ✅ Écoute sur le port 3000
    const PORT = process.env.PORT || 3000;
    await app.listen(PORT);
    console.log(`✅ Application running on http://localhost:${PORT}`);
}
bootstrap();