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

## 📖 Overview & Core Capabilities

FieldForge is an enterprise field service management and autonomous dispatch platform engineered for high-concurrency gig-economy operations. It provides end-to-end management of the field workforce lifecycle:

- **⚡ Sub-Millisecond Dispatch Matching:** Redis 7 `GEOSEARCH` proximity engine paired with multi-parameter contractor scoring (certifications, ratings, hourly rate, distance).
- **📋 Deterministic Finite State Machine (FSM):** Strict, ACID-backed work order state progression with zero race conditions.
- **📍 GPS Geofence Check-In & Proof of Work:** Native mobile verification requiring $\le 100	ext{m}$ site proximity, photo deliverables, checklist milestone verification, and SHA-256 signed client approvals.
- **💳 Guaranteed Escrow Settlement:** Automated pre-authorization, fund locking on assignment, and 72-hour auto-disbursement with PDF invoice generation.
- **📊 99.9% SLI/SLO Reliability:** Built-in OpenTelemetry APM interceptors, Prometheus metrics collectors, and Pino structured logging with distributed `x-correlation-id` tracing.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Clients[" 🌐 Client Tier "]
        Buyer["🏢 Enterprise Buyer Portal<br/>(React 19 + Redux Toolkit)"]
        Tech["📱 Field Tech Mobile App<br/>(React Native + Offline Sync)"]
    end

    subgraph Edge[" 🛡️ Edge & Routing "]
        APIGW["⚡ API Gateway Microservice<br/>(:3000 • JWT Auth • Rate Limiting)"]
    end

    subgraph Services[" 🚀 Core Domain Microservices "]
        AuthSvc["🔐 Auth & Identity Service<br/>(:3001 • RBAC & Tech Vetting)"]
        WOSvc["📋 Work Order Service<br/>(:3002 • FSM & SLA Escalation)"]
        DispSvc["📍 Dispatch & Matching Service<br/>(:3003 • Redis GEOSEARCH)"]
        BillSvc["💳 Billing & Escrow Service<br/>(:3004 • Stripe & Invoicing)"]
        NotifSvc["🔔 Notification Service<br/>(:3005 • FCM, Twilio, SES)"]
    end

    subgraph Persistence[" 💾 Persistence & Messaging "]
        MySQL[("🗄️ MySQL 8.0 InnoDB<br/>(ACID Relational Core)")]
        Redis[("⚡ Redis 7.0<br/>(Geospatial & Cache)")]
        RabbitMQ{{"📬 RabbitMQ 3.13<br/>(Topic Exchange: fieldforge.events.topic)"}}
    end

    subgraph Observability[" 📊 APM & Monitoring "]
        Prometheus["📈 Prometheus Metrics"]
        Jaeger["🔍 Jaeger Distributed Tracing"]
        Grafana["📊 Grafana Dashboards"]
    end

    Buyer -->|HTTPS / REST| APIGW
    Tech -->|HTTPS / REST| APIGW

    APIGW --> AuthSvc
    APIGW --> WOSvc
    APIGW --> DispSvc
    APIGW --> BillSvc

    AuthSvc --> MySQL
    WOSvc --> MySQL
    BillSvc --> MySQL

    DispSvc --> Redis
    WOSvc -->|Publish Domain Events| RabbitMQ
    RabbitMQ -->|Consume Events| DispSvc
    RabbitMQ -->|Consume Events| BillSvc
    RabbitMQ -->|Consume Events| NotifSvc

    Services -.->|APM Metrics & Spans| Prometheus
    Services -.->|Tracing Spans| Jaeger
    Prometheus --> Grafana
```

---

## 🚀 Microservices Ecosystem

| Microservice | Port | Domain Responsibilities | Primary Data Store |
| :--- | :---: | :--- | :--- |
| **`api-gateway`** | `3000` | Edge reverse proxy, JWT validation, rate limiting, correlation ID injection | In-Memory / Redis |
| **`auth-service`** | `3001` | User onboarding, RBAC tokens, compliance vetting (OSHA 10, Cisco CCNA, Background Checks) | MySQL (`users`, `profiles`) |
| **`work-order-service`** | `3002` | Work order lifecycle FSM, SOW templates, S3 deliverable uploads, SLA timeout watchers | MySQL (`work_orders`, `deliverables`) |
| **`dispatch-matching-service`** | `3003` | Geospatial contractor matching (`GEOSEARCH`), bidding negotiation, auto-routing rules | Redis 7 & RabbitMQ |
| **`billing-service`** | `3004` | Escrow pre-authorizations, fund capture, technician payouts, automated PDF invoicing | MySQL (`escrow_accounts`) |
| **`notification-service`** | `3005` | Push notifications (FCM/APNS), SMS dispatch alerts (Twilio), Email receipts (SES) | RabbitMQ Topic Consumer |

---

## 📦 Shared Monorepo Packages

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
    EN_ROUTE --> ON_SITE: GPS Geofence Check-in Verified (<100m)
    ON_SITE --> COMPLETED: Deliverables & Signature Captured
    COMPLETED --> APPROVED: Buyer Sign-Off (or 72h Auto-Approval)
    APPROVED --> SETTLED: Escrow Released to Tech Payout
    SETTLED --> [*]

    PUBLISHED --> CANCELLED: Buyer Cancels
    ASSIGNED --> DISPUTED: SLA Breach / Dispute Raised
    DISPUTED --> APPROVED: Dispute Resolved
    DISPUTED --> CANCELLED: Job Nullified
```

---

## 📊 Service Level Objectives (SLOs) & Reliability Matrix

| Service Level Metric | Target Objective (SLO) | Indicator Definition (SLI) | Max Error Budget |
| :--- | :---: | :--- | :--- |
| **Platform Availability** | **$\ge 99.95\%$** | $\frac{\text{Successful HTTP Requests (non-5xx)}}{\text{Total HTTP Requests}}$ | $21.6\text{ minutes / month}$ |
| **Read Latency (p95)** | **$< 100	ext{ms}$** | Duration of REST read endpoints | $95\%$ requests under $100\text{ms}$ |
| **Write Latency (p95)** | **$< 200	ext{ms}$** | Duration of relational transaction endpoints | $95\%$ writes under $200\text{ms}$ |
| **Dispatch Queue Latency** | **$\le 1.5	ext{s}$** | Time from work order publication to push notification | $99\%$ notifications in $\le 1.5\text{s}$ |
| **Redis GEOSEARCH Latency** | **$< 120	ext{ms}$** | Proximity lookup across 50,000+ cached technician nodes | $p95 < 120\text{ms}$ |

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

# 2. Install monorepo dependencies
pnpm install

# 3. Spin up local backing services (MySQL, Redis, RabbitMQ, Jaeger, Prometheus, Grafana)
pnpm docker:up

# 4. Run database migrations and seed mock data
pnpm db:migrate
pnpm db:seed

# 5. Launch all microservices and frontend portals concurrently
pnpm dev
```

### 3. Service Endpoints
- **Enterprise Buyer Portal:** `http://localhost:5173`
- **API Gateway (Public REST API):** `http://localhost:3000/api/v1`
- **RabbitMQ Management UI:** `http://localhost:15672` (guest / guest)
- **Jaeger Tracing Console:** `http://localhost:16686`
- **Grafana APM Dashboards:** `http://localhost:3001` (admin / admin)

---

## 🤖 Agentic Context Engineering

This repository is optimized for autonomous AI coding agents (Cursor, Antigravity, GitHub Copilot). Operational guardrails are codified under `.agent/` and `.cursorrules`:

- **`.agent/rules/`**: Modular rules enforcing microservices isolation, Drizzle ORM transactions, RabbitMQ topic routing, and React 19 / React Native best practices.
- **`.agent/context/`**: Living specifications for domain entities, OpenAPI catalogues, and SLI/SLO definitions.
- **`.agent/memory/ADRs/`**: Architecture Decision Records capturing technical rationale for key design choices.
- **`.agent/workflows/`**: Automation shell scripts for microservice generation, automated test loops, and SLI latency verification.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
