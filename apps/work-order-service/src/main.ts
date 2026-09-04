import { NestFactory } from '@nestjs/core';
import { WorkOrderModule } from './work-order.module';
import { createLogger } from '@fieldforge/common';

const logger = createLogger('work-order-service');

async function bootstrap() {
  const app = await NestFactory.create(WorkOrderModule);
  const port = Number(process.env.WORK_ORDER_PORT) || 8002;
  await app.listen(port);
  logger.info(`📋 FieldForge Work Order Service running on port ${port}`);
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start work-order-service');
  process.exit(1);
});
