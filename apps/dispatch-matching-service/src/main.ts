import { NestFactory } from '@nestjs/core';
import { DispatchModule } from './dispatch.module';
import { createLogger } from '@fieldforge/common';

const logger = createLogger('dispatch-matching-service');

async function bootstrap() {
  const app = await NestFactory.create(DispatchModule);
  const port = Number(process.env.DISPATCH_PORT) || 8003;
  await app.listen(port);
  logger.info(`📍 FieldForge Dispatch Matching Engine running on port ${port}`);
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start dispatch-matching-service');
  process.exit(1);
});
