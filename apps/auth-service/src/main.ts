import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const port = process.env.PORT || 8001;
  await app.listen(port);
  console.log(`🔐 FieldForge Auth Service running on port ${port}`);
}
bootstrap();
