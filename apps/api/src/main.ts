// apps/api/src/main.ts
// Fix : CORS étendu pour autoriser le portal sur le port 4201
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ─── Static Files (logos uploads) ──────────────────────────
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // ─── Global Pipes ──────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── CORS — FIX : autoriser web (4200) ET portal (4201) ────
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:4200')
    .split(',')
    .map(o => o.trim())
    .concat(['http://localhost:4201']);   // ← portal public

  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origine (curl, Postman) + les origines listées
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS : origine non autorisée — ${origin}`));
      }
    },
    credentials: true,
  });

  // ─── Global Prefix ─────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Swagger ───────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Fasossira API')
      .setDescription('Transport Management SaaS — Mali')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger disponible : http://localhost:3000/api/docs');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚌 Fasossira API démarrée sur le port ${port}`);
}

bootstrap();
