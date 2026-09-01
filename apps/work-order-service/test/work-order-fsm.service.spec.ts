import { BadRequestException } from '@nestjs/common';
import { WorkOrderStatus } from '@fieldforge/contracts';
import { WorkOrderFsmService } from '../src/modules/fsm/work-order-fsm.service';

/**
 * The work order lifecycle, docs/SRS.md FR-WO-002. This table is the assertion:
 * every status maps to the complete set of states it may move to, so both
 * halves of the guard are covered — a removed transition breaks the allow case,
 * and an added one breaks the deny case, since anything absent from a row is
 * asserted to be rejected.
 */
const ALLOWED: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.DRAFT]: [WorkOrderStatus.PUBLISHED, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.PUBLISHED]: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.ASSIGNED]: [
    WorkOrderStatus.EN_ROUTE,
    WorkOrderStatus.DISPUTED,
    WorkOrderStatus.CANCELLED
  ],
  [WorkOrderStatus.EN_ROUTE]: [WorkOrderStatus.ON_SITE, WorkOrderStatus.DISPUTED],
  [WorkOrderStatus.ON_SITE]: [WorkOrderStatus.COMPLETED, WorkOrderStatus.DISPUTED],
  [WorkOrderStatus.COMPLETED]: [WorkOrderStatus.APPROVED, WorkOrderStatus.DISPUTED],
  [WorkOrderStatus.APPROVED]: [WorkOrderStatus.PAID],
  [WorkOrderStatus.PAID]: [],
  [WorkOrderStatus.CANCELLED]: [],
  [WorkOrderStatus.DISPUTED]: [WorkOrderStatus.APPROVED, WorkOrderStatus.CANCELLED]
};

const ALL_STATUSES = Object.values(WorkOrderStatus);

describe('WorkOrderFsmService', () => {
  let fsm: WorkOrderFsmService;

  beforeEach(() => {
    fsm = new WorkOrderFsmService();
  });

  describe('the full transition matrix', () => {
    const cases = ALL_STATUSES.flatMap((from) =>
      ALL_STATUSES.map((to) => ({ from, to, allowed: ALLOWED[from].includes(to) }))
    );

    it.each(cases)('$from -> $to allowed=$allowed', ({ from, to, allowed }) => {
      if (allowed) {
        expect(() => fsm.validateTransition(from, to)).not.toThrow();
      } else {
        expect(() => fsm.validateTransition(from, to)).toThrow(BadRequestException);
      }
    });

    it('covers every ordered pair of statuses', () => {
      expect(cases).toHaveLength(ALL_STATUSES.length ** 2);
    });
  });

  describe('terminal states', () => {
    it.each([WorkOrderStatus.PAID, WorkOrderStatus.CANCELLED])('%s accepts nothing', (terminal) => {
      // A PAID order that could move again would let the same escrow be
      // released twice; a reopened CANCELLED order would have no funding path.
      for (const to of ALL_STATUSES) {
        expect(() => fsm.validateTransition(terminal, to)).toThrow(BadRequestException);
      }
    });
  });

  describe('money-bearing transitions', () => {
    it('reaches PAID only from APPROVED', () => {
      // FR-BILL-002: PAID is the record of a successful escrow release, so no
      // other state may claim the buyer's funds left the account.
      const sources = ALL_STATUSES.filter((from) => {
        try {
          fsm.validateTransition(from, WorkOrderStatus.PAID);
          return true;
        } catch {
          return false;
        }
      });
      expect(sources).toEqual([WorkOrderStatus.APPROVED]);
    });

    it('does not allow COMPLETED to skip straight to PAID', () => {
      // Buyer approval (or the Phase 4 72-hour auto-approval) must intervene.
      expect(() => fsm.validateTransition(WorkOrderStatus.COMPLETED, WorkOrderStatus.PAID)).toThrow(
        BadRequestException
      );
    });

    it('does not allow a work order to be cancelled once work is proven', () => {
      // Cancelling after ON_SITE would strand a technician who has already
      // travelled and logged deliverables; DISPUTED is the escape hatch.
      for (const from of [
        WorkOrderStatus.ON_SITE,
        WorkOrderStatus.COMPLETED,
        WorkOrderStatus.APPROVED
      ]) {
        expect(() => fsm.validateTransition(from, WorkOrderStatus.CANCELLED)).toThrow(
          BadRequestException
        );
      }
    });
  });

  describe('self transitions', () => {
    it.each(ALL_STATUSES)('%s cannot transition to itself', (status) => {
      // A no-op transition that succeeded would append a duplicate history row
      // and re-publish the event for that status.
      expect(() => fsm.validateTransition(status, status)).toThrow(BadRequestException);
    });
  });

  it('names the allowed set in the rejection message', () => {
    // The message is what a technician's client surfaces, so it has to say what
    // *is* possible rather than only that the attempt failed.
    expect(() => fsm.validateTransition(WorkOrderStatus.DRAFT, WorkOrderStatus.COMPLETED)).toThrow(
      /Allowed: \[PUBLISHED, CANCELLED\]/
    );
  });

  it('rejects a status outside the canon', () => {
    // Defends the `|| []` fallback: an unknown state must deny everything
    // rather than read as "no restrictions".
    const bogus = 'SETTLED' as WorkOrderStatus;
    expect(() => fsm.validateTransition(bogus, WorkOrderStatus.PAID)).toThrow(BadRequestException);
  });
});
