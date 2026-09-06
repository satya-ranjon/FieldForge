import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { MinorUnits } from '@fieldforge/contracts';
import { EscrowStatus } from '@fieldforge/contracts';

export interface EscrowTransaction {
  id: string;
  workOrderId: string;
  workOrderTitle: string;
  amountMinor: MinorUnits;
  status: EscrowStatus;
  paymentMethod: string;
  createdAt: string;
  releasedAt?: string;
  autoReleaseDeadline?: string;
  invoiceNumber?: string;
  idempotencyKey: string;
}

export interface BillingState {
  totalLockedMinor: MinorUnits;
  totalReleasedMinor: MinorUnits;
  totalDisputedMinor: MinorUnits;
  paymentMethod: string;
  transactions: EscrowTransaction[];
  selectedTransactionId: string | null;
}

const initialState: BillingState = {
  totalLockedMinor: 0,
  totalReleasedMinor: 0,
  totalDisputedMinor: 0,
  paymentMethod: 'Corporate Visa •••• 9842 (Apex Retail Corp)',
  transactions: [],
  selectedTransactionId: null
};

export const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setTransactions: (state, action: PayloadAction<EscrowTransaction[]>) => {
      state.transactions = action.payload;
    },
    setTotals: (
      state,
      action: PayloadAction<{
        locked: MinorUnits;
        released: MinorUnits;
        disputed: MinorUnits;
      }>
    ) => {
      state.totalLockedMinor = action.payload.locked;
      state.totalReleasedMinor = action.payload.released;
      state.totalDisputedMinor = action.payload.disputed;
    },
    preAuthorizeEscrow: (
      state,
      action: PayloadAction<{
        workOrderId: string;
        workOrderTitle: string;
        amountMinor: MinorUnits;
      }>
    ) => {
      const randomSuffix =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID().slice(0, 8)
          : Date.now().toString().slice(-4);
      const newTx: EscrowTransaction = {
        id: `esc-${randomSuffix}`,
        workOrderId: action.payload.workOrderId,
        workOrderTitle: action.payload.workOrderTitle,
        amountMinor: action.payload.amountMinor,
        status: EscrowStatus.HELD,
        paymentMethod: state.paymentMethod,
        createdAt: new Date().toISOString(),
        idempotencyKey: `idemp-${action.payload.workOrderId}-${randomSuffix}`
      };
      state.transactions.unshift(newTx);
      state.totalLockedMinor += action.payload.amountMinor;
    },
    releaseEscrow: (state, action: PayloadAction<{ workOrderId: string }>) => {
      const tx = state.transactions.find((t) => t.workOrderId === action.payload.workOrderId);
      if (tx && tx.status === EscrowStatus.HELD) {
        const invSuffix =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID().slice(0, 8).toUpperCase()
            : Date.now().toString().slice(-6);
        tx.status = EscrowStatus.RELEASED;
        tx.releasedAt = new Date().toISOString();
        tx.invoiceNumber = `INV-2026-${invSuffix}`;
        state.totalLockedMinor = Math.max(0, state.totalLockedMinor - tx.amountMinor);
        state.totalReleasedMinor += tx.amountMinor;
      }
    },
    disputeEscrow: (state, action: PayloadAction<{ workOrderId: string }>) => {
      const tx = state.transactions.find((t) => t.workOrderId === action.payload.workOrderId);
      if (tx && tx.status === EscrowStatus.HELD) {
        tx.status = EscrowStatus.DISPUTED;
        state.totalLockedMinor = Math.max(0, state.totalLockedMinor - tx.amountMinor);
        state.totalDisputedMinor += tx.amountMinor;
      }
    }
  }
});

export const { setTransactions, setTotals, preAuthorizeEscrow, releaseEscrow, disputeEscrow } =
  billingSlice.actions;

export default billingSlice.reducer;
