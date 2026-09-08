import { Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import type { ConsumeMessage } from 'amqplib';
import type { EventEnvelope } from '@fieldforge/contracts';
import { createLogger } from '@fieldforge/common';
import {
  EVENT_DEAD_LETTER_EXCHANGE,
  HEADER_CORRELATION_ID,
  HEADER_EVENT_ID,
  HEADER_EVENT_TYPE,
  HEADER_RETRY_COUNT,
  HEADER_ORIGINAL_QUEUE,
  MESSAGING_MODULE_OPTIONS,
  RETRY_QUEUE_SUFFIX,
  DLQ_QUEUE_SUFFIX
} from '../constants';
import { RabbitMQConnectionManager } from '../connection/rabbitmq-connection.manager';
import { RedisIdempotencyClient } from '../connection/redis-idempotency.client';
import { RetryPolicy } from './retry-policy';
import type { MessagingOptions } from '../config/messaging.config';

export type ConsumerHandler<TPayload> = (
  event: EventEnvelope<TPayload>,
  contextLogger: ReturnType<typeof createLogger>
) => Promise<void>;

@Injectable()
export class IdempotentConsumer implements OnApplicationShutdown {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly activeConsumerTags: string[] = [];

  constructor(
    private readonly connectionManager: RabbitMQConnectionManager,
    private readonly redisClient: RedisIdempotencyClient,
    @Inject(MESSAGING_MODULE_OPTIONS) private readonly options: MessagingOptions
  ) {
    this.logger = createLogger(options.serviceName || 'messaging-consumer');
  }

  /**
   * Subscribes to a worker queue, guaranteeing:
   * 1. Queue assertion with DLX binding and broker-native retry queue per RULE-EVENT-03.
   * 2. Atomic 7-day Redis idempotency check on eventId.
   * 3. Restoration of correlationId into Pino child logger.
   * 4. Bounded retries (max 3) with broker-native exponential backoff and DLQ routing.
   */
  async subscribe<TPayload>(
    queueName: string,
    routingKeys: string[],
    handler: ConsumerHandler<TPayload>
  ): Promise<string> {
    await this.connectionManager.assertQueueAndBind(queueName, routingKeys);
    const channel = await this.connectionManager.getConsumeChannel();

    const { consumerTag } = await channel.consume(
      queueName,
      async (msg: ConsumeMessage | null) => {
        if (!msg) {
          return;
        }
        await this.processMessage(msg, queueName, handler);
      },
      { noAck: false }
    );

    this.activeConsumerTags.push(consumerTag);
    return consumerTag;
  }

  private async processMessage<TPayload>(
    msg: ConsumeMessage,
    queueName: string,
    handler: ConsumerHandler<TPayload>
  ): Promise<void> {
    const channel = await this.connectionManager.getConsumeChannel();

    let envelope: EventEnvelope<TPayload>;
    try {
      envelope = JSON.parse(msg.content.toString('utf8'));
      if (!envelope || !envelope.eventId || !envelope.eventType) {
        throw new Error('Malformed event envelope: missing eventId or eventType');
      }
    } catch (parseErr: unknown) {
      this.logger.error(
        { err: parseErr, content: msg.content.toString('utf8') },
        '[IdempotentConsumer] Failed to parse message JSON; routing directly to DLQ'
      );
      await this.routeToDlx(msg, queueName, 'json_parse_error');
      channel.ack(msg);
      return;
    }

    const currentRetry = RetryPolicy.getRetryCount(msg);

    const correlationId =
      envelope.correlationId ||
      (msg.properties.headers?.[HEADER_CORRELATION_ID] as string) ||
      'unknown-correlation-id';

    const childLogger = this.logger.child({
      correlationId,
      eventId: envelope.eventId,
      eventType: envelope.eventType,
      queue: queueName,
      retryCount: currentRetry
    });

    // 1. Idempotency Gate (RULE-EVENT-03: 7-day TTL)
    // Passes currentRetry so broker-native retries can re-acquire while fresh duplicate deliveries are blocked
    const acquired = await this.redisClient.tryAcquire(envelope.eventId, currentRetry);
    if (!acquired) {
      childLogger.info(
        `[IdempotentConsumer] Duplicate event ${envelope.eventId} detected in Redis (retry: ${currentRetry}); skipping processing (no-op)`
      );
      channel.ack(msg);
      return;
    }

    // 2. Process Handler
    try {
      childLogger.debug(`[IdempotentConsumer] Handling event ${envelope.eventType}`);
      await handler(envelope, childLogger);

      // 3. Mark completed in Redis and ACK
      await this.redisClient.markCompleted(envelope.eventId);
      channel.ack(msg);
      childLogger.debug(`[IdempotentConsumer] Event ${envelope.eventId} processed and ACKed`);
    } catch (handlerErr: unknown) {
      this.logger.error(
        { err: handlerErr, retryCount: currentRetry },
        `[IdempotentConsumer] Handler failure for event ${envelope.eventId}`
      );

      if (RetryPolicy.canRetry(currentRetry)) {
        const nextRetry = currentRetry + 1;
        const delayMs = RetryPolicy.calculateDelayMs(nextRetry);

        childLogger.warn(
          `[IdempotentConsumer] Scheduling broker-native retry ${nextRetry}/3 in ${delayMs}ms via ${queueName}${RETRY_QUEUE_SUFFIX} for event ${envelope.eventId}`
        );

        try {
          // 1. Durably publish retry message into RabbitMQ's delay/retry queue with per-message expiration
          const pubChannel = await this.connectionManager.getPublishChannel();
          const existingHeaders = msg.properties.headers || {};
          const retryQueueName = `${queueName}${RETRY_QUEUE_SUFFIX}`;

          await new Promise<void>((resolve, reject) => {
            const published = pubChannel.sendToQueue(
              retryQueueName,
              msg.content,
              {
                ...msg.properties,
                persistent: true,
                expiration: String(delayMs),
                headers: {
                  ...existingHeaders,
                  [HEADER_RETRY_COUNT]: nextRetry,
                  [HEADER_CORRELATION_ID]: correlationId,
                  [HEADER_EVENT_ID]: envelope.eventId,
                  [HEADER_EVENT_TYPE]: envelope.eventType
                }
              },
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              }
            );

            // If buffer full, listen for drain or allow callback to resolve
            if (!published) {
              pubChannel.once('drain', () => {
                // drained
              });
            }
          });

          // 2. Transition Redis state to 'retrying:N' to block premature duplicate delivery
          // while message waits in RabbitMQ retry queue
          await this.redisClient.markRetrying(envelope.eventId, nextRetry);

          // 3. ONLY now safely ACK original message from worker queue (zero premature ACK)
          channel.ack(msg);
        } catch (republishErr: unknown) {
          childLogger.error(
            { err: republishErr },
            `[IdempotentConsumer] Failed to enqueue retry to ${queueName}${RETRY_QUEUE_SUFFIX}; routing to DLQ`
          );
          await this.routeToDlx(msg, queueName, 'retry_enqueue_failed');
          channel.ack(msg);
        }
      } else {
        // Max retries exceeded -> Dead-letter queue
        childLogger.error(
          `[IdempotentConsumer] Max retries (${currentRetry}) exceeded for event ${envelope.eventId}; routing to DLX`
        );

        await this.redisClient.markFailed(envelope.eventId, 'max_retries_exceeded');
        const reason = handlerErr instanceof Error ? handlerErr.message : 'max_retries_exceeded';
        await this.routeToDlx(msg, queueName, reason);
        channel.ack(msg);
      }
    }
  }

  private async routeToDlx(msg: ConsumeMessage, queueName: string, reason: string): Promise<void> {
    const pubChannel = await this.connectionManager.getPublishChannel();
    const dlx = this.options.dlxExchange || EVENT_DEAD_LETTER_EXCHANGE;
    const dlqRoutingKey = `${queueName}${DLQ_QUEUE_SUFFIX}`;

    const headers = {
      ...(msg.properties.headers || {}),
      [HEADER_ORIGINAL_QUEUE]: queueName,
      'x-death-reason': reason,
      'x-death-timestamp': new Date().toISOString()
    };

    pubChannel.publish(dlx, dlqRoutingKey, msg.content, {
      ...msg.properties,
      persistent: true,
      headers
    });
  }

  async onApplicationShutdown(): Promise<void> {
    try {
      const channel = await this.connectionManager.getConsumeChannel();
      for (const tag of this.activeConsumerTags) {
        await channel.cancel(tag);
      }
    } catch {
      // Ignored during shutdown
    }
  }
}
