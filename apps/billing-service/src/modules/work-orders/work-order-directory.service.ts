import { Injectable, Logger } from '@nestjs/common';
import type { WorkOrderResponseDto } from '@fieldforge/contracts';

export const WORK_ORDER_DIRECTORY_CACHE_TTL_SECONDS = 60; // 1 minute

interface MemoryCacheEntry {
  data: WorkOrderResponseDto;
  expiresAt: number;
}

@Injectable()
export class WorkOrderDirectoryService {
  private readonly logger = new Logger(WorkOrderDirectoryService.name);
  private readonly workOrderServiceUrl: string;
  private readonly memoryCache = new Map<string, MemoryCacheEntry>();
  private readonly localWorkOrders = new Map<string, WorkOrderResponseDto>();

  constructor() {
    this.workOrderServiceUrl = process.env.WORK_ORDER_SERVICE_URL || 'http://localhost:8002';
  }

  /**
   * Sets an in-memory work order for testing or local simulation.
   */
  setLocalWorkOrder(id: string, workOrder: Partial<WorkOrderResponseDto>): void {
    this.localWorkOrders.set(id, workOrder as WorkOrderResponseDto);
  }

  /**
   * Clears in-memory caches and test overrides.
   */
  clearCache(): void {
    this.memoryCache.clear();
    this.localWorkOrders.clear();
  }

  /**
   * Fetches work order summary from work-order-service over REST.
   */
  async getWorkOrder(
    workOrderId: string,
    correlationId?: string
  ): Promise<WorkOrderResponseDto | null> {
    if (!workOrderId) {
      return null;
    }

    const local = this.localWorkOrders.get(workOrderId);
    if (local) {
      return local;
    }

    const cached = this.getFromMemoryCache(workOrderId);
    if (cached) {
      return cached;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (correlationId) {
        headers['x-correlation-id'] = correlationId;
      }

      const response = await fetch(`${this.workOrderServiceUrl}/work-orders/${workOrderId}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) {
        this.logger.warn(
          `[WorkOrderDirectoryService] Work order lookup for ${workOrderId} returned HTTP ${response.status}`
        );
        return null;
      }

      const data = (await response.json()) as WorkOrderResponseDto;
      if (data && data.id) {
        this.saveToMemoryCache(workOrderId, data);
        return data;
      }

      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `[WorkOrderDirectoryService] Work order lookup failed for ${workOrderId}: ${msg}`
      );
      return null;
    }
  }

  private getFromMemoryCache(workOrderId: string): WorkOrderResponseDto | null {
    const entry = this.memoryCache.get(workOrderId);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(workOrderId);
      return null;
    }
    return entry.data;
  }

  private saveToMemoryCache(workOrderId: string, data: WorkOrderResponseDto): void {
    const expiresAt = Date.now() + WORK_ORDER_DIRECTORY_CACHE_TTL_SECONDS * 1000;
    this.memoryCache.set(workOrderId, { data, expiresAt });
  }
}
