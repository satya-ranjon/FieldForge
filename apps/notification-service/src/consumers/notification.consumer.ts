import { Injectable, OnApplicationBootstrap, Optional } from '@nestjs/common';
import type {
  MinorUnits,
  WorkOrderPublishedEvent,
  WorkOrderAssignedEvent
} from '@fieldforge/contracts';
import { EventType, formatMinor } from '@fieldforge/contracts';
import { metricsRegistry } from '@fieldforge/common';
import { IdempotentConsumer } from '@fieldforge/messaging';
import { PushNotificationChannel } from '../channels/push.channel';
import { SmsNotificationChannel } from '../channels/sms.channel';

interface ContextLogger {
  info?: (msg: string) => void;
  error?: (msg: string) => void;
}

export const NOTIFICATIONS_WORK_ORDERS_QUEUE = 'fieldforge.notifications.work-orders';

@Injectable()
export class NotificationConsumer implements OnApplicationBootstrap {
  constructor(
    private readonly pushChannel: PushNotificationChannel,
    private readonly smsChannel: SmsNotificationChannel,
    @Optional() private readonly consumer?: IdempotentConsumer
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.consumer) {
      await this.consumer.subscribe<unknown>(
        NOTIFICATIONS_WORK_ORDERS_QUEUE,
        [EventType.WORK_ORDER_PUBLISHED, EventType.WORK_ORDER_ASSIGNED],
        async (event, logger) => {
          if (event.eventType === EventType.WORK_ORDER_PUBLISHED) {
            await this.handlePublishedEvent(event as unknown as WorkOrderPublishedEvent, logger);
          } else if (event.eventType === EventType.WORK_ORDER_ASSIGNED) {
            await this.handleAssignedEvent(event as unknown as WorkOrderAssignedEvent, logger);
          }
        }
      );
    }
  }

  async handlePublishedEvent(
    event: WorkOrderPublishedEvent,
    logger?: ContextLogger
  ): Promise<void> {
    const { title, maxBudgetMinor } = event.payload;
    if (logger?.info) {
      logger.info(`[Notifications] Broadcast notification for new work order: "${title}"`);
    }
    // Broadcast notification demo dispatch to nearby tech placeholder
    await this.handleDispatchNotification('+14155550123', title, maxBudgetMinor);

    if (event.occurredAt) {
      const durationSeconds = Math.max(
        0,
        (Date.now() - new Date(event.occurredAt).getTime()) / 1000
      );
      metricsRegistry.recordDispatchFanoutLatency(event.eventType, durationSeconds);
    }
  }

  async handleAssignedEvent(event: WorkOrderAssignedEvent, logger?: ContextLogger): Promise<void> {
    const { workOrderId, techId } = event.payload;
    if (logger?.info) {
      logger.info(
        `[Notifications] Sent assignment notice for work order ${workOrderId} to technician ${techId}`
      );
    }
    await this.handlePushNotification(
      `fcm-device-token-${techId}`,
      `Job Assignment: ${workOrderId}`
    );
  }

  async handleDispatchNotification(
    techPhone: string,
    workOrderTitle: string,
    payoutMinor: MinorUnits
  ) {
    await this.smsChannel.sendSms(
      techPhone,
      `[FieldForge] New gig nearby: "${workOrderTitle}" (${formatMinor(payoutMinor)}). Accept at https://app.fieldforge.io/gigs`
    );
  }

  async handlePushNotification(deviceToken: string, workOrderTitle: string) {
    await this.pushChannel.sendPush(deviceToken, 'New gig nearby', workOrderTitle);
  }
}
