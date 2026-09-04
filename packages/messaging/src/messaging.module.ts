import { Module, DynamicModule, Global } from '@nestjs/common';
import { MESSAGING_MODULE_OPTIONS } from './constants';
import { resolveMessagingOptions, type MessagingOptions } from './config/messaging.config';
import { RabbitMQConnectionManager } from './connection/rabbitmq-connection.manager';
import { RedisIdempotencyClient } from './connection/redis-idempotency.client';
import { EventPublisher } from './publisher/event-publisher';
import { IdempotentConsumer } from './consumer/idempotent-consumer';

@Global()
@Module({})
export class MessagingModule {
  static forRoot(options: Partial<MessagingOptions> = {}): DynamicModule {
    const resolvedOptions = resolveMessagingOptions(options);

    return {
      module: MessagingModule,
      providers: [
        {
          provide: MESSAGING_MODULE_OPTIONS,
          useValue: resolvedOptions
        },
        RabbitMQConnectionManager,
        RedisIdempotencyClient,
        EventPublisher,
        IdempotentConsumer
      ],
      exports: [
        MESSAGING_MODULE_OPTIONS,
        RabbitMQConnectionManager,
        RedisIdempotencyClient,
        EventPublisher,
        IdempotentConsumer
      ]
    };
  }
}
