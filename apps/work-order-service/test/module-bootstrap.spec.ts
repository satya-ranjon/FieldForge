import 'reflect-metadata';
import { NestContainer } from '@nestjs/core/injector/container';
import { ApplicationConfig } from '@nestjs/core/application-config';
import { NestApplicationContext } from '@nestjs/core/nest-application-context';
import { NestFactory } from '@nestjs/core';
import { RedisIdempotencyClient } from '@fieldforge/messaging';
import { ProfileDirectoryService } from '@fieldforge/common';
import { WorkOrderModule } from '../src/work-order.module';
import { WorkOrdersService } from '../src/modules/work-orders/work-orders.service';
import { BidsService } from '../src/modules/bids/bids.service';
import { WorkOrderFsmService } from '../src/modules/fsm/work-order-fsm.service';
import { WorkOrderEventPublisher } from '../src/events/work-order-event.publisher';
import { WorkOrderOutboxRelay } from '../src/events/work-order-outbox.relay';
import { WorkOrderOutboxRetentionService } from '../src/events/work-order-outbox-retention.service';
import { DeliverablesService } from '../src/modules/deliverables/deliverables.service';
import { SlaEscalationService } from '../src/modules/sla/sla-escalation.service';
import { SlaAutoApprovalService } from '../src/modules/sla/sla-auto-approval.service';
import { WorkOrderEventsConsumer } from '../src/consumers/work-order-events.consumer';
import { WorkOrdersController } from '../src/modules/work-orders/work-orders.controller';
import { InternalWorkOrdersController } from '../src/modules/work-orders/internal-work-orders.controller';
import { BidsController } from '../src/modules/bids/bids.controller';

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

describe('WorkOrderModule Dependency Injection Bootstrap', () => {
  let context: NestApplicationContext;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_must_be_at_least_32_characters_long_for_test';

    const internalNestFactory = NestFactory as unknown as NestFactoryInternal;
    const applicationConfig = new ApplicationConfig();
    const container = new NestContainer(applicationConfig);
    const graphInspector = internalNestFactory.createGraphInspector({}, container);
    await internalNestFactory.initialize(
      WorkOrderModule,
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

  it('resolves controllers and all domain providers without DI errors', () => {
    expect(context.get(WorkOrdersController)).toBeInstanceOf(WorkOrdersController);
    expect(context.get(InternalWorkOrdersController)).toBeInstanceOf(InternalWorkOrdersController);
    expect(context.get(BidsController)).toBeInstanceOf(BidsController);
    expect(context.get(WorkOrdersService)).toBeInstanceOf(WorkOrdersService);
    expect(context.get(BidsService)).toBeInstanceOf(BidsService);
    expect(context.get(WorkOrderFsmService)).toBeInstanceOf(WorkOrderFsmService);
    expect(context.get(WorkOrderEventPublisher)).toBeInstanceOf(WorkOrderEventPublisher);
    expect(context.get(WorkOrderOutboxRelay)).toBeInstanceOf(WorkOrderOutboxRelay);
    expect(context.get(WorkOrderOutboxRetentionService)).toBeInstanceOf(
      WorkOrderOutboxRetentionService
    );
    expect(context.get(DeliverablesService)).toBeInstanceOf(DeliverablesService);
    expect(context.get(SlaEscalationService)).toBeInstanceOf(SlaEscalationService);
    expect(context.get(SlaAutoApprovalService)).toBeInstanceOf(SlaAutoApprovalService);
    expect(context.get(WorkOrderEventsConsumer)).toBeInstanceOf(WorkOrderEventsConsumer);
    expect(context.get(ProfileDirectoryService)).toBeInstanceOf(ProfileDirectoryService);
  });
});
