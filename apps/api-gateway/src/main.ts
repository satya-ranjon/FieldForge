import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  const port = process.env.PORT || 8000;
  await app.listen(port);
  console.log(`🌐 FieldForge API Gateway running on port ${port}`);
}
bootstrap();
