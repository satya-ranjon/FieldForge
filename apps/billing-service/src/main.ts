import { NestFactory } from '@nestjs/core';
import { BillingModule } from './billing.module';

async function bootstrap() {
  const app = await NestFactory.create(BillingModule);
  const port = process.env.PORT || 8004;
  await app.listen(port);
  console.log(`💳 FieldForge Billing & Escrow Service running on port ${port}`);
}
bootstrap();
