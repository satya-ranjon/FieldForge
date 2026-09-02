import type { DynamicModule } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';
import { createDbClient } from '@fieldforge/database';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleClient = ReturnType<typeof createDbClient>;

function loadEnvFile() {
  if (process.env.DATABASE_URL) return;

  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(__dirname, '../../../../.env'),
    resolve(__dirname, '../../../.env')
  ];

  for (const file of candidates) {
    if (existsSync(file)) {
      const content = readFileSync(file, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').trim();
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
      break;
    }
  }
}

@Global()
@Module({})
export class DrizzleModule {
  static forRoot(databaseUrl?: string): DynamicModule {
    loadEnvFile();

    const connectionUri =
      databaseUrl ||
      process.env.DATABASE_URL ||
      `mysql://${process.env.DB_USER || 'fieldforge'}:${process.env.DB_PASSWORD || 'fieldforge_local_only'}@${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'fieldforge'}`;

    const client = createDbClient(connectionUri);

    const provider = {
      provide: DRIZZLE,
      useValue: client
    };

    return {
      module: DrizzleModule,
      providers: [provider],
      exports: [provider]
    };
  }
}
