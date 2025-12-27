const path = require('path');

// This config is at: tests/scripts/mobile/e2e/jest.config.js
// Detox runs Jest from: apps/mobile/, but we set rootDir to system-pos root
// so Jest can find tests in tests/scripts/mobile/e2e/
const systemPosRoot = path.resolve(__dirname, '../../../../');
const mobileAppDir = path.join(systemPosRoot, 'apps/mobile');

module.exports = {
  // Root directory is system-pos root (allows Jest to find tests outside apps/mobile)
  rootDir: systemPosRoot,
  // Test files are in tests/scripts/mobile/e2e/ - relative to rootDir
  testMatch: ['<rootDir>/tests/scripts/mobile/e2e/**/*.e2e.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  testEnvironment: 'detox/runners/jest/testEnvironment',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      configFile: path.join(mobileAppDir, 'babel.config.js'),
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@expo|expo|detox|@react-navigation)/)',
  ],
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  verbose: true,
};

