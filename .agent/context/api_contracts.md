# 📡 OpenAPI & REST Endpoint Catalogue

> **Living Specification** • Base URL: `http://localhost:8000/api/v1`

---

## 1. Authentication & Vetting Service (`auth-service`)

| Method | Endpoint                  | Description                                      | Auth / RBAC | Payload Schema             |
| :----- | :------------------------ | :----------------------------------------------- | :---------- | :------------------------- |
| `POST` | `/auth/register`          | Register new Buyer or Technician account         | Public      | `registerUserSchema`       |
| `POST` | `/auth/login`             | Authenticate credentials & return JWT tokens     | Public      | `loginSchema`              |
| `POST` | `/auth/refresh`           | Issue fresh access token from refresh token      | Public      | `{ refreshToken: string }` |
| `GET`  | `/users/me`               | Retrieve authenticated user profile              | Bearer JWT  | None                       |
| `GET`  | `/technicians/:id/badges` | Fetch technician certifications & vetting badges | Bearer JWT  | None                       |

> **"Bearer JWT" means the token, not the header.** `/users/me` resolves the
> caller from the verified token's `sub` claim. The `x-ff-user-id` /
> `x-ff-user-role` headers the gateway injects are **not** an accepted identity
> source: the gateway sets them only after verifying a token, but every service
> listens on `0.0.0.0` with no NetworkPolicy or mTLS, so a direct caller can set
> them too. `/users/me` reads `x-ff-user-id` solely to detect disagreement with
> the token and returns 401 on a mismatch. The gateway, for its part, strips any
> inbound `x-ff-user-*` before asserting its own.
>
> New endpoints in this catalogue inherit that rule — verify the token, use
> `payload.sub`. `docs/ISSUES.md` **C5** records what happened when `/users/me`
> did it the other way around.

---

## 2. Work Order Lifecycle Service (`work-order-service`)

| Method  | Endpoint                                      | Description                                           | Auth / RBAC           | Payload Schema               |
| :------ | :-------------------------------------------- | :---------------------------------------------------- | :-------------------- | :--------------------------- |
| `POST`  | `/work-orders`                                | Create a new work order draft                         | `BUYER`               | `createWorkOrderSchema`      |
| `GET`   | `/work-orders`                                | List & filter work orders (by status, date, location) | Authenticated         | `listWorkOrdersQuerySchema`  |
| `GET`   | `/work-orders/:id`                            | Fetch complete work order details                     | Authenticated         | None                         |
| `GET`   | `/work-orders/:id/history`                    | Fetch immutable state transition audit history        | Authenticated         | None                         |
| `POST`  | `/work-orders/:id/publish`                    | Transition draft work order to `PUBLISHED`            | `BUYER`               | None                         |
| `POST`  | `/work-orders/:id/transition`                 | Execute validated FSM state transition                | `BUYER`, `TECHNICIAN` | `transitionStatusSchema`     |
| `PATCH` | `/work-orders/:id/status`                     | Alias to execute validated FSM state transition       | `BUYER`, `TECHNICIAN` | `transitionStatusSchema`     |
| `POST`  | `/work-orders/:id/deliverables/presigned-url` | Generate pre-signed upload URL for media storage      | `TECHNICIAN`          | `generatePresignedUrlSchema` |
| `POST`  | `/work-orders/:id/deliverables/signature`     | Submit cryptographic digital signature artifact       | `TECHNICIAN`          | `recordSignatureSchema`      |
| `POST`  | `/work-orders/:id/signature`                  | Alias to submit digital signature artifact            | `TECHNICIAN`          | `recordSignatureSchema`      |
| `GET`   | `/work-orders/:id/deliverables`               | Fetch deliverables for work order                     | Authenticated         | None                         |

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
