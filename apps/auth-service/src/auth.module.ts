import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { DrizzleModule, HealthController, GlobalHttpExceptionFilter } from '@fieldforge/common';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { UsersController } from './modules/users/users.controller';
import { UsersService } from './modules/users/users.service';
import { CertificationsService } from './modules/certifications/certifications.service';

@Module({
  imports: [
    DrizzleModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_jwt_key_fieldforge_2026',
      signOptions: { expiresIn: '15m' }
    })
  ],
  controllers: [AuthController, UsersController, HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter
    },
    AuthService,
    UsersService,
    CertificationsService
  ],
  exports: [AuthService, UsersService, CertificationsService]
})
export class AuthModule {}
