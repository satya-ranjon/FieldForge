# ADR 002: RabbitMQ Topic Exchanges for Asynchronous Event Propagation

## Context
State transitions in work orders trigger multiple downstream reactions: billing escrow capture, push notifications, dispatch updates, and audit logging.

## Decision
Use **RabbitMQ** with a centralized Topic Exchange (\`fieldforge.events.topic\`) and routing keys formatted as \`<domain>.<entity>.<action>\`.

## Consequences
- Decouples microservice dependencies.
- Dead letter exchanges guarantee resilience during transient service outages.
