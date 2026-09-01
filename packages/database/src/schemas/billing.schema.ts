import { mysqlTable, varchar, timestamp, mysqlEnum, decimal } from 'drizzle-orm/mysql-core';
import { workOrders } from './work-orders.schema';

export const escrowAccounts = mysqlTable('escrow_accounts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  // One escrow per work order, enforced by the database rather than by
  // application code: a second HELD row for the same job would let the same
  // funds be released twice. See docs/ISSUES.md (M3).
  workOrderId: varchar('work_order_id', { length: 36 })
    .references(() => workOrders.id, { onDelete: 'cascade' })
    .notNull()
    .unique('uq_escrow_work_order'),
  amountLocked: decimal('amount_locked', { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['HELD', 'RELEASED', 'REFUNDED', 'DISPUTED'])
    .default('HELD')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  releasedAt: timestamp('released_at')
});
