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

/**
 * Identity headers the gateway asserts downstream. A client may not supply
 * these: `express-http-proxy` copies inbound headers onto the proxied request
 * by default, so anything arriving under these names is stripped before the
 * gateway sets its own. Without the strip, a request to a public route — where
 * the JWT guard allows anonymous access and so leaves `req.user` undefined —
 * would forward the caller's own `x-ff-user-id` untouched.
 */
const GATEWAY_ASSERTED_HEADERS = ['x-ff-user-id', 'x-ff-user-role'] as const;

const createServiceProxy = (targetUrl: string): RequestHandler => {
  return proxy(targetUrl, {
    proxyReqPathResolver: (req: Request) => {
      const stripped = req.originalUrl.replace(/^\/api\/v1/, '');
      return stripped.startsWith('/') ? stripped : `/${stripped}`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq: Request) => {
      const authReq = srcReq as AuthenticatedRequest;
      const correlationId = authReq.headers['x-correlation-id'];

      if (proxyReqOpts.headers) {
        // Drop first, then re-assert: a spoofed header must not survive on a
        // path where the gateway has no verified identity to overwrite it with.
        for (const header of GATEWAY_ASSERTED_HEADERS) {
          delete proxyReqOpts.headers[header];
        }

        if (correlationId) {
          proxyReqOpts.headers['x-correlation-id'] = correlationId;
        }
        if (authReq.user) {
          proxyReqOpts.headers['x-ff-user-id'] = authReq.user.userId;
          proxyReqOpts.headers['x-ff-user-role'] = authReq.user.role;
        }
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
