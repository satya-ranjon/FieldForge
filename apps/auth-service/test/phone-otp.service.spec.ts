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

  describe('Pruning and Capacity Controls (ISSUE-008)', () => {
    it('prunes expired OTPs and leaves active OTPs intact', async () => {
      const pastTime = Date.now();
      await service.sendOtp(TEST_PHONE);
      expect(service.getOtpStoreSize()).toBe(1);

      // Fast-forward 6 minutes (TTL is 5 minutes)
      const futureTime = pastTime + 6 * 60 * 1000;
      service.pruneExpired(futureTime);

      expect(service.getOtpStoreSize()).toBe(0);
    });

    it('prunes stale rate-limit timestamps and deletes empty phone keys', async () => {
      const startTime = Date.now();
      await service.sendOtp(TEST_PHONE);
      expect(service.getRateLimitStoreSize()).toBe(1);

      // 11 minutes later (RATE_LIMIT_WINDOW_MS is 10 minutes)
      const futureTime = startTime + 11 * 60 * 1000;
      service.pruneExpired(futureTime);

      expect(service.getRateLimitStoreSize()).toBe(0);
    });

    it('fails closed when store reaches capacity limit rather than evicting rate limits', async () => {
      // Create service with small capacity = 2
      const smallService = new PhoneOtpService(2);

      await smallService.sendOtp('+14155550001');
      await smallService.sendOtp('+14155550002');
      expect(smallService.getOtpStoreSize()).toBe(2);
      expect(smallService.getRateLimitStoreSize()).toBe(2);

      // Attempting to send OTP to a 3rd number must fail closed
      await expect(smallService.sendOtp('+14155550003')).rejects.toThrow(
        'OTP verification service is temporarily busy. Please try again later.'
      );

      // Re-sending to existing number within rate limit should still work
      const res = await smallService.sendOtp('+14155550001');
      expect(res.success).toBe(true);

      // But rate limit on existing number must STILL be enforced (never evicted or bypassed)
      await smallService.sendOtp('+14155550001');
      await expect(smallService.sendOtp('+14155550001')).rejects.toThrow(
        'Too many OTP requests. Please try again later.'
      );
    });

    it('frees capacity when expired entries are pruned', async () => {
      const smallService = new PhoneOtpService(1);
      const startTime = Date.now();

      await smallService.sendOtp('+14155550001');
      expect(smallService.getOtpStoreSize()).toBe(1);

      // 11 minutes later, pruning should allow a new phone number
      smallService.pruneExpired(startTime + 11 * 60 * 1000);
      expect(smallService.getOtpStoreSize()).toBe(0);
      expect(smallService.getRateLimitStoreSize()).toBe(0);

      const res = await smallService.sendOtp('+14155550002');
      expect(res.success).toBe(true);
    });
  });
});
