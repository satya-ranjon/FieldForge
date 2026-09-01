import { PushNotificationChannel } from '../src/channels/push.channel';
import { SmsNotificationChannel } from '../src/channels/sms.channel';
import { NotificationConsumer } from '../src/consumers/notification.consumer';

const TECH_PHONE = '+14155550123';
const DEVICE_TOKEN = 'fcm-token-abcdefghijklmnop';

describe('NotificationConsumer', () => {
  let push: PushNotificationChannel;
  let sms: SmsNotificationChannel;
  let consumer: NotificationConsumer;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    push = new PushNotificationChannel();
    sms = new SmsNotificationChannel();
    consumer = new NotificationConsumer(push, sms);
  });

  describe('handleDispatchNotification', () => {
    it('sends through the SMS channel rather than formatting its own transport', async () => {
      const sendSms = jest.spyOn(sms, 'sendSms').mockResolvedValue();
      const sendPush = jest.spyOn(push, 'sendPush').mockResolvedValue();

      await consumer.handleDispatchNotification(TECH_PHONE, 'Emergency POS Terminal Swap', 45000);

      // The channel is the seam a real provider SDK slots into (Twilio, later);
      // a consumer that talked to the provider directly would have to be
      // rewritten instead of reconfigured.
      expect(sendSms).toHaveBeenCalledTimes(1);
      expect(sendPush).not.toHaveBeenCalled();
      expect(sendSms).toHaveBeenCalledWith(TECH_PHONE, expect.any(String));
    });

    it('renders the payout as currency, never as raw minor units', async () => {
      const sendSms = jest.spyOn(sms, 'sendSms').mockResolvedValue();

      await consumer.handleDispatchNotification(TECH_PHONE, 'Emergency POS Terminal Swap', 45000);

      // A technician reading "New gig nearby ... 45000" would think the job pays
      // forty-five thousand dollars. Formatting is the only place a money value
      // becomes a string for humans.
      const [, message] = sendSms.mock.calls[0];
      expect(message).toContain('$450.00');
      expect(message).not.toContain('45000');
    });

    it('names the work order in the message', async () => {
      const sendSms = jest.spyOn(sms, 'sendSms').mockResolvedValue();

      await consumer.handleDispatchNotification(TECH_PHONE, 'Emergency POS Terminal Swap', 45000);

      expect(sendSms.mock.calls[0][1]).toContain('Emergency POS Terminal Swap');
    });

    it.each([0, 7, 100, 4999])('formats %i minor units correctly', async (payoutMinor) => {
      const sendSms = jest.spyOn(sms, 'sendSms').mockResolvedValue();
      await consumer.handleDispatchNotification(TECH_PHONE, 'Job', payoutMinor);

      const expected = (payoutMinor / 100).toFixed(2);
      expect(sendSms.mock.calls[0][1]).toContain(`$${expected}`);
    });

    it('rejects a fractional payout rather than rounding it into a message', async () => {
      jest.spyOn(sms, 'sendSms').mockResolvedValue();

      // 449.995 cents is not an amount; sending "about $4.50" to a technician
      // would be a quote nobody can honour.
      await expect(consumer.handleDispatchNotification(TECH_PHONE, 'Job', 449.995)).rejects.toThrow(
        /minor units/
      );
    });
  });

  describe('handlePushNotification', () => {
    it('sends through the push channel', async () => {
      const sendPush = jest.spyOn(push, 'sendPush').mockResolvedValue();
      const sendSms = jest.spyOn(sms, 'sendSms').mockResolvedValue();

      await consumer.handlePushNotification(DEVICE_TOKEN, 'Emergency POS Terminal Swap');

      expect(sendPush).toHaveBeenCalledWith(
        DEVICE_TOKEN,
        'New gig nearby',
        'Emergency POS Terminal Swap'
      );
      expect(sendSms).not.toHaveBeenCalled();
    });
  });
});

describe('PushNotificationChannel', () => {
  it('truncates the device token in its log line', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await new PushNotificationChannel().sendPush(DEVICE_TOKEN, 'New gig nearby', 'Job');

    // A push token is a credential for reaching that device; whole tokens do not
    // belong in logs (docs/ISSUES.md L2).
    expect(String(log.mock.calls[0][0])).not.toContain(DEVICE_TOKEN);
  });
});
