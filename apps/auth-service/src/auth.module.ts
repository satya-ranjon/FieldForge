import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import {
  DrizzleModule,
  HealthController,
  GlobalHttpExceptionFilter,
  requireJwtSecret
} from '@fieldforge/common';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { UsersController } from './modules/users/users.controller';
import { UsersService } from './modules/users/users.service';
import { CertificationsService } from './modules/certifications/certifications.service';

@Module({
  imports: [
    DrizzleModule.forRoot(),
    // registerAsync, not register: the factory runs while `bootstrap()` builds
    // the app, so a missing or public JWT_SECRET is reported by the fatal logger
    // in main.ts instead of throwing during module import.
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: requireJwtSecret(),
        signOptions: { expiresIn: '15m' }
      })
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
