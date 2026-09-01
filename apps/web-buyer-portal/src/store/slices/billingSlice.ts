import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { EscrowStatus } from '@fieldforge/contracts';

export interface EscrowTransaction {
  id: string;
  workOrderId: string;
  workOrderTitle: string;
  amount: number;
  status: EscrowStatus;
  paymentMethod: string;
  createdAt: string;
  releasedAt?: string;
  autoReleaseDeadline?: string;
  invoiceNumber?: string;
  idempotencyKey: string;
}

export interface BillingState {
  totalLocked: number;
  totalReleased: number;
  totalDisputed: number;
  paymentMethod: string;
  transactions: EscrowTransaction[];
  selectedTransactionId: string | null;
}

const now = Date.now();

const initialTransactions: EscrowTransaction[] = [
  {
    id: 'esc-001',
    workOrderId: 'wo-101',
    workOrderTitle: 'Emergency POS Terminal Swap & Cat6 Cabling',
    amount: 450.0,
    status: EscrowStatus.HELD,
    paymentMethod: 'Corporate Visa ending in 9842',
    createdAt: new Date(now - 3600000).toISOString(),
    idempotencyKey: 'idemp-wo-101-auth'
  },
  {
    id: 'esc-002',
    workOrderId: 'wo-102',
    workOrderTitle: 'Fiber Optic Patching & Core Switch SFP+ Replacement',
    amount: 620.0,
    status: EscrowStatus.HELD,
    paymentMethod: 'Corporate Visa ending in 9842',
    createdAt: new Date(now - 14400000).toISOString(),
    idempotencyKey: 'idemp-wo-102-auth'
  },
  {
    id: 'esc-003',
    workOrderId: 'wo-103',
    workOrderTitle: 'Self-Checkout Barcode Scanner & Scale Calibration',
    amount: 380.0,
    status: EscrowStatus.HELD,
    paymentMethod: 'Corporate Visa ending in 9842',
    createdAt: new Date(now - 18000000).toISOString(),
    idempotencyKey: 'idemp-wo-103-auth'
  },
  {
    id: 'esc-004',
    workOrderId: 'wo-104',
    workOrderTitle: 'HVAC Server Room Temperature Sensor Replacement',
    amount: 550.0,
    status: EscrowStatus.HELD,
    paymentMethod: 'Corporate Visa ending in 9842',
    createdAt: new Date(now - 86400000).toISOString(),
    autoReleaseDeadline: new Date(now + 172800000).toISOString(), // 48h left of 72h window
    idempotencyKey: 'idemp-wo-104-auth'
  },
  {
    id: 'esc-005',
    workOrderId: 'wo-106',
    workOrderTitle: 'Drive-Thru Digital Menu Board High-Voltage Inverter Check',
    amount: 350.0,
    status: EscrowStatus.DISPUTED,
    paymentMethod: 'Corporate Visa ending in 9842',
    createdAt: new Date(now - 120000000).toISOString(),
    idempotencyKey: 'idemp-wo-106-auth'
  },
  {
    id: 'esc-000',
    workOrderId: 'wo-historical-099',
    workOrderTitle: 'Access Control Card Reader Upgrade (Store #12)',
    amount: 890.0,
    status: EscrowStatus.RELEASED,
    paymentMethod: 'Corporate Visa ending in 9842',
    createdAt: new Date(now - 432000000).toISOString(),
    releasedAt: new Date(now - 345600000).toISOString(),
    invoiceNumber: 'INV-2026-08942',
    idempotencyKey: 'idemp-hist-099-rel'
  }
];

const initialState: BillingState = {
  totalLocked: 2000.0, // 450 + 620 + 380 + 550
  totalReleased: 84320.0,
  totalDisputed: 350.0,
  paymentMethod: 'Corporate Visa •••• 9842 (Apex Retail Corp)',
  transactions: initialTransactions,
  selectedTransactionId: null
};

export const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    preAuthorizeEscrow: (
      state,
      action: PayloadAction<{
        workOrderId: string;
        workOrderTitle: string;
        amount: number;
      }>
    ) => {
      const newTx: EscrowTransaction = {
        id: `esc-${Date.now().toString().slice(-4)}`,
        workOrderId: action.payload.workOrderId,
        workOrderTitle: action.payload.workOrderTitle,
        amount: action.payload.amount,
        status: EscrowStatus.HELD,
        paymentMethod: state.paymentMethod,
        createdAt: new Date().toISOString(),
        idempotencyKey: `idemp-${action.payload.workOrderId}-${Date.now()}`
      };
      state.transactions.unshift(newTx);
      state.totalLocked += action.payload.amount;
    },
    releaseEscrow: (state, action: PayloadAction<{ workOrderId: string }>) => {
      const tx = state.transactions.find((t) => t.workOrderId === action.payload.workOrderId);
      if (tx && tx.status === EscrowStatus.HELD) {
        tx.status = EscrowStatus.RELEASED;
        tx.releasedAt = new Date().toISOString();
        tx.invoiceNumber = `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
        state.totalLocked = Math.max(0, state.totalLocked - tx.amount);
        state.totalReleased += tx.amount;
      }
    },
    disputeEscrow: (state, action: PayloadAction<{ workOrderId: string }>) => {
      const tx = state.transactions.find((t) => t.workOrderId === action.payload.workOrderId);
      if (tx && tx.status === EscrowStatus.HELD) {
        tx.status = EscrowStatus.DISPUTED;
        state.totalLocked = Math.max(0, state.totalLocked - tx.amount);
        state.totalDisputed += tx.amount;
      }
    }
  }
});

export const { preAuthorizeEscrow, releaseEscrow, disputeEscrow } = billingSlice.actions;

export default billingSlice.reducer;
