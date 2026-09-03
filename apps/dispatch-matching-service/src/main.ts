import { NestFactory } from '@nestjs/core';
import { DispatchModule } from './dispatch.module';

async function bootstrap() {
  const app = await NestFactory.create(DispatchModule);
  const port = Number(process.env.DISPATCH_PORT) || 8003;
  await app.listen(port);
  console.log(`📍 FieldForge Dispatch Matching Engine running on port ${port}`);
}
bootstrap();
