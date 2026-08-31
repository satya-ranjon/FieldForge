import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';

@Module({})
class NotificationModule {}

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);
  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`🔔 FieldForge Notification Service running on port ${port}`);
}
bootstrap();
