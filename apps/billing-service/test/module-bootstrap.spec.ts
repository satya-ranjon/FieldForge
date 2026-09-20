import 'reflect-metadata';
import { NestContainer } from '@nestjs/core/injector/container';
import { ApplicationConfig } from '@nestjs/core/application-config';
import { NestApplicationContext } from '@nestjs/core/nest-application-context';
import { NestFactory } from '@nestjs/core';
import { RedisIdempotencyClient } from '@fieldforge/messaging';
import { ProfileDirectoryService } from '@fieldforge/common';
import { BillingModule } from '../src/billing.module';
import { BillingController } from '../src/controllers/billing.controller';
import { EscrowService } from '../src/modules/escrow/escrow.service';
import { InvoicesService } from '../src/modules/invoices/invoices.service';
import { WorkOrderDirectoryService } from '../src/modules/work-orders/work-order-directory.service';
import { BillingConsumer } from '../src/consumers/billing.consumer';
import { BillingOutboxRelay } from '../src/events/billing-outbox.relay';
import { BillingOutboxRetentionService } from '../src/events/billing-outbox-retention.service';

interface NestFactoryInternal {
  createGraphInspector(options: unknown, container: unknown): unknown;
  initialize(
    moduleCls: unknown,
    container: unknown,
    graphInspector: unknown,
    applicationConfig: unknown,
    options: unknown
  ): Promise<void>;
  createNestInstance<T>(instance: T): T;
}

describe('BillingModule Dependency Injection Bootstrap', () => {
  let context: NestApplicationContext;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_must_be_at_least_32_characters_long_for_test';

    const internalNestFactory = NestFactory as unknown as NestFactoryInternal;
    const applicationConfig = new ApplicationConfig();
    const container = new NestContainer(applicationConfig);
    const graphInspector = internalNestFactory.createGraphInspector({}, container);
    await internalNestFactory.initialize(
      BillingModule,
      container,
      graphInspector,
      applicationConfig,
      { logger: false }
    );
    const modules = container.getModules().values();
    const root = modules.next().value;
    context = internalNestFactory.createNestInstance(
      new NestApplicationContext(container, {}, root)
    );
  });

  afterAll(() => {
    const redis = context?.get(RedisIdempotencyClient);
    if (redis && redis.rawClient) {
      redis.rawClient.disconnect();
    }
  });

  it('resolves BillingController and all domain providers without DI errors', () => {
    expect(context.get(BillingController)).toBeInstanceOf(BillingController);
    expect(context.get(EscrowService)).toBeInstanceOf(EscrowService);
    expect(context.get(InvoicesService)).toBeInstanceOf(InvoicesService);
    expect(context.get(ProfileDirectoryService)).toBeInstanceOf(ProfileDirectoryService);
    expect(context.get(WorkOrderDirectoryService)).toBeInstanceOf(WorkOrderDirectoryService);
    expect(context.get(BillingConsumer)).toBeInstanceOf(BillingConsumer);
    expect(context.get(BillingOutboxRelay)).toBeInstanceOf(BillingOutboxRelay);
    expect(context.get(BillingOutboxRetentionService)).toBeInstanceOf(
      BillingOutboxRetentionService
    );
  });
});
