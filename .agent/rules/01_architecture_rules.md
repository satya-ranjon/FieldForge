# 01. Architecture & Microservices Rules

- **Bounded Contexts**: Microservices must never share a database or make synchronous calls for mutating foreign aggregate roots.
- **API Gateway as Edge Router**: External client traffic (Web/Mobile) must route through \`api-gateway\` on port 3000.
- **DTOs & Validation**: All incoming requests must be validated using Zod schemas from \`@fieldforge/contracts\`.
- **Dependency Injection**: Use NestJS DI and adhere to SOLID design principles.
- **Async Communication**: Cross-service state transitions trigger RabbitMQ domain events (\`work_order.published\`, \`work_order.assigned\`, \`work_order.approved\`).
