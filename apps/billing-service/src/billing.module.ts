import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import {
  DrizzleModule,
  HealthController,
  GlobalHttpExceptionFilter,
  requireJwtSecret,
  ProfileDirectoryService
} from '@fieldforge/common';
import { MessagingModule } from '@fieldforge/messaging';
import { EscrowService } from './modules/escrow/escrow.service';
import { InvoicesService } from './modules/invoices/invoices.service';
import { BillingConsumer } from './consumers/billing.consumer';
import { PAYMENT_PROVIDER } from './modules/payments/payment-provider.port';
import { LedgerPaymentProvider } from './modules/payments/ledger-payment.provider';
import { BillingController } from './controllers/billing.controller';
import { WorkOrderDirectoryService } from './modules/work-orders/work-order-directory.service';

@Module({
  imports: [
    DrizzleModule.forRoot(),
    MessagingModule.forRoot({ serviceName: 'billing-service' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: requireJwtSecret(),
        signOptions: { expiresIn: '15m' }
      })
    })
  ],
  controllers: [BillingController, HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter
    },
    {
      provide: PAYMENT_PROVIDER,
      useClass: LedgerPaymentProvider
    },
    EscrowService,
    InvoicesService,
    BillingConsumer,
    ProfileDirectoryService,
    WorkOrderDirectoryService
  ],
  exports: [
    EscrowService,
    InvoicesService,
    BillingConsumer,
    ProfileDirectoryService,
    WorkOrderDirectoryService
  ]
})
export class BillingModule {}
