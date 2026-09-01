import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createDbClient } from '../index';
import { users, buyerProfiles, technicianProfiles } from '../schemas/users.schema';
import { workOrders } from '../schemas/work-orders.schema';
import { workOrderBids } from '../schemas/bids.schema';
import { escrowAccounts } from '../schemas/billing.schema';

config({ path: resolve(process.cwd(), '../../.env'), quiet: true });

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env for local development.');
  }

  console.log('Connecting to the configured database for seeding...');
  const db = createDbClient(dbUrl);

  const buyerUserId = '00000000-0000-4000-8000-000000000001';
  const buyerProfileId = '10000000-0000-4000-8000-000000000001';
  const tech1UserId = '00000000-0000-4000-8000-000000000002';
  const tech1ProfileId = '20000000-0000-4000-8000-000000000001';
  const tech2UserId = '00000000-0000-4000-8000-000000000003';
  const tech2ProfileId = '20000000-0000-4000-8000-000000000002';
  const woId = '30000000-0000-4000-8000-000000000001';

  console.log('Inserting seed users (Buyer & Techs)...');
  await db
    .insert(users)
    .values([
      {
        id: buyerUserId,
        email: 'buyer@apexretail.com',
        passwordHash: '$2b$10$EPVpZp07f4M.w42c5g9v6.YqgO1mR3uW1V8qK1fT8b9l0mQ2j7yG', // mock hash
        role: 'BUYER',
        phoneNumber: '+1-555-010-9988',
        status: 'ACTIVE'
      },
      {
        id: tech1UserId,
        email: 'alex.rivas@fieldtech.io',
        passwordHash: '$2b$10$EPVpZp07f4M.w42c5g9v6.YqgO1mR3uW1V8qK1fT8b9l0mQ2j7yG',
        role: 'TECHNICIAN',
        phoneNumber: '+1-555-019-3322',
        status: 'ACTIVE'
      },
      {
        id: tech2UserId,
        email: 'jordan.lee@fieldtech.io',
        passwordHash: '$2b$10$EPVpZp07f4M.w42c5g9v6.YqgO1mR3uW1V8qK1fT8b9l0mQ2j7yG',
        role: 'TECHNICIAN',
        phoneNumber: '+1-555-019-7744',
        status: 'ACTIVE'
      }
    ])
    .onDuplicateKeyUpdate({ set: { phoneNumber: '+1-555-010-9988' } });

  console.log('Inserting seed profiles...');
  await db
    .insert(buyerProfiles)
    .values({
      id: buyerProfileId,
      userId: buyerUserId,
      companyName: 'Apex Retail Services Corp',
      billingAddress: '100 Market St, San Francisco, CA 94105',
      escrowBalance: '5000.00'
    })
    .onDuplicateKeyUpdate({ set: { companyName: 'Apex Retail Services Corp' } });

  await db
    .insert(technicianProfiles)
    .values([
      {
        id: tech1ProfileId,
        userId: tech1UserId,
        firstName: 'Alex',
        lastName: 'Rivas',
        hourlyRate: '85.00',
        currentLatitude: '37.7749295',
        currentLongitude: '-122.4194155',
        ratingAverage: '4.95',
        jobsCompleted: 42
      },
      {
        id: tech2ProfileId,
        userId: tech2UserId,
        firstName: 'Jordan',
        lastName: 'Lee',
        hourlyRate: '75.00',
        currentLatitude: '37.783333',
        currentLongitude: '-122.416667',
        ratingAverage: '4.80',
        jobsCompleted: 18
      }
    ])
    .onDuplicateKeyUpdate({ set: { ratingAverage: '4.95' } });

  console.log('Inserting sample active work order...');
  await db
    .insert(workOrders)
    .values({
      id: woId,
      buyerId: buyerProfileId,
      title: 'Emergency POS Terminal Swap & Cat6 Cabling',
      description:
        'Replace 4 failed Ingenico POS pin-pads and terminate 2 Cat6 drop lines in server rack.',
      category: 'Networking & POS',
      status: 'PUBLISHED',
      budgetType: 'FIXED',
      budgetAmount: '450.00',
      addressLine: '789 Mission St, San Francisco, CA 94103',
      latitude: '37.78530000',
      longitude: '-122.40480000',
      scheduledStartTime: new Date(Date.now() + 86400000),
      scheduledEndTime: new Date(Date.now() + 90000000),
      slaExpirationTime: new Date(Date.now() + 172800000)
    })
    .onDuplicateKeyUpdate({ set: { title: 'Emergency POS Terminal Swap & Cat6 Cabling' } });

  console.log('Inserting sample technician bid & escrow hold...');
  await db
    .insert(workOrderBids)
    .values({
      id: '40000000-0000-4000-8000-000000000001',
      workOrderId: woId,
      technicianId: tech1ProfileId,
      bidAmount: '425.00',
      counterNote: 'Available immediately with full crimper kit and Cat6 tester.',
      bidStatus: 'PENDING'
    })
    .onDuplicateKeyUpdate({ set: { bidAmount: '425.00' } });

  await db
    .insert(escrowAccounts)
    .values({
      id: '50000000-0000-4000-8000-000000000001',
      workOrderId: woId,
      amountLocked: '450.00',
      status: 'HELD'
    })
    .onDuplicateKeyUpdate({ set: { amountLocked: '450.00' } });

  console.log('✅ Seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
