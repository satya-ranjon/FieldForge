# OpenAPI & REST Endpoint Catalogue

## API Gateway (\`http://localhost:3000/api/v1\`)

| Method | Endpoint | Service Route | Description |
|---|---|---|---|
| POST | \`/auth/login\` | \`auth-service\` | Authenticate user & issue JWT tokens |
| POST | \`/auth/refresh\` | \`auth-service\` | Refresh access token |
| GET | \`/users/me\` | \`auth-service\` | Current user profile |
| GET | \`/work-orders\` | \`work-order-service\` | List & filter work orders |
| POST | \`/work-orders\` | \`work-order-service\` | Create new work order |
| GET | \`/work-orders/:id\` | \`work-order-service\` | Retrieve work order details & deliverables |
| POST | \`/work-orders/:id/status\` | \`work-order-service\` | Transition work order FSM state |
| POST | \`/dispatch/bids\` | \`dispatch-matching-service\` | Submit technician bid |
| GET | \`/dispatch/technicians/nearby\` | \`dispatch-matching-service\` | Redis GEOSEARCH nearby technicians |
| POST | \`/billing/escrow/preauth\` | \`billing-service\` | Pre-authorize escrow funds |
| GET | \`/billing/invoices/:id\` | \`billing-service\` | Fetch generated invoice |
