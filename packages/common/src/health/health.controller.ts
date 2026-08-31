import { Controller, GET } from '@nestjs/common';

@Controller()
export class HealthController {
  @GET('/healthz')
  getLiveness() {
    return { status: 'UP', timestamp: new Date().toISOString() };
  }

  @GET('/readyz')
  getReadiness() {
    return { status: 'READY', uptime: process.uptime() };
  }
}
