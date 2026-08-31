# 03. Event & RabbitMQ Rules

- **Exchange Type**: Topic Exchange (\`fieldforge.events.topic\`).
- **Routing Keys**: \`<domain>.<entity>.<action>\` (e.g. \`work_order.lifecycle.created\`, \`tech.bidding.submitted\`, \`billing.escrow.funded\`).
- **Dead Letter Queues (DLQ)**: Every queue must configure an \`x-dead-letter-exchange\` and retry policy (exponential backoff up to 3 retries).
- **Message Contracts**: Payloads must strictly implement interfaces defined in \`@fieldforge/contracts/events\`.
- **Idempotency**: Consumers must record processed message IDs in Redis or MySQL with a 7-day TTL.
