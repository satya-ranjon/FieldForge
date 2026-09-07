import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { requireJwtSecret } from '@fieldforge/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PhoneOtpService } from './phone-otp.service';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [
    ProfilesModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: requireJwtSecret(),
        signOptions: { expiresIn: '15m' }
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, PhoneOtpService],
  exports: [AuthService, PhoneOtpService, JwtModule]
})
export class IamModule {}
