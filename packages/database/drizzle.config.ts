import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schemas/*',
  out: './src/migrations',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'fieldforge_root',
    password: process.env.DB_PASSWORD || 'fieldforge_secret',
    database: process.env.DB_NAME || 'fieldforge'
  }
});
