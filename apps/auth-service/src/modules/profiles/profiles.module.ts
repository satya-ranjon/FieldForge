import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { requireJwtSecret } from '@fieldforge/common';
import { ProfilesService } from './profiles.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: requireJwtSecret(),
        signOptions: { expiresIn: '15m' }
      })
    })
  ],
  controllers: [UsersController],
  providers: [ProfilesService],
  exports: [ProfilesService]
})
export class ProfilesModule {}
