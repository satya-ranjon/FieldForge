import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsNotificationChannel {
  async sendSms(phoneNumber: string, message: string) {
    console.log(`💬 [Twilio SMS] -> ${phoneNumber}: ${message}`);
  }
}
