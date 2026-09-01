import { Injectable } from '@nestjs/common';
import type { MinorUnits } from '@fieldforge/contracts';
import { formatMinor } from '@fieldforge/contracts';
import { PushNotificationChannel } from '../channels/push.channel';
import { SmsNotificationChannel } from '../channels/sms.channel';

@Injectable()
export class NotificationConsumer {
  constructor(
    private readonly pushChannel: PushNotificationChannel,
    private readonly smsChannel: SmsNotificationChannel
  ) {}

  /**
   * Not bound to a queue yet — Phase 3 of docs/DEVELOPMENT_PLAN.md subscribes
   * this to `work_order.lifecycle.published` and reads the technician's phone
   * number from the match result rather than taking it as an argument.
   *
   * `payoutMinor` is integer minor units; formatting is the only place a money
   * value becomes a string for humans.
   */
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
