import { NestFactory } from '@nestjs/core';
import { WorkOrderModule } from './work-order.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkOrderModule);
  const port = process.env.PORT || 5002;
  await app.listen(port);
  console.log(`📋 FieldForge Work Order Service running on port ${port}`);
}
bootstrap();
