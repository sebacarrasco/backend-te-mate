module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/migrations/**',
    '!src/seeds/**',
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Run integration tests sequentially to avoid database race conditions
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      transform: {
        '^.+\\.tsx?$': 'ts-jest',
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup.ts',
        '<rootDir>/tests/integration/setup.ts',
      ],
      transform: {
        '^.+\\.tsx?$': 'ts-jest',
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      // Run integration tests sequentially beacuause of the database
      maxWorkers: 1,
    },
  ],
};
