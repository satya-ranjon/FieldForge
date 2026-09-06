/* global __ENV, __VU, __ITER */

import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * FieldForge Real-Traffic Load & SLO Evidence Test (k6)
 * Aligned with SRS §5, FR-OBS-002, and NFR-PERF-001.
 * Drives concurrent traffic against the real stack to measure
 * actual availability and latency thresholds.
 */

export const options = {
  scenarios: {
    dispatch_load: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 1000,
      maxDuration: '2m'
    }
  },
  thresholds: {
    // API availability ≥ 99.9% (non-5xx)
    http_req_failed: ['rate<0.001'],
    // API overall / mutation latency: p95 < 200ms
    'http_req_duration{expected_response:true}': ['p(95)<200'],
    // REST read duration: p95 < 100ms
    'http_req_duration{method:GET}': ['p(95)<100']
  }
};

const BASE_URL = __ENV.GATEWAY_URL || 'http://localhost:8000';

export default function () {
  const correlationId = `k6-${__VU}-${__ITER}-${Date.now()}`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-correlation-id': correlationId
    }
  };

  // 1. Health & Liveness Probe
  const healthRes = http.get(`${BASE_URL}/healthz`, params);
  check(healthRes, {
    'liveness probe status is 200': (r) => r.status === 200
  });

  // 2. Readiness Probe
  const readyRes = http.get(`${BASE_URL}/readyz`, params);
  check(readyRes, {
    'readiness probe status is 200': (r) => r.status === 200
  });

  // 3. Prometheus Metrics Scraping
  const metricsRes = http.get(`${BASE_URL}/metrics`, params);
  check(metricsRes, {
    'metrics scrape status is 200': (r) => r.status === 200,
    'metrics payload contains http_requests_total': (r) =>
      r.body && r.body.includes('http_requests_total')
  });

  // 4. Authenticate Buyer
  const loginPayload = JSON.stringify({
    email: 'buyer@fieldforge.local',
    password: 'Password123!'
  });
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, params);
  const isAuthOk = check(loginRes, {
    'login status is 200': (r) => r.status === 200
  });

  let authParams = params;
  if (isAuthOk && loginRes.json('accessToken')) {
    authParams = {
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
        Authorization: `Bearer ${loginRes.json('accessToken')}`
      }
    };
  }

  // 5. Query Work Orders (Read Latency Check)
  const woRes = http.get(`${BASE_URL}/api/v1/work-orders?limit=20`, authParams);
  check(woRes, {
    'work orders read status is 200': (r) => r.status === 200
  });

  // 6. Geospatial Technician Matching Query
  const geoRes = http.get(
    `${BASE_URL}/api/v1/dispatch/technicians/nearby?latitude=37.7749&longitude=-122.4194&radiusMiles=25`,
    authParams
  );
  check(geoRes, {
    'nearby dispatch search status is 200': (r) => r.status === 200
  });

  sleep(0.05);
}
