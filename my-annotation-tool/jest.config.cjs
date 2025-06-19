/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    verbose: true,
    transform: {
      '^.+\\.(js|jsx)$': '<rootDir>/jest-esm-transformer.cjs'
    },
    moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
    transformIgnorePatterns: ['node_modules/(?!(somePkg-to-transform))']
  };