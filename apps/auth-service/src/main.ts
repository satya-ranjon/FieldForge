import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { createLogger } from '@fieldforge/common';

const logger = createLogger('auth-service');

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const port = Number(process.env.AUTH_PORT) || 8001;
  await app.listen(port);
  logger.info(`🔐 FieldForge Auth Service running on port ${port}`);
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start auth-service');
  process.exit(1);
});
