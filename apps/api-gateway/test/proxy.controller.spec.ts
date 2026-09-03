import type { Request } from 'express';

/**
 * Capture the options `express-http-proxy` is configured with, so the
 * `proxyReqOptDecorator` can be exercised without standing up a downstream
 * service. The factory returns a handler that is never invoked here.
 */
const capturedOptions: Array<Record<string, unknown>> = [];

jest.mock('express-http-proxy', () => ({
  __esModule: true,
  default: jest.fn((_target: string, options: Record<string, unknown>) => {
    capturedOptions.push(options);
    return jest.fn();
  })
}));

// Imported after the mock is registered so the controller picks it up.
import { ProxyController } from '../src/controllers/proxy.controller';

type ProxyOptions = {
  proxyReqOptDecorator: (
    opts: { headers: Record<string, unknown> },
    req: Request
  ) => { headers: Record<string, unknown> };
};

describe('ProxyController identity headers', () => {
  let decorate: ProxyOptions['proxyReqOptDecorator'];

  beforeEach(() => {
    capturedOptions.length = 0;
    new ProxyController();
    decorate = (capturedOptions[0] as unknown as ProxyOptions).proxyReqOptDecorator;
  });

  const run = (
    inboundHeaders: Record<string, unknown>,
    user?: { userId: string; email: string; role: string }
  ) => {
    // express-http-proxy seeds the outbound headers from the inbound request,
    // so the decorator receives the client's own headers to start from.
    const srcReq = { headers: { ...inboundHeaders }, user } as unknown as Request;
    return decorate({ headers: { ...inboundHeaders } }, srcReq).headers;
  };

  it('strips a client-supplied x-ff-user-id when the request is anonymous', () => {
    // Public routes (login/register/refresh) pass the JWT guard without setting
    // req.user. Before the strip, this header reached auth-service verbatim.
    const headers = run({ 'x-ff-user-id': 'victim-user-id' });

    expect(headers['x-ff-user-id']).toBeUndefined();
  });

  it('strips a client-supplied x-ff-user-role when the request is anonymous', () => {
    const headers = run({ 'x-ff-user-role': 'ADMIN' });

    expect(headers['x-ff-user-role']).toBeUndefined();
  });

  it('overwrites spoofed identity headers with the verified identity', () => {
    const headers = run(
      { 'x-ff-user-id': 'victim-user-id', 'x-ff-user-role': 'ADMIN' },
      { userId: 'real-user-id', email: 'buyer@example.com', role: 'BUYER' }
    );

    expect(headers['x-ff-user-id']).toBe('real-user-id');
    expect(headers['x-ff-user-role']).toBe('BUYER');
  });

  it('asserts the verified identity downstream', () => {
    const headers = run({}, { userId: 'usr-123', email: 'b@example.com', role: 'BUYER' });

    expect(headers['x-ff-user-id']).toBe('usr-123');
    expect(headers['x-ff-user-role']).toBe('BUYER');
  });

  it('still forwards the correlation id', () => {
    // The strip must not take the trace header with it (FR-OBS-002).
    const id = '7f2b1c9e-0a41-4d3f-9c11-8b6d5e4a3210';
    const headers = run({ 'x-correlation-id': id, 'x-ff-user-id': 'spoofed' });

    expect(headers['x-correlation-id']).toBe(id);
    expect(headers['x-ff-user-id']).toBeUndefined();
  });
});
