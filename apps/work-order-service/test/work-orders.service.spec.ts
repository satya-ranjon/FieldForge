import { BudgetType, EventType, WorkOrderStatus } from '@fieldforge/contracts';
import { WorkOrderEventPublisher } from '../src/events/work-order-event.publisher';
import { WorkOrderFsmService } from '../src/modules/fsm/work-order-fsm.service';
import { WorkOrdersService } from '../src/modules/work-orders/work-orders.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { DrizzleClient } from '@fieldforge/common';

const BUYER_USER_ID = 'u0000000-0000-4000-8000-000000000001';
const BUYER_PROFILE_ID = 'b0000000-0000-4000-8000-000000000001';
const TECH_USER_ID = 'u0000000-0000-4000-8000-000000000002';
const TECH_PROFILE_ID = 't0000000-0000-4000-8000-000000000002';
const CORRELATION_ID = '7f2b1c9e-0a41-4d3f-9c11-8b6d5e4a3210';

interface InMemWorkOrder {
  id: string;
  buyerId: string;
  assignedTechnicianId?: string | null;
  title: string;
  description: string;
  category: string;
  status: string;
  budgetType: string;
  budgetAmount: string;
  addressLine: string;
  latitude: string;
  longitude: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  slaExpirationTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemStatusHistory {
  id: string;
  workOrderId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  reason: string | null;
  createdAt: Date;
}

function extractCriteria(expr: unknown): { column?: string; value?: string } {
  if (!expr) return {};
  if (typeof expr === 'string') return { value: expr };
  const candidate = expr as {
    queryChunks?: unknown[];
    right?: { value?: unknown };
    value?: unknown;
  };
  if (Array.isArray(candidate.queryChunks)) {
    let column: string | undefined;
    let value: string | undefined;
    for (const chunk of candidate.queryChunks) {
      if (chunk && typeof chunk === 'object') {
        if ('name' in chunk) {
          column = String((chunk as { name: unknown }).name);
        } else if ('value' in chunk && typeof (chunk as { value: unknown }).value === 'string') {
          value = (chunk as { value: string }).value;
        } else if ('queryChunks' in chunk) {
          const sub = extractCriteria(chunk);
          if (sub.column) column = sub.column;
          if (sub.value) value = sub.value;
        }
      } else if (typeof chunk === 'string') {
        const trimmed = chunk.trim();
        if (
          trimmed &&
          !trimmed.includes('`') &&
          trimmed !== '=' &&
          !trimmed.includes('(') &&
          !trimmed.includes('and')
        ) {
          value = trimmed;
        }
      }
    }
    return { column, value };
  }
  const fallback = candidate?.right?.value ?? candidate?.value;
  return { value: fallback !== undefined ? String(fallback) : undefined };
}

function getTableName(table: unknown): string {
  if (!table || typeof table !== 'object') return '';
  const candidate = table as Record<string | symbol, unknown>;
  const drizzleName = candidate[Symbol.for('drizzle:Name')];
  if (typeof drizzleName === 'string') return drizzleName;
  const originalName = candidate[Symbol.for('drizzle:OriginalName')];
  if (typeof originalName === 'string') return originalName;
  const internal = candidate._ as { name?: string } | undefined;
  if (internal?.name) return internal.name;
  return '';
}

function createMockDb() {
  const store = {
    workOrders: new Map<string, InMemWorkOrder>(),
    statusHistory: [] as InMemStatusHistory[],
    buyerProfiles: new Map<string, { id: string; userId: string }>([
      [BUYER_PROFILE_ID, { id: BUYER_PROFILE_ID, userId: BUYER_USER_ID }]
    ]),
    technicianProfiles: new Map<string, { id: string; userId: string }>([
      [TECH_PROFILE_ID, { id: TECH_PROFILE_ID, userId: TECH_USER_ID }]
    ]),
    locks: new Set<string>()
  };

  let transactionQueue: Promise<void> = Promise.resolve();

  const createTx = () => ({
    select: () => ({
      from: (table: unknown) => {
        const tableName = getTableName(table);
        return {
          where: (expr: unknown) => ({
            for: async () => {
              const { value } = extractCriteria(expr);
              const id = value;
              const wo = id ? store.workOrders.get(id) : undefined;
              return wo ? [{ ...wo }] : [];
            },
            limit: async () => {
              const { column, value } = extractCriteria(expr);
              const id = value;
              if (tableName === 'technician_profiles') {
                const t = Array.from(store.technicianProfiles.values()).find((tp) =>
                  id ? tp.userId === id || tp.id === id : true
                );
                return t ? [{ ...t }] : [];
              }
              if (tableName === 'buyer_profiles' || column === 'user_id') {
                const b = Array.from(store.buyerProfiles.values()).find((bp) =>
                  id ? bp.userId === id || bp.id === id : true
                );
                return b ? [{ ...b }] : [];
              }
              const found = id ? store.workOrders.get(id) : undefined;
              return found ? [{ ...found }] : [];
            }
          })
        };
      }
    }),
    insert: () => ({
      values: async (data: Record<string, unknown>) => {
        if (data.fromStatus !== undefined || data.toStatus !== undefined) {
          store.statusHistory.push(data as unknown as InMemStatusHistory);
        } else if (data.companyName) {
          store.buyerProfiles.set(String(data.id), {
            id: String(data.id),
            userId: String(data.userId)
          });
        } else {
          store.workOrders.set(String(data.id), data as unknown as InMemWorkOrder);
        }
        return {};
      }
    }),
    update: () => ({
      set: (updateData: Record<string, unknown>) => ({
        where: async (expr: unknown) => {
          const { value } = extractCriteria(expr);
          const id = value;
          const wo = id ? store.workOrders.get(id) : undefined;
          if (wo) {
            Object.assign(wo, updateData);
          }
          return {};
        }
      })
    })
  });

  const db = {
    ...createTx(),
    select: () => ({
      from: (table: unknown) => {
        const tableName = getTableName(table);
        return {
          where: (expr: unknown) => ({
            limit: async () => {
              const { column, value } = extractCriteria(expr);
              const id = value;
              if (tableName === 'technician_profiles') {
                const t = Array.from(store.technicianProfiles.values()).find((tp) =>
                  id ? tp.userId === id || tp.id === id : true
                );
                return t ? [{ ...t }] : [];
              }
              if (tableName === 'buyer_profiles' || column === 'user_id') {
                const b = Array.from(store.buyerProfiles.values()).find((bp) =>
                  id ? bp.userId === id || bp.id === id : true
                );
                return b ? [{ ...b }] : [];
              }
              const wo = id ? store.workOrders.get(id) : undefined;
              return wo ? [{ ...wo }] : [];
            },
            orderBy: () => ({
              limit: (lim = 20) => ({
                offset: async (off = 0) => {
                  let list = Array.from(store.workOrders.values());
                  const { column, value } = extractCriteria(expr);
                  if (value) {
                    list = list.filter((w) =>
                      column === 'status'
                        ? w.status === value
                        : column === 'buyer_id'
                          ? w.buyerId === value
                          : column === 'assigned_technician_id'
                            ? w.assignedTechnicianId === value
                            : w.status === value ||
                              w.buyerId === value ||
                              w.assignedTechnicianId === value
                    );
                  }
                  return list.slice(off, off + lim).map((w) => ({ ...w }));
                }
              })
            })
          }),
          orderBy: () => ({
            limit: (lim: number) => ({
              offset: async (off: number) =>
                Array.from(store.workOrders.values())
                  .slice(off, off + lim)
                  .map((w) => ({ ...w }))
            })
          })
        };
      }
    }),
    transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
      // Simulate serializable/pessimistic row locking inside transactions
      const prev = transactionQueue;
      let release: () => void = () => {};
      transactionQueue = new Promise((resolve) => {
        release = resolve;
      });
      await prev;
      try {
        return await cb(createTx());
      } finally {
        release();
      }
    }
  };

  return { db: db as unknown as DrizzleClient, store };
}

describe('WorkOrdersService (Persistent, Transactional Lifecycle)', () => {
  let publisher: WorkOrderEventPublisher;
  let service: WorkOrdersService;
  let fsm: WorkOrderFsmService;
  let mockDbInfo: ReturnType<typeof createMockDb>;

  const defaultDto = {
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

  beforeEach(() => {
    fsm = new WorkOrderFsmService();
    publisher = new WorkOrderEventPublisher();
    mockDbInfo = createMockDb();
    service = new WorkOrdersService(mockDbInfo.db, fsm, publisher);
  });

  describe('create (FR-WO-001)', () => {
    it('creates work order in DRAFT and logs initial status history', async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);

      expect(created.id).toBeDefined();
      expect(created.status).toBe(WorkOrderStatus.DRAFT);
      expect(created.budgetAmountMinor).toBe(45000);
      expect(created.latitude).toBe(37.7749);
      expect(created.longitude).toBe(-122.4194);

      // Verify persistence in store
      const persisted = mockDbInfo.store.workOrders.get(created.id);
      expect(persisted).toBeDefined();
      expect(persisted?.status).toBe(WorkOrderStatus.DRAFT);
      expect(persisted?.budgetAmount).toBe('450.00');

      // Verify status history entry
      const history = mockDbInfo.store.statusHistory.filter((h) => h.workOrderId === created.id);
      expect(history).toHaveLength(1);
      expect(history[0].toStatus).toBe(WorkOrderStatus.DRAFT);
      expect(history[0].changedBy).toBe(BUYER_USER_ID);
    });

    it('assigns the identifier server-side as UUID v4', async () => {
      const a = await service.create(BUYER_USER_ID, defaultDto);
      const b = await service.create(BUYER_USER_ID, defaultDto);

      expect(a.id).not.toBe(b.id);
      expect(a.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('rejects creation if scheduledEndTime is before or equal to scheduledStartTime', async () => {
      const invalidDatesDto = {
        ...defaultDto,
        scheduledStartTime: '2026-09-02T18:00:00.000Z',
        scheduledEndTime: '2026-09-02T15:00:00.000Z'
      };

      await expect(service.create(BUYER_USER_ID, invalidDatesDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('rejects creation if slaExpirationTime is before scheduledStartTime', async () => {
      const invalidSlaDto = {
        ...defaultDto,
        scheduledStartTime: '2026-09-02T15:00:00.000Z',
        scheduledEndTime: '2026-09-02T18:00:00.000Z',
        slaExpirationTime: '2026-09-02T14:00:00.000Z'
      };

      await expect(service.create(BUYER_USER_ID, invalidSlaDto)).rejects.toThrow(
        /slaExpirationTime must not be before scheduledStartTime/i
      );
    });
  });

  describe('list filtering (FR-WO-001, NFR-PERF-003)', () => {
    it('filters work orders by status, buyerId, and scheduled time', async () => {
      const created1 = await service.create(BUYER_USER_ID, defaultDto);
      await service.publish(created1.id, BUYER_USER_ID, 'BUYER', CORRELATION_ID);

      const created2 = await service.create(BUYER_USER_ID, {
        ...defaultDto,
        title: 'Second Work Order Draft',
        scheduledStartTime: '2026-09-05T10:00:00.000Z',
        scheduledEndTime: '2026-09-05T12:00:00.000Z',
        slaExpirationTime: '2026-09-05T14:00:00.000Z'
      });

      const publishedList = await service.list({ status: WorkOrderStatus.PUBLISHED });
      expect(publishedList.some((w) => w.id === created1.id)).toBe(true);
      expect(publishedList.some((w) => w.id === created2.id)).toBe(false);

      const buyerList = await service.list({ buyerId: BUYER_PROFILE_ID });
      expect(buyerList.length).toBeGreaterThanOrEqual(2);
    });

    it('rejects list query when scheduledStartTimeTo is earlier than scheduledStartTimeFrom', async () => {
      await expect(
        service.list({
          scheduledStartTimeFrom: '2026-09-05T00:00:00.000Z',
          scheduledStartTimeTo: '2026-09-01T00:00:00.000Z'
        })
      ).rejects.toThrow(
        /scheduledStartTimeTo must be greater than or equal to scheduledStartTimeFrom/i
      );
    });
  });

  describe('publish (FR-WO-001, FR-WO-002, H4)', () => {
    it('transactionally validates real current status and transitions DRAFT -> PUBLISHED', async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);
      const emitSpy = jest.spyOn(publisher, 'publishWorkOrderPublished').mockResolvedValue();

      const published = await service.publish(created.id, BUYER_USER_ID, 'BUYER', CORRELATION_ID);

      expect(published.status).toBe(WorkOrderStatus.PUBLISHED);
      expect(mockDbInfo.store.workOrders.get(created.id)?.status).toBe(WorkOrderStatus.PUBLISHED);

      // Check event emission
      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy.mock.calls[0][0].eventType).toBe(EventType.WORK_ORDER_PUBLISHED);
      expect(emitSpy.mock.calls[0][0].payload.maxBudgetMinor).toBe(45000);

      // Check audit history
      const history = mockDbInfo.store.statusHistory.filter((h) => h.workOrderId === created.id);
      expect(history).toHaveLength(2); // DRAFT + PUBLISHED
      expect(history[1].fromStatus).toBe(WorkOrderStatus.DRAFT);
      expect(history[1].toStatus).toBe(WorkOrderStatus.PUBLISHED);
    });

    it('rejects publishing if caller is not the owning buyer (or admin)', async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);
      const otherUserId = 'u9999999-9999-4999-8999-999999999999';

      await expect(
        service.publish(created.id, otherUserId, 'BUYER', CORRELATION_ID)
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects publishing if work order is already beyond DRAFT (e.g. COMPLETED)', async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);
      // Simulate order already in COMPLETED
      mockDbInfo.store.workOrders.get(created.id)!.status = WorkOrderStatus.COMPLETED;

      await expect(
        service.publish(created.id, BUYER_USER_ID, 'BUYER', CORRELATION_ID)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('transition & FSM enforcement (FR-WO-002, H4)', () => {
    it('rejects an invalid state transition regardless of what caller claims', async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);
      // Actual state is DRAFT. Attempting ON_SITE directly must fail!
      await expect(
        service.transition(
          created.id,
          TECH_USER_ID,
          'TECHNICIAN',
          { nextStatus: WorkOrderStatus.ON_SITE, latitude: 37.7749, longitude: -122.4194 },
          CORRELATION_ID
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('progresses lifecycle correctly across the primary happy path', async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);
      const woId = created.id;

      // 1. DRAFT -> PUBLISHED
      await service.publish(woId, BUYER_USER_ID, 'BUYER', CORRELATION_ID);
      expect(mockDbInfo.store.workOrders.get(woId)?.status).toBe(WorkOrderStatus.PUBLISHED);

      // 2. PUBLISHED -> ASSIGNED
      const assignSpy = jest.spyOn(publisher, 'publishWorkOrderAssigned').mockResolvedValue();
      await service.transition(
        woId,
        BUYER_USER_ID,
        'BUYER',
        { nextStatus: WorkOrderStatus.ASSIGNED, assignedTechnicianId: TECH_PROFILE_ID },
        CORRELATION_ID
      );
      expect(mockDbInfo.store.workOrders.get(woId)?.status).toBe(WorkOrderStatus.ASSIGNED);
      expect(mockDbInfo.store.workOrders.get(woId)?.assignedTechnicianId).toBe(TECH_PROFILE_ID);
      expect(assignSpy).toHaveBeenCalled();

      // 3. ASSIGNED -> EN_ROUTE (Technician)
      await service.transition(
        woId,
        TECH_USER_ID,
        'TECHNICIAN',
        { nextStatus: WorkOrderStatus.EN_ROUTE },
        CORRELATION_ID
      );
      expect(mockDbInfo.store.workOrders.get(woId)?.status).toBe(WorkOrderStatus.EN_ROUTE);

      // 4. EN_ROUTE -> ON_SITE (Technician inside geofence)
      await service.transition(
        woId,
        TECH_USER_ID,
        'TECHNICIAN',
        {
          nextStatus: WorkOrderStatus.ON_SITE,
          latitude: 37.7749,
          longitude: -122.4194
        },
        CORRELATION_ID
      );
      expect(mockDbInfo.store.workOrders.get(woId)?.status).toBe(WorkOrderStatus.ON_SITE);

      // 5. ON_SITE -> COMPLETED (Technician)
      await service.transition(
        woId,
        TECH_USER_ID,
        'TECHNICIAN',
        { nextStatus: WorkOrderStatus.COMPLETED },
        CORRELATION_ID
      );
      expect(mockDbInfo.store.workOrders.get(woId)?.status).toBe(WorkOrderStatus.COMPLETED);

      // 6. COMPLETED -> APPROVED (Buyer)
      const approveSpy = jest.spyOn(publisher, 'publishWorkOrderApproved').mockResolvedValue();
      await service.transition(
        woId,
        BUYER_USER_ID,
        'BUYER',
        { nextStatus: WorkOrderStatus.APPROVED },
        CORRELATION_ID
      );
      expect(mockDbInfo.store.workOrders.get(woId)?.status).toBe(WorkOrderStatus.APPROVED);
      expect(approveSpy).toHaveBeenCalled();
    });

    it('rejects technician marking en_route if caller is NOT the assigned technician', async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);
      const woId = created.id;
      await service.publish(woId, BUYER_USER_ID, 'BUYER', CORRELATION_ID);
      await service.transition(
        woId,
        BUYER_USER_ID,
        'BUYER',
        { nextStatus: WorkOrderStatus.ASSIGNED, assignedTechnicianId: TECH_PROFILE_ID },
        CORRELATION_ID
      );

      const imposterTechId = 'u9999999-0000-0000-0000-000000000099';
      await expect(
        service.transition(
          woId,
          imposterTechId,
          'TECHNICIAN',
          { nextStatus: WorkOrderStatus.EN_ROUTE },
          CORRELATION_ID
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects ASSIGNED transition if assignedTechnicianId is missing and order has no tech', async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);
      const woId = created.id;
      await service.publish(woId, BUYER_USER_ID, 'BUYER', CORRELATION_ID);

      await expect(
        service.transition(
          woId,
          BUYER_USER_ID,
          'BUYER',
          { nextStatus: WorkOrderStatus.ASSIGNED },
          CORRELATION_ID
        )
      ).rejects.toThrow(/assignedTechnicianId is required/i);
    });

    it("rejects non-owning buyer trying to assign someone else's work order", async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);
      const woId = created.id;
      await service.publish(woId, BUYER_USER_ID, 'BUYER', CORRELATION_ID);

      const strangerBuyerId = 'u9999999-0000-0000-0000-000000000088';
      await expect(
        service.transition(
          woId,
          strangerBuyerId,
          'BUYER',
          { nextStatus: WorkOrderStatus.ASSIGNED, assignedTechnicianId: TECH_PROFILE_ID },
          CORRELATION_ID
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it("rejects non-owning buyer trying to cancel someone else's work order", async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);
      const woId = created.id;
      await service.publish(woId, BUYER_USER_ID, 'BUYER', CORRELATION_ID);

      const strangerBuyerId = 'u9999999-0000-0000-0000-000000000088';
      await expect(
        service.transition(
          woId,
          strangerBuyerId,
          'BUYER',
          { nextStatus: WorkOrderStatus.CANCELLED },
          CORRELATION_ID
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects unauthorized user trying to dispute work order', async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);
      const woId = created.id;
      await service.publish(woId, BUYER_USER_ID, 'BUYER', CORRELATION_ID);
      await service.transition(
        woId,
        BUYER_USER_ID,
        'BUYER',
        { nextStatus: WorkOrderStatus.ASSIGNED, assignedTechnicianId: TECH_PROFILE_ID },
        CORRELATION_ID
      );

      const strangerBuyerId = 'u9999999-0000-0000-0000-000000000088';
      await expect(
        service.transition(
          woId,
          strangerBuyerId,
          'BUYER',
          { nextStatus: WorkOrderStatus.DISPUTED },
          CORRELATION_ID
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects non-admin attempting to transition to PAID', async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);
      const woId = created.id;
      await service.publish(woId, BUYER_USER_ID, 'BUYER', CORRELATION_ID);
      await service.transition(
        woId,
        BUYER_USER_ID,
        'BUYER',
        { nextStatus: WorkOrderStatus.ASSIGNED, assignedTechnicianId: TECH_PROFILE_ID },
        CORRELATION_ID
      );
      await service.transition(
        woId,
        TECH_USER_ID,
        'TECHNICIAN',
        { nextStatus: WorkOrderStatus.EN_ROUTE },
        CORRELATION_ID
      );
      await service.transition(
        woId,
        TECH_USER_ID,
        'TECHNICIAN',
        {
          nextStatus: WorkOrderStatus.ON_SITE,
          latitude: defaultDto.latitude,
          longitude: defaultDto.longitude
        },
        CORRELATION_ID
      );
      await service.transition(
        woId,
        TECH_USER_ID,
        'TECHNICIAN',
        { nextStatus: WorkOrderStatus.COMPLETED },
        CORRELATION_ID
      );
      await service.transition(
        woId,
        BUYER_USER_ID,
        'BUYER',
        { nextStatus: WorkOrderStatus.APPROVED },
        CORRELATION_ID
      );

      await expect(
        service.transition(
          woId,
          BUYER_USER_ID,
          'BUYER',
          { nextStatus: WorkOrderStatus.PAID },
          CORRELATION_ID
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('server-side geofence enforcement on ON_SITE (FR-MOB-001, H5)', () => {
    let woId: string;

    beforeEach(async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);
      woId = created.id;
      await service.publish(woId, BUYER_USER_ID, 'BUYER', CORRELATION_ID);
      await service.transition(
        woId,
        BUYER_USER_ID,
        'BUYER',
        { nextStatus: WorkOrderStatus.ASSIGNED, assignedTechnicianId: TECH_PROFILE_ID },
        CORRELATION_ID
      );
      await service.transition(
        woId,
        TECH_USER_ID,
        'TECHNICIAN',
        { nextStatus: WorkOrderStatus.EN_ROUTE },
        CORRELATION_ID
      );
    });

    it('rejects transition to ON_SITE if latitude or longitude is missing', async () => {
      await expect(
        service.transition(
          woId,
          TECH_USER_ID,
          'TECHNICIAN',
          { nextStatus: WorkOrderStatus.ON_SITE },
          CORRELATION_ID
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts transition at 199 meters and rejects at 201 meters (exit criteria)', async () => {
      const metersPerDegreeLat = (6371e3 * Math.PI) / 180;
      const delta199 = 199 / metersPerDegreeLat;
      const delta201 = 201 / metersPerDegreeLat;

      // 1. Attempt at 201 meters (must reject)
      await expect(
        service.transition(
          woId,
          TECH_USER_ID,
          'TECHNICIAN',
          {
            nextStatus: WorkOrderStatus.ON_SITE,
            latitude: defaultDto.latitude + delta201,
            longitude: defaultDto.longitude
          },
          CORRELATION_ID
        )
      ).rejects.toThrow(/outside 200m geofence/i);

      expect(mockDbInfo.store.workOrders.get(woId)?.status).toBe(WorkOrderStatus.EN_ROUTE);

      // 2. Attempt at 199 meters (must succeed)
      const success = await service.transition(
        woId,
        TECH_USER_ID,
        'TECHNICIAN',
        {
          nextStatus: WorkOrderStatus.ON_SITE,
          latitude: defaultDto.latitude + delta199,
          longitude: defaultDto.longitude
        },
        CORRELATION_ID
      );

      expect(success.status).toBe(WorkOrderStatus.ON_SITE);
      expect(mockDbInfo.store.workOrders.get(woId)?.status).toBe(WorkOrderStatus.ON_SITE);
    });
  });

  describe('concurrent assignment race condition (C4, verification criteria)', () => {
    it('ensures exactly one concurrent assignment wins', async () => {
      const created = await service.create(BUYER_USER_ID, defaultDto);
      const woId = created.id;
      await service.publish(woId, BUYER_USER_ID, 'BUYER', CORRELATION_ID);

      const tech1ProfileId = TECH_PROFILE_ID;
      const tech2ProfileId = 't9999999-0000-0000-0000-000000000099';

      // Simulate concurrency: first assignment succeeds and moves to ASSIGNED;
      // second concurrent assignment encounters status ASSIGNED and fails FSM validation
      const assign1Promise = service.transition(
        woId,
        BUYER_USER_ID,
        'BUYER',
        { nextStatus: WorkOrderStatus.ASSIGNED, assignedTechnicianId: tech1ProfileId },
        CORRELATION_ID
      );

      const assign2Promise = service.transition(
        woId,
        BUYER_USER_ID,
        'BUYER',
        { nextStatus: WorkOrderStatus.ASSIGNED, assignedTechnicianId: tech2ProfileId },
        CORRELATION_ID
      );

      const results = await Promise.allSettled([assign1Promise, assign2Promise]);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(BadRequestException);
    });
  });
});
