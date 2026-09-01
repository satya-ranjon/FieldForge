# 📡 OpenAPI & REST Endpoint Catalogue

> **Living Specification** • Base URL: `http://localhost:3000/api/v1`

---

## 1. Authentication & Vetting Service (`auth-service`)

| Method | Endpoint                  | Description                                      | Auth / RBAC | Payload Schema             |
| :----- | :------------------------ | :----------------------------------------------- | :---------- | :------------------------- |
| `POST` | `/auth/register`          | Register new Buyer or Technician account         | Public      | `registerUserSchema`       |
| `POST` | `/auth/login`             | Authenticate credentials & return JWT tokens     | Public      | `loginSchema`              |
| `POST` | `/auth/refresh`           | Issue fresh access token from refresh token      | Public      | `{ refreshToken: string }` |
| `GET`  | `/users/me`               | Retrieve authenticated user profile              | Bearer JWT  | None                       |
| `GET`  | `/technicians/:id/badges` | Fetch technician certifications & vetting badges | Bearer JWT  | None                       |

---

## 2. Work Order Lifecycle Service (`work-order-service`)

| Method | Endpoint                                      | Description                                           | Auth / RBAC           | Payload Schema           |
| :----- | :-------------------------------------------- | :---------------------------------------------------- | :-------------------- | :----------------------- |
| `POST` | `/work-orders`                                | Create a new work order draft                         | `BUYER`               | `createWorkOrderSchema`  |
| `GET`  | `/work-orders`                                | List & filter work orders (by status, date, location) | Authenticated         | Query Params             |
| `GET`  | `/work-orders/:id`                            | Fetch complete work order details & deliverables      | Authenticated         | None                     |
| `POST` | `/work-orders/:id/publish`                    | Lock escrow and transition status to `PUBLISHED`      | `BUYER`               | None                     |
| `POST` | `/work-orders/:id/transition`                 | Execute validated FSM state transition                | `BUYER`, `TECHNICIAN` | `transitionStatusSchema` |
| `POST` | `/work-orders/:id/deliverables/presigned-url` | Generate S3 pre-signed upload URL                     | `TECHNICIAN`          | `{ type, filename }`     |
| `POST` | `/work-orders/:id/deliverables/signature`     | Submit cryptographic digital signature                | `TECHNICIAN`          | `{ svg, clientName }`    |

---

## 3. Dispatch & Geospatial Matching Service (`dispatch-matching-service`)

| Method | Endpoint                       | Description                                       | Auth / RBAC           | Payload Schema             |
| :----- | :----------------------------- | :------------------------------------------------ | :-------------------- | :------------------------- |
| `GET`  | `/dispatch/technicians/nearby` | Redis `GEOSEARCH` available certified contractors | `BUYER`, `DISPATCHER` | `?lat=..&lng=..&radius=25` |
| `POST` | `/dispatch/bids`               | Submit technician bid with rate & counter-note    | `TECHNICIAN`          | `submitBidSchema`          |
| `POST` | `/dispatch/bids/:id/accept`    | Accept technician bid & trigger assignment event  | `BUYER`               | None                       |
| `POST` | `/dispatch/auto-route`         | Trigger automated rule-based ticket dispatch      | `BUYER`, `DISPATCHER` | `{ workOrderId }`          |

---

## 4. Billing, Escrow & Invoicing Service (`billing-service`)

| Method | Endpoint                           | Description                                     | Auth / RBAC      | Payload Schema        |
| :----- | :--------------------------------- | :---------------------------------------------- | :--------------- | :-------------------- |
| `POST` | `/billing/escrow/preauth`          | Pre-authorize and hold funds in escrow          | `BUYER`          | `preAuthEscrowSchema` |
| `POST` | `/billing/escrow/release`          | Release escrow funds to technician wallet       | `BUYER`, `ADMIN` | `{ workOrderId }`     |
| `GET`  | `/billing/invoices/:id`            | Generate and download immutable PDF tax invoice | `BUYER`, `ADMIN` | None                  |
| `GET`  | `/billing/technicians/:id/payouts` | Retrieve 1099 earnings and settlement ledger    | `TECHNICIAN`     | None                  |
