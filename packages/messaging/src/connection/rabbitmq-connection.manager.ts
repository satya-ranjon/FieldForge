import { Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import * as amqp from 'amqplib';
import {
  EVENT_EXCHANGE,
  EVENT_DEAD_LETTER_EXCHANGE,
  DEFAULT_DEAD_LETTER_QUEUE,
  MESSAGING_MODULE_OPTIONS
} from '../constants';
import type { MessagingOptions } from '../config/messaging.config';

@Injectable()
export class RabbitMQConnectionManager implements OnApplicationShutdown {
  private connection: amqp.ChannelModel | null = null;
  private publishChannel: amqp.ConfirmChannel | null = null;
  private consumeChannel: amqp.Channel | null = null;
  private isConnecting = false;

  constructor(@Inject(MESSAGING_MODULE_OPTIONS) private readonly options: MessagingOptions) {}

  async getPublishChannel(): Promise<amqp.ConfirmChannel> {
    await this.ensureConnected();
    if (!this.publishChannel) {
      throw new Error('[RabbitMQConnectionManager] Publish channel is not initialized');
    }
    return this.publishChannel;
  }

  async getConsumeChannel(): Promise<amqp.Channel> {
    await this.ensureConnected();
    if (!this.consumeChannel) {
      throw new Error('[RabbitMQConnectionManager] Consume channel is not initialized');
    }
    return this.consumeChannel;
  }

  async ensureConnected(): Promise<void> {
    if (this.connection && this.publishChannel && this.consumeChannel) {
      return;
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return;
    }

    this.isConnecting = true;
    try {
      this.connection = await amqp.connect(this.options.rabbitUrl);

      this.connection.on('error', (err) => {
        console.error('[RabbitMQConnectionManager] Connection error:', err.message);
      });

      this.connection.on('close', () => {
        this.connection = null;
        this.publishChannel = null;
        this.consumeChannel = null;
      });

      // Confirm channel for publisher confirms
      this.publishChannel = await this.connection.createConfirmChannel();

      // Consumer channel for queue subscriptions
      this.consumeChannel = await this.connection.createChannel();
      await this.consumeChannel.prefetch(10);

      // Assert primary topic exchange and DLX per RULE-EVENT-03
      await this.publishChannel.assertExchange(this.options.exchange || EVENT_EXCHANGE, 'topic', {
        durable: true
      });

      await this.publishChannel.assertExchange(
        this.options.dlxExchange || EVENT_DEAD_LETTER_EXCHANGE,
        'topic',
        { durable: true }
      );

      // Assert default dead-letter queue and bind to DLX
      await this.publishChannel.assertQueue(DEFAULT_DEAD_LETTER_QUEUE, { durable: true });
      await this.publishChannel.bindQueue(
        DEFAULT_DEAD_LETTER_QUEUE,
        this.options.dlxExchange || EVENT_DEAD_LETTER_EXCHANGE,
        '#'
      );
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Asserts a worker queue with dead-letter exchange configuration
   * and binds it to the topic exchange for the given routing keys.
   */
  async assertQueueAndBind(queueName: string, routingKeys: string[]): Promise<void> {
    const channel = await this.getConsumeChannel();
    const dlx = this.options.dlxExchange || EVENT_DEAD_LETTER_EXCHANGE;
    const exchange = this.options.exchange || EVENT_EXCHANGE;

    // Queue configured with DLX per RULE-EVENT-03
    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlx,
        'x-dead-letter-routing-key': `${queueName}.dlq`
      }
    });

    // Dedicated DLQ for this queue on DLX
    const dlqName = `${queueName}.dlq`;
    await channel.assertQueue(dlqName, { durable: true });
    await channel.bindQueue(dlqName, dlx, dlqName);

    for (const key of routingKeys) {
      await channel.bindQueue(queueName, exchange, key);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    try {
      if (this.publishChannel) {
        await this.publishChannel.close();
      }
      if (this.consumeChannel) {
        await this.consumeChannel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[RabbitMQConnectionManager] Shutdown error:', message);
    } finally {
      this.publishChannel = null;
      this.consumeChannel = null;
      this.connection = null;
    }
  }
}
