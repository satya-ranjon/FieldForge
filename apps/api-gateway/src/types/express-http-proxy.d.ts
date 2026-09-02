declare module 'express-http-proxy' {
  import type { Request, RequestHandler } from 'express';
  import type { RequestOptions, IncomingMessage } from 'node:http';

  export interface ProxyRequestOptions extends RequestOptions {
    headers?: Record<string, string | string[] | number | undefined>;
  }

  export interface ProxyOptions {
    proxyReqPathResolver?: (req: Request) => string | Promise<string>;
    proxyReqOptDecorator?: (
      proxyReqOpts: ProxyRequestOptions,
      srcReq: Request
    ) => ProxyRequestOptions | Promise<ProxyRequestOptions>;
    userResDecorator?: (
      proxyRes: IncomingMessage,
      proxyResData: Buffer,
      userReq: Request,
      userRes: unknown
    ) => unknown | Promise<unknown>;
    filter?: (req: Request, res: unknown) => boolean | Promise<boolean>;
    limit?: string;
  }

  function proxy(host: string, options?: ProxyOptions): RequestHandler;

  export default proxy;
}
