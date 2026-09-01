# 🏛️ Architecture & Microservices Directives

> **Rule ID:** `RULE-ARCH-01` • **Priority:** `CRITICAL`

---

### 1. Bounded Contexts & Decoupling

- Microservices must never directly query another microservice's database.
- Data exchange between services must strictly utilize:
  - **Synchronous Reads:** API Gateway edge routing with Bearer JWT propagation.
  - **Asynchronous Mutations:** RabbitMQ topic events on `fieldforge.events.topic`.

### 2. Dependency Injection & Clean Architecture

- Follow SOLID principles with NestJS dependency injection.
- Separate controllers, services, repositories, and event publishers into distinct modules.

### 3. Type Contracts Single Source of Truth

- All request/response DTOs, Zod validators, and event interfaces must be imported from `@fieldforge/contracts`.
