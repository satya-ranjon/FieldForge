import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/healthz')
  getLiveness() {
    return { status: 'UP', timestamp: new Date().toISOString() };
  }

  @Get('/readyz')
  getReadiness() {
    return { status: 'READY', uptime: process.uptime() };
  }
}
