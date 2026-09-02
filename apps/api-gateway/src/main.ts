import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createLogger } from '@fieldforge/common';

const logger = createLogger('api-gateway');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  const webPort = process.env.WEB_PORT || 5173;
  const allowedOrigins = [
    `http://localhost:${webPort}`,
    `http://127.0.0.1:${webPort}`,
    process.env.CLIENT_URL
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS allowlist'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id']
  });

  const port = Number(process.env.PORT) || 8000;
  await app.listen(port);
  logger.info(`🌐 FieldForge API Gateway running on port ${port}`);
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start api-gateway');
  process.exit(1);
});
