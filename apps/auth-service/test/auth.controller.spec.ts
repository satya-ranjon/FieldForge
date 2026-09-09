import { BadRequestException } from '@nestjs/common';
import { AuthController } from '../src/modules/iam/auth.controller';
import type { AuthService } from '../src/modules/iam/auth.service';
import type { PhoneOtpService } from '../src/modules/iam/phone-otp.service';
import { ZodValidationPipe } from '@fieldforge/common';
import {
  registerUserSchema,
  loginSchema,
  refreshTokenSchema,
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
  UserRole
} from '@fieldforge/contracts';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: {
    register: jest.Mock;
    login: jest.Mock;
    refresh: jest.Mock;
  };
  let mockPhoneOtpService: {
    sendOtp: jest.Mock;
    verifyOtp: jest.Mock;
  };

  const sampleTokens = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
    tokenType: 'Bearer',
    expiresIn: 900
  };

  beforeEach(() => {
    mockAuthService = {
      register: jest.fn().mockResolvedValue(sampleTokens),
      login: jest.fn().mockResolvedValue(sampleTokens),
      refresh: jest.fn().mockResolvedValue(sampleTokens)
    };

    mockPhoneOtpService = {
      sendOtp: jest.fn().mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
        phoneNumber: '+14155552671'
      }),
      verifyOtp: jest.fn().mockResolvedValue({
        success: true,
        message: 'Phone number verified successfully',
        phoneNumber: '+14155552671'
      })
    };

    controller = new AuthController(
      mockAuthService as unknown as AuthService,
      mockPhoneOtpService as unknown as PhoneOtpService
    );
  });

  describe('POST /auth/register', () => {
    const validDto = {
      email: 'tech@example.com',
      password: 'StrongPassword123!',
      phoneNumber: '+14155552671',
      firstName: 'Jane',
      lastName: 'Doe',
      role: UserRole.TECHNICIAN
    };

    it('delegates valid registration payload to AuthService', async () => {
      const result = await controller.register(validDto);
      expect(result).toEqual(sampleTokens);
      expect(mockAuthService.register).toHaveBeenCalledWith(validDto);
    });

    it('rejects invalid email via ZodValidationPipe', () => {
      const pipe = new ZodValidationPipe(registerUserSchema);
      expect(() =>
        pipe.transform(
          { ...validDto, email: 'not-an-email' },
          { type: 'body', metatype: Object, data: '' }
        )
      ).toThrow(BadRequestException);
    });
  });

  describe('POST /auth/login', () => {
    const validDto = {
      email: 'user@example.com',
      password: 'Password123!'
    };

    it('delegates valid login credentials to AuthService', async () => {
      const result = await controller.login(validDto);
      expect(result).toEqual(sampleTokens);
      expect(mockAuthService.login).toHaveBeenCalledWith(validDto);
    });

    it('rejects missing password via ZodValidationPipe', () => {
      const pipe = new ZodValidationPipe(loginSchema);
      expect(() =>
        pipe.transform({ email: 'user@example.com' }, { type: 'body', metatype: Object, data: '' })
      ).toThrow(BadRequestException);
    });
  });

  describe('POST /auth/refresh', () => {
    it('delegates valid refresh token to AuthService', async () => {
      const result = await controller.refresh({ refreshToken: 'valid-refresh-token' });
      expect(result).toEqual(sampleTokens);
      expect(mockAuthService.refresh).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('rejects empty refresh token via ZodValidationPipe', () => {
      const pipe = new ZodValidationPipe(refreshTokenSchema);
      expect(() =>
        pipe.transform({ refreshToken: '' }, { type: 'body', metatype: Object, data: '' })
      ).toThrow(BadRequestException);
    });
  });

  describe('POST /auth/phone/send-otp', () => {
    it('delegates valid phone number to PhoneOtpService', async () => {
      const result = await controller.sendPhoneOtp({ phoneNumber: '+14155552671' });
      expect(result.success).toBe(true);
      expect(mockPhoneOtpService.sendOtp).toHaveBeenCalledWith('+14155552671');
    });

    it('rejects invalid phone format via ZodValidationPipe', () => {
      const pipe = new ZodValidationPipe(sendPhoneOtpSchema);
      expect(() =>
        pipe.transform({ phoneNumber: '123' }, { type: 'body', metatype: Object, data: '' })
      ).toThrow(BadRequestException);
    });
  });

  describe('POST /auth/phone/verify-otp', () => {
    it('delegates valid phone verification payload to PhoneOtpService', async () => {
      const result = await controller.verifyPhoneOtp({
        phoneNumber: '+14155552671',
        code: '123456'
      });
      expect(result.success).toBe(true);
      expect(mockPhoneOtpService.verifyOtp).toHaveBeenCalledWith('+14155552671', '123456');
    });

    it('rejects short OTP code via ZodValidationPipe', () => {
      const pipe = new ZodValidationPipe(verifyPhoneOtpSchema);
      expect(() =>
        pipe.transform(
          { phoneNumber: '+14155552671', code: '12' },
          { type: 'body', metatype: Object, data: '' }
        )
      ).toThrow(BadRequestException);
    });
  });
});
