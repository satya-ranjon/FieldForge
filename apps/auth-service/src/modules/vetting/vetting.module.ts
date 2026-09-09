import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { requireJwtSecret } from '@fieldforge/common';
import { CertificationsService } from './certifications.service';
import { CertificationsController } from './certifications.controller';
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
  controllers: [CertificationsController],
  providers: [CertificationsService],
  exports: [CertificationsService]
})
export class ContractorVettingModule {}
