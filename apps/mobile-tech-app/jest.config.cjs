/**
 * Jest configuration for mobile-tech-app.
 * @type {import('jest').Config}
 */
module.exports = {
  ...require('@fieldforge/jest-config/node'),
  displayName: 'mobile-tech-app',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: false
      }
    ]
  },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/test/mocks/react-native.mock.js',
    '^expo-location$': '<rootDir>/test/mocks/expo-location.mock.js'
  }
};
