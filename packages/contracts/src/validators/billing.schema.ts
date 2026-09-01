import { z } from 'zod';
import { positiveMinorUnitsSchema } from './money.schema';

/**
 * Escrow pre-authorization. `buyerId` is deliberately absent — the funding
 * buyer is derived from the verified access token. See createWorkOrderSchema.
 */
export const preAuthEscrowSchema = z.object({
  workOrderId: z.uuid(),
  amountMinor: positiveMinorUnitsSchema,
  paymentMethodId: z.string().min(1)
});
