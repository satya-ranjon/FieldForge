import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { createLogger } from '@fieldforge/common';

const logger = createLogger('notification-service');

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);
  const port = Number(process.env.NOTIFICATION_PORT) || 8005;
  await app.listen(port);
  logger.info(`🔔 FieldForge Notification Service running on port ${port}`);
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start notification-service');
  process.exit(1);
});
