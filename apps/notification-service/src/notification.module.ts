import { Module } from '@nestjs/common';
import { MessagingModule } from '@fieldforge/messaging';
import { HealthController } from '@fieldforge/common';
import { PushNotificationChannel } from './channels/push.channel';
import { SmsNotificationChannel } from './channels/sms.channel';
import { NotificationConsumer } from './consumers/notification.consumer';

/**
 * Headless Event-Driven Notification Worker (ADR 010)
 *
 * This module defines a headless background consumer daemon, NOT an HTTP-routable
 * API microservice. It subscribes exclusively to RabbitMQ topic exchange events
 * (e.g. WORK_ORDER_PUBLISHED, WORK_ORDER_ASSIGNED, WORK_ORDER_PAID) and delivers
 * SMS alerts and push notifications via external provider channels.
 *
 * HTTP controllers are strictly limited to `HealthController` for internal container
 * liveness/readiness probes (/healthz, /readyz) and Prometheus scraping (/metrics).
 * No public business endpoints are registered or proxied through API Gateway.
 */
@Module({
  imports: [MessagingModule.forRoot({ serviceName: 'notification-service' })],
  controllers: [HealthController],
  providers: [PushNotificationChannel, SmsNotificationChannel, NotificationConsumer],
  exports: [NotificationConsumer]
})
export class NotificationModule {}
