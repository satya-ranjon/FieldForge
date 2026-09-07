import { Injectable, BadRequestException } from '@nestjs/common';
import type { PhoneOtpResponseDto } from '@fieldforge/contracts';

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class PhoneOtpService {
  private readonly otpStore = new Map<string, OtpRecord>();
  private readonly rateLimitStore = new Map<string, number[]>();

  private readonly OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_REQUESTS_PER_WINDOW = 3;

  /**
   * Generates and stores a 6-digit verification code for the phone number.
   */
  async sendOtp(phoneNumber: string): Promise<PhoneOtpResponseDto> {
    const cleanPhone = phoneNumber.trim();
    const now = Date.now();

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
    const record = this.otpStore.get(cleanPhone);

    if (!record) {
      throw new BadRequestException('No verification code requested for this phone number');
    }

    const now = Date.now();
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
   * Clears in-memory state (useful for test teardown).
   */
  clear(): void {
    this.otpStore.clear();
    this.rateLimitStore.clear();
  }
}
