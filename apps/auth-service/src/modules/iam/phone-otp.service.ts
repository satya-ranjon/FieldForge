import {
  Injectable,
  Inject,
  Optional,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
  type OnApplicationShutdown
} from '@nestjs/common';
import type Redis from 'ioredis';
import * as crypto from 'node:crypto';
import type { PhoneOtpResponseDto } from '@fieldforge/contracts';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const OTP_GENERATOR = Symbol('OTP_GENERATOR');

export const OTP_REDIS_PREFIX = 'auth:otp:';
export const RATE_LIMIT_REDIS_PREFIX = 'auth:ratelimit:';

export const OTP_TTL_SECONDS = 300; // 5 minutes
export const RATE_LIMIT_WINDOW_SECONDS = 600; // 10 minutes
export const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_SECONDS * 1000;
export const MAX_ATTEMPTS = 3;
export const MAX_REQUESTS_PER_WINDOW = 3;

export type OtpGenerator = (phoneNumber?: string) => string;

export const defaultSecureOtpGenerator: OtpGenerator = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Atomic Lua script for sliding-window rate limiting on OTP generation.
 * KEYS[1]: Rate limit ZSET key (auth:ratelimit:<phone>)
 * ARGV[1]: Current timestamp in ms
 * ARGV[2]: Window size in ms (600,000)
 * ARGV[3]: Max requests per window (3)
 * ARGV[4]: Unique member identifier (<timestamp>:<nonce>)
 */
export const RATE_LIMIT_LUA_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local maxRequests = tonumber(ARGV[3])
local member = ARGV[4]
local clearBefore = now - windowMs

-- 1. Evict timestamps older than sliding window
redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)

-- 2. Count active timestamps in window
local currentCount = redis.call('ZCARD', key)

if currentCount >= maxRequests then
  return 0 -- Rate limit exceeded
end

-- 3. Record new attempt with unique member
redis.call('ZADD', key, now, member)

-- 4. Refresh TTL so idle keys expire naturally
redis.call('EXPIRE', key, math.ceil(windowMs / 1000))

return 1 -- Allowed
`;

/**
 * Atomic Lua script for one-time OTP verification.
 * KEYS[1]: OTP key (auth:otp:<phone>)
 * ARGV[1]: Submitted verification code
 * ARGV[2]: Max failed attempts allowed (3)
 */
export const VERIFY_OTP_LUA_SCRIPT = `
local key = KEYS[1]
local submittedCode = ARGV[1]
local maxAttempts = tonumber(ARGV[2])

local record = redis.call('GET', key)
if not record then
  return 'NOT_FOUND'
end

local data = cjson.decode(record)
if data.attempts >= maxAttempts then
  redis.call('DEL', key)
  return 'TOO_MANY_ATTEMPTS'
end

if data.code ~= submittedCode then
  data.attempts = data.attempts + 1
  if data.attempts >= maxAttempts then
    redis.call('DEL', key)
    return 'TOO_MANY_ATTEMPTS'
  else
    local pttl = redis.call('PTTL', key)
    if pttl > 0 then
      redis.call('SET', key, cjson.encode(data), 'PX', pttl)
    else
      redis.call('DEL', key)
      return 'NOT_FOUND'
    end
    return 'INVALID_CODE'
  end
end

-- Code matches! Atomically consume (delete) the OTP
redis.call('DEL', key)
return 'SUCCESS'
`;

@Injectable()
export class PhoneOtpService implements OnApplicationShutdown {
  private readonly logger = new Logger(PhoneOtpService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Optional()
    @Inject(OTP_GENERATOR)
    private readonly otpGenerator: OtpGenerator = defaultSecureOtpGenerator
  ) {}

  /**
   * Generates and stores a 6-digit verification code for the phone number in Redis.
   */
  async sendOtp(phoneNumber: string): Promise<PhoneOtpResponseDto> {
    const cleanPhone = phoneNumber.trim();
    const now = Date.now();
    const rateLimitKey = `${RATE_LIMIT_REDIS_PREFIX}${cleanPhone}`;
    const otpKey = `${OTP_REDIS_PREFIX}${cleanPhone}`;
    const member = `${now}:${crypto.randomUUID()}`;

    try {
      // 1. Atomic sliding-window rate limit check via Lua script
      const rateLimitResult = await this.redis.eval(
        RATE_LIMIT_LUA_SCRIPT,
        1,
        rateLimitKey,
        String(now),
        String(RATE_LIMIT_WINDOW_MS),
        String(MAX_REQUESTS_PER_WINDOW),
        member
      );

      if (Number(rateLimitResult) === 0) {
        throw new BadRequestException('Too many OTP requests. Please try again later.');
      }

      // 2. Generate non-predictable 6-digit code
      const code = this.otpGenerator(cleanPhone);

      // 3. Atomically store OTP in Redis with 5-minute TTL (replaces any existing code)
      const payload = JSON.stringify({
        code,
        attempts: 0
      });

      await this.redis.set(otpKey, payload, 'EX', OTP_TTL_SECONDS);

      this.logger.log(
        `Verification code dispatched for phone ending in ****${cleanPhone.slice(-4)}`
      );

      return {
        success: true,
        message: `Verification code sent to ${cleanPhone}`,
        expiresInSeconds: OTP_TTL_SECONDS
      };
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Redis failure during sendOtp for ****${cleanPhone.slice(-4)}: ${msg}`);
      throw new ServiceUnavailableException(
        'Authentication service is temporarily unavailable. Please try again later.'
      );
    }
  }

  /**
   * Atomically verifies the supplied code for the phone number in Redis.
   */
  async verifyOtp(phoneNumber: string, code: string): Promise<PhoneOtpResponseDto> {
    const cleanPhone = phoneNumber.trim();
    const cleanCode = code.trim();
    const otpKey = `${OTP_REDIS_PREFIX}${cleanPhone}`;

    try {
      const result = await this.redis.eval(
        VERIFY_OTP_LUA_SCRIPT,
        1,
        otpKey,
        cleanCode,
        String(MAX_ATTEMPTS)
      );

      const status = String(result);

      if (status === 'NOT_FOUND') {
        throw new BadRequestException('No verification code requested for this phone number');
      }

      if (status === 'TOO_MANY_ATTEMPTS') {
        throw new BadRequestException(
          'Too many failed verification attempts. Please request a new code.'
        );
      }

      if (status === 'INVALID_CODE') {
        throw new BadRequestException('Invalid verification code');
      }

      if (status === 'SUCCESS') {
        this.logger.log(`Phone number verified successfully: ****${cleanPhone.slice(-4)}`);
        return {
          success: true,
          message: 'Phone number verified successfully'
        };
      }

      throw new BadRequestException('Invalid verification code');
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Redis failure during verifyOtp for ****${cleanPhone.slice(-4)}: ${msg}`);
      throw new ServiceUnavailableException(
        'Authentication service is temporarily unavailable. Please try again later.'
      );
    }
  }

  async onApplicationShutdown(): Promise<void> {
    try {
      if (typeof this.redis?.disconnect === 'function') {
        this.redis.disconnect();
      }
    } catch {
      // Ignored during shutdown
    }
  }
}
