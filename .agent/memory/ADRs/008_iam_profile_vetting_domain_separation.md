# 📝 ADR 008: IAM, Domain Profiles, and Contractor Vetting Separation

| Status       | Date           | Decision Maker         |
| :----------- | :------------- | :--------------------- |
| **ACCEPTED** | September 2026 | Satya Ranjan Debsharma |

---

## 1. Context

In the initial microservice scaffold, `apps/auth-service` conflated Identity & Access Management (IAM) security primitives with business profile operations and contractor vetting/compliance management:

- Low-level IAM security concerns (password hashing, credential validation, JWT access/refresh token generation and rotation, phone SMS OTP) were intertwined with marketplace domain profiles (`buyer_profiles`, `technician_profiles`).
- Contractor compliance and credentialing features (`technician_certifications`, badge verification, pending certification queues, directory batch lookups) were managed within the same service and flat module structure.
- In `AuthService.register()`, direct SQL inserts into `buyerProfiles` and `technicianProfiles` were coupled into the authentication transaction.
- In `AuthService.login()` and `AuthService.refresh()`, direct queries against `buyerProfiles` and `technicianProfiles` were executed to resolve aggregate profile identifiers.
- All controllers, services, and DTOs were grouped in an un-encapsulated flat module layout (`AuthModule`).

This violated core architectural design principles:

1. **Single Responsibility Principle (SRP)**: The IAM service should be strictly responsible for authentication, token issuance, and credential security. Managing trade licenses, OSHA certifications, company billing profiles, and directory querying are distinct business domain capabilities.
2. **Blast Radius & Security Surface**: A vulnerability, heavy query load, or schema change in contractor vetting or directory lookups could impair platform-wide authentication availability.
3. **Impediment to Independent Evolution**: Enhancements to contractor onboarding, document uploads, or third-party compliance verification engines were constrained by the auth service deployment and test cycles.

---

## 2. Decision

Decouple `apps/auth-service` internally into three distinct, encapsulated NestJS domain modules while preserving the 6-microservice platform topology (avoiding microservice sprawl):

1. **`IamModule` (`src/modules/iam/`)**:
   - **Responsibility**: Low-level IAM security, credential validation, password hashing (`bcrypt`), JWT signing and rotation, and phone OTP verification.
   - **Components**: `AuthController`, `AuthService`, `PhoneOtpService`.
   - **Endpoints**:
     - `POST /auth/register`
     - `POST /auth/login`
     - `POST /auth/refresh`
     - `POST /auth/phone/send-otp`
     - `POST /auth/phone/verify-otp`

2. **`ProfilesModule` (`src/modules/profiles/`)**:
   - **Responsibility**: Domain profiles (`buyerProfiles`, `technicianProfiles`), profile provisioning port, and self-profile retrieval with C5 identity invariant enforcement.
   - **Components**: `UsersController`, `ProfilesService`.
   - **Endpoints**:
     - `GET /users/me`
   - **Port / Inversion Interface**: Exposes `ProfilesService` methods:
     - `provisionProfile(tx, userId, registerDto)`: Encapsulates creation of role-specific buyer/technician records.
     - `resolveProfileId(userId, role)`: Encapsulates resolution of role-specific entity IDs for token generation.
     - `getUserProfile(userId)`: Encapsulates retrieval of user identity + associated profile payload.

3. **`ContractorVettingModule` (`src/modules/vetting/`)**:
   - **Responsibility**: Contractor credentials, compliance badge generation, license verification lifecycle, and technician directory queries.
   - **Components**: `CertificationsController`, `CertificationsService`.
   - **Endpoints**:
     - `GET /technicians/:id/badges`
     - `POST /technicians/certifications`
     - `PATCH /technicians/certifications/:id/verify`
     - `GET /technicians/certifications/pending`
     - `POST /technicians/batch`

4. **Dependency Inversion Between IAM and Profiles**:
   - `AuthService` delegates profile creation and profile ID resolution to `ProfilesService` via dependency injection (`@Optional() @Inject(ProfilesService)`).
   - `AuthService` performs zero direct queries or inserts into `buyerProfiles` or `technicianProfiles`.

5. **Domain-Categorized Database Schema Exports**:
   - In `packages/database/src/index.ts`, group and export schemas into clear domain namespaces:
     - `iamSchema`: `users`, `refreshTokens`
     - `profileSchema`: `buyerProfiles`, `technicianProfiles`
     - `vettingSchema`: `technicianCertifications`
   - Zero database schema migrations (`RULE-DB-02`); existing tables and constraints remain 100% intact.

---

## 3. Consequences

### Positive

- **Domain Decoupling**: IAM security logic is completely decoupled from business domain profile schemas and vetting workflows.
- **Encapsulation & High Cohesion**: Each module has a single clear purpose, isolated controllers, services, and unit test suites.
- **Zero Microservice Sprawl**: Avoided the operational overhead, network latency, and infrastructure cost of prematurely spinning up a 7th microservice.
- **Clean Extraction Pathway**: Because `ContractorVettingModule` and `ProfilesModule` are strictly modularized and decoupled from IAM internals, either can be extracted into an independent microservice in the future with zero breaking changes to external consumers.
- **Robust Invariants**: Security checks (such as gateway header spoofing prevention in `GET /users/me` and role-based verification authorization in `PATCH /technicians/certifications/:id/verify`) remain strictly guarded.

### Negative

- Intra-service communication between `IamModule` and `ProfilesModule` requires module imports and dependency injection wiring within `apps/auth-service`.
