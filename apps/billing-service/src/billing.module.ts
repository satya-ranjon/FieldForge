import { Module } from '@nestjs/common';
import { EscrowService } from './modules/escrow/escrow.service';
import { HealthController } from '@fieldforge/common';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [EscrowService],
  exports: [EscrowService]
})
export class BillingModule {}
