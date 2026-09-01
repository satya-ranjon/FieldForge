/**
 * `.cjs` rather than `jest.config.ts` on purpose: a TypeScript config file
 * needs a loader (`ts-node`) in every workspace that has one, and this file
 * holds no logic worth type checking. The specs themselves are TypeScript and
 * are type checked by ts-jest (`diagnostics: true` in the shared preset).
 *
 * @type {import('jest').Config}
 */
module.exports = {
  ...require('@fieldforge/jest-config/node'),
  displayName: 'contracts'
};
