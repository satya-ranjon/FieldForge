import { Module } from '@nestjs/common';
import { MessagingModule } from '@fieldforge/messaging';
import { HealthController } from '@fieldforge/common';
import { PushNotificationChannel } from './channels/push.channel';
import { SmsNotificationChannel } from './channels/sms.channel';
import { NotificationConsumer } from './consumers/notification.consumer';

@Module({
  imports: [MessagingModule.forRoot({ serviceName: 'notification-service' })],
  controllers: [HealthController],
  providers: [PushNotificationChannel, SmsNotificationChannel, NotificationConsumer],
  exports: [NotificationConsumer]
})
export class NotificationModule {}
