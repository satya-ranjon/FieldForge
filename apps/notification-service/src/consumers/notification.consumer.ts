import { Injectable } from '@nestjs/common';
import { PushNotificationChannel } from '../channels/push.channel';
import { SmsNotificationChannel } from '../channels/sms.channel';

@Injectable()
export class NotificationConsumer {
  constructor(
    private readonly pushChannel: PushNotificationChannel,
    private readonly smsChannel: SmsNotificationChannel
  ) {}

  async handleDispatchNotification(techPhone: string, workOrderTitle: string, payout: number) {
    await this.smsChannel.sendSms(
      techPhone,
      `[FieldForge] New high-priority gig nearby! "${workOrderTitle}" ($${payout}). Tap to accept now: https://app.fieldforge.io/gigs`
    );
  }
}
