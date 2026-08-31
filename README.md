# FieldForge ⚡

Enterprise-grade, distributed Field Service Management (FSM) and autonomous technician dispatching platform.

## 🏗️ Architecture Overview

FieldForge is built as a cloud-native, event-driven monorepo powered by:
- **NestJS** Microservices (API Gateway, Auth, Work Orders, Dispatch, Billing, Notifications)
- **MySQL 8** with **Drizzle ORM** for ACID persistence
- **RabbitMQ** topic exchanges for asynchronous domain event propagation
- **Redis 7** (\`GEOSEARCH\`) for sub-millisecond proximity matching & geospatial technician dispatch
- **React 19 & Redux Toolkit** for the Enterprise Buyer Portal
- **React Native (Expo)** for the On-Field Technician Application
- **Kubernetes & Helm** on AWS EKS infrastructure provisioned via **Terraform**

## 📦 Monorepo Structure

\`\`\`
fieldforge/
├── .agent/              # Agent rules, domain specifications, ADRs & playbooks
├── .github/             # CI/CD workflows (Linter, Jest, Multi-stage Docker, K8s GitOps)
├── apps/                # Microservices & Frontends (Gateway, Auth, WorkOrder, Dispatch, Billing, Web, Mobile)
├── packages/            # Shared internal packages (database, contracts, common, ui, tsconfig)
├── infra/               # Docker Compose, Kubernetes manifests, Helm charts & Terraform IaC
└── scripts/             # Local bootstrapping, database seeders & load testing harnesses
\`\`\`

## 🚀 Quickstart

1. **Bootstrap local environment:**
   \`\`\`bash
   ./scripts/setup-dev.sh
   \`\`\`
2. **Start Docker infrastructure:**
   \`\`\`bash
   pnpm docker:up
   \`\`\`
3. **Run database migrations and seed mock records:**
   \`\`\`bash
   pnpm db:migrate
   pnpm db:seed
   \`\`\`
4. **Launch all apps & services in development mode:**
   \`\`\`bash
   pnpm dev
   \`\`\`
