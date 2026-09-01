import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '../../.env'), quiet: true });

const databasePassword = process.env.DB_PASSWORD;

if (!databasePassword) {
  throw new Error('DB_PASSWORD is required. Copy .env.example to .env for local development.');
}

export default defineConfig({
  schema: './src/schemas/*',
  out: './src/migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'fieldforge_root',
    password: databasePassword,
    database: process.env.DB_NAME || 'fieldforge'
  }
});
