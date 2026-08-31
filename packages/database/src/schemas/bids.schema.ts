import { mysqlTable, varchar, timestamp, mysqlEnum, decimal, text } from 'drizzle-orm/mysql-core';
import { workOrders } from './work-orders.schema';
import { technicianProfiles } from './users.schema';

export const workOrderBids = mysqlTable('work_order_bids', {
  id: varchar('id', { length: 36 }).primaryKey(),
  workOrderId: varchar('work_order_id', { length: 36 }).references(() => workOrders.id, { onDelete: 'cascade' }).notNull(),
  technicianId: varchar('technician_id', { length: 36 }).references(() => technicianProfiles.id).notNull(),
  bidAmount: decimal('bid_amount', { precision: 10, scale: 2 }).notNull(),
  counterNote: text('counter_note'),
  bidStatus: mysqlEnum('bid_status', ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']).default('PENDING').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
