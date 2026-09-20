import {
  Inject,
  Injectable,
  Logger,
  Optional,
  InternalServerErrorException,
  ServiceUnavailableException
} from '@nestjs/common';
import type { WorkOrderBillingContextDto } from '@fieldforge/contracts';
import {
  INTERNAL_SECRET_HEADER,
  SERVICE_NAME_HEADER,
  getInternalServiceSecret
} from '@fieldforge/common';

export const WORK_ORDER_DIRECTORY_INTERNAL_SECRET = 'WORK_ORDER_DIRECTORY_INTERNAL_SECRET';

@Injectable()
export class WorkOrderDirectoryService {
  private readonly logger = new Logger(WorkOrderDirectoryService.name);
  private readonly workOrderServiceUrl: string;
  private readonly internalSecret?: string;
  private readonly localWorkOrders = new Map<string, WorkOrderBillingContextDto>();

  constructor(
    @Optional()
    @Inject(WORK_ORDER_DIRECTORY_INTERNAL_SECRET)
    internalSecret?: string
  ) {
    this.workOrderServiceUrl = process.env.WORK_ORDER_SERVICE_URL || 'http://localhost:8002';
    this.internalSecret = internalSecret;
  }

  /**
   * Sets an in-memory work order for testing or local simulation.
   */
  setLocalWorkOrder(id: string, workOrder: Partial<WorkOrderBillingContextDto>): void {
    this.localWorkOrders.set(id, workOrder as WorkOrderBillingContextDto);
  }

  /**
   * Clears explicit test/local overrides.
   */
  clearCache(): void {
    this.localWorkOrders.clear();
  }

  /**
   * Fetches narrow work order billing context from work-order-service over authenticated REST (ISSUE-002).
   * Note: Remote responses are never cached to guarantee state and technician freshness during financial operations.
   */
  async getWorkOrder(
    workOrderId: string,
    correlationId?: string
  ): Promise<WorkOrderBillingContextDto | null> {
    if (!workOrderId) {
      return null;
    }

    const local = this.localWorkOrders.get(workOrderId);
    if (local) {
      return local;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      [SERVICE_NAME_HEADER]: 'billing-service'
    };

    const secret =
      this.internalSecret ?? (process.env.INTERNAL_SERVICE_SECRET || getInternalServiceSecret());
    if (secret) {
      headers[INTERNAL_SECRET_HEADER] = secret;
    }

    if (correlationId) {
      headers['x-correlation-id'] = correlationId;
    }

    let response: Response;
    try {
      response = await fetch(
        `${this.workOrderServiceUrl}/internal/work-orders/${workOrderId}/billing-context`,
        {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(3000)
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[WorkOrderDirectoryService] Network failure during work order lookup for ${workOrderId}: ${msg}`
      );
      throw new ServiceUnavailableException(`Internal work-order service unreachable: ${msg}`);
    }

    if (response.status === 404) {
      return null;
    }

    if (response.status === 401 || response.status === 403) {
      this.logger.error(
        `[WorkOrderDirectoryService] Authentication to work-order service failed with HTTP ${response.status}`
      );
      throw new InternalServerErrorException('Internal work-order service authentication failed');
    }

    if (!response.ok) {
      this.logger.error(
        `[WorkOrderDirectoryService] Work order lookup for ${workOrderId} returned HTTP ${response.status}`
      );
      throw new ServiceUnavailableException(
        `Internal work-order service error: HTTP ${response.status}`
      );
    }

    const data = (await response.json()) as WorkOrderBillingContextDto;
    if (data && data.id) {
      return data;
    }

    return null;
  }
}
