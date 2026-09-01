/**
 * `.cjs` rather than `jest.config.ts`: a TypeScript config file needs a loader
 * in every workspace that has one, and this file holds no logic worth type
 * checking. The specs are TypeScript and are type checked by ts-jest.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  ...require('@fieldforge/jest-config/nestjs'),
  displayName: 'notification-service'
};
