import { gatewayConfig } from '../src/config/gateway.config';
import { CorrelationIdMiddleware } from '../src/middleware/correlation-id.middleware';

type Headers = Record<string, string | undefined>;

const fakeRequest = (headers: Headers = {}) =>
  ({ headers }) as never as {
    headers: Headers;
  };

const fakeResponse = () => {
  const set: Record<string, unknown> = {};
  return {
    set,
    res: {
      setHeader: (name: string, value: unknown) => {
        set[name] = value;
      }
    }
  };
};

describe('gatewayConfig', () => {
  // Phase 1 of docs/DEVELOPMENT_PLAN.md proxies /api/v1/* to these URLs. A
  // missing or malformed entry currently fails at the first request rather than
  // at startup, so this is the earliest place it can be caught.
  const ROUTED = ['auth', 'workOrder', 'dispatch', 'billing', 'notifications'] as const;

  it.each(ROUTED)('resolves an absolute http(s) URL for %s', (key) => {
    const url = new URL(gatewayConfig.services[key]);
    expect(url.protocol).toMatch(/^https?:$/);
    expect(url.hostname).not.toBe('');
  });

  it('routes each downstream service to its own address', () => {
    // Two services sharing one URL means requests for one silently land on the
    // other, which reads as a 404 from the wrong service.
    const urls = ROUTED.map((key) => gatewayConfig.services[key]);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('exposes no service beyond the five the gateway fronts', () => {
    expect(Object.keys(gatewayConfig.services).sort()).toEqual([...ROUTED].sort());
  });

  it('listens on a usable port', () => {
    expect(Number.isInteger(gatewayConfig.port)).toBe(true);
    expect(gatewayConfig.port).toBeGreaterThan(0);
    expect(gatewayConfig.port).toBeLessThan(65536);
  });
});

describe('CorrelationIdMiddleware', () => {
  const INBOUND = '7f2b1c9e-0a41-4d3f-9c11-8b6d5e4a3210';
  let middleware: CorrelationIdMiddleware;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
  });

  it('keeps an inbound correlation id', () => {
    // A gateway that reissued the id would break the trace at the first hop,
    // which is exactly where a client-supplied id is most useful (FR-OBS-002).
    const req = fakeRequest({ 'x-correlation-id': INBOUND });
    const { set, res } = fakeResponse();

    middleware.use(req as never, res as never, () => undefined);

    expect(req.headers['x-correlation-id']).toBe(INBOUND);
    expect(set['x-correlation-id']).toBe(INBOUND);
  });

  it('mints one when the caller supplies none', () => {
    const req = fakeRequest();
    const { set, res } = fakeResponse();

    middleware.use(req as never, res as never, () => undefined);

    expect(req.headers['x-correlation-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
    expect(set['x-correlation-id']).toBe(req.headers['x-correlation-id']);
  });

  it('gives a different id to each correlation-free request', () => {
    const ids = [1, 2].map(() => {
      const req = fakeRequest();
      middleware.use(req as never, fakeResponse().res as never, () => undefined);
      return req.headers['x-correlation-id'];
    });

    expect(ids[0]).not.toBe(ids[1]);
  });

  it('echoes the id on the response so a client can quote it in a bug report', () => {
    const { set, res } = fakeResponse();
    middleware.use(fakeRequest() as never, res as never, () => undefined);
    expect(set['x-correlation-id']).toBeDefined();
  });

  it('always continues the chain', () => {
    // Swallowing next() would hang every request behind the middleware.
    const next = jest.fn();
    middleware.use(fakeRequest() as never, fakeResponse().res as never, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
