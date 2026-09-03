import type { DynamicModule } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';
import { createDbClient } from '@fieldforge/database';
import { loadEnv } from '../config/env';

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleClient = ReturnType<typeof createDbClient>;

@Global()
@Module({})
export class DrizzleModule {
  static forRoot(databaseUrl?: string): DynamicModule {
    loadEnv();

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
