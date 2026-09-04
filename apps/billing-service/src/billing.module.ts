import { Module } from '@nestjs/common';
import { MessagingModule } from '@fieldforge/messaging';
import { EscrowService } from './modules/escrow/escrow.service';
import { BillingConsumer } from './consumers/billing.consumer';
import { HealthController } from '@fieldforge/common';

@Module({
  imports: [MessagingModule.forRoot({ serviceName: 'billing-service' })],
  controllers: [HealthController],
  providers: [EscrowService, BillingConsumer],
  exports: [EscrowService, BillingConsumer]
})
export class BillingModule {}
