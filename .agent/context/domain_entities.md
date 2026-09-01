# 🏛️ Domain Entities & Relational Schema Specifications

> **Living Specification** • Conforms to Software Requirements Specification (SRS v1.0.0)

---

## 1. User Classes & Profile Models

```mermaid
erDiagram
    USERS ||--o| BUYER_PROFILES : "has profile"
    USERS ||--o| TECHNICIAN_PROFILES : "has profile"
    BUYER_PROFILES ||--o{ WORK_ORDERS : "creates & funds"
    TECHNICIAN_PROFILES ||--o{ WORK_ORDERS : "assigned to"
    TECHNICIAN_PROFILES ||--o{ WORK_ORDER_BIDS : "submits"
    WORK_ORDERS ||--o{ WORK_ORDER_BIDS : "receives"
    WORK_ORDERS ||--o{ WORK_ORDER_DELIVERABLES : "contains"
    WORK_ORDERS ||--|| ESCROW_ACCOUNTS : "secured by"

    USERS {
        string id PK
        string email UK
        string password_hash
        enum role "BUYER | TECHNICIAN | DISPATCHER | ADMIN"
        string phone_number
        enum status "PENDING | ACTIVE | SUSPENDED"
        timestamp created_at
    }

    BUYER_PROFILES {
        string id PK
        string user_id FK
        string company_name
        text billing_address
        decimal escrow_balance
    }

    TECHNICIAN_PROFILES {
        string id PK
        string user_id FK
        string first_name
        string last_name
        decimal hourly_rate
        decimal current_latitude
        decimal current_longitude
        decimal rating_average
        int jobs_completed
    }

    WORK_ORDERS {
        string id PK
        string buyer_id FK
        string assigned_technician_id FK
        string title
        text description
        string category
        enum status "DRAFT | PUBLISHED | ASSIGNED | EN_ROUTE | ON_SITE | COMPLETED | APPROVED | PAID | CANCELLED | DISPUTED"
        enum budget_type "FIXED | HOURLY"
        decimal budget_amount
        text address_line
        decimal latitude
        decimal longitude
        datetime scheduled_start_time
        datetime scheduled_end_time
        datetime sla_expiration_time
    }

    WORK_ORDER_BIDS {
        string id PK
        string work_order_id FK
        string technician_id FK
        decimal bid_amount
        text counter_note
        enum bid_status "PENDING | ACCEPTED | REJECTED | WITHDRAWN"
    }

    WORK_ORDER_DELIVERABLES {
        string id PK
        string work_order_id FK
        enum deliverable_type "PHOTO_BEFORE | PHOTO_AFTER | CHECKLIST | SIGNATURE"
        string s3_url
        timestamp uploaded_at
    }

    ESCROW_ACCOUNTS {
        string id PK
        string work_order_id FK
        decimal amount_locked
        enum status "HELD | RELEASED | REFUNDED | DISPUTED"
        timestamp released_at
    }
```

---

## 2. Work Order Finite State Machine (FSM)

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Buyer drafts work order & SOW
    DRAFT --> PUBLISHED: Buyer funds escrow & publishes ticket
    PUBLISHED --> ASSIGNED: Buyer accepts bid or Auto-Dispatch matches
    ASSIGNED --> EN_ROUTE: Technician marks departure
    EN_ROUTE --> ON_SITE: GPS geofence verified (≤200m radius)
    ON_SITE --> COMPLETED: Photos, checklist & client signature uploaded
    COMPLETED --> APPROVED: Buyer approves deliverables (or 72h auto-approval)
    APPROVED --> PAID: Escrow released to technician payout ledger
    PAID --> [*]

    PUBLISHED --> CANCELLED: Buyer cancels ticket
    ASSIGNED --> DISPUTED: SLA breach or quality dispute raised
    DISPUTED --> APPROVED: Dispute resolved in technician favor
    DISPUTED --> CANCELLED: Dispute resolved with buyer refund
```

---

## 3. Deliverable & Proof-of-Work Contracts

| Deliverable Type | Storage Location                           | Validation & Cryptographic Integrity                   |
| :--------------- | :----------------------------------------- | :----------------------------------------------------- |
| `PHOTO_BEFORE`   | AWS S3 (`fieldforge-deliverables-storage`) | Pre-work timestamp watermark + Geo-tag inspection      |
| `PHOTO_AFTER`    | AWS S3 (`fieldforge-deliverables-storage`) | Post-repair photo with serial number verification      |
| `CHECKLIST`      | AWS S3 / JSON Metadata                     | Mandatory itemized tasks completed (100% check rate)   |
| `SIGNATURE`      | AWS S3 (`.svg`)                            | Client on-screen signature + SHA-256 audit digest hash |
