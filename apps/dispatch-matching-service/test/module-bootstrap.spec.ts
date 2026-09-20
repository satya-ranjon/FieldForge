import 'reflect-metadata';
import { NestContainer } from '@nestjs/core/injector/container';
import { ApplicationConfig } from '@nestjs/core/application-config';
import { NestApplicationContext } from '@nestjs/core/nest-application-context';
import { NestFactory } from '@nestjs/core';
import { RedisIdempotencyClient } from '@fieldforge/messaging';
import { DispatchModule } from '../src/dispatch.module';
import { DispatchController } from '../src/modules/dispatch/dispatch.controller';
import { GeoSearchService } from '../src/modules/geo-search/geo-search.service';
import { REDIS_CLIENT } from '../src/modules/geo-search/geo-search.constants';
import { TechnicianDirectoryService } from '../src/modules/geo-search/technician-directory.service';
import { CandidateScoringService, CANDIDATE_SCORER } from '../src/modules/scoring';
import { WorkOrderCreatedConsumer } from '../src/modules/consumers/work-order-created.consumer';

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

describe('DispatchModule Dependency Injection Bootstrap', () => {
  let context: NestApplicationContext;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_must_be_at_least_32_characters_long_for_test';

    const internalNestFactory = NestFactory as unknown as NestFactoryInternal;
    const applicationConfig = new ApplicationConfig();
    const container = new NestContainer(applicationConfig);
    const graphInspector = internalNestFactory.createGraphInspector({}, container);
    await internalNestFactory.initialize(
      DispatchModule,
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

    // Allow any pending async connect attempts from Redis factory to settle
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  afterAll(async () => {
    const redis = context?.get(RedisIdempotencyClient);
    if (redis && redis.rawClient) {
      redis.rawClient.disconnect();
    }
    const localRedis = context?.get(REDIS_CLIENT);
    if (localRedis && typeof localRedis.disconnect === 'function') {
      localRedis.disconnect();
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it('resolves DispatchController and all dispatch providers without DI errors', () => {
    expect(context.get(DispatchController)).toBeInstanceOf(DispatchController);
    expect(context.get(GeoSearchService)).toBeInstanceOf(GeoSearchService);
    expect(context.get(TechnicianDirectoryService)).toBeInstanceOf(TechnicianDirectoryService);
    expect(context.get(CANDIDATE_SCORER)).toBeDefined();
    expect(context.get(CandidateScoringService)).toBeInstanceOf(CandidateScoringService);
    expect(context.get(WorkOrderCreatedConsumer)).toBeInstanceOf(WorkOrderCreatedConsumer);
    expect(context.get(REDIS_CLIENT)).toBeDefined();
  });
});
