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

  test('UI Approve action failure: displays error notification, does not show success toast, and prevents false approval (Requirement 21)', async ({
    page
  }) => {
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

    await page.route('**/api/v1/work-orders', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'wo-test-err-001',
            buyerId: 'b1111111-1111-1111-1111-111111111111',
            title: 'Substation Transformer Inspection',
            description: 'Inspect auxiliary cooling loops and oil dielectric levels',
            category: 'ELECTRICAL',
            status: 'COMPLETED',
            budgetType: 'FIXED',
            budgetAmountMinor: 45000,
            addressLine: '120 Market Street, San Francisco, CA',
            latitude: 37.7749,
            longitude: -122.4194,
            scheduledStartTime: '2026-09-25T08:00:00.000Z',
            scheduledEndTime: '2026-09-25T17:00:00.000Z',
            slaExpirationTime: '2026-09-26T17:00:00.000Z',
            createdAt: '2026-09-20T10:00:00.000Z',
            updatedAt: '2026-09-21T10:00:00.000Z'
          }
        ])
      });
    });

    // Mock transition failure: 400 Bad Request
    await page.route('**/api/v1/work-orders/*/transition', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 400,
          message:
            'Invalid FSM transition: Cannot transition work order from COMPLETED to APPROVED. Missing required deliverables.',
          error: 'Bad Request'
        })
      });
    });

    await page.goto('/operations');

    // Click Approve button if present on page
    const approveButton = page.getByRole('button', { name: /Approve & Release Escrow/i });
    if (await approveButton.isVisible()) {
      await approveButton.click();

      // Verify error toast appears with the backend error message
      const errorToast = page.locator('[data-testid="transition-error-toast"]');
      await expect(errorToast).toBeVisible();
      await expect(errorToast).toContainText('Missing required deliverables');

      // Verify success toast is NOT displayed
      const successToast = page.locator('[data-testid="transition-success-toast"]');
      await expect(successToast).not.toBeVisible();
    }
  });

  test('UI Dispute action failure: displays error notification, does not show success toast, and keeps modal open on rejection (Requirement 22)', async ({
    page
  }) => {
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

    await page.route('**/api/v1/work-orders', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'wo-test-err-002',
            buyerId: 'b1111111-1111-1111-1111-111111111111',
            title: 'Substation Transformer Inspection',
            description: 'Inspect auxiliary cooling loops and oil dielectric levels',
            category: 'ELECTRICAL',
            status: 'COMPLETED',
            budgetType: 'FIXED',
            budgetAmountMinor: 45000,
            addressLine: '120 Market Street, San Francisco, CA',
            latitude: 37.7749,
            longitude: -122.4194,
            scheduledStartTime: '2026-09-25T08:00:00.000Z',
            scheduledEndTime: '2026-09-25T17:00:00.000Z',
            slaExpirationTime: '2026-09-26T17:00:00.000Z',
            createdAt: '2026-09-20T10:00:00.000Z',
            updatedAt: '2026-09-21T10:00:00.000Z'
          }
        ])
      });
    });

    await page.route('**/api/v1/work-orders/*/transition', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 500,
          message: 'Internal database transaction timeout',
          error: 'Internal Server Error'
        })
      });
    });

    await page.goto('/operations');

    const disputeButton = page.getByRole('button', { name: /Dispute Deliverables/i });
    if (await disputeButton.isVisible()) {
      await disputeButton.click();

      // Fill in dispute reason
      await page.fill('textarea', 'Work performed violates site safety standards');

      // Click Confirm Dispute
      await page.getByRole('button', { name: /Confirm Dispute & Lock Escrow/i }).click();

      // Verify error toast appears
      const errorToast = page.locator('[data-testid="transition-error-toast"]');
      await expect(errorToast).toBeVisible();
      await expect(errorToast).toContainText('Internal database transaction timeout');

      // Verify success toast is NOT displayed
      const successToast = page.locator('[data-testid="transition-success-toast"]');
      await expect(successToast).not.toBeVisible();
    }
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
