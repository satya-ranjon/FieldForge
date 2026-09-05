import { mysqlTable, varchar, timestamp, mysqlEnum, decimal } from 'drizzle-orm/mysql-core';
import { workOrders } from './work-orders.schema';
import { buyerProfiles, technicianProfiles } from './users.schema';

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

export const invoices = mysqlTable('invoices', {
  id: varchar('id', { length: 36 }).primaryKey(),
  workOrderId: varchar('work_order_id', { length: 36 })
    .references(() => workOrders.id, { onDelete: 'cascade' })
    .notNull()
    .unique('uq_invoice_work_order'),
  buyerId: varchar('buyer_id', { length: 36 })
    .references(() => buyerProfiles.id)
    .notNull(),
  invoiceNumber: varchar('invoice_number', { length: 64 }).notNull().unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const payoutLedger = mysqlTable('payout_ledger', {
  id: varchar('id', { length: 36 }).primaryKey(),
  technicianId: varchar('technician_id', { length: 36 })
    .references(() => technicianProfiles.id)
    .notNull(),
  workOrderId: varchar('work_order_id', { length: 36 })
    .references(() => workOrders.id, { onDelete: 'cascade' })
    .notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum('type', ['CREDIT', 'DEBIT']).default('CREDIT').notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
