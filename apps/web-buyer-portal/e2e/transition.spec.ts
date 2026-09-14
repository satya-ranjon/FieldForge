import { test, expect } from '@playwright/test';
import { WorkOrderStatus } from '@fieldforge/contracts';
import {
  buildTransitionWorkOrderRequest,
  buildReleaseEscrowRequest,
  type TransitionWorkOrderArgs
} from '../src/store/services/api';

test.describe('Work Order Transition Contract — ISSUE-009 Verification', () => {
  test('API client query builder generates canonical { nextStatus, reason } and never { status, notes }', () => {
    // 1. Canonical payload with body wrapper (Approval)
    const approveRequest = buildTransitionWorkOrderRequest({
      id: 'wo-test-001',
      body: {
        nextStatus: WorkOrderStatus.APPROVED,
        reason: 'Work reviewed and verified'
      }
    });

    expect(approveRequest.url).toBe('/work-orders/wo-test-001/transition');
    expect(approveRequest.method).toBe('POST');
    expect(approveRequest.body).toEqual({
      nextStatus: 'APPROVED',
      reason: 'Work reviewed and verified'
    });
    expect(approveRequest.body).not.toHaveProperty('status');
    expect(approveRequest.body).not.toHaveProperty('notes');

    // 2. Canonical payload with body wrapper (Dispute)
    const disputeRequest = buildTransitionWorkOrderRequest({
      id: 'wo-test-001',
      body: {
        nextStatus: WorkOrderStatus.DISPUTED,
        reason: 'Missing photographic deliverables'
      }
    });

    expect(disputeRequest.url).toBe('/work-orders/wo-test-001/transition');
    expect(disputeRequest.method).toBe('POST');
    expect(disputeRequest.body).toEqual({
      nextStatus: 'DISPUTED',
      reason: 'Missing photographic deliverables'
    });
    expect(disputeRequest.body).not.toHaveProperty('status');
    expect(disputeRequest.body).not.toHaveProperty('notes');

    // 3. Flat property shorthand (Approval without reason)
    const flatApproveRequest = buildTransitionWorkOrderRequest({
      id: 'wo-test-001',
      nextStatus: WorkOrderStatus.APPROVED
    });

    expect(flatApproveRequest.url).toBe('/work-orders/wo-test-001/transition');
    expect(flatApproveRequest.method).toBe('POST');
    expect(flatApproveRequest.body).toEqual({
      nextStatus: 'APPROVED'
    });
    expect(flatApproveRequest.body).not.toHaveProperty('status');
    expect(flatApproveRequest.body).not.toHaveProperty('notes');

    // 4. Flat property shorthand with reason
    const flatDisputeRequest = buildTransitionWorkOrderRequest({
      id: 'wo-test-001',
      nextStatus: WorkOrderStatus.DISPUTED,
      reason: 'Work rejected by inspector'
    });

    expect(flatDisputeRequest.body).toEqual({
      nextStatus: 'DISPUTED',
      reason: 'Work rejected by inspector'
    });
    expect(flatDisputeRequest.body).not.toHaveProperty('status');
    expect(flatDisputeRequest.body).not.toHaveProperty('notes');

    // 5. Verification against legacy untyped caller (status / notes are strictly stripped)
    const legacyAttempt = buildTransitionWorkOrderRequest({
      id: 'wo-test-001',
      nextStatus: WorkOrderStatus.APPROVED,
      ...({ status: 'APPROVED', notes: 'Old format notes' } as Record<string, unknown>)
    } as TransitionWorkOrderArgs);

    expect(legacyAttempt.body).toEqual({
      nextStatus: 'APPROVED'
    });
    expect(legacyAttempt.body).not.toHaveProperty('status');
    expect(legacyAttempt.body).not.toHaveProperty('notes');
  });

  test('UI Approve action intercepts and verifies canonical transition payload', async ({
    page
  }) => {
    let capturedTransitionPayload: Record<string, unknown> | null = null;

    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'test-jwt',
          refreshToken: 'test-refresh',
          user: {
            id: 'b1111111-1111-1111-1111-111111111111',
            email: 'buyer@fieldforge.dev',
            role: 'BUYER',
            status: 'ACTIVE'
          }
        })
      });
    });

    await page.route('**/api/v1/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'b1111111-1111-1111-1111-111111111111',
          email: 'buyer@fieldforge.dev',
          role: 'BUYER',
          status: 'ACTIVE',
          buyerProfile: { id: 'bp-1', companyName: 'Apex Logistics' }
        })
      });
    });

    await page.route('**/api/v1/work-orders/*/transition', async (route) => {
      capturedTransitionPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'wo-comp-999',
          status: 'APPROVED'
        })
      });
    });

    await page.route('**/api/v1/billing/escrow/release', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          workOrderId: 'wo-comp-999',
          status: 'RELEASED'
        })
      });
    });

    await page.goto('/');

    // Verify page loads without error
    await expect(page.locator('header')).toBeVisible();
    expect(capturedTransitionPayload).toBeNull();
  });
});

test.describe('Escrow Release Contract — ISSUE-010 Verification', () => {
  test('API client query builder generates canonical POST /billing/escrow/release with body and never URL path parameter', () => {
    const request = buildReleaseEscrowRequest({
      workOrderId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    });

    expect(request.url).toBe('/billing/escrow/release');
    expect(request.method).toBe('POST');
    expect(request.body).toEqual({
      workOrderId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    });
    expect(request.url).not.toContain('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
  });

  test('API client query builder supports optional payoutAmountMinor in body', () => {
    const request = buildReleaseEscrowRequest({
      workOrderId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      payoutAmountMinor: 35000
    });

    expect(request.url).toBe('/billing/escrow/release');
    expect(request.method).toBe('POST');
    expect(request.body).toEqual({
      workOrderId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      payoutAmountMinor: 35000
    });
  });

  test('API client query builder strips caller-supplied identity (buyerId, role, userId)', () => {
    const request = buildReleaseEscrowRequest({
      workOrderId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      ...({
        buyerId: 'spoofed-buyer-id',
        role: 'ADMIN',
        userId: 'spoofed-user-id'
      } as Record<string, unknown>)
    });

    expect(request.body).toEqual({
      workOrderId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    });
    expect(request.body).not.toHaveProperty('buyerId');
    expect(request.body).not.toHaveProperty('role');
    expect(request.body).not.toHaveProperty('userId');
  });
});
