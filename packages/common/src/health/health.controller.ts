import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/healthz')
  getLiveness() {
    return { status: 'UP', timestamp: new Date().toISOString() };
  }

  @Get('/readyz')
  getReadiness() {
    const memoryUsage = process.memoryUsage();
    return {
      status: 'READY',
      uptimeSeconds: Math.floor(process.uptime()),
      memoryMb: Math.round(memoryUsage.rss / (1024 * 1024)),
      timestamp: new Date().toISOString()
    };
  }
}
