import { Injectable } from '@nestjs/common';

@Injectable()
export class PushNotificationChannel {
  async sendPush(deviceToken: string, title: string, body: string, payload: Record<string, any> = {}) {
    console.log(`📲 [FCM/APNS Push] -> Token: ${deviceToken.slice(0, 10)}... | ${title}: ${body}`);
  }
}
