import type { EscrowTransaction } from '../../store/slices/billingSlice';
import { EscrowStatus } from '@fieldforge/contracts';

const now = 1772496000000;

export const mockTransactions: EscrowTransaction[] = [
  {
    id: 'esc-001',
    workOrderId: 'wo-101',
    workOrderTitle: 'Emergency POS Terminal Swap & Cat6 Cabling',
    amountMinor: 45_000,
    status: EscrowStatus.HELD,
    paymentMethod: 'Corporate Visa ending in 9842',
    createdAt: new Date(now - 3600000).toISOString(),
    idempotencyKey: 'idemp-wo-101-auth'
  },
  {
    id: 'esc-002',
    workOrderId: 'wo-102',
    workOrderTitle: 'Fiber Optic Patching & Core Switch SFP+ Replacement',
    amountMinor: 62_000,
    status: EscrowStatus.HELD,
    paymentMethod: 'Corporate Visa ending in 9842',
    createdAt: new Date(now - 14400000).toISOString(),
    idempotencyKey: 'idemp-wo-102-auth'
  },
  {
    id: 'esc-003',
    workOrderId: 'wo-103',
    workOrderTitle: 'Self-Checkout Barcode Scanner & Scale Calibration',
    amountMinor: 38_000,
    status: EscrowStatus.HELD,
    paymentMethod: 'Corporate Visa ending in 9842',
    createdAt: new Date(now - 18000000).toISOString(),
    idempotencyKey: 'idemp-wo-103-auth'
  },
  {
    id: 'esc-004',
    workOrderId: 'wo-104',
    workOrderTitle: 'HVAC Server Room Temperature Sensor Replacement',
    amountMinor: 55_000,
    status: EscrowStatus.HELD,
    paymentMethod: 'Corporate Visa ending in 9842',
    createdAt: new Date(now - 86400000).toISOString(),
    autoReleaseDeadline: new Date(now + 172800000).toISOString(),
    idempotencyKey: 'idemp-wo-104-auth'
  },
  {
    id: 'esc-005',
    workOrderId: 'wo-106',
    workOrderTitle: 'Drive-Thru Digital Menu Board High-Voltage Inverter Check',
    amountMinor: 35_000,
    status: EscrowStatus.DISPUTED,
    paymentMethod: 'Corporate Visa ending in 9842',
    createdAt: new Date(now - 120000000).toISOString(),
    idempotencyKey: 'idemp-wo-106-auth'
  },
  {
    id: 'esc-000',
    workOrderId: 'wo-historical-099',
    workOrderTitle: 'Access Control Card Reader Upgrade (Store #12)',
    amountMinor: 89_000,
    status: EscrowStatus.RELEASED,
    paymentMethod: 'Corporate Visa ending in 9842',
    createdAt: new Date(now - 432000000).toISOString(),
    releasedAt: new Date(now - 345600000).toISOString(),
    invoiceNumber: 'INV-2026-08942',
    idempotencyKey: 'idemp-hist-099-rel'
  }
];
