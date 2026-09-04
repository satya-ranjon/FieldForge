import { loadEnv } from '@fieldforge/common';
import { EVENT_EXCHANGE, EVENT_DEAD_LETTER_EXCHANGE } from '../constants';

export interface MessagingOptions {
  rabbitUrl: string;
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  exchange: string;
  dlxExchange: string;
  serviceName: string;
}

export function resolveMessagingOptions(
  overrides: Partial<MessagingOptions> = {}
): MessagingOptions {
  loadEnv();

  const rabbitUser = process.env.RABBITMQ_USER || 'fieldforge';
  const rabbitPass = process.env.RABBITMQ_PASSWORD || 'fieldforge_rabbit_local_only';
  const rabbitHost = process.env.RABBITMQ_HOST || '127.0.0.1';
  const rabbitPort = process.env.RABBITMQ_PORT || '5672';
  const defaultRabbitUrl = `amqp://${encodeURIComponent(rabbitUser)}:${encodeURIComponent(rabbitPass)}@${rabbitHost}:${rabbitPort}`;

  const redisHost = overrides.redisHost || process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = overrides.redisPort || Number(process.env.REDIS_PORT) || 6379;
  const redisPassword =
    overrides.redisPassword !== undefined
      ? overrides.redisPassword
      : process.env.REDIS_PASSWORD || 'fieldforge_redis_local_only';

  return {
    rabbitUrl: overrides.rabbitUrl || process.env.RABBITMQ_URL || defaultRabbitUrl,
    redisHost,
    redisPort,
    redisPassword,
    exchange: overrides.exchange || EVENT_EXCHANGE,
    dlxExchange: overrides.dlxExchange || EVENT_DEAD_LETTER_EXCHANGE,
    serviceName: overrides.serviceName || process.env.SERVICE_NAME || 'fieldforge-service'
  };
}
