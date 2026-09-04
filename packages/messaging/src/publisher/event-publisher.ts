import { Injectable, Inject } from '@nestjs/common';
import type { EventEnvelope } from '@fieldforge/contracts';
import {
  EVENT_EXCHANGE,
  HEADER_CORRELATION_ID,
  HEADER_EVENT_ID,
  HEADER_EVENT_TYPE,
  HEADER_RETRY_COUNT,
  MESSAGING_MODULE_OPTIONS
} from '../constants';
import { RabbitMQConnectionManager } from '../connection/rabbitmq-connection.manager';
import type { MessagingOptions } from '../config/messaging.config';

@Injectable()
export class EventPublisher {
  constructor(
    private readonly connectionManager: RabbitMQConnectionManager,
    @Inject(MESSAGING_MODULE_OPTIONS) private readonly options: MessagingOptions
  ) {}

  /**
   * Publishes an EventEnvelope to the central topic exchange with Publisher Confirms.
   * Ensures the broker acknowledges receipt before resolving.
   */
  async publish<TPayload>(
    event: EventEnvelope<TPayload>,
    exchangeOverride?: string
  ): Promise<void> {
    const channel = await this.connectionManager.getPublishChannel();
    const exchange = exchangeOverride || this.options.exchange || EVENT_EXCHANGE;
    const routingKey = event.eventType;

    const content = Buffer.from(JSON.stringify(event));

    const publishPromise = new Promise<void>((resolve, reject) => {
      const published = channel.publish(
        exchange,
        routingKey,
        content,
        {
          persistent: true,
          contentType: 'application/json',
          messageId: event.eventId,
          correlationId: event.correlationId,
          timestamp: new Date(event.occurredAt).getTime(),
          headers: {
            [HEADER_CORRELATION_ID]: event.correlationId,
            [HEADER_EVENT_ID]: event.eventId,
            [HEADER_EVENT_TYPE]: event.eventType,
            [HEADER_RETRY_COUNT]: 0
          }
        },
        (err) => {
          if (err) {
            reject(
              new Error(
                `[EventPublisher] Broker NACK for event ${event.eventId} on ${routingKey}: ${err.message}`
              )
            );
          } else {
            resolve();
          }
        }
      );

      if (!published) {
        // Channel buffer full; wait for drain event or let confirm callback handle it
        channel.once('drain', () => {
          // drained
        });
      }
    });

    await publishPromise;
  }
}
