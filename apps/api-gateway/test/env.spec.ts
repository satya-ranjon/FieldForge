import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnv } from '@fieldforge/common';

describe('loadEnv', () => {
  let tempDir: string;
  let tempEnvFile: string;

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fieldforge-env-test-'));
    tempEnvFile = join(tempDir, '.env');
    writeFileSync(
      tempEnvFile,
      [
        '# Test environment configuration',
        'JWT_SECRET=super-secure-jwt-secret-key-32-chars-long',
        'PORT=8000',
        'QUOTED_VAR="hello world"',
        "SINGLE_QUOTED='single quote string'",
        'IGNORED_COMMENT=# not a variable',
        'INVALID_LINE_WITHOUT_EQUALS',
        ''
      ].join('\n'),
      'utf8'
    );
  });

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads environment variables into a target environment object from specified path', () => {
    const mockEnv: NodeJS.ProcessEnv = {};
    loadEnv(mockEnv, tempEnvFile);

    expect(mockEnv.JWT_SECRET).toBe('super-secure-jwt-secret-key-32-chars-long');
    expect(mockEnv.PORT).toBe('8000');
    expect(mockEnv.QUOTED_VAR).toBe('hello world');
    expect(mockEnv.SINGLE_QUOTED).toBe('single quote string');
    expect(mockEnv.INVALID_LINE_WITHOUT_EQUALS).toBeUndefined();
  });

  it('does not overwrite existing environment variables', () => {
    const mockEnv: NodeJS.ProcessEnv = {
      JWT_SECRET: 'custom-existing-secret-that-must-not-be-overwritten'
    };
    loadEnv(mockEnv, tempEnvFile);

    expect(mockEnv.JWT_SECRET).toBe('custom-existing-secret-that-must-not-be-overwritten');
    expect(mockEnv.PORT).toBe('8000');
  });

  it('handles nonexistent path gracefully without throwing', () => {
    const mockEnv: NodeJS.ProcessEnv = {};
    expect(() => loadEnv(mockEnv, join(tempDir, 'nonexistent.env'))).not.toThrow();
    expect(mockEnv).toEqual({});
  });
});
