import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import Redis from 'ioredis';
import { requireJwtSecret, loadEnv } from '@fieldforge/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PhoneOtpService, REDIS_CLIENT } from './phone-otp.service';
import { ProfilesModule } from '../profiles/profiles.module';

export const redisProvider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    loadEnv();
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = Number(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || undefined;
    const client = new Redis({
      host,
      port,
      password,
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });
    client.connect().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[IamModule] Redis connect failed: ${msg}`);
    });
    return client;
  }
};

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
  providers: [AuthService, PhoneOtpService, redisProvider],
  exports: [AuthService, PhoneOtpService, JwtModule, REDIS_CLIENT]
})
export class IamModule {}
