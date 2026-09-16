#!/usr/bin/env node
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import {
  createDbClient,
  workOrderOutboxEvents,
  billingOutboxEvents,
  eq,
  and,
  asc
} from '../packages/database/dist/index.js';

// Load environment variables via native Node.js support
if (typeof process.loadEnvFile === 'function') {
  const envPath = resolve(process.cwd(), '.env');
  const exampleEnvPath = resolve(process.cwd(), '.env.example');
  if (existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
    } catch {
      // Continue with process.env
    }
  } else if (existsSync(exampleEnvPath)) {
    try {
      process.loadEnvFile(exampleEnvPath);
    } catch {
      // Continue with process.env
    }
  }
}

type TargetOutbox = 'work-order' | 'billing';

interface ResolvedOutbox {
  target: TargetOutbox;
  tableName: string;
  serviceName: string;
  table: typeof workOrderOutboxEvents | typeof billingOutboxEvents;
}

function resolveOutbox(target?: string): ResolvedOutbox {
  if (target === 'work-order') {
    return {
      target: 'work-order',
      tableName: 'work_order_outbox_events',
      serviceName: 'work-order-service',
      table: workOrderOutboxEvents
    };
  }
  if (target === 'billing') {
    return {
      target: 'billing',
      tableName: 'billing_outbox_events',
      serviceName: 'billing-service',
      table: billingOutboxEvents
    };
  }
  throw new Error(
    `Invalid or missing target '${target}'. Allowed targets: 'work-order', 'billing'`
  );
}

function printUsage(): void {
  console.log(`
FieldForge Transactional Outbox Admin CLI (ISSUE-014)
=====================================================

Usage:
  pnpm outbox:admin list <work-order|billing> [--limit <number>]
  pnpm outbox:admin inspect <work-order|billing> <id> [--show-payload]
  pnpm outbox:admin replay <work-order|billing> <id>

Commands:
  list     Inspect DEAD outbox events for an aggregate table with safe metadata.
  inspect  Display full metadata and error diagnostic for a specific DEAD event.
  replay   Safely requeue a DEAD event back to PENDING (atomic CAS, preserves eventId and payload).

Safety Guarantees:
  - Causal ordering is strictly preserved (predecessor DEAD blocks later same-aggregate events).
  - Replay requires precondition status == 'DEAD'.
  - Payload modification via CLI is strictly forbidden to preserve cryptographic hash integrity.
`);
}

async function run(): Promise<number> {
  const args = process.argv.slice(2);

  // Safety guardrail: reject direct payload modification
  if (args.some((arg) => arg === '--payload' || arg.startsWith('--payload='))) {
    console.error(`[SAFETY ERROR] Direct payload modification via CLI is strictly forbidden.`);
    console.error(
      `Altering event payloads breaks event immutability, cryptographic trace hashes, and idempotency.`
    );
    console.error(
      `To fix a dead event caused by schema or configuration drift, deploy the corrective code fix and then replay.`
    );
    return 1;
  }

  const command = args[0];
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printUsage();
    return 0;
  }

  const targetArg = args[1];
  let resolved: ResolvedOutbox;
  try {
    resolved = resolveOutbox(targetArg);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ARGUMENT ERROR] ${msg}`);
    printUsage();
    return 1;
  }

  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.MYSQL_URI ||
    'mysql://fieldforge:fieldforge_local_only@127.0.0.1:3306/fieldforge';

  const db = createDbClient(dbUrl);

  try {
    if (command === 'list') {
      let limit = 50;
      const limitIndex = args.indexOf('--limit');
      if (limitIndex !== -1 && args[limitIndex + 1]) {
        const parsed = parseInt(args[limitIndex + 1], 10);
        if (!isNaN(parsed) && parsed > 0) {
          limit = parsed;
        }
      }

      console.log(
        `\n🔍 Searching for DEAD events in ${resolved.target} outbox (table: ${resolved.tableName})...`
      );

      const rows = await db
        .select({
          id: resolved.table.id,
          eventId: resolved.table.eventId,
          eventType: resolved.table.eventType,
          aggregateType: resolved.table.aggregateType,
          aggregateId: resolved.table.aggregateId,
          status: resolved.table.status,
          attemptCount: resolved.table.attemptCount,
          createdAt: resolved.table.createdAt,
          updatedAt: resolved.table.updatedAt,
          lastError: resolved.table.lastError
        })
        .from(resolved.table)
        .where(eq(resolved.table.status, 'DEAD'))
        .orderBy(asc(resolved.table.id))
        .limit(limit);

      if (rows.length === 0) {
        console.log(
          `✅ No DEAD outbox events found in ${resolved.target} (${resolved.tableName}).\n`
        );
        return 0;
      }

      console.log(`⚠️ Found ${rows.length} DEAD outbox event(s):\n`);
      for (const r of rows) {
        console.log(`  Row ID:         ${r.id}`);
        console.log(`  Event ID:       ${r.eventId}`);
        console.log(`  Event Type:     ${r.eventType}`);
        console.log(`  Aggregate:      ${r.aggregateType} #${r.aggregateId}`);
        console.log(`  Attempts:       ${r.attemptCount}`);
        console.log(
          `  Created At:     ${r.createdAt ? new Date(r.createdAt).toISOString() : 'N/A'}`
        );
        console.log(
          `  Updated At:     ${r.updatedAt ? new Date(r.updatedAt).toISOString() : 'N/A'}`
        );
        console.log(`  Last Error:     ${r.lastError ?? 'N/A'}`);
        console.log(`  ${'─'.repeat(60)}`);
      }
      console.log(`\nTo replay a dead event after remediation, run:`);
      console.log(`  pnpm outbox:admin replay ${resolved.target} <id>\n`);
      return 0;
    }

    if (command === 'inspect') {
      const idArg = args[2];
      const numericId = parseInt(idArg, 10);
      if (isNaN(numericId) || numericId <= 0) {
        console.error(`[ARGUMENT ERROR] Valid positive integer ID required for inspect command.`);
        return 1;
      }

      const rows = await db
        .select()
        .from(resolved.table)
        .where(eq(resolved.table.id, numericId))
        .limit(1);

      if (rows.length === 0) {
        console.error(
          `[NOT FOUND] Event #${numericId} not found in ${resolved.target} (${resolved.tableName}).`
        );
        return 1;
      }

      const row = rows[0];
      const showPayload = args.includes('--show-payload');

      console.log(`\n📋 Event Details #${row.id} in ${resolved.target} (${resolved.tableName}):`);
      console.log(`  Event ID:       ${row.eventId}`);
      console.log(`  Event Type:     ${row.eventType}`);
      console.log(`  Status:         ${row.status}`);
      console.log(`  Aggregate Type: ${row.aggregateType}`);
      console.log(`  Aggregate ID:   ${row.aggregateId}`);
      console.log(`  Correlation ID: ${row.correlationId}`);
      console.log(`  Attempt Count:  ${row.attemptCount}`);
      console.log(`  Claimed By:     ${row.claimedBy ?? 'None'}`);
      console.log(`  Last Error:     ${row.lastError ?? 'None'}`);
      console.log(
        `  Created At:     ${row.createdAt ? new Date(row.createdAt).toISOString() : 'N/A'}`
      );
      console.log(
        `  Updated At:     ${row.updatedAt ? new Date(row.updatedAt).toISOString() : 'N/A'}`
      );
      console.log(
        `  Published At:   ${row.publishedAt ? new Date(row.publishedAt).toISOString() : 'None'}`
      );

      console.log(`\nPayload Diagnostic:`);
      if (showPayload) {
        console.log(`⚠️  [SENSITIVE DATA WARNING] Raw event payload:`);
        try {
          const payloadStr =
            typeof row.payload === 'string' ? row.payload : JSON.stringify(row.payload, null, 2);
          console.log(payloadStr);
        } catch {
          console.log('  [Unserializable Payload]');
        }
      } else {
        if (row.payload && typeof row.payload === 'object') {
          const keys = Object.keys(row.payload as Record<string, unknown>);
          console.log(`  [Protected] Payload contains ${keys.length} keys: [${keys.join(', ')}]`);
          console.log(`  To display full raw payload (SENSITIVE), pass: --show-payload`);
        } else {
          console.log('  [Payload is null or non-object]');
        }
      }
      console.log();
      return 0;
    }

    if (command === 'replay') {
      const idArg = args[2];
      const numericId = parseInt(idArg, 10);
      if (isNaN(numericId) || numericId <= 0) {
        console.error(`[ARGUMENT ERROR] Valid positive integer ID required for replay command.`);
        return 1;
      }

      console.log(
        `\n🔄 Attempting atomic replay for DEAD event #${numericId} in ${resolved.target}...`
      );

      const updateClient = db as unknown as {
        update: (table: unknown) => {
          set: (values: Record<string, unknown>) => {
            where: (clause: unknown) => Promise<Array<{ affectedRows?: number }>>;
          };
        };
      };

      const now = new Date();
      const res = await updateClient
        .update(resolved.table)
        .set({
          status: 'PENDING',
          attemptCount: 0,
          nextAttemptAt: now,
          claimedBy: null,
          claimToken: null,
          leaseExpiresAt: null,
          lastError: 'REPLAY_QUEUED_BY_OPERATOR',
          updatedAt: now
        })
        .where(and(eq(resolved.table.id, numericId), eq(resolved.table.status, 'DEAD')));

      const affectedRows = (res && res[0] && res[0].affectedRows) ?? 0;

      if (affectedRows > 0) {
        console.log(
          `✅ [SUCCESS] Event #${numericId} successfully transitioned from DEAD to PENDING.`
        );
        console.log(`   - Attempt count reset to 0`);
        console.log(`   - Next attempt scheduled immediately`);
        console.log(`   - Causal blocker unblocked for downstream events on the same aggregate.`);
        console.log(
          `   - The relay engine will claim and process it on the next poll cycle or trigger.\n`
        );
        return 0;
      }

      // Determine reason for failure
      const existing = await db
        .select({ id: resolved.table.id, status: resolved.table.status })
        .from(resolved.table)
        .where(eq(resolved.table.id, numericId))
        .limit(1);

      if (existing.length === 0) {
        console.error(
          `❌ [NOT FOUND] Event #${numericId} not found in ${resolved.target} (${resolved.tableName}).\n`
        );
        return 1;
      }

      console.error(
        `❌ [REJECTED] Event #${numericId} cannot be replayed: current status is '${existing[0].status}' (expected 'DEAD').\n`
      );
      return 1;
    }

    console.error(`[COMMAND ERROR] Unknown command '${command}'.`);
    printUsage();
    return 1;
  } finally {
    const client = (db as unknown as { $client?: { end?: () => Promise<void> } }).$client;
    if (client && typeof client.end === 'function') {
      await client.end();
    }
  }
}

run()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((err) => {
    console.error('[UNEXPECTED ERROR]', err);
    process.exit(1);
  });
