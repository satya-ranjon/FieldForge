import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DrizzleModule, HealthController, GlobalHttpExceptionFilter } from '@fieldforge/common';
import { IamModule } from './modules/iam/iam.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ContractorVettingModule } from './modules/vetting/vetting.module';

@Module({
  imports: [DrizzleModule.forRoot(), IamModule, ProfilesModule, ContractorVettingModule],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter
    }
  ],
  exports: [IamModule, ProfilesModule, ContractorVettingModule]
})
export class AuthModule {}
