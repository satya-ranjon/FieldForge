import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { Controller, All, Req, Res, Next } from '@nestjs/common';
import proxy from 'express-http-proxy';
import { gatewayConfig } from '../config/gateway.config';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const createServiceProxy = (targetUrl: string): RequestHandler => {
  return proxy(targetUrl, {
    proxyReqPathResolver: (req: Request) => {
      const stripped = req.originalUrl.replace(/^\/api\/v1/, '');
      return stripped.startsWith('/') ? stripped : `/${stripped}`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq: Request) => {
      const authReq = srcReq as AuthenticatedRequest;
      const correlationId = authReq.headers['x-correlation-id'];

      if (correlationId && proxyReqOpts.headers) {
        proxyReqOpts.headers['x-correlation-id'] = correlationId;
      }
      if (authReq.user && proxyReqOpts.headers) {
        proxyReqOpts.headers['x-ff-user-id'] = authReq.user.userId;
        proxyReqOpts.headers['x-ff-user-role'] = authReq.user.role;
      }
      return proxyReqOpts;
    }
  });
};

@Controller()
export class ProxyController {
  private readonly proxies: Record<string, RequestHandler>;

  constructor() {
    this.proxies = {
      auth: createServiceProxy(gatewayConfig.services.auth),
      users: createServiceProxy(gatewayConfig.services.auth),
      'work-orders': createServiceProxy(gatewayConfig.services.workOrder),
      dispatch: createServiceProxy(gatewayConfig.services.dispatch),
      billing: createServiceProxy(gatewayConfig.services.billing),
      notifications: createServiceProxy(gatewayConfig.services.notifications)
    };
  }

  @All([
    'auth',
    'auth/{*path}',
    'users',
    'users/{*path}',
    'work-orders',
    'work-orders/{*path}',
    'dispatch',
    'dispatch/{*path}',
    'billing',
    'billing/{*path}',
    'notifications',
    'notifications/{*path}'
  ])
  forward(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    const rawPath = req.originalUrl.replace(/^\/api\/v1\/?/, '');
    const serviceSegment = rawPath.split('/')[0]?.split('?')[0];

    const proxyHandler = serviceSegment ? this.proxies[serviceSegment] : undefined;
    if (proxyHandler) {
      return proxyHandler(req, res, next);
    }

    return res.status(404).json({
      statusCode: 404,
      message: `No downstream service registered for path: ${rawPath}`
    });
  }
}
