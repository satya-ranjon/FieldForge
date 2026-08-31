import { createDbClient } from '../index';
import { users } from '../schemas/users.schema';
import { workOrders } from '../schemas/work-orders.schema';
import { bids } from '../schemas/bids.schema';
import { escrowAccounts } from '../schemas/billing.schema';

async function seed() {
  const dbUrl = process.env.DATABASE_URL || 'mysql://fieldforge_root:fieldforge_secret@127.0.0.1:3306/fieldforge';
  console.log(`🌱 Connecting to database for seeding: ${dbUrl}`);
  const db = createDbClient(dbUrl);

  const buyerId = 'b0000000-0000-0000-0000-000000000001';
  const tech1Id = 't0000000-0000-0000-0000-000000000001';
  const tech2Id = 't0000000-0000-0000-0000-000000000002';
  const woId = 'w0000000-0000-0000-0000-000000000001';

  console.log('Inserting seed users (Buyer & Techs)...');
  await db.insert(users).values([
    {
      id: buyerId,
      email: 'buyer@apexretail.com',
      passwordHash: '$2b$10$EPVpZp07f4M.w42c5g9v6.YqgO1mR3uW1V8qK1fT8b9l0mQ2j7yG', // mock hash
      fullName: 'Apex Retail Services Corp',
      role: 'BUYER',
      phone: '+1-555-010-9988'
    },
    {
      id: tech1Id,
      email: 'alex.rivas@fieldtech.io',
      passwordHash: '$2b$10$EPVpZp07f4M.w42c5g9v6.YqgO1mR3uW1V8qK1fT8b9l0mQ2j7yG',
      fullName: 'Alex Rivas (Cisco CCNA / Fiber Specialist)',
      role: 'TECHNICIAN',
      phone: '+1-555-019-3322'
    },
    {
      id: tech2Id,
      email: 'jordan.lee@fieldtech.io',
      passwordHash: '$2b$10$EPVpZp07f4M.w42c5g9v6.YqgO1mR3uW1V8qK1fT8b9l0mQ2j7yG',
      fullName: 'Jordan Lee (POS / CCTV Tier 2 Tech)',
      role: 'TECHNICIAN',
      phone: '+1-555-019-7744'
    }
  ]).onDuplicateKeyUpdate({ target: users.id, set: { fullName: 'Apex Retail Services Corp' } });

  console.log('Inserting sample active work order...');
  await db.insert(workOrders).values({
    id: woId,
    buyerId,
    title: 'Emergency POS Terminal Swap & Cat6 Cabling',
    description: 'Replace 4 failed Ingenico POS pin-pads and terminate 2 Cat6 drop lines in server rack.',
    status: 'PUBLISHED',
    maxBudget: '450.00',
    latitude: '37.7749295',
    longitude: '-122.4194155',
    scheduledDate: new Date(Date.now() + 86400000)
  }).onDuplicateKeyUpdate({ target: workOrders.id, set: { title: 'Emergency POS Terminal Swap' } });

  console.log('Inserting sample technician bid & escrow hold...');
  await db.insert(bids).values({
    id: 'bid-0000000-0000-0000-0000-000000000001',
    workOrderId: woId,
    techId: tech1Id,
    proposedAmount: '425.00',
    counterNote: 'Available immediately with full crimper kit and Cat6 tester.',
    status: 'PENDING'
  }).onDuplicateKeyUpdate({ target: bids.id, set: { proposedAmount: '425.00' } });

  await db.insert(escrowAccounts).values({
    id: 'escrow-0000-0000-0000-000000000001',
    workOrderId: woId,
    amountLocked: '450.00',
    status: 'HELD'
  }).onDuplicateKeyUpdate({ target: escrowAccounts.id, set: { amountLocked: '450.00' } });

  console.log('✅ Seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
