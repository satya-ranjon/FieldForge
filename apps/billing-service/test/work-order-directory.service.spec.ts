import { WorkOrderDirectoryService } from '../src/modules/work-orders/work-order-directory.service';
import { WorkOrderStatus, type WorkOrderBillingContextDto } from '@fieldforge/contracts';
import { INTERNAL_SECRET_HEADER, SERVICE_NAME_HEADER } from '@fieldforge/common';
import { InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';

describe('WorkOrderDirectoryService', () => {
  let service: WorkOrderDirectoryService;
  const testSecret = 'test-internal-service-secret-12345';
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new WorkOrderDirectoryService(testSecret);
    service.clearCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns cached entry if local override is set', async () => {
    const localDto: WorkOrderBillingContextDto = {
      id: 'wo-local-1',
      buyerId: 'buyer-local',
      assignedTechnicianId: 'tech-local',
      status: WorkOrderStatus.APPROVED
    };
    service.setLocalWorkOrder('wo-local-1', localDto);

    const result = await service.getWorkOrder('wo-local-1');
    expect(result).toEqual(localDto);
  });

  it('returns null when workOrderId is empty', async () => {
    const result = await service.getWorkOrder('');
    expect(result).toBeNull();
  });

  it('calls internal billing-context endpoint with correct headers and returns DTO on 200', async () => {
    const expectedDto: WorkOrderBillingContextDto = {
      id: 'wo-100',
      buyerId: 'buyer-100',
      assignedTechnicianId: 'tech-100',
      status: WorkOrderStatus.APPROVED
    };

    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};

    global.fetch = jest.fn().mockImplementation((url, init) => {
      capturedUrl = String(url);
      capturedHeaders = init.headers;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(expectedDto)
      } as Response);
    });

    const result = await service.getWorkOrder('wo-100', 'corr-123');

    expect(result).toEqual(expectedDto);
    expect(capturedUrl).toContain('/internal/work-orders/wo-100/billing-context');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
    expect(capturedHeaders[SERVICE_NAME_HEADER]).toBe('billing-service');
    expect(capturedHeaders[INTERNAL_SECRET_HEADER]).toBe(testSecret);
    expect(capturedHeaders['x-correlation-id']).toBe('corr-123');
  });

  it('returns null on 404 response (work order not found)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404
    } as Response);

    const result = await service.getWorkOrder('wo-missing', 'corr-404');
    expect(result).toBeNull();
  });

  it('throws InternalServerErrorException on 401 Unauthorized', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401
    } as Response);

    await expect(service.getWorkOrder('wo-auth-fail')).rejects.toThrow(
      InternalServerErrorException
    );
    await expect(service.getWorkOrder('wo-auth-fail')).rejects.toThrow(
      'Internal work-order service authentication failed'
    );
  });

  it('throws InternalServerErrorException on 403 Forbidden', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403
    } as Response);

    await expect(service.getWorkOrder('wo-forbidden')).rejects.toThrow(
      InternalServerErrorException
    );
  });

  it('throws ServiceUnavailableException on 500 Internal Server Error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500
    } as Response);

    await expect(service.getWorkOrder('wo-500')).rejects.toThrow(ServiceUnavailableException);
  });

  it('throws ServiceUnavailableException on network/connection failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

    await expect(service.getWorkOrder('wo-net-fail')).rejects.toThrow(ServiceUnavailableException);
    await expect(service.getWorkOrder('wo-net-fail')).rejects.toThrow(
      'Internal work-order service unreachable'
    );
  });

  it('does not cache responses and always returns fresh status on successive calls (no stale cache)', async () => {
    const approvedDto: WorkOrderBillingContextDto = {
      id: 'wo-fresh-1',
      buyerId: 'buyer-1',
      assignedTechnicianId: 'tech-1',
      status: WorkOrderStatus.APPROVED
    };
    const completedDto: WorkOrderBillingContextDto = {
      id: 'wo-fresh-1',
      buyerId: 'buyer-1',
      assignedTechnicianId: 'tech-1',
      status: WorkOrderStatus.COMPLETED
    };

    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(approvedDto)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(completedDto)
      } as Response);

    global.fetch = mockFetch;

    const firstCall = await service.getWorkOrder('wo-fresh-1');
    expect(firstCall).toEqual(approvedDto);
    expect(firstCall?.status).toBe(WorkOrderStatus.APPROVED);

    const secondCall = await service.getWorkOrder('wo-fresh-1');
    expect(secondCall).toEqual(completedDto);
    expect(secondCall?.status).toBe(WorkOrderStatus.COMPLETED);

    // Verify fetch was invoked on BOTH calls (zero in-memory cache)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('does not cache responses and always returns fresh technician assignment on successive calls', async () => {
    const techADto: WorkOrderBillingContextDto = {
      id: 'wo-tech-reassign',
      buyerId: 'buyer-1',
      assignedTechnicianId: 'tech-A',
      status: WorkOrderStatus.APPROVED
    };
    const techBDto: WorkOrderBillingContextDto = {
      id: 'wo-tech-reassign',
      buyerId: 'buyer-1',
      assignedTechnicianId: 'tech-B',
      status: WorkOrderStatus.APPROVED
    };

    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(techADto)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(techBDto)
      } as Response);

    global.fetch = mockFetch;

    const firstCall = await service.getWorkOrder('wo-tech-reassign');
    expect(firstCall?.assignedTechnicianId).toBe('tech-A');

    const secondCall = await service.getWorkOrder('wo-tech-reassign');
    expect(secondCall?.assignedTechnicianId).toBe('tech-B');

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
