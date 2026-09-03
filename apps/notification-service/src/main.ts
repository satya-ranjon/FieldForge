import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';

@Module({})
class NotificationModule {}

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);
  const port = Number(process.env.NOTIFICATION_PORT) || 8005;
  await app.listen(port);
  console.log(`🔔 FieldForge Notification Service running on port ${port}`);
}
bootstrap();
