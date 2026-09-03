import { loadEnv } from '@fieldforge/common';

describe('loadEnv', () => {
  it('loads environment variables into a target environment object', () => {
    const mockEnv: NodeJS.ProcessEnv = {};
    loadEnv(mockEnv);

    // Should load variables present in root .env such as JWT_SECRET
    expect(mockEnv.JWT_SECRET).toBeDefined();
    expect(typeof mockEnv.JWT_SECRET).toBe('string');
  });

  it('does not overwrite existing environment variables', () => {
    const mockEnv: NodeJS.ProcessEnv = {
      JWT_SECRET: 'custom-existing-secret-that-must-not-be-overwritten'
    };
    loadEnv(mockEnv);

    expect(mockEnv.JWT_SECRET).toBe('custom-existing-secret-that-must-not-be-overwritten');
  });
});
