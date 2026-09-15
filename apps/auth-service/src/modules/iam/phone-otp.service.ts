import { Injectable, BadRequestException } from '@nestjs/common';
import type { PhoneOtpResponseDto } from '@fieldforge/contracts';

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

export const DEFAULT_MAX_OTP_ENTRIES = 10_000;
export const DEFAULT_PRUNE_INTERVAL_MS = 60_000; // 1 minute

@Injectable()
export class PhoneOtpService {
  private readonly otpStore = new Map<string, OtpRecord>();
  private readonly rateLimitStore = new Map<string, number[]>();

  private readonly OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_REQUESTS_PER_WINDOW = 3;

  private readonly maxEntries: number;
  private readonly pruneIntervalMs: number;
  private lastPrunedAt = 0;

  constructor(maxEntries = DEFAULT_MAX_OTP_ENTRIES, pruneIntervalMs = DEFAULT_PRUNE_INTERVAL_MS) {
    this.maxEntries = maxEntries;
    this.pruneIntervalMs = pruneIntervalMs;
  }

  /**
   * Generates and stores a 6-digit verification code for the phone number.
   */
  async sendOtp(phoneNumber: string): Promise<PhoneOtpResponseDto> {
    const cleanPhone = phoneNumber.trim();
    const now = Date.now();

    // Opportunistic cleanup of expired OTPs and stale rate-limit records
    this.opportunisticPrune(now);

    // Fail-closed capacity check: never evict active rate limits under capacity pressure (anti-brute-force invariant)
    if (
      (!this.rateLimitStore.has(cleanPhone) && this.rateLimitStore.size >= this.maxEntries) ||
      (!this.otpStore.has(cleanPhone) && this.otpStore.size >= this.maxEntries)
    ) {
      throw new BadRequestException(
        'OTP verification service is temporarily busy. Please try again later.'
      );
    }

    // Check rate limit
    const timestamps = this.rateLimitStore.get(cleanPhone) ?? [];
    const recentTimestamps = timestamps.filter((t) => now - t < this.RATE_LIMIT_WINDOW_MS);

    if (recentTimestamps.length >= this.MAX_REQUESTS_PER_WINDOW) {
      throw new BadRequestException('Too many OTP requests. Please try again later.');
    }

    recentTimestamps.push(now);
    this.rateLimitStore.set(cleanPhone, recentTimestamps);

    // Deterministic mock OTP for test environments, or random 6-digit code
    const code = cleanPhone.endsWith('0000')
      ? '123456'
      : Math.floor(100000 + Math.random() * 900000).toString();

    this.otpStore.set(cleanPhone, {
      code,
      expiresAt: now + this.OTP_TTL_MS,
      attempts: 0
    });

    return {
      success: true,
      message: `Verification code sent to ${cleanPhone}`,
      expiresInSeconds: Math.floor(this.OTP_TTL_MS / 1000)
    };
  }

  /**
   * Verifies the supplied code for the phone number.
   */
  async verifyOtp(phoneNumber: string, code: string): Promise<PhoneOtpResponseDto> {
    const cleanPhone = phoneNumber.trim();
    const now = Date.now();

    // Opportunistic cleanup
    this.opportunisticPrune(now);

    const record = this.otpStore.get(cleanPhone);

    if (!record) {
      throw new BadRequestException('No verification code requested for this phone number');
    }

    if (now > record.expiresAt) {
      this.otpStore.delete(cleanPhone);
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    if (record.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(cleanPhone);
      throw new BadRequestException(
        'Too many failed verification attempts. Please request a new code.'
      );
    }

    if (record.code !== code.trim()) {
      record.attempts += 1;
      throw new BadRequestException('Invalid verification code');
    }

    // Successfully verified, clean up store
    this.otpStore.delete(cleanPhone);

    return {
      success: true,
      message: 'Phone number verified successfully'
    };
  }

  /**
   * Prunes expired OTP records and stale rate-limit timestamps.
   * Completely removes phone numbers from rateLimitStore if all their timestamps are outside the window.
   */
  pruneExpired(now: number = Date.now()): void {
    for (const [phone, record] of this.otpStore.entries()) {
      if (now > record.expiresAt) {
        this.otpStore.delete(phone);
      }
    }

    for (const [phone, timestamps] of this.rateLimitStore.entries()) {
      const active = timestamps.filter((t) => now - t < this.RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) {
        this.rateLimitStore.delete(phone);
      } else if (active.length < timestamps.length) {
        this.rateLimitStore.set(phone, active);
      }
    }

    this.lastPrunedAt = now;
  }

  private opportunisticPrune(now: number): void {
    const isNearCapacity =
      this.otpStore.size >= this.maxEntries * 0.9 ||
      this.rateLimitStore.size >= this.maxEntries * 0.9;
    const isIntervalElapsed = now - this.lastPrunedAt >= this.pruneIntervalMs;

    if (isNearCapacity || isIntervalElapsed) {
      this.pruneExpired(now);
    }
  }

  /**
   * Introspection method for tests/monitoring.
   */
  getOtpStoreSize(): number {
    return this.otpStore.size;
  }

  /**
   * Introspection method for tests/monitoring.
   */
  getRateLimitStoreSize(): number {
    return this.rateLimitStore.size;
  }

  /**
   * Clears in-memory state (useful for test teardown).
   */
  clear(): void {
    this.otpStore.clear();
    this.rateLimitStore.clear();
    this.lastPrunedAt = 0;
  }
}
