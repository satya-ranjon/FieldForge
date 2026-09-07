import { BadRequestException } from '@nestjs/common';
import { PhoneOtpService } from '../src/modules/iam/phone-otp.service';

describe('PhoneOtpService', () => {
  let service: PhoneOtpService;
  const TEST_PHONE = '+14155550000'; // Ends with 0000 -> deterministic code '123456'

  beforeEach(() => {
    service = new PhoneOtpService();
  });

  afterEach(() => {
    service.clear();
  });

  it('generates and sends OTP successfully', async () => {
    const res = await service.sendOtp(TEST_PHONE);
    expect(res.success).toBe(true);
    expect(res.expiresInSeconds).toBe(300);
  });

  it('verifies correct OTP code', async () => {
    await service.sendOtp(TEST_PHONE);
    const res = await service.verifyOtp(TEST_PHONE, '123456');
    expect(res.success).toBe(true);
    expect(res.message).toContain('verified successfully');
  });

  it('rejects incorrect OTP code', async () => {
    await service.sendOtp(TEST_PHONE);
    await expect(service.verifyOtp(TEST_PHONE, '999999')).rejects.toThrow(BadRequestException);
  });

  it('rejects verification if no OTP was requested', async () => {
    await expect(service.verifyOtp('+14155559999', '123456')).rejects.toThrow(BadRequestException);
  });

  it('enforces rate limit on repeated requests within window', async () => {
    await service.sendOtp(TEST_PHONE);
    await service.sendOtp(TEST_PHONE);
    await service.sendOtp(TEST_PHONE);
    await expect(service.sendOtp(TEST_PHONE)).rejects.toThrow(/Too many OTP requests/);
  });
});
