/**
 * Shared Jest configuration for FieldForge NestJS microservices.
 *
 * Extends the Node base with the exclusions appropriate to a Nest service:
 * dependency-injection wiring modules and the process entrypoint carry no
 * branching logic worth covering, so counting them only depresses the SRS
 * section 8 coverage figure without telling us anything.
 *
 * @type {import('jest').Config}
 */
const base = require('./node.cjs');

module.exports = {
  ...base,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.module.ts',
    '!<rootDir>/src/**/*.dto.ts',
    '!<rootDir>/src/main.ts'
  ]
};
