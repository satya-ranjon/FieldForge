import { preAuthEscrowSchema } from '../src/validators/billing.schema';
import { submitBidSchema } from '../src/validators/dispatch.schema';
import { createWorkOrderSchema, transitionStatusSchema } from '../src/validators/work-order.schema';
import { BudgetType, WorkOrderStatus } from '../src/enums';

const WORK_ORDER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

const validWorkOrder = {
  title: 'Emergency POS Terminal Swap',
  description: 'Replace the failed lane 3 terminal and verify the payment path.',
  category: 'POS Hardware',
  budgetType: BudgetType.FIXED,
  budgetAmountMinor: 45000,
  addressLine: '1 Market St, San Francisco, CA',
  latitude: 37.7749,
  longitude: -122.4194,
  scheduledStartTime: '2026-09-02T15:00:00.000Z',
  scheduledEndTime: '2026-09-02T18:00:00.000Z',
  slaExpirationTime: '2026-09-02T19:00:00.000Z'
};

describe('request schemas strip caller-supplied identity', () => {
  // The single most dangerous shape a request DTO can have is a field naming
  // whose account the action belongs to. Zod strips unknown keys, so a client
  // that sends one is ignored rather than obeyed — but only as long as the
  // schema does not declare the field. These tests are the guard on that.
  it('createWorkOrderSchema drops buyerId', () => {
    const parsed = createWorkOrderSchema.parse({
      ...validWorkOrder,
      buyerId: 'victim-buyer-id'
    });

    expect(parsed).not.toHaveProperty('buyerId');
    expect(parsed.budgetAmountMinor).toBe(45000);
  });

  it('submitBidSchema drops techId', () => {
    const parsed = submitBidSchema.parse({
      workOrderId: WORK_ORDER_ID,
      bidAmountMinor: 42000,
      techId: 'someone-elses-tech-id'
    });

    expect(parsed).not.toHaveProperty('techId');
    expect(parsed.bidAmountMinor).toBe(42000);
  });

  it('preAuthEscrowSchema drops buyerId', () => {
    const parsed = preAuthEscrowSchema.parse({
      workOrderId: WORK_ORDER_ID,
      amountMinor: 45000,
      paymentMethodId: 'pm_local_fake',
      buyerId: 'victim-buyer-id'
    });

    expect(parsed).not.toHaveProperty('buyerId');
  });
});

describe('money fields reject fractional currency', () => {
  it.each([
    [
      'createWorkOrderSchema.budgetAmountMinor',
      () => createWorkOrderSchema.parse({ ...validWorkOrder, budgetAmountMinor: 450.5 })
    ],
    [
      'submitBidSchema.bidAmountMinor',
      () => submitBidSchema.parse({ workOrderId: WORK_ORDER_ID, bidAmountMinor: 420.99 })
    ],
    [
      'preAuthEscrowSchema.amountMinor',
      () =>
        preAuthEscrowSchema.parse({
          workOrderId: WORK_ORDER_ID,
          amountMinor: 0.07,
          paymentMethodId: 'pm_local_fake'
        })
    ]
  ])('%s rejects a non-integer', (_label, parse) => {
    expect(parse).toThrow(/integer/i);
  });

  it.each([0, -1])('rejects %p as a budget', (amount) => {
    expect(() =>
      createWorkOrderSchema.parse({ ...validWorkOrder, budgetAmountMinor: amount })
    ).toThrow();
  });
});

describe('transitionStatusSchema', () => {
  it('requires coordinates for the ON_SITE arrival', () => {
    // The server decides whether the technician is inside the geofence
    // (docs/SRS.md FR-MOB-001), so a coordinate-free arrival is not a request
    // the handler should ever have to interpret.
    expect(() => transitionStatusSchema.parse({ nextStatus: WorkOrderStatus.ON_SITE })).toThrow(
      /latitude and longitude are required/
    );

    const parsed = transitionStatusSchema.parse({
      nextStatus: WorkOrderStatus.ON_SITE,
      latitude: 37.7749,
      longitude: -122.4194
    });
    expect(parsed.latitude).toBe(37.7749);
  });

  it('does not require coordinates for other transitions', () => {
    expect(transitionStatusSchema.parse({ nextStatus: WorkOrderStatus.EN_ROUTE }).nextStatus).toBe(
      WorkOrderStatus.EN_ROUTE
    );
  });

  it('rejects a status outside the canon', () => {
    expect(() => transitionStatusSchema.parse({ nextStatus: 'SETTLED' })).toThrow();
  });

  it.each([
    { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: 181 }
  ])('rejects out-of-range coordinates %p', (coords) => {
    expect(() =>
      transitionStatusSchema.parse({ nextStatus: WorkOrderStatus.ON_SITE, ...coords })
    ).toThrow();
  });
});
