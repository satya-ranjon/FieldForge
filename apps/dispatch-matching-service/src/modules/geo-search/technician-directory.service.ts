import { Injectable, Logger } from '@nestjs/common';
import type { TechnicianSummaryDto } from '@fieldforge/contracts';

@Injectable()
export class TechnicianDirectoryService {
  private readonly logger = new Logger(TechnicianDirectoryService.name);
  private readonly authServiceUrl: string;

  constructor() {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  }

  async getTechniciansBatch(ids: string[]): Promise<TechnicianSummaryDto[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      const response = await fetch(`${this.authServiceUrl}/technicians/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids }),
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) {
        this.logger.warn(`Technician directory batch lookup failed with HTTP ${response.status}`);
        return [];
      }

      const data = (await response.json()) as TechnicianSummaryDto[];
      return Array.isArray(data) ? data : [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Technician directory lookup error: ${msg}`);
      return [];
    }
  }
}
