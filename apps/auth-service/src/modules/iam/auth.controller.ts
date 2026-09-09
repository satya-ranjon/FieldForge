import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PhoneOtpService } from './phone-otp.service';
import { ZodValidationPipe } from '@fieldforge/common';
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
  async register(
    @Body(new ZodValidationPipe(registerUserSchema)) dto: RegisterUserDto
  ): Promise<AuthTokensDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto): Promise<AuthTokensDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema)) dto: RefreshTokenDto
  ): Promise<AuthTokensDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('phone/send-otp')
  @HttpCode(HttpStatus.OK)
  async sendPhoneOtp(
    @Body(new ZodValidationPipe(sendPhoneOtpSchema)) dto: SendPhoneOtpDto
  ): Promise<PhoneOtpResponseDto> {
    return this.phoneOtpService.sendOtp(dto.phoneNumber);
  }

  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyPhoneOtp(
    @Body(new ZodValidationPipe(verifyPhoneOtpSchema)) dto: VerifyPhoneOtpDto
  ): Promise<PhoneOtpResponseDto> {
    return this.phoneOtpService.verifyOtp(dto.phoneNumber, dto.code);
  }
}
