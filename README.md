<div align="center">

# ⚡ FieldForge

### Real-Time Enterprise Field Service Marketplace & Microservices Platform

[![Node.js](https://img.shields.io/badge/Node.js-v24_LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-v12-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React 19](https://img.shields.io/badge/React-v19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React_Native-Expo-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![MySQL 8](https://img.shields.io/badge/MySQL-8.4_InnoDB-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-8.0_GEOSEARCH-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-4.1_Topic-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-EKS_GitOps-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](./LICENSE)

<p align="center">
  <b>High-throughput, event-driven SaaS marketplace connecting enterprise buyers with certified field service technicians for mission-critical hardware, telecom, and networking maintenance.</b>
</p>

[Architecture](#-system-architecture) • [Microservices](#-microservices-ecosystem) • [Database Schema](#-database--relational-modeling) • [Quickstart](#-quickstart) • [Agent Directives](#-agentic-context-engineering)

</div>

---

## 📖 Overview & Target Capabilities

FieldForge is an early scaffold for an enterprise field service management and autonomous dispatch platform. The SRS targets end-to-end management of the field workforce lifecycle; the items below are design goals, not claims of completed behavior. See [implementation status](./.agent/context/project_status.md) and [known issues](./docs/ISSUES.md).

- **⚡ Low-Latency Dispatch Matching:** Redis `GEOSEARCH` proximity matching paired with multi-parameter contractor scoring (certifications, ratings, hourly rate, distance).
- **📋 Deterministic Finite State Machine (FSM):** Strict, ACID-backed work order state progression with zero race conditions.
- **📍 GPS Geofence Check-In & Proof of Work:** Native mobile verification requiring no more than 200 metres of site proximity, photo deliverables, checklist milestone verification, and SHA-256 signed client approvals.
- **💳 Guaranteed Escrow Settlement:** Automated pre-authorization, fund locking on assignment, and 72-hour auto-disbursement with PDF invoice generation.
- **📊 99.9% SLI/SLO Reliability Target:** Planned OpenTelemetry tracing, Prometheus metrics, Pino structured logging, and distributed `x-correlation-id` propagation.

---

## 🏗️ System Architecture

### High-Level System Topology

```mermaid
graph TD
    %% Clients
    subgraph Clients[" 🌐 Client Tier "]
        Buyer["🏢 Web Buyer Portal<br/>(React 19 + Redux Toolkit + Vite)"]
        Tech["📱 Mobile Tech App<br/>(React Native / Expo + Offline Queue)"]
    end

    %% Edge Gateway
    subgraph Edge[" 🛡️ Edge & Gateway Tier "]
        APIGW["⚡ API Gateway (:3000)<br/>• Reverse Proxy & Routing<br/>• JWT Authentication & RBAC<br/>• Rate Limiting<br/>• x-correlation-id Injection"]
    end

    %% Core Services
    subgraph Services[" 🚀 Core Domain Microservices Tier (NestJS) "]
        AuthSvc["🔐 Auth & Identity Service (:3001)<br/>• Identity, Login & Token Refresh<br/>• Contractor Vetting & Certifications"]
        WOSvc["📋 Work Order Service (:3002)<br/>• Finite State Machine (FSM)<br/>• SOW & SLA Watcher<br/>• Deliverable Proofs (S3 presigned)"]
        DispSvc["📍 Dispatch & Matching Service (:3003)<br/>• Geospatial Matching (GEOSEARCH)<br/>• Technician Scoring & Auto-Routing<br/>• Contractor Bidding"]
        BillSvc["💳 Billing & Escrow Service (:3004)<br/>• Pre-Auth & Escrow Locking<br/>• Payout Ledger & PDF Invoicing<br/>• Payment Integrations"]
        NotifSvc["🔔 Notification Service (:3005)<br/>• Push Notifications (FCM / APNS)<br/>• SMS Alerts (Twilio)<br/>• Email Receipts (AWS SES)"]
    end

    %% Messaging & Event Bus
    subgraph EventBus[" 📬 Asynchronous Event-Driven Messaging "]
        RabbitMQ{{"RabbitMQ Topic Exchange<br/>(fieldforge.events.topic)"}}
    end

    %% Persistence
    subgraph Storage[" 💾 Data & Caching Tier "]
        MySQL[("🗄️ MySQL 8 (InnoDB)<br/>• Users & Profiles<br/>• Work Orders & Bids<br/>• Deliverables & Escrow")]
        Redis[("⚡ Redis 7+<br/>• Geospatial Index (GEOSEARCH)<br/>• Token Cache & Rate Limiting")]
    end

    %% Observability
    subgraph APM[" 📊 APM & Observability "]
        Prometheus["📈 Prometheus (Metrics)"]
        Jaeger["🔍 Jaeger (Tracing)"]
        Grafana["📊 Grafana (Dashboards)"]
    end

    %% Client -> Edge
    Buyer -->|HTTPS / REST| APIGW
    Tech -->|HTTPS / REST| APIGW

    %% Edge -> Services
    APIGW --> AuthSvc
    APIGW --> WOSvc
    APIGW --> DispSvc
    APIGW --> BillSvc

    %% Service -> Databases
    AuthSvc --> MySQL
    WOSvc --> MySQL
    BillSvc --> MySQL
    DispSvc --> Redis

    %% Async Events
    WOSvc -.->|Publishes: work_order.lifecycle.*| RabbitMQ
    DispSvc -.->|Publishes: dispatch.*, tech.bidding.*| RabbitMQ
    BillSvc -.->|Publishes: billing.escrow.*, billing.payout.*| RabbitMQ

    RabbitMQ -.->|Consumes events| DispSvc
    RabbitMQ -.->|Consumes events| BillSvc
    RabbitMQ -.->|Consumes events| NotifSvc

    %% Observability
    Services -.->|Pino JSON Logs / OTEL Metrics| Prometheus
    Services -.->|x-correlation-id Traces| Jaeger
    Prometheus --> Grafana
```

---

### 🔄 End-to-End Work Order Lifecycle & Event Flow

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as 🏢 Buyer (Portal)
    participant GW as ⚡ API Gateway
    participant WO as 📋 Work Order Svc
    participant Bill as 💳 Billing Svc
    participant MQ as 📬 RabbitMQ
    participant Disp as 📍 Dispatch Svc
    actor Tech as 📱 Tech (Mobile)

    %% Step 1: Draft & Publish
    Buyer->>GW: POST /work-orders (Create SOW Draft)
    GW->>WO: Create Draft Work Order
    Buyer->>GW: POST /work-orders/{id}/publish
    GW->>WO: Trigger Publish FSM Transition
    WO->>Bill: Pre-authorize Escrow Amount
    Bill-->>WO: Escrow Pre-authorized & Locked
    WO->>MQ: Publish "work_order.lifecycle.published"

    %% Step 2: Dispatch & Match
    MQ->>Disp: Consume published event
    Disp->>Disp: Redis GEOSEARCH nearby active techs
    Disp->>Tech: Dispatch Opportunity Notification
    Tech->>GW: POST /bids (Submit Bid)
    GW->>Disp: Record Bid & Score Contractor

    %% Step 3: Assignment & On-Site Execution
    Disp->>WO: Assign Selected Tech
    WO->>MQ: Publish "work_order.lifecycle.assigned"
    Tech->>GW: PATCH /status -> EN_ROUTE
    Tech->>GW: POST /check-in (GPS Coordinates ≤ 100m)
    GW->>WO: Verify Geofence & Set Status: ON_SITE
    Tech->>GW: POST /deliverables (Photos, Checklists, Signatures)
    Tech->>GW: PATCH /status -> COMPLETED

    %% Step 4: Approval & Settlement
    Buyer->>GW: POST /work-orders/{id}/approve (Sign-Off)
    GW->>WO: Status -> APPROVED
    WO->>MQ: Publish "work_order.lifecycle.approved"
    MQ->>Bill: Release Escrow & Trigger Tech Payout
    Bill->>Bill: Disburse Funds & Generate PDF Invoice
    Bill->>MQ: Publish "billing.payout.disbursed"
```

---

### 🗄️ Database Entity-Relationship (ER) Model

```mermaid
erDiagram
    USERS ||--o| BUYER_PROFILES : "extends"
    USERS ||--o| TECHNICIAN_PROFILES : "extends"
    BUYER_PROFILES ||--o{ WORK_ORDERS : "creates"
    TECHNICIAN_PROFILES ||--o{ WORK_ORDERS : "assigned_to"
    WORK_ORDERS ||--o{ WORK_ORDER_BIDS : "receives"
    WORK_ORDERS ||--o{ WORK_ORDER_DELIVERABLES : "contains"
    WORK_ORDERS ||--|| ESCROW_ACCOUNTS : "secured_by"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        enum role "BUYER | TECHNICIAN | ADMIN"
        timestamp created_at
    }

    BUYER_PROFILES {
        uuid id PK
        uuid user_id FK
        string company_name
        string tax_id
        string billing_address
    }

    TECHNICIAN_PROFILES {
        uuid id PK
        uuid user_id FK
        string full_name
        json certifications
        decimal rating
        decimal hourly_rate
        decimal current_lat
        decimal current_lng
    }

    WORK_ORDERS {
        uuid id PK
        uuid buyer_id FK
        uuid assigned_technician_id FK
        string title
        text scope_of_work
        enum status "DRAFT|PUBLISHED|ASSIGNED|EN_ROUTE|ON_SITE|COMPLETED|APPROVED|CANCELLED|DISPUTED"
        decimal budget
        decimal site_lat
        decimal site_lng
        timestamp scheduled_start_time
    }

    WORK_ORDER_BIDS {
        uuid id PK
        uuid work_order_id FK
        uuid technician_id FK
        decimal bid_amount
        enum bid_status "PENDING | ACCEPTED | REJECTED"
    }

    WORK_ORDER_DELIVERABLES {
        uuid id PK
        uuid work_order_id FK
        string media_s3_url
        string checklist_data
        string client_signature_hash
    }

    ESCROW_ACCOUNTS {
        uuid id PK
        uuid work_order_id FK
        decimal amount
        enum status "HELD | RELEASED | REFUNDED | DISPUTED"
        string payment_intent_id
    }
```

---

## 🚀 Microservices Ecosystem

| Microservice                    |  Port  | Domain Responsibilities                                                                   | Primary Data Store                    |
| :------------------------------ | :----: | :---------------------------------------------------------------------------------------- | :------------------------------------ |
| **`api-gateway`**               | `3000` | Edge reverse proxy, JWT validation, rate limiting, correlation ID injection               | In-Memory / Redis                     |
| **`auth-service`**              | `3001` | User onboarding, RBAC tokens, compliance vetting (OSHA 10, Cisco CCNA, Background Checks) | MySQL (`users`, `profiles`)           |
| **`work-order-service`**        | `3002` | Work order lifecycle FSM, SOW templates, S3 deliverable uploads, SLA timeout watchers     | MySQL (`work_orders`, `deliverables`) |
| **`dispatch-matching-service`** | `3003` | Geospatial contractor matching (`GEOSEARCH`), bidding negotiation, auto-routing rules     | Redis 7 & RabbitMQ                    |
| **`billing-service`**           | `3004` | Escrow pre-authorizations, fund capture, technician payouts, automated PDF invoicing      | MySQL (`escrow_accounts`)             |
| **`notification-service`**      | `3005` | Push notifications (FCM/APNS), SMS dispatch alerts (Twilio), Email receipts (SES)         | RabbitMQ Topic Consumer               |

---

## 📦 Monorepo Package Architecture

```mermaid
graph LR
    subgraph Apps[" 📱 Apps Tier "]
        APIGW["apps/api-gateway"]
        AuthSvc["apps/auth-service"]
        WOSvc["apps/work-order-service"]
        DispSvc["apps/dispatch-matching-service"]
        BillSvc["apps/billing-service"]
        NotifSvc["apps/notification-service"]
        WebPortal["apps/web-buyer-portal"]
        MobileApp["apps/mobile-tech-app"]
    end

    subgraph Packages[" 📦 Shared Packages Tier "]
        Contracts["@fieldforge/contracts<br/>(DTOs, Zod Validators, Event Interfaces)"]
        Database["@fieldforge/database<br/>(Drizzle ORM, MySQL Schemas, Seeds)"]
        Common["@fieldforge/common<br/>(Pino Logger, Interceptors, Probes)"]
        UI["@fieldforge/ui<br/>(Tailwind React Primitives)"]
    end

    Apps --> Contracts
    Apps --> Common
    AuthSvc --> Database
    WOSvc --> Database
    BillSvc --> Database
    WebPortal --> UI
```

```
packages/
├── contracts/       # Shared DTOs, Zod runtime validators, Enums & RabbitMQ event interfaces
├── database/        # MySQL 8.0 Drizzle ORM typed schema definitions, seeds & migrations
├── common/          # Structured Pino logger, OpenTelemetry APM interceptors, /healthz probes
├── ui/              # Shared Tailwind CSS React design system (Buttons, Modals, StatusBadges)
├── tsconfig/        # Standardized TypeScript compiler configurations (Base, NestJS, React, React Native)
└── eslint-config/   # Unified ESLint & Prettier code quality standards
```

---

## 🔄 Work Order Finite State Machine (FSM)

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Buyer drafts Scope of Work
    DRAFT --> PUBLISHED: Pre-auth Escrow & Publish
    PUBLISHED --> ASSIGNED: Tech Selected / Auto-Dispatched
    ASSIGNED --> EN_ROUTE: Tech Departs for Site
    EN_ROUTE --> ON_SITE: GPS Geofence Check-in Verified (≤200m)
    ON_SITE --> COMPLETED: Deliverables & Signature Captured
    COMPLETED --> APPROVED: Buyer Sign-Off (or 72h Auto-Approval)
    APPROVED --> PAID: Escrow Released to Tech Payout
    PAID --> [*]

    PUBLISHED --> CANCELLED: Buyer Cancels
    ASSIGNED --> DISPUTED: SLA Breach / Dispute Raised
    DISPUTED --> APPROVED: Dispute Resolved
    DISPUTED --> CANCELLED: Job Nullified
```

---

## 📊 Service Level Objectives (SLOs) & Reliability Matrix

| Service Level Metric        | Target Objective (SLO) | Indicator Definition (SLI)                              | Max Error Budget                          |
| :-------------------------- | :--------------------: | :------------------------------------------------------ | :---------------------------------------- |
| **Platform Availability**   |   **at least 99.9%**   | Successful non-5xx requests / total requests            | 43.2 minutes / month                      |
| **Read Latency (p95)**      |   **$< 100	ext{ms}$**   | Duration of REST read endpoints                         | $95\%$ requests under $100\text{ms}$      |
| **Write Latency (p95)**     |   **$< 200	ext{ms}$**   | Duration of relational transaction endpoints            | $95\%$ writes under $200\text{ms}$        |
| **Dispatch Queue Latency**  |  **$\le 1.5	ext{s}$**   | Time from work order publication to push notification   | $99\%$ notifications in $\le 1.5\text{s}$ |
| **Redis GEOSEARCH Latency** |   **$< 120	ext{ms}$**   | Proximity lookup across 50,000+ cached technician nodes | $p95 < 120\text{ms}$                      |

---

## 🛠️ Quickstart & Local Development

### 1. Prerequisites

- **Node.js** $\ge 24.0.0$
- **pnpm** $\ge 11.0.0$ (`npm install -g pnpm@latest`)
- **Docker Desktop** with Docker Compose enabled

### 2. Environment Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/fieldforge.git
cd fieldforge

# 2. Create a local environment file and run the reproducible bootstrap
cp .env.example .env
pnpm setup

# 3. Run database migrations and seed mock data
pnpm db:migrate
pnpm db:seed

# 4. Launch all microservices and frontend portals concurrently
pnpm dev
```

### 3. Service Endpoints

- **Enterprise Buyer Portal:** `http://localhost:5173`
- **API Gateway (Public REST API):** `http://localhost:3000/api/v1`
- **RabbitMQ Management UI:** `http://localhost:15672` (credentials from `.env`)
- **Jaeger Tracing Console:** `http://localhost:16686`
- **Grafana:** `http://localhost:3009` (credentials from `.env`)

---

## 🤖 Agentic Context Engineering

All coding agents start with [`AGENTS.md`](./AGENTS.md). Supporting guardrails are codified under `.agent/` and `.cursorrules`:

- **`.agent/rules/`**: Modular rules enforcing microservices isolation, Drizzle ORM transactions, RabbitMQ topic routing, and React 19 / React Native best practices.
- **`.agent/context/`**: Living specifications for domain entities, OpenAPI catalogues, and SLI/SLO definitions.
- **`.agent/memory/ADRs/`**: Architecture Decision Records capturing technical rationale for key design choices.
- **`.agent/workflows/`**: Guarded helper scripts for scaffolding, quality checks, and explicitly labelled SLO simulation.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
