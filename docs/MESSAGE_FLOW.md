# FieldForge — Event Backbone & Message Flow Architecture

> **Comprehensive Event-Driven Architecture, AMQP Topology, and Lifecycle Message Flows**  
> Companion to [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)  
> Standard: [`RULE-EVENT-03`](file:///home/satya/development/FieldForge/.agent/rules/03_event_rules.md) · Implementation: [`@fieldforge/messaging`](file:///home/satya/development/FieldForge/packages/messaging)

---

## 1. Executive Summary

FieldForge employs an asynchronous, event-driven choreography for all cross-service state mutations and notifications. While client requests enter via the synchronous API Gateway (`:8000`), downstream microservice effects—such as dispatching matching queries, locking escrow funds, broadcasting SMS/Push notifications, and disbursing contractor payouts—are decoupled across a RabbitMQ topic exchange infrastructure backed by an atomic Redis idempotency deduplication layer.

```
                  ┌─────────────────────────────────┐
                  │      HTTP Ingress (Gateway)     │
                  └────────────────┬────────────────┘
                                   │
                                   ▼
                  ┌─────────────────────────────────┐
                  │    Producer Microservice        │
                  │ (e.g. apps/work-order-service)  │
                  └────────────────┬────────────────┘
                                   │ Confirmed Publish
                                   ▼
    ┌──────────────────────────────────────────────────────────────┐
    │          RabbitMQ Topic Exchange: fieldforge.events.topic    │
    └──────────────┬───────────────────────────────┬───────────────┘
                   │                               │
       Routing Key │                   Routing Key │
                   ▼                               ▼
    ┌──────────────────────────────┐ ┌─────────────────────────────┐
    │ fieldforge.dispatch.work-ord │ │ fieldforge.notifications... │
    └──────────────┬───────────────┘ └─────────────┬───────────────┘
                   │                               │
                   ▼                               ▼
    ┌──────────────────────────────┐ ┌─────────────────────────────┐
    │   IdempotentConsumer         │ │    IdempotentConsumer       │
    │   (Redis 7d SETNX Dedupe)    │ │    (Redis 7d SETNX Dedupe)  │
    └──────────────┬───────────────┘ └─────────────┬───────────────┘
                   │                               │
                   ▼                               ▼
    ┌──────────────────────────────┐ ┌─────────────────────────────┐
    │  apps/dispatch-matching-svc  │ │  apps/notification-service  │
    └──────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. AMQP Topology & Infrastructure (`@fieldforge/messaging`)

The core messaging infrastructure is encapsulated within [`packages/messaging`](file:///home/satya/development/FieldForge/packages/messaging), providing consistent publisher-confirms, persistent delivery mode, standardized headers, and consumer wrappers across all NestJS microservices.

### Exchanges & Queues

| Component                      | Identifier                             | Type             | Durability | Purpose                                                               |
| :----------------------------- | :------------------------------------- | :--------------- | :--------- | :-------------------------------------------------------------------- |
| **Central Topic Exchange**     | `fieldforge.events.topic`              | `topic`          | Durable    | Central fanout exchange routing all domain events.                    |
| **Dead-Letter Exchange (DLX)** | `fieldforge.events.dlx`                | `direct`         | Durable    | Traps poison pills, malformed messages, and exhausted retries.        |
| **Dead-Letter Queue (DLQ)**    | `fieldforge.events.dlq`                | `direct`         | Durable    | Storage queue bound to DLX for forensic inspection and manual replay. |
| **Dispatch Queue**             | `fieldforge.dispatch.work-orders`      | `direct` / bound | Durable    | Receives publication events for geospatial matching.                  |
| **Notifications Queue**        | `fieldforge.notifications.work-orders` | `direct` / bound | Durable    | Receives lifecycle events for SMS and Push alerts.                    |
| **Billing Queue**              | `fieldforge.billing.work-orders`       | `direct` / bound | Durable    | Receives lifecycle events for escrow pre-auth, lock, and release.     |

### Routing Keys & Consumer Subscriptions

| Routing Key                      | Event Type                       | Publisher Service           | Subscribed Queue(s)                                                          | Receiving Microservice(s)                              |
| :------------------------------- | :------------------------------- | :-------------------------- | :--------------------------------------------------------------------------- | :----------------------------------------------------- |
| `work_order.lifecycle.published` | `work_order.lifecycle.published` | `work-order-service`        | `fieldforge.dispatch.work-orders`<br/>`fieldforge.notifications.work-orders` | `dispatch-matching-service`<br/>`notification-service` |
| `work_order.lifecycle.assigned`  | `work_order.lifecycle.assigned`  | `work-order-service`        | `fieldforge.notifications.work-orders`<br/>`fieldforge.billing.work-orders`  | `notification-service`<br/>`billing-service`           |
| `work_order.lifecycle.approved`  | `work_order.lifecycle.approved`  | `work-order-service`        | `fieldforge.billing.work-orders`                                             | `billing-service`                                      |
| `work_order.lifecycle.paid`      | `work_order.lifecycle.paid`      | `work-order-service`        | `fieldforge.notifications.work-orders`                                       | `notification-service`                                 |
| `tech.bidding.submitted`         | `tech.bidding.submitted`         | `dispatch-matching-service` | `fieldforge.notifications.work-orders`                                       | `notification-service`                                 |
| `billing.escrow.funded`          | `billing.escrow.funded`          | `billing-service`           | `fieldforge.work-orders.billing`                                             | `work-order-service`                                   |
| `billing.payout.disbursed`       | `billing.payout.disbursed`       | `billing-service`           | `fieldforge.work-orders.billing`                                             | `work-order-service`                                   |

---

## 3. Standard Event Envelope & AMQP Headers

Every message published to `fieldforge.events.topic` adheres to the strict contract defined in [`@fieldforge/contracts`](file:///home/satya/development/FieldForge/packages/contracts/src/events/envelope.ts).

### JSON Envelope Payload Structure

```json
{
  "eventId": "e9b271d4-839e-4c7b-9721-cb9ad0419280",
  "eventType": "work_order.lifecycle.published",
  "occurredAt": "2026-09-05T01:00:00.000Z",
  "correlationId": "corr-f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "payload": {
    "workOrderId": "wo-12345",
    "buyerId": "buyer-987",
    "title": "Emergency POS Terminal Replacement",
    "maxBudgetMinor": 45000,
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

### AMQP Message Properties & Headers

| Header / Property  | Value / Format            | Purpose                                                      |
| :----------------- | :------------------------ | :----------------------------------------------------------- |
| `deliveryMode`     | `2` (Persistent)          | Writes message to disk on broker to survive broker restarts. |
| `contentType`      | `application/json`        | Guarantees UTF-8 JSON serialization.                         |
| `messageId`        | `eventId` (UUID v4)       | AMQP native identifier.                                      |
| `correlationId`    | `correlationId` (UUID v4) | AMQP native correlation ID for distributed tracing.          |
| `x-correlation-id` | `correlationId` string    | Explicit transport header matching HTTP ingress.             |
| `x-event-id`       | `eventId` string          | Key used for Redis atomic idempotency check.                 |
| `x-event-type`     | `eventType` string        | Strict event enumeration value.                              |
| `x-retry-count`    | Integer (`0` to `3`)      | Counter incremented on delayed retry redeliveries.           |
| `x-death-reason`   | Error string              | Injected only when routing to DLX/DLQ.                       |

---

## 4. End-to-End Domain Message Flows

### Flow 1: Work Order Publication & Dispatch Fanout

Triggered when a buyer transitions a work order from `DRAFT` to `PUBLISHED` via `POST /api/v1/work-orders/:id/publish`.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as 🏢 Enterprise Buyer
    participant APIGW as ⚡ API Gateway (:8000)
    participant WOSvc as 📋 work-order-service (:8002)
    participant DB as 🗄️ MySQL (work_orders)
    participant MQ as 📬 RabbitMQ (fieldforge.events.topic)
    participant DispSvc as 📍 dispatch-matching-service (:8003)
    participant NotifSvc as 🔔 notification-service (:8005)

    Buyer->>APIGW: POST /api/v1/work-orders/:id/publish
    APIGW->>WOSvc: Proxy with x-correlation-id & verified token

    rect rgb(240, 249, 255)
    Note over WOSvc, DB: Database Transaction
    WOSvc->>DB: SELECT ... FOR UPDATE (Check DRAFT status)
    WOSvc->>DB: UPDATE work_orders SET status = 'PUBLISHED'
    WOSvc->>DB: INSERT INTO work_order_status_history
    end

    WOSvc->>MQ: EventPublisher.publish(work_order.lifecycle.published)
    MQ-->>WOSvc: Confirm ACK
    WOSvc-->>APIGW: 200 OK (Work order published)
    APIGW-->>Buyer: 200 OK

    par Fanout to Dispatch Queue
        MQ->>DispSvc: Deliver to fieldforge.dispatch.work-orders
        activate DispSvc
        Note over DispSvc: Redis SETNX check (ff:idemp:<eventId>)
        DispSvc->>DispSvc: Trigger Redis GEOSEARCH for certified techs
        DispSvc-->>MQ: ACK message
        deactivate DispSvc
    and Fanout to Notifications Queue
        MQ->>NotifSvc: Deliver to fieldforge.notifications.work-orders
        activate NotifSvc
        Note over NotifSvc: Redis SETNX check (ff:idemp:<eventId>)
        NotifSvc->>NotifSvc: Dispatch SMS Alert (Twilio transport)
        NotifSvc-->>MQ: ACK message
        deactivate NotifSvc
    end
```

---

### Flow 2: Bid Acceptance & Work Order Assignment

Triggered when a contractor's bid is accepted, assigning the technician and triggering fund lock and push alerts.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as 🏢 Enterprise Buyer
    participant WOSvc as 📋 work-order-service (:8002)
    participant MQ as 📬 RabbitMQ (fieldforge.events.topic)
    participant BillSvc as 💳 billing-service (:8004)
    participant NotifSvc as 🔔 notification-service (:8005)
    actor Tech as 📱 Field Technician

    Buyer->>WOSvc: POST /api/v1/work-orders/:id/transition (ASSIGNED)
    Note over WOSvc: Transaction commits row status = 'ASSIGNED'
    WOSvc->>MQ: EventPublisher.publish(work_order.lifecycle.assigned)
    MQ-->>WOSvc: Confirm ACK

    par Lock Escrow Funds
        MQ->>BillSvc: Deliver to fieldforge.billing.work-orders
        activate BillSvc
        Note over BillSvc: Idempotency acquire: ff:idemp:<eventId>
        BillSvc->>BillSvc: EscrowService.lockFunds(workOrderId, techId, amount)
        BillSvc-->>MQ: ACK message
        deactivate BillSvc
    and Notify Assigned Technician
        MQ->>NotifSvc: Deliver to fieldforge.notifications.work-orders
        activate NotifSvc
        Note over NotifSvc: Idempotency acquire: ff:idemp:<eventId>
        NotifSvc->>Tech: Push Alert via FCM ("Job Assigned: Proceed to site")
        NotifSvc-->>MQ: ACK message
        deactivate NotifSvc
    end
```

---

### Flow 3: Buyer Sign-Off, Approval & Escrow Release

Triggered when a buyer reviews deliverables and approves the work order (`COMPLETED` → `APPROVED`).

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as 🏢 Enterprise Buyer
    participant WOSvc as 📋 work-order-service (:8002)
    participant MQ as 📬 RabbitMQ (fieldforge.events.topic)
    participant BillSvc as 💳 billing-service (:8004)
    participant DB_Bill as 🗄️ MySQL (escrow_accounts)

    Buyer->>WOSvc: POST /api/v1/work-orders/:id/transition (APPROVED)
    Note over WOSvc: Transaction commits status = 'APPROVED'
    WOSvc->>MQ: EventPublisher.publish(work_order.lifecycle.approved)
    MQ-->>WOSvc: Confirm ACK

    MQ->>BillSvc: Deliver to fieldforge.billing.work-orders
    activate BillSvc
    Note over BillSvc: Idempotency acquire: ff:idemp:<eventId>

    rect rgb(240, 253, 244)
    Note over BillSvc, DB_Bill: Escrow Release Transaction
    BillSvc->>DB_Bill: SELECT ... FOR UPDATE FROM escrow_accounts WHERE status = 'HELD'
    BillSvc->>DB_Bill: UPDATE escrow_accounts SET status = 'RELEASED', released_at = NOW()
    BillSvc->>DB_Bill: Credit technician ledger balance
    end

    BillSvc-->>MQ: ACK message
    deactivate BillSvc
```

---

## 5. Resiliency & Failure Topologies

### A. Idempotency & Duplicate Delivery Suppression

Network blips, broker failovers, or unacknowledged socket disconnects can cause AMQP brokers to redeliver messages (`redelivered: true`). `IdempotentConsumer` ensures domain logic is executed **exactly once**.

```mermaid
sequenceDiagram
    autonumber
    participant MQ as 📬 RabbitMQ Queue
    participant Consumer as ⚙️ IdempotentConsumer
    participant Redis as ⚡ Redis (Idempotency Store)
    participant Handler as 🧩 Domain Handler

    MQ->>Consumer: Deliver Message (eventId: "evt-101")
    Consumer->>Redis: SET ff:idemp:evt-101 in_flight NX EX 604800
    alt First Delivery (Key Acquired)
        Redis-->>Consumer: OK (1)
        Consumer->>Handler: Execute handleEvent(envelope, logger)
        Handler-->>Consumer: Success
        Consumer->>Redis: SET ff:idemp:evt-101 completed EX 604800
        Consumer->>MQ: channel.ack(message)
    else Redelivery / Duplicate (Key Already Exists)
        Redis-->>Consumer: NULL (0)
        Note over Consumer: Duplicate detected! Do not execute handler.
        Consumer->>MQ: channel.ack(message)
        Note over Consumer, MQ: Safely ACKed and dropped
    end
```

---

### B. Bounded Retries with Exponential Backoff

When transient network or database errors occur in consumer handlers, the consumer captures the failure, applies an exponential delay, and re-queues the message with an incremented `x-retry-count`.

```mermaid
sequenceDiagram
    autonumber
    participant MQ as 📬 RabbitMQ
    participant Consumer as ⚙️ IdempotentConsumer
    participant Handler as 🧩 Domain Handler

    MQ->>Consumer: Deliver Message (x-retry-count: 0)
    Consumer->>Handler: handleEvent(...)
    Handler-->>Consumer: Throw Error ("Database lock timeout")

    Note over Consumer: Calculate backoff delay: 1000ms * 2^0 = 1000ms (1s)
    Consumer->>MQ: channel.publish(..., headers: { 'x-retry-count': 1 })
    Consumer->>MQ: channel.ack(originalMessage)

    Note over MQ: After 1s delay
    MQ->>Consumer: Deliver Message (x-retry-count: 1)
    Consumer->>Handler: handleEvent(...)
    Handler-->>Consumer: Success
    Consumer->>MQ: channel.ack(message)
```

---

### C. Poison Pill & Retry Exhaustion → Dead-Letter Exchange (DLX)

If an unparseable JSON payload arrives, or if a message fails consistently through all 3 retries, `IdempotentConsumer` permanently marks the event as failed in Redis and routes the raw message directly to `fieldforge.events.dlx`.

```mermaid
sequenceDiagram
    autonumber
    participant MQ as 📬 RabbitMQ
    participant Consumer as ⚙️ IdempotentConsumer
    participant Redis as ⚡ Redis
    participant DLX as ☠️ DLX (fieldforge.events.dlx)
    participant DLQ as 📦 DLQ (fieldforge.events.dlq)

    MQ->>Consumer: Deliver Message (x-retry-count: 3)
    Consumer->>Consumer: Detect MAX_RETRY_COUNT (3) exceeded
    Consumer->>Redis: markFailed("evt-999", "max_retries_exceeded")

    Consumer->>DLX: publish to DLX (routingKey: "queue.name.dlq", headers: { 'x-death-reason': "Persistent error" })
    DLX->>DLQ: Route to dead-letter storage queue
    Consumer->>MQ: channel.ack(message)
    Note over Consumer, MQ: Message removed from active hot-path queue
```

---

## 6. Distributed Tracing & Correlation ID Propagation

In accordance with [`RULE-OBS`](file:///home/satya/development/FieldForge/.agent/rules/01_architecture_rules.md), request context is preserved across HTTP and AMQP boundaries:

1. **HTTP Ingress**: The API Gateway (`apps/api-gateway`) reads or generates `x-correlation-id` and passes it downstream.
2. **Event Publishing**: `EventPublisher` copies `correlationId` into the JSON envelope and into the AMQP transport header `x-correlation-id`.
3. **Event Consumption**: `IdempotentConsumer` extracts `correlationId` from the headers/envelope and initializes a scoped child logger:
   ```typescript
   const childLogger = this.logger.child({
     correlationId,
     eventId: envelope.eventId,
     eventType: envelope.eventType,
     queue
   });
   ```
4. **Log Continuity**: All log lines produced inside the domain handler include the same `correlationId`, allowing Jaeger and Loki to trace the entire transaction from the initial user click in the Buyer Portal to the final SMS alert sent to the contractor.
