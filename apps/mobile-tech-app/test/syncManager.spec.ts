import { WorkOrderStatus } from '@fieldforge/contracts';
import {
  defaultMobileDispatcher,
  buildTransitionPayload,
  executeOnlineTransition
} from '../src/services/syncManager';
import { OfflineQueueItem } from '../src/services/offlineSync.service';
import { store } from '../src/store/store';
import { setOnlineStatus } from '../src/store/slices/syncSlice';
import { setCredentials } from '../src/store/slices/authSlice';
import { DeliverableHttpError } from '../src/services/deliverableUpload.service';

describe('Mobile SyncManager Transition Contract (ISSUE-009)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    store.dispatch(setOnlineStatus(true));
    store.dispatch(
      setCredentials({
        accessToken: 'mock-jwt-token-1234',
        user: {
          id: 'u-1',
          email: 'tech@fieldforge.dev',
          fullName: 'Test Tech',
          rating: 5,
          completedJobsCount: 10
        }
      })
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('buildTransitionPayload helper', () => {
    it('constructs minimal canonical payload with nextStatus only', () => {
      const payload = buildTransitionPayload({
        nextStatus: WorkOrderStatus.EN_ROUTE
      });
      expect(payload).toEqual({
        nextStatus: WorkOrderStatus.EN_ROUTE
      });
      expect(payload).not.toHaveProperty('latitude');
      expect(payload).not.toHaveProperty('longitude');
      expect(payload).not.toHaveProperty('status');
      expect(payload).not.toHaveProperty('notes');
    });

    it('constructs geofenced ON_SITE payload with latitude and longitude', () => {
      const payload = buildTransitionPayload({
        nextStatus: WorkOrderStatus.ON_SITE,
        latitude: 23.7,
        longitude: 90.4
      });
      expect(payload).toEqual({
        nextStatus: WorkOrderStatus.ON_SITE,
        latitude: 23.7,
        longitude: 90.4
      });
    });

    it('constructs DISPUTED payload with reason and strips undefined/null keys', () => {
      const payload = buildTransitionPayload({
        nextStatus: WorkOrderStatus.DISPUTED,
        reason: 'Client unavailable on site',
        latitude: undefined,
        longitude: undefined
      });
      expect(payload).toEqual({
        nextStatus: WorkOrderStatus.DISPUTED,
        reason: 'Client unavailable on site'
      });
      expect(payload).not.toHaveProperty('latitude');
      expect(payload).not.toHaveProperty('longitude');
    });
  });

  describe('Offline Queue Transition Replay (Requirements 15, 16, 17)', () => {
    it('Requirement 15: Start Travel queued offline replays as EN_ROUTE and NOT ON_SITE', async () => {
      let interceptedUrl = '';
      let interceptedBody: Record<string, unknown> | null = null;

      global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
        interceptedUrl = String(url);
        interceptedBody = JSON.parse(String(init?.body));
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'wo-1', status: 'EN_ROUTE' })
        } as unknown as Response;
      });

      const queueItem: OfflineQueueItem = {
        id: 'q-item-1',
        action: 'CHECK_IN',
        payload: {
          workOrderId: 'wo-1',
          nextStatus: WorkOrderStatus.EN_ROUTE
        },
        idempotencyKey: 'mob-offline-q-item-1',
        retryCount: 0,
        createdAt: new Date().toISOString()
      };

      const result = await defaultMobileDispatcher(queueItem);

      expect(result).toBe(true);
      expect(interceptedUrl).toBe('http://localhost:8000/api/v1/work-orders/wo-1/transition');
      expect(interceptedBody).toEqual({
        nextStatus: 'EN_ROUTE'
      });
      expect(interceptedBody).not.toHaveProperty('status');
      expect(interceptedBody).not.toHaveProperty('notes');
      expect(interceptedBody?.nextStatus).not.toBe('ON_SITE');
    });

    it('Requirement 16: Check In queued offline replays as ON_SITE preserving coordinates', async () => {
      let interceptedBody: Record<string, unknown> | null = null;

      global.fetch = jest.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        interceptedBody = JSON.parse(String(init?.body));
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'wo-1', status: 'ON_SITE' })
        } as unknown as Response;
      });

      const queueItem: OfflineQueueItem = {
        id: 'q-item-2',
        action: 'CHECK_IN',
        payload: {
          workOrderId: 'wo-1',
          nextStatus: WorkOrderStatus.ON_SITE,
          latitude: 23.7,
          longitude: 90.4
        },
        idempotencyKey: 'mob-offline-q-item-2',
        retryCount: 0,
        createdAt: new Date().toISOString()
      };

      const result = await defaultMobileDispatcher(queueItem);

      expect(result).toBe(true);
      expect(interceptedBody).toEqual({
        nextStatus: 'ON_SITE',
        latitude: 23.7,
        longitude: 90.4
      });
    });

    it('Requirement 17: Complete Job queued offline replays as COMPLETED', async () => {
      let interceptedBody: Record<string, unknown> | null = null;

      global.fetch = jest.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        interceptedBody = JSON.parse(String(init?.body));
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'wo-1', status: 'COMPLETED' })
        } as unknown as Response;
      });

      const queueItem: OfflineQueueItem = {
        id: 'q-item-3',
        action: 'COMPLETE_JOB',
        payload: {
          workOrderId: 'wo-1',
          nextStatus: WorkOrderStatus.COMPLETED
        },
        idempotencyKey: 'mob-offline-q-item-3',
        retryCount: 0,
        createdAt: new Date().toISOString()
      };

      const result = await defaultMobileDispatcher(queueItem);

      expect(result).toBe(true);
      expect(interceptedBody).toEqual({
        nextStatus: 'COMPLETED'
      });
      expect(interceptedBody).not.toHaveProperty('status');
      expect(interceptedBody).not.toHaveProperty('notes');
    });
  });

  describe('Online Transition Execution (Requirements 18, 19, 20)', () => {
    it('Requirement 18: Online Start Travel transmits canonical EN_ROUTE payload', async () => {
      let capturedHeaders: Record<string, string> = {};
      let capturedBody: Record<string, unknown> | null = null;

      global.fetch = jest.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        capturedHeaders = init?.headers as Record<string, string>;
        capturedBody = JSON.parse(String(init?.body));
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'wo-online-1', status: 'EN_ROUTE' })
        } as unknown as Response;
      });

      const payload = buildTransitionPayload({
        nextStatus: WorkOrderStatus.EN_ROUTE
      });

      const success = await executeOnlineTransition('wo-online-1', payload, 'mock-jwt-token-1234');

      expect(success).toBe(true);
      expect(capturedBody).toEqual({
        nextStatus: 'EN_ROUTE'
      });
      expect(capturedHeaders['Authorization']).toBe('Bearer mock-jwt-token-1234');
      expect(capturedHeaders['x-idempotency-key']).toMatch(/^mob-online-/);
    });

    it('Requirement 19: Online Check In transmits ON_SITE with required coordinates', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      global.fetch = jest.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = JSON.parse(String(init?.body));
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'wo-online-1', status: 'ON_SITE' })
        } as unknown as Response;
      });

      const payload = buildTransitionPayload({
        nextStatus: WorkOrderStatus.ON_SITE,
        latitude: 37.7749,
        longitude: -122.4194
      });

      const success = await executeOnlineTransition('wo-online-1', payload, 'mock-jwt-token-1234');

      expect(success).toBe(true);
      expect(capturedBody).toEqual({
        nextStatus: 'ON_SITE',
        latitude: 37.7749,
        longitude: -122.4194
      });
    });

    it('Requirement 20: Online Complete Job transmits COMPLETED payload', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      global.fetch = jest.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = JSON.parse(String(init?.body));
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'wo-online-1', status: 'COMPLETED' })
        } as unknown as Response;
      });

      const payload = buildTransitionPayload({
        nextStatus: WorkOrderStatus.COMPLETED
      });

      const success = await executeOnlineTransition('wo-online-1', payload, 'mock-jwt-token-1234');

      expect(success).toBe(true);
      expect(capturedBody).toEqual({
        nextStatus: 'COMPLETED'
      });
    });

    it('API failure on HTTP 400 throws DeliverableHttpError with parsed backend message', async () => {
      global.fetch = jest.fn(async () => {
        return {
          ok: false,
          status: 400,
          json: async () => ({
            statusCode: 400,
            message:
              'Invalid FSM transition: Cannot transition work order from ASSIGNED to ON_SITE. Allowed: [EN_ROUTE, DISPUTED, CANCELLED]',
            error: 'Bad Request'
          })
        } as unknown as Response;
      });

      const payload = buildTransitionPayload({
        nextStatus: WorkOrderStatus.ON_SITE,
        latitude: 37.7749,
        longitude: -122.4194
      });

      await expect(
        executeOnlineTransition('wo-online-1', payload, 'mock-jwt-token-1234')
      ).rejects.toThrow(DeliverableHttpError);

      await expect(
        executeOnlineTransition('wo-online-1', payload, 'mock-jwt-token-1234')
      ).rejects.toThrow(
        'Invalid FSM transition: Cannot transition work order from ASSIGNED to ON_SITE. Allowed: [EN_ROUTE, DISPUTED, CANCELLED]'
      );
    });

    it('API failure on HTTP 500 throws generic Error without masking', async () => {
      global.fetch = jest.fn(async () => {
        return {
          ok: false,
          status: 500,
          json: async () => ({ message: 'Internal Server Error' })
        } as unknown as Response;
      });

      const payload = buildTransitionPayload({
        nextStatus: WorkOrderStatus.COMPLETED
      });

      await expect(
        executeOnlineTransition('wo-online-1', payload, 'mock-jwt-token-1234')
      ).rejects.toThrow('Internal Server Error');
    });
  });
});
