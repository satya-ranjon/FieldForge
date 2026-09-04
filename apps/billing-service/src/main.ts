import { NestFactory } from '@nestjs/core';
import { BillingModule } from './billing.module';
import { createLogger } from '@fieldforge/common';

const logger = createLogger('billing-service');

async function bootstrap() {
  const app = await NestFactory.create(BillingModule);
  const port = Number(process.env.BILLING_PORT) || 8004;
  await app.listen(port);
  logger.info(`💳 FieldForge Billing & Escrow Service running on port ${port}`);
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start billing-service');
  process.exit(1);
});
