import { NestFactory } from '@nestjs/core';
import { WorkOrderModule } from './work-order.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkOrderModule);
  const port = Number(process.env.WORK_ORDER_PORT) || 8002;
  await app.listen(port);
  console.log(`📋 FieldForge Work Order Service running on port ${port}`);
}
bootstrap();
