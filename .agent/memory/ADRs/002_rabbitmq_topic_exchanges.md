# 📝 ADR 002: RabbitMQ Topic Exchanges for Event-Driven Microservices

| Status | Date | Decision Maker |
| :--- | :--- | :--- |
| **ACCEPTED** | August 2026 | Satya Ranjan Debsharma |

---

## 1. Context
State transitions in work orders trigger multiple asynchronous reactions across independent services (billing holds, push notifications, dispatch updates).

## 2. Decision
Implement **RabbitMQ 3.13** using a central Topic Exchange (`fieldforge.events.topic`) with routing keys structured as `<domain>.<entity>.<action>`.

## 3. Consequences
- **Positive:** Complete decoupling of producer and consumer microservices; resilient message delivery via DLQs.
- **Negative:** Requires message idempotency checks across all consumers.
