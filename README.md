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

FieldForge is an enterprise field service marketplace and autonomous dispatch platform connecting businesses with certified technicians.

- **⚡ Low-Latency Dispatch Matching:** Redis `GEOSEARCH` proximity matching paired with multi-parameter contractor scoring (certifications, ratings, hourly rate, distance).
- **📋 Deterministic Finite State Machine (FSM):** Strict, ACID-backed work order state progression with zero race conditions.
- **📍 GPS Geofence Check-In & Proof of Work:** Native mobile verification requiring $\le 100\text{m}$ of site proximity, photo deliverables, checklist milestone verification, and SHA-256 signed client approvals.
- **💳 Guaranteed Escrow Settlement:** Automated pre-authorization, fund locking on assignment, and 72-hour auto-disbursement with PDF invoice generation.
- **📊 99.9% SLI/SLO Reliability Target:** Planned OpenTelemetry tracing, Prometheus metrics, Pino structured logging, and distributed `x-correlation-id` propagation.

---

## 🏗️ System Architecture

### High-Level System Topology

```mermaid
flowchart TD
    %% Global Styling Classes
    classDef clientStyle fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef gatewayStyle fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef serviceStyle fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef brokerStyle fill:#fffbeb,stroke:#d97706,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef dbStyle fill:#f1f5f9,stroke:#475569,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef extStyle fill:#fdf2f8,stroke:#db2777,stroke-width:2px,color:#0f172a,font-weight:600;
    classDef apmStyle fill:#fef2f2,stroke:#dc2626,stroke-width:2px,color:#0f172a,font-weight:600;

    subgraph Clients[" 🌐 Client Applications Tier "]
        Buyer["🏢 Enterprise Buyer Portal<br/><b>React 19 + Redux Toolkit</b><br/><i>Vite Dashboard (:5173)</i>"]:::clientStyle
        Tech["📱 Field Tech Mobile App<br/><b>React Native + Expo</b><br/><i>Offline-First Queue & GPS</i>"]:::clientStyle
    end

    subgraph Edge[" 🛡️ Edge Security & Gateway Tier "]
        APIGW["⚡ API Gateway Microservice (:5000)<br/><b>Reverse Proxy · JWT Authentication · Rate Limiting</b><br/><i>x-correlation-id propagation</i>"]:::gatewayStyle
    end

    subgraph Services[" 🚀 Core Domain Microservices Cluster (NestJS) "]
        direction TB
        AuthSvc["🔐 Auth & Identity (:5001)<br/><i>RBAC · Identity · Vetting</i>"]:::serviceStyle
        WOSvc["📋 Work Order FSM (:5002)<br/><i>State Machine · SOW · SLA</i>"]:::serviceStyle
        DispSvc["📍 Dispatch & Matching (:5003)<br/><i>Geo Routing · Bidding</i>"]:::serviceStyle
        BillSvc["💳 Billing & Escrow (:5004)<br/><i>Escrow · Ledger · Invoicing</i>"]:::serviceStyle
        NotifSvc["🔔 Notification Service (:5005)<br/><i>Event Consumer · Push/SMS</i>"]:::serviceStyle
    end

    subgraph Messaging[" 📬 Event-Driven Message Broker "]
        RabbitMQ{{"📬 RabbitMQ Topic Exchange<br/><b>fieldforge.events.topic</b>"}}:::brokerStyle
    end

    subgraph Storage[" 💾 Persistence & In-Memory Geospatial Tier "]
        MySQL[("🗄️ MySQL 8 (InnoDB)<br/><b>Drizzle ORM · ACID</b><br/><i>Users, Work Orders, Escrow</i>")]:::dbStyle
        Redis[("⚡ Redis 7+ Cache<br/><b>GEOSEARCH & In-Memory</b><br/><i>Spatial Index & Rate Limits</i>")]:::dbStyle
    end

    subgraph External[" ☁️ Third-Party Integrations & Cloud Services "]
        S3["🪣 AWS S3<br/><i>Presigned Deliverables</i>"]:::extStyle
        Stripe["💳 Stripe API<br/><i>Payment Intents</i>"]:::extStyle
        Twilio["📱 Twilio / AWS SES<br/><i>SMS Alerts & Email</i>"]:::extStyle
        FCM["🔔 Firebase FCM<br/><i>Mobile Push Alerts</i>"]:::extStyle
    end

    subgraph Observability[" 📊 APM, Metrics & Distributed Tracing "]
        OTEL["📡 OpenTelemetry & Pino Logs"]:::apmStyle
        Prometheus["📈 Prometheus & Grafana"]:::apmStyle
        Jaeger["🔍 Jaeger Distributed Tracing"]:::apmStyle
    end

    %% Client Ingress
    Buyer -->|HTTPS / REST| APIGW
    Tech -->|HTTPS / REST| APIGW

    %% Gateway Routing
    APIGW -->|Route /auth| AuthSvc
    APIGW -->|Route /work-orders| WOSvc
    APIGW -->|Route /dispatch| DispSvc
    APIGW -->|Route /billing| BillSvc

    %% Database Connections
    AuthSvc -->|TCP / Drizzle| MySQL
    WOSvc -->|TCP / Drizzle| MySQL
    BillSvc -->|TCP / Drizzle| MySQL
    DispSvc -->|RESP / GEOSEARCH| Redis

    %% Async Event Publish & Consume
    WOSvc -.->|Pub: work_order.lifecycle.*| RabbitMQ
    DispSvc -.->|Pub: dispatch.* / tech.bidding.*| RabbitMQ
    BillSvc -.->|Pub: billing.escrow.*| RabbitMQ

    RabbitMQ -.->|Sub: work_order.lifecycle.*| DispSvc
    RabbitMQ -.->|Sub: work_order.approved| BillSvc
    RabbitMQ -.->|Sub: notifications.*| NotifSvc

    %% External Cloud Services
    WOSvc -.->|Presigned URLs| S3
    BillSvc -.->|Payment Gateway| Stripe
    NotifSvc -.->|SMS & Email Delivery| Twilio
    NotifSvc -.->|Push Notifications| FCM

    %% APM Telemetry
    Services -.->|Structured JSON Logs & Spans| OTEL
    OTEL --> Prometheus
    OTEL --> Jaeger
```

---

### 🔄 End-to-End Work Order Lifecycle & Event Flow

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as 🏢 Enterprise Buyer
    participant Core as ⚡ FieldForge Platform (API & FSM)
    participant MQ as 📬 RabbitMQ Event Bus
    participant Bill as 💳 Escrow & Billing
    actor Tech as 📱 Field Technician

    %% 1. Post & Lock Escrow
    rect rgb(240, 249, 255)
    Note over Buyer, Bill: 1️⃣ Post Work Order & Lock Escrow (DRAFT → PUBLISHED)
    Buyer->>Core: 1. Create & Publish Work Order ($450 Budget)
    Core->>Bill: 2. Pre-Authorize & Lock Escrow Funds (Stripe)
    Core->>MQ: 3. Publish "work_order.lifecycle.published"
    end

    %% 2. Dispatch & Matching
    rect rgb(255, 251, 235)
    Note over Core, Tech: 2️⃣ Smart Dispatch & Assignment (PUBLISHED → ASSIGNED)
    MQ->>Tech: 4. Match & Notify nearby certified techs (Redis GEO ≤ 50km)
    Tech->>Core: 5. Accept Job / Submit Bid
    Core->>MQ: 6. Publish "work_order.lifecycle.assigned"
    end

    %% 3. Transit & On-Site Verification
    rect rgb(240, 253, 244)
    Note over Core, Tech: 3️⃣ Transit & GPS Check-in (ASSIGNED → EN_ROUTE → ON_SITE)
    Tech->>Core: 7. Start Trip (Status: EN_ROUTE)
    Tech->>Core: 8. GPS Geofence Check-in (Verified ≤ 100m Site Geofence)
    Tech->>Core: 9. Upload Proof of Work (Photos & Client Signature)
    Core->>MQ: 10. Publish "work_order.lifecycle.completed"
    end

    %% 4. Approval & Escrow Release
    rect rgb(253, 242, 248)
    Note over Buyer, Tech: 4️⃣ Buyer Sign-Off & Instant Payout (COMPLETED → APPROVED → PAID)
    Buyer->>Core: 11. Approve Deliverables (or 72h Auto-Approval)
    Core->>MQ: 12. Publish "work_order.lifecycle.approved"
    MQ->>Bill: 13. Capture Escrow & Disburse Payout
    Bill->>Tech: 14. Direct Deposit Payout & Invoice Issued
    end
```

---

### 🗄️ Database Entity-Relationship (ER) Model

```mermaid
erDiagram
    USERS ||--o| BUYER_PROFILES : "1:1 profile"
    USERS ||--o| TECHNICIAN_PROFILES : "1:1 profile"
    BUYER_PROFILES ||--o{ WORK_ORDERS : "creates (1:N)"
    TECHNICIAN_PROFILES ||--o{ WORK_ORDERS : "assigned_to (0..1:N)"
    TECHNICIAN_PROFILES ||--o{ WORK_ORDER_BIDS : "submits (1:N)"
    WORK_ORDERS ||--o{ WORK_ORDER_BIDS : "receives (1:N)"
    WORK_ORDERS ||--o{ WORK_ORDER_DELIVERABLES : "contains (1:N)"
    WORK_ORDERS ||--|| ESCROW_ACCOUNTS : "secured_by (1:1 strict)"

    USERS {
        varchar_36 id PK "UUID"
        varchar_255 email UK "Unique login"
        varchar_255 password_hash "Bcrypt hash"
        enum role "BUYER | TECHNICIAN | DISPATCHER | ADMIN"
        varchar_30 phone_number "E.164 phone"
        enum status "PENDING | ACTIVE | SUSPENDED"
        timestamp created_at "Auto-now"
        timestamp updated_at "On-update"
    }

    BUYER_PROFILES {
        varchar_36 id PK "UUID"
        varchar_36 user_id FK,UK "1:1 Cascade delete"
        varchar_255 company_name "Legal enterprise name"
        text billing_address "Billing & tax address"
        decimal_12_2 escrow_balance "Available balance"
    }

    TECHNICIAN_PROFILES {
        varchar_36 id PK "UUID"
        varchar_36 user_id FK,UK "1:1 Cascade delete"
        varchar_100 first_name "First name"
        varchar_100 last_name "Last name"
        decimal_8_2 hourly_rate "Base rate / hr"
        decimal_10_8 current_latitude "Spatial GPS Lat"
        decimal_11_8 current_longitude "Spatial GPS Lng"
        decimal_3_2 rating_average "Score (default 5.00)"
        int jobs_completed "Completed count"
    }

    WORK_ORDERS {
        varchar_36 id PK "UUID"
        varchar_36 buyer_id FK "References buyer_profiles"
        varchar_36 assigned_technician_id FK "References technician_profiles (nullable)"
        varchar_255 title "Job summary"
        text description "Scope of work specifications"
        varchar_100 category "Hardware, Cabling, Telecom"
        enum status "DRAFT|PUBLISHED|ASSIGNED|EN_ROUTE|ON_SITE|COMPLETED|APPROVED|PAID|CANCELLED|DISPUTED"
        enum budget_type "FIXED | HOURLY"
        decimal_10_2 budget_amount "Max budget allocation"
        text address_line "Physical site address"
        decimal_10_8 latitude "Geofence target lat"
        decimal_11_8 longitude "Geofence target lng"
        datetime scheduled_start_time "SLA window start"
        datetime scheduled_end_time "SLA window end"
        datetime sla_expiration_time "Auto-escalation deadline"
        timestamp created_at "Auto-now"
        timestamp updated_at "On-update"
    }

    WORK_ORDER_BIDS {
        varchar_36 id PK "UUID"
        varchar_36 work_order_id FK "References work_orders (cascade)"
        varchar_36 technician_id FK "References technician_profiles"
        decimal_10_2 bid_amount "Contractor proposed rate"
        text counter_note "Scope or timeline notes"
        enum bid_status "PENDING | ACCEPTED | REJECTED | WITHDRAWN"
        timestamp created_at "Auto-now"
    }

    WORK_ORDER_DELIVERABLES {
        varchar_36 id PK "UUID"
        varchar_36 work_order_id FK "References work_orders (cascade)"
        enum deliverable_type "PHOTO_BEFORE | PHOTO_AFTER | CHECKLIST | SIGNATURE"
        varchar_512 s3_url "Secure AWS S3 Object URI"
        timestamp uploaded_at "Proof upload timestamp"
    }

    ESCROW_ACCOUNTS {
        varchar_36 id PK "UUID"
        varchar_36 work_order_id FK,UK "1:1 Unique constraint (uq_escrow_work_order)"
        decimal_10_2 amount_locked "Pre-authorized escrow funds"
        enum status "HELD | RELEASED | REFUNDED | DISPUTED"
        timestamp created_at "Escrow locked timestamp"
        timestamp released_at "Payout disbursement timestamp"
    }
```

#### Relational Constraints & Indexing Invariants

- **Escrow 1:1 Invariant (`uq_escrow_work_order`)**: `escrow_accounts.work_order_id` is enforced by a `UNIQUE` constraint at the database layer to prevent double-funding or duplicate payout releases.
- **Dispatch Composite Index (`idx_wo_status_sched`)**: Composite index on `work_orders(status, scheduled_start_time)` allows high-throughput querying of open work orders without filesorting.
- **Geospatial Precision**: Site locations and technician coordinates use `DECIMAL(10, 8)` and `DECIMAL(11, 8)` for centimeter-level geofence accuracy ($\le 100\text{m}$).

---

## 🚀 Microservices Ecosystem

| Microservice                    |  Port  | Domain Responsibilities                                                                   | Primary Data Store                    |
| :------------------------------ | :----: | :---------------------------------------------------------------------------------------- | :------------------------------------ |
| **`api-gateway`**               | `5000` | Edge reverse proxy, JWT validation, rate limiting, correlation ID injection               | In-Memory / Redis                     |
| **`auth-service`**              | `5001` | User onboarding, RBAC tokens, compliance vetting (OSHA 10, Cisco CCNA, Background Checks) | MySQL (`users`, `profiles`)           |
| **`work-order-service`**        | `5002` | Work order lifecycle FSM, SOW templates, S3 deliverable uploads, SLA timeout watchers     | MySQL (`work_orders`, `deliverables`) |
| **`dispatch-matching-service`** | `5003` | Geospatial contractor matching (`GEOSEARCH`), bidding negotiation, auto-routing rules     | Redis 7 & RabbitMQ                    |
| **`billing-service`**           | `5004` | Escrow pre-authorizations, fund capture, technician payouts, automated PDF invoicing      | MySQL (`escrow_accounts`)             |
| **`notification-service`**      | `5005` | Push notifications (FCM/APNS), SMS dispatch alerts (Twilio), Email receipts (SES)         | RabbitMQ Topic Consumer               |

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
    direction TB

    [*] --> DRAFT : Buyer creates SOW

    state "DRAFT (Drafting Scope)" as DRAFT
    state "PUBLISHED (Open for Bids / Dispatch)" as PUBLISHED
    state "ASSIGNED (Technician Selected)" as ASSIGNED
    state "EN_ROUTE (Technician In Transit)" as EN_ROUTE
    state "ON_SITE (Geofence Check-in ≤ 100m)" as ON_SITE
    state "COMPLETED (Deliverables & Signature)" as COMPLETED
    state "APPROVED (Buyer Sign-Off / 72h Auto)" as APPROVED
    state "PAID (Escrow Released & Settled)" as PAID
    state "DISPUTED (Mediation & SLA Audit)" as DISPUTED
    state "CANCELLED (Nullified & Refunded)" as CANCELLED

    DRAFT --> PUBLISHED : Pre-Authorize Escrow Funds
    DRAFT --> CANCELLED : Discard Draft

    PUBLISHED --> ASSIGNED : Bid Accepted / Auto-Dispatched
    PUBLISHED --> CANCELLED : Buyer Cancels Listing

    ASSIGNED --> EN_ROUTE : Technician Departs for Site
    ASSIGNED --> DISPUTED : Technician No-Show / Breach
    ASSIGNED --> CANCELLED : Penalty Cancellation

    EN_ROUTE --> ON_SITE : GPS Geofence Check-In (≤ 100m)
    EN_ROUTE --> DISPUTED : Transit SLA Violation

    ON_SITE --> COMPLETED : Photos, Checklist & Client Signature Uploaded
    ON_SITE --> DISPUTED : Scope / Deliverable Conflict

    COMPLETED --> APPROVED : Buyer Manual Sign-Off or 72h Auto-Approval
    COMPLETED --> DISPUTED : Quality Rejection / Scope Deficiency

    APPROVED --> PAID : billing-service Releases Escrow Payout

    DISPUTED --> APPROVED : Dispute Resolved in Tech's Favor
    DISPUTED --> CANCELLED : Dispute Nullified / Buyer Refunded

    PAID --> [*]
    CANCELLED --> [*]
```

### 📋 State Transition Matrix & Lifecycle Invariants

| From State      | Allowed Next State(s)               | Authorized Actor        | Transition Guard / Pre-condition                      | Emitted Event (`fieldforge.events.topic`) |
| :-------------- | :---------------------------------- | :---------------------- | :---------------------------------------------------- | :---------------------------------------- |
| **`DRAFT`**     | `PUBLISHED`, `CANCELLED`            | Buyer                   | Stripe escrow pre-authorization locked                | `work_order.lifecycle.published`          |
| **`PUBLISHED`** | `ASSIGNED`, `CANCELLED`             | Buyer / Dispatch Engine | Contractor bid accepted or auto-assigned              | `work_order.lifecycle.assigned`           |
| **`ASSIGNED`**  | `EN_ROUTE`, `DISPUTED`, `CANCELLED` | Technician / Buyer      | Technician accepts and initiates transit              | `work_order.lifecycle.en_route`           |
| **`EN_ROUTE`**  | `ON_SITE`, `DISPUTED`               | Technician              | Device GPS Haversine verification ($\le 100\text{m}$) | `work_order.lifecycle.on_site`            |
| **`ON_SITE`**   | `COMPLETED`, `DISPUTED`             | Technician              | Before/after photos + SHA-256 client sign-off         | `work_order.lifecycle.completed`          |
| **`COMPLETED`** | `APPROVED`, `DISPUTED`              | Buyer / SLA Worker      | Buyer approves deliverables OR 72h inactivity timeout | `work_order.lifecycle.approved`           |
| **`APPROVED`**  | `PAID`                              | `billing-service`       | Escrow capture succeeded & payout ledger credited     | `billing.payout.disbursed`                |
| **`DISPUTED`**  | `APPROVED`, `CANCELLED`             | Admin / Arbiter         | Arbitration resolved or job nullified with refund     | `work_order.dispute.resolved`             |
| **`PAID`**      | _Terminal (`[*]`)_                  | —                       | Final state: Payout settled & PDF invoice issued      | —                                         |
| **`CANCELLED`** | _Terminal (`[*]`)_                  | Buyer / Admin           | Final state: Escrow refunded to buyer card            | `work_order.lifecycle.cancelled`          |

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
- **API Gateway (Public REST API):** `http://localhost:5000/api/v1`
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
