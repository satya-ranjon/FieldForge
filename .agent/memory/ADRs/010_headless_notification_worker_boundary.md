# 📝 ADR 010: Headless Notification Worker Boundary & Gateway Route Decoupling

| Status       | Date           | Decision Maker         |
| :----------- | :------------- | :--------------------- |
| **ACCEPTED** | September 2026 | Satya Ranjan Debsharma |

---

## 1. Context

In the legacy architecture, `apps/notification-service` was modeled and registered in `apps/api-gateway` as an externally routed HTTP microservice (`FF-ARCH-06 / Finding 6`):

1. **Dead Route Proxying in API Gateway**:
   - `apps/api-gateway/src/config/gateway.config.ts` configured `notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8005'`.
   - `apps/api-gateway/src/controllers/proxy.controller.ts` registered route forwarders for `/notifications` and `/notifications/{*path}` forwarding to port `8005`.
   - However, `apps/notification-service` is an asynchronous event consumer that subscribes to RabbitMQ topics (`fieldforge.notifications.work-orders`) and invokes external channels (Twilio SMS, Firebase FCM Push). It exposes **zero** business REST endpoints.
   - Any external request hitting `/api/v1/notifications/*` opened an unnecessary HTTP proxy connection to port `8005`, only to receive an unhandled 404 from NestJS/Express.

2. **Architectural Confusion & Ingress Risk**:
   - Treating `notification-service` as an HTTP-routable API service introduced unnecessary gateway configuration overhead.
   - Exposing internal daemon ports to the public edge reverse proxy confused developers and clients regarding available API capabilities.
   - It also increased the risk of inadvertently routing external traffic to internal container probes (`/healthz`, `/readyz`).

---

## 2. Decision

We establish that `notification-service` is strictly a **headless background consumer worker daemon**, completely decoupled from the edge API Gateway:

```mermaid
flowchart TD
    classDef clientStyle fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef gatewayStyle fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef serviceStyle fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef workerStyle fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef brokerStyle fill:#fffbeb,stroke:#b45309,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef extStyle fill:#fdf2f8,stroke:#db2777,stroke-width:2px,color:#0f172a,font-weight:600;

    subgraph Edge[" Edge Gateway Layer "]
        APIGW["⚡ API Gateway (:8000)<br/>Fronts 4 Domain Services Only"]:::gatewayStyle
    end

    subgraph HttpServices[" Core HTTP Domain Services (NestJS) "]
        AuthSvc["🔐 auth-service (:8001)"]:::serviceStyle
        WOSvc["📋 work-order-service (:8002)"]:::serviceStyle
        DispSvc["📍 dispatch-matching-service (:8003)"]:::serviceStyle
        BillSvc["💳 billing-service (:8004)"]:::serviceStyle
    end

    subgraph Broker[" Message Bus "]
        RabbitMQ{{"📬 RabbitMQ Topic Exchange<br/>fieldforge.events.topic"}}:::brokerStyle
    end

    subgraph Headless[" Headless Background Worker Layer "]
        NotifSvc["🔔 notification-service (:8005)<br/><b>Pure AMQP Event Consumer</b><br/><i>Internal probes only (/healthz, /readyz, /metrics)</i>"]:::workerStyle
    end

    subgraph External[" External Notification Providers "]
        Twilio["📱 Twilio (SMS alerts)"]:::extStyle
        FCM["🔔 Firebase FCM (Push notifications)"]:::extStyle
    end

    APIGW -->|/auth, /users, /technicians| AuthSvc
    APIGW -->|/work-orders, /bids| WOSvc
    APIGW -->|/dispatch| DispSvc
    APIGW -->|/billing| BillSvc

    WOSvc -.->|Pub: work_order.*| RabbitMQ
    BillSvc -.->|Pub: billing.payout.disbursed| RabbitMQ
    DispSvc -.->|Pub: dispatch.*| RabbitMQ

    RabbitMQ -.->|Sub: fieldforge.notifications.work-orders| NotifSvc
    NotifSvc -.-> Twilio
    NotifSvc -.-> FCM
```

### Key Architectural Enforcements:

1. **Remove Notifications Proxy from API Gateway**:
   - `gatewayConfig.services` only contains the 4 HTTP domain services: `auth`, `workOrder`, `dispatch`, `billing`.
   - `ProxyController` removes `notifications` proxy creation and route decorator entries.
   - Any inbound request targeting `/api/v1/notifications/*` is immediately rejected at the edge with `404 Not Found` (`No downstream service registered for path: ...`) without opening upstream network sockets.

2. **Retain Internal Infrastructure Probes in `notification-service`**:
   - `apps/notification-service` continues to run on port `8005` with `HealthController` for Kubernetes pod liveness/readiness probes (`/healthz`, `/readyz`) and Prometheus observability scraping (`/metrics`).
   - It remains an independent container/process in Docker Compose and Kubernetes without ingress exposure.

3. **Zero Impact on Domain Clients**:
   - Neither `apps/web-buyer-portal` nor `apps/mobile-tech-app` issues HTTP calls to `notification-service`.
   - Notifications to mobile technicians and enterprise buyers remain 100% event-driven via RabbitMQ and push/SMS channels.

---

## 3. Consequences

### Positive

- **Reduced Gateway Overhead**: Eliminates dead proxy routing and avoids unnecessary socket connections to a non-HTTP business service.
- **Clear Architectural Boundaries**: Clarifies in documentation and code that `notification-service` is an asynchronous event consumer, not a public HTTP API.
- **Fail-Fast Security**: Prevents edge exposure of worker internals or unintended probing.

### Neutral / Negative

- None. `notification-service` never exposed business HTTP endpoints; no client contracts or features are affected.
