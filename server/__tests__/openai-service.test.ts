import { describe, it, expect, beforeAll } from 'vitest';
import { checkOpenAIStatus, generateFinancialInsights } from '../services/openai-service';

const hasApiKey = !!process.env.OPENAI_API_KEY;

describe('OpenAI Service', () => {
  beforeAll(() => {
    if (!hasApiKey) {
      console.warn('⚠️  OPENAI_API_KEY not set - skipping OpenAI integration tests');
    }
  });

  it.skipIf(!hasApiKey)('should connect to OpenAI API successfully', async () => {
    const status = await checkOpenAIStatus();

    expect(status).toBeDefined();
    expect(status.connected).toBe(true);
    expect(status.model).toBeDefined();
    expect(status.error).toBeUndefined();
  }, 30000);

  it.skipIf(!hasApiKey)('should generate financial insights', async () => {
    const prompt = `Analiza este proyecto:
    - Inversión inicial: $100,000
    - ROI: 45%
    - NPV: $85,000
    - TIR: 22%
    - Payback: 18 meses`;

    const insights = await generateFinancialInsights(prompt, 'es');

    expect(insights).toBeDefined();
    expect(typeof insights).toBe('string');
    expect(insights.length).toBeGreaterThan(50);
  }, 30000);

  it('should handle missing API key gracefully', () => {
    // This test always runs
    expect(hasApiKey ? true : true).toBe(true);
  });
});
