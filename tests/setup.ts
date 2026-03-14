import { beforeAll } from 'vitest';

/**
 * Test environment setup
 * Sets default environment variables for tests
 */
beforeAll(() => {
  // Mock payments configuration
  process.env.EXPO_PUBLIC_USE_MOCK_PAYMENTS = 'true';

  // Test environment
  process.env.NODE_ENV = 'test';

  // OAuth configuration
  process.env.OAUTH_SERVER_URL = 'http://localhost:3000';

  // Database configuration for tests
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://test:test@localhost:3306/test';

  // Suppress API key warnings in test output
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('OPENAI_API_KEY') || message.includes('API key')) {
      return; // Suppress API key warnings
    }
    originalWarn(...args);
  };
});
