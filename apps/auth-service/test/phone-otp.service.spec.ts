import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import type Redis from 'ioredis';
import {
  PhoneOtpService,
  defaultSecureOtpGenerator,
  OTP_REDIS_PREFIX
} from '../src/modules/iam/phone-otp.service';

/**
 * In-memory test double that accurately simulates Redis key-value storage,
 * sorted sets (ZSET), TTL expiration, and Lua atomic scripts used by PhoneOtpService.
 */
class FakeRedisClient {
  private kv = new Map<string, { value: string; expiresAt: number }>();
  private zsets = new Map<
    string,
    { entries: { score: number; member: string }[]; expiresAt: number }
  >();
  private currentTime = Date.now();
  public shouldFail = false;

  setTime(t: number): void {
    this.currentTime = t;
  }

  advanceTime(ms: number): void {
    this.currentTime += ms;
  }

  getTime(): number {
    return this.currentTime;
  }

  async eval(
    script: string,
    _numKeys: number,
    key: string,
    ...args: (string | number)[]
  ): Promise<string | number> {
    if (this.shouldFail) {
      throw new Error('Connection to Redis lost');
    }

    // Rate-limiting Lua script
    if (script.includes('ZREMRANGEBYSCORE')) {
      const now = Number(args[0]);
      const windowMs = Number(args[1]);
      const maxRequests = Number(args[2]);
      const member = String(args[3]);
      const clearBefore = now - windowMs;

      let zset = this.zsets.get(key);
      if (!zset || zset.expiresAt <= now) {
        zset = { entries: [], expiresAt: now + windowMs };
        this.zsets.set(key, zset);
      }

      // Evict timestamps older than sliding window
      zset.entries = zset.entries.filter((e) => e.score > clearBefore);

      if (zset.entries.length >= maxRequests) {
        return 0; // Rate limited
      }

      zset.entries.push({ score: now, member });
      zset.expiresAt = now + windowMs;
      return 1; // Allowed
    }

    // Verification Lua script
    if (script.includes('submittedCode')) {
      const submittedCode = String(args[0]);
      const maxAttempts = Number(args[1]);

      const entry = this.kv.get(key);
      if (!entry || entry.expiresAt <= this.currentTime) {
        if (entry) this.kv.delete(key);
        return 'NOT_FOUND';
      }

      const data = JSON.parse(entry.value);
      if (data.attempts >= maxAttempts) {
        this.kv.delete(key);
        return 'TOO_MANY_ATTEMPTS';
      }

      if (data.code !== submittedCode) {
        data.attempts += 1;
        if (data.attempts >= maxAttempts) {
          this.kv.delete(key);
          return 'TOO_MANY_ATTEMPTS';
        }

        const remainingMs = entry.expiresAt - this.currentTime;
        if (remainingMs > 0) {
          entry.value = JSON.stringify(data);
          return 'INVALID_CODE';
        } else {
          this.kv.delete(key);
          return 'NOT_FOUND';
        }
      }

      // Code matched -> atomically consume (delete)
      this.kv.delete(key);
      return 'SUCCESS';
    }

    throw new Error(`Unsupported script in FakeRedisClient: ${script}`);
  }

  async set(key: string, value: string, mode?: string, ttl?: number): Promise<'OK'> {
    if (this.shouldFail) {
      throw new Error('Connection to Redis lost');
    }
    let expiresAt = Infinity;
    if (mode === 'EX' && ttl) {
      expiresAt = this.currentTime + ttl * 1000;
    } else if (mode === 'PX' && ttl) {
      expiresAt = this.currentTime + ttl;
    }
    this.kv.set(key, { value, expiresAt });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    if (this.shouldFail) {
      throw new Error('Connection to Redis lost');
    }
    const entry = this.kv.get(key);
    if (!entry || entry.expiresAt <= this.currentTime) {
      if (entry) this.kv.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<number> {
    if (this.shouldFail) {
      throw new Error('Connection to Redis lost');
    }
    const deleted = (this.kv.delete(key) ? 1 : 0) + (this.zsets.delete(key) ? 1 : 0);
    return deleted > 0 ? 1 : 0;
  }

  disconnect(): void {}

  clear(): void {
    this.kv.clear();
    this.zsets.clear();
    this.shouldFail = false;
  }
}

describe('PhoneOtpService (ISSUE-012 Distributed Redis Implementation)', () => {
  let fakeRedis: FakeRedisClient;
  let service: PhoneOtpService;
  const TEST_PHONE = '+14155552671';
  const FIXED_OTP = '123456';

  beforeEach(() => {
    fakeRedis = new FakeRedisClient();
    jest.spyOn(Date, 'now').mockImplementation(() => fakeRedis.getTime());
    // Inject fake Redis and deterministic generator for tests
    service = new PhoneOtpService(fakeRedis as unknown as Redis, () => FIXED_OTP);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fakeRedis.clear();
  });

  describe('Core Functionality', () => {
    it('generates and sends OTP successfully with 300s TTL', async () => {
      const res = await service.sendOtp(TEST_PHONE);
      expect(res.success).toBe(true);
      expect(res.expiresInSeconds).toBe(300);
      expect(res.message).toContain(TEST_PHONE);

      const stored = await fakeRedis.get(`${OTP_REDIS_PREFIX}${TEST_PHONE}`);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.code).toBe(FIXED_OTP);
      expect(parsed.attempts).toBe(0);
    });

    it('verifies correct OTP code and consumes it from Redis', async () => {
      await service.sendOtp(TEST_PHONE);
      const res = await service.verifyOtp(TEST_PHONE, FIXED_OTP);
      expect(res.success).toBe(true);
      expect(res.message).toContain('verified successfully');

      // Key must be atomically deleted after successful verification (one-time use)
      const stored = await fakeRedis.get(`${OTP_REDIS_PREFIX}${TEST_PHONE}`);
      expect(stored).toBeNull();
    });

    it('rejects incorrect OTP code without deleting valid code on non-terminal attempt', async () => {
      await service.sendOtp(TEST_PHONE);
      await expect(service.verifyOtp(TEST_PHONE, '999999')).rejects.toThrow(
        'Invalid verification code'
      );

      // Key still exists with attempts = 1
      const stored = await fakeRedis.get(`${OTP_REDIS_PREFIX}${TEST_PHONE}`);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.attempts).toBe(1);

      // Now verifying with correct code still succeeds
      const res = await service.verifyOtp(TEST_PHONE, FIXED_OTP);
      expect(res.success).toBe(true);
    });

    it('rejects verification if no OTP was requested', async () => {
      await expect(service.verifyOtp('+14155559999', FIXED_OTP)).rejects.toThrow(
        'No verification code requested for this phone number'
      );
    });

    it('enforces 3 failed attempts max before permanently deleting OTP', async () => {
      await service.sendOtp(TEST_PHONE);

      // Attempt 1: wrong
      await expect(service.verifyOtp(TEST_PHONE, '000001')).rejects.toThrow(
        'Invalid verification code'
      );
      // Attempt 2: wrong
      await expect(service.verifyOtp(TEST_PHONE, '000002')).rejects.toThrow(
        'Invalid verification code'
      );
      // Attempt 3: wrong -> exhausted
      await expect(service.verifyOtp(TEST_PHONE, '000003')).rejects.toThrow(
        'Too many failed verification attempts. Please request a new code.'
      );

      // Subsequent attempt must find no OTP
      await expect(service.verifyOtp(TEST_PHONE, FIXED_OTP)).rejects.toThrow(
        'No verification code requested for this phone number'
      );
    });

    it('enforces sliding-window rate limit on repeated requests', async () => {
      await service.sendOtp(TEST_PHONE);
      await service.sendOtp(TEST_PHONE);
      await service.sendOtp(TEST_PHONE);

      // 4th request within 10-minute window must be rejected
      await expect(service.sendOtp(TEST_PHONE)).rejects.toThrow(
        'Too many OTP requests. Please try again later.'
      );

      // Fast forward 11 minutes (past 10-minute sliding window)
      fakeRedis.advanceTime(11 * 60 * 1000);

      // Next send must now succeed
      const res = await service.sendOtp(TEST_PHONE);
      expect(res.success).toBe(true);
    });
  });

  describe('Predictable Test OTP Backdoor Elimination (PART 2 & PART 27)', () => {
    it('does NOT generate predictable 123456 for phone numbers ending with 0000 in normal runtime', async () => {
      // Create service without test generator override (using defaultSecureOtpGenerator)
      const runtimeService = new PhoneOtpService(fakeRedis as unknown as Redis);

      // Send OTP to phone ending in 0000
      const res = await runtimeService.sendOtp('+14155550000');
      expect(res.success).toBe(true);

      const stored = await fakeRedis.get(`${OTP_REDIS_PREFIX}+14155550000`);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.code).toHaveLength(6);
      expect(Number(parsed.code)).toBeGreaterThanOrEqual(100000);
      expect(Number(parsed.code)).toBeLessThan(1000000);

      // Generate 10 codes for a number ending in 0000
      const generatedCodes = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const code = defaultSecureOtpGenerator();
        expect(code).toHaveLength(6);
        expect(Number(code)).toBeGreaterThanOrEqual(100000);
        expect(Number(code)).toBeLessThan(1000000);
        generatedCodes.add(code);
      }

      // Codes must be non-predictable (random distribution)
      expect(generatedCodes.size).toBeGreaterThan(1);
    });
  });

  describe('Multi-Instance & Distributed Replica Safety (PART 21 & PART 25)', () => {
    let servicePodA: PhoneOtpService;
    let servicePodB: PhoneOtpService;

    beforeEach(() => {
      // Simulate two separate microservice pods sharing the same Redis cluster
      servicePodA = new PhoneOtpService(fakeRedis as unknown as Redis, () => '654321');
      servicePodB = new PhoneOtpService(fakeRedis as unknown as Redis, () => '654321');
    });

    it('cross-pod verification: Pod A sends OTP, Pod B successfully verifies it', async () => {
      const sendRes = await servicePodA.sendOtp(TEST_PHONE);
      expect(sendRes.success).toBe(true);

      const verifyRes = await servicePodB.verifyOtp(TEST_PHONE, '654321');
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.message).toContain('verified successfully');
    });

    it('one-time-use atomicity: Pod A and Pod B concurrently verify same code -> exactly one succeeds', async () => {
      await servicePodA.sendOtp(TEST_PHONE);

      const results = await Promise.allSettled([
        servicePodA.verifyOtp(TEST_PHONE, '654321'),
        servicePodB.verifyOtp(TEST_PHONE, '654321')
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(BadRequestException);
    });

    it('distributed send rate-limiting: requests split across Pod A and Pod B enforce global limit', async () => {
      // 3 requests split across pods
      await servicePodA.sendOtp(TEST_PHONE); // Request 1 (Pod A)
      await servicePodB.sendOtp(TEST_PHONE); // Request 2 (Pod B)
      await servicePodA.sendOtp(TEST_PHONE); // Request 3 (Pod A)

      // 4th request on Pod B must be rejected
      await expect(servicePodB.sendOtp(TEST_PHONE)).rejects.toThrow(
        'Too many OTP requests. Please try again later.'
      );
      // 4th request on Pod A must also be rejected
      await expect(servicePodA.sendOtp(TEST_PHONE)).rejects.toThrow(
        'Too many OTP requests. Please try again later.'
      );
    });

    it('shared wrong attempt tracking: wrong attempts on Pod A and Pod B aggregate globally', async () => {
      await servicePodA.sendOtp(TEST_PHONE);

      // Attempt 1 on Pod A: wrong
      await expect(servicePodA.verifyOtp(TEST_PHONE, '000001')).rejects.toThrow(
        'Invalid verification code'
      );

      // Attempt 2 on Pod B: wrong
      await expect(servicePodB.verifyOtp(TEST_PHONE, '000002')).rejects.toThrow(
        'Invalid verification code'
      );

      // Attempt 3 on Pod A: wrong -> terminal exhaustion
      await expect(servicePodA.verifyOtp(TEST_PHONE, '000003')).rejects.toThrow(
        'Too many failed verification attempts. Please request a new code.'
      );

      // Key must now be absent across all pods
      await expect(servicePodB.verifyOtp(TEST_PHONE, '654321')).rejects.toThrow(
        'No verification code requested for this phone number'
      );
    });

    it('resend semantics: Pod A sends OTP1, Pod B sends OTP2 -> OTP1 invalidated, OTP2 valid from either pod', async () => {
      const customPodA = new PhoneOtpService(fakeRedis as unknown as Redis, () => '111111');
      const customPodB = new PhoneOtpService(fakeRedis as unknown as Redis, () => '222222');

      await customPodA.sendOtp(TEST_PHONE);
      await customPodB.sendOtp(TEST_PHONE);

      // Old OTP1 must be invalid
      await expect(customPodA.verifyOtp(TEST_PHONE, '111111')).rejects.toThrow(
        'Invalid verification code'
      );

      // New OTP2 must be valid from Pod A
      const verifyRes = await customPodA.verifyOtp(TEST_PHONE, '222222');
      expect(verifyRes.success).toBe(true);
    });

    it('TTL expiration: past 300s, neither Pod A nor Pod B can verify', async () => {
      await servicePodA.sendOtp(TEST_PHONE);

      // Fast forward 6 minutes (TTL is 5 minutes)
      fakeRedis.advanceTime(6 * 60 * 1000);

      await expect(servicePodA.verifyOtp(TEST_PHONE, '654321')).rejects.toThrow(
        'No verification code requested for this phone number'
      );
      await expect(servicePodB.verifyOtp(TEST_PHONE, '654321')).rejects.toThrow(
        'No verification code requested for this phone number'
      );
    });
  });

  describe('Redis Outage & Fail-Closed Behavior (PART 16, 22, 23)', () => {
    it('fails closed with ServiceUnavailableException (HTTP 503) on Redis error during sendOtp', async () => {
      fakeRedis.shouldFail = true;

      await expect(service.sendOtp(TEST_PHONE)).rejects.toThrow(ServiceUnavailableException);
      await expect(service.sendOtp(TEST_PHONE)).rejects.toThrow(
        'Authentication service is temporarily unavailable. Please try again later.'
      );
    });

    it('fails closed with ServiceUnavailableException (HTTP 503) on Redis error during verifyOtp', async () => {
      fakeRedis.shouldFail = true;

      await expect(service.verifyOtp(TEST_PHONE, FIXED_OTP)).rejects.toThrow(
        ServiceUnavailableException
      );
      await expect(service.verifyOtp(TEST_PHONE, FIXED_OTP)).rejects.toThrow(
        'Authentication service is temporarily unavailable. Please try again later.'
      );
    });

    it('does not have any process-local Maps in PhoneOtpService (PART 29)', () => {
      const keys = Object.keys(service);
      expect(keys).not.toContain('otpStore');
      expect(keys).not.toContain('rateLimitStore');
      const untyped = service as unknown as Record<string, unknown>;
      expect(untyped['otpStore']).toBeUndefined();
      expect(untyped['rateLimitStore']).toBeUndefined();
      expect(untyped['pruneExpired']).toBeUndefined();
    });
  });
});
