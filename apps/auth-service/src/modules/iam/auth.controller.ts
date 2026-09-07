import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PhoneOtpService } from './phone-otp.service';
import {
  registerUserSchema,
  loginSchema,
  refreshTokenSchema,
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
  type RegisterUserDto,
  type LoginDto,
  type RefreshTokenDto,
  type SendPhoneOtpDto,
  type VerifyPhoneOtpDto,
  type AuthTokensDto,
  type PhoneOtpResponseDto
} from '@fieldforge/contracts';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly phoneOtpService: PhoneOtpService
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: unknown): Promise<AuthTokensDto> {
    const parsed = registerUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    return this.authService.register(parsed.data as RegisterUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown): Promise<AuthTokensDto> {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    return this.authService.login(parsed.data as LoginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: unknown): Promise<AuthTokensDto> {
    const parsed = refreshTokenSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    return this.authService.refresh((parsed.data as RefreshTokenDto).refreshToken);
  }

  @Post('phone/send-otp')
  @HttpCode(HttpStatus.OK)
  async sendPhoneOtp(@Body() body: unknown): Promise<PhoneOtpResponseDto> {
    const parsed = sendPhoneOtpSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    const { phoneNumber } = parsed.data as SendPhoneOtpDto;
    return this.phoneOtpService.sendOtp(phoneNumber);
  }

  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyPhoneOtp(@Body() body: unknown): Promise<PhoneOtpResponseDto> {
    const parsed = verifyPhoneOtpSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    const { phoneNumber, code } = parsed.data as VerifyPhoneOtpDto;
    return this.phoneOtpService.verifyOtp(phoneNumber, code);
  }
}
