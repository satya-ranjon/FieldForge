import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Loads environment variables from the nearest `.env` file candidate into the
 * target environment (defaults to `process.env`) without overwriting existing variables.
 */
export function loadEnv(targetEnv: NodeJS.ProcessEnv = process.env): void {
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
          const trimmedKey = key.trim();
          let val = rest.join('=').trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (!targetEnv[trimmedKey]) {
            targetEnv[trimmedKey] = val;
          }
        }
      }
      break;
    }
  }
}
