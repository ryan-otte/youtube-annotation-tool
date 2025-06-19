// This fixed setup file uses a different approach for ES modules

// Import Jest functions
import { jest } from '@jest/globals';

// Export these functions so they can be imported into test files
export { jest };
export { expect, test, describe, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';

// For CommonJS compatibility
global.require = require;