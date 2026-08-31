# Domain Entities & Database Schema Specs (Matching SRS Section 5)

## 1. User Roles & Profiles
- **`users`**: Base credentials, authentication role (`BUYER`, `TECHNICIAN`, `DISPATCHER`, `ADMIN`), phone number, account status (`PENDING`, `ACTIVE`, `SUSPENDED`).
- **`buyer_profiles`**: Enterprise customer identity, company name, billing address, escrow account balance.
- **`technician_profiles`**: Contractor profile, first/last name, hourly rate, live GPS coordinates (`current_latitude`, `current_longitude`), average star rating, completed job counter.

## 2. Work Order Finite State Machine (FSM)
$$\\text{DRAFT} \\rightarrow \\text{PUBLISHED} \\rightarrow \\text{ASSIGNED} \\rightarrow \\text{EN\\_ROUTE} \\rightarrow \\text{ON\\_SITE} \\rightarrow \\text{COMPLETED} \\rightarrow \\text{APPROVED / SETTLED}$$
*(Allowable exceptional states: `CANCELLED`, `DISPUTED`).*

## 3. Work Order Deliverables & Proof of Work
- **`work_order_deliverables`**: Linked attachments with S3 URLs and SHA-256 digital signature hashes for verification.
  - `PHOTO_BEFORE`: Pre-work equipment condition.
  - `PHOTO_AFTER`: Post-completion verification.
  - `CHECKLIST`: Itemized tasks & serial number logs.
  - `SIGNATURE`: On-site client digital signature.
