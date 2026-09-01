import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  text,
  decimal,
  int
} from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['BUYER', 'TECHNICIAN', 'DISPATCHER', 'ADMIN']).notNull(),
  phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
  status: mysqlEnum('status', ['PENDING', 'ACTIVE', 'SUSPENDED']).default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull()
});

export const buyerProfiles = mysqlTable('buyer_profiles', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 })
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  billingAddress: text('billing_address').notNull(),
  escrowBalance: decimal('escrow_balance', { precision: 12, scale: 2 }).default('0.00').notNull()
});

export const technicianProfiles = mysqlTable('technician_profiles', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 })
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }).notNull(),
  currentLatitude: decimal('current_latitude', { precision: 10, scale: 8 }),
  currentLongitude: decimal('current_longitude', { precision: 11, scale: 8 }),
  ratingAverage: decimal('rating_average', { precision: 3, scale: 2 }).default('5.00').notNull(),
  jobsCompleted: int('jobs_completed').default(0).notNull()
});
