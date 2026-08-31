import { z } from 'zod';

export const preAuthEscrowSchema = z.object({
  workOrderId: z.string().uuid(),
  buyerId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethodId: z.string().min(1)
});
