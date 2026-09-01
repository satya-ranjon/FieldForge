import { EscrowStatus } from '@fieldforge/contracts';
import { EscrowService } from '../src/modules/escrow/escrow.service';

const WORK_ORDER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const BUYER_ID = 'b0000000-0000-4000-8000-000000000001';
const CORRELATION_ID = '7f2b1c9e-0a41-4d3f-9c11-8b6d5e4a3210';

/**
 * Escrow is the highest-consequence code in the repo and is deliberately still
 * incomplete: `releaseFunds` checks nothing and persists nothing (docs/ISSUES.md
 * C3), and Phase 4 of docs/DEVELOPMENT_PLAN.md rewrites it as a single locked
 * transaction. These tests therefore assert only the invariants that survive
 * that rewrite — the shape and units of the hold — so that they are a guard on
 * the contract rather than a fossil of the placeholder.
 */
describe('EscrowService.lockFunds', () => {
  let escrow: EscrowService;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    escrow = new EscrowService();
  });

  it('opens the hold in HELD', async () => {
    // Any other opening state would let a release read the row as already
    // settled, or leave the buyer's funds unaccounted for.
    const held = await escrow.lockFunds(WORK_ORDER_ID, BUYER_ID, 45000, CORRELATION_ID);
    expect(held.status).toBe(EscrowStatus.HELD);
  });

  it('holds exactly the requested amount, in integer minor units', async () => {
    const held = await escrow.lockFunds(WORK_ORDER_ID, BUYER_ID, 45000, CORRELATION_ID);

    // A hold that rounds is a hold that pays out the wrong number: the release
    // path asserts the amounts match, so a drift here becomes a stuck payout.
    expect(held.amountLockedMinor).toBe(45000);
    expect(Number.isSafeInteger(held.amountLockedMinor)).toBe(true);
  });

  it('ties the hold to the work order it funds', async () => {
    const held = await escrow.lockFunds(WORK_ORDER_ID, BUYER_ID, 45000, CORRELATION_ID);
    expect(held.workOrderId).toBe(WORK_ORDER_ID);
  });

  it('mints the escrow identifier server-side', async () => {
    const a = await escrow.lockFunds(WORK_ORDER_ID, BUYER_ID, 45000, CORRELATION_ID);
    const b = await escrow.lockFunds(WORK_ORDER_ID, BUYER_ID, 45000, CORRELATION_ID);

    // `escrow_accounts.work_order_id` is UNIQUE, so the second hold on one work
    // order is the database's job to refuse once this writes (Phase 4). Until
    // then the invariant that matters is that ids are never caller-chosen.
    expect(a.escrowId).not.toBe(b.escrowId);
    expect(a.escrowId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('does not leak the raw minor-unit integer into the log line', async () => {
    const log = jest.spyOn(console, 'log');
    await escrow.lockFunds(WORK_ORDER_ID, BUYER_ID, 45000, CORRELATION_ID);

    // "holding 45000" reads as forty-five thousand dollars to whoever is paged.
    const line = String(log.mock.calls.at(-1)?.[0]);
    expect(line).toContain('$450.00');
    expect(line).not.toContain('45000');
  });
});
