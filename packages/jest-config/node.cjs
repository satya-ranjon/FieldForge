/**
 * Shared Jest base configuration for FieldForge Node.js (non-DOM) workspaces.
 *
 * This module intentionally exports a plain object literal instead of calling
 * `createDefaultPreset()` from `ts-jest`. Jest resolves the `'ts-jest'`
 * transformer name relative to the consuming project's `rootDir`, so this
 * package needs no dependencies of its own — exactly like `@fieldforge/tsconfig`.
 *
 * `preset` is deliberately unset: ts-jest documents that combining `preset`
 * with a custom `transform` causes files to be transformed incorrectly, and the
 * legacy string presets are slated for removal.
 *
 * Coverage thresholds are NOT enforced here. SRS section 8 requires >= 90%
 * statement coverage; that gate is enabled per workspace as real suites land,
 * so that an empty workspace fails for having no tests rather than silently
 * passing a threshold computed over zero files. See docs/ISSUES.md (H7).
 *
 * Consuming workspaces must invoke Jest as
 * `node --experimental-vm-modules node_modules/jest/bin/jest.js`, not the bare
 * `jest` binary. NestJS 12 ships ESM only (`"type": "module"`, no CommonJS
 * build) while the services compile to CommonJS, so every spec that touches
 * `@nestjs/common` needs `require(ESM)` inside Jest's sandbox. Jest enables that
 * path only when `vm.SourceTextModule` is exposed, which needs both Node 24.9+
 * (see .nvmrc) and that flag. Without it the suites fail to even load, with
 * "Must use import to load ES Module".
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: true
      }
    ]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/test/**/*.spec.ts'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text-summary', 'lcov'],
  clearMocks: true,
  restoreMocks: true,
  resetModules: true
};
