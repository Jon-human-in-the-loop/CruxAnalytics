import { Router } from 'express';
import { z } from 'zod';
import { generateFinancialInsights, checkOpenAIStatus, getAvailableModels } from '../services/openai-service';

const router = Router();

const insightRequestSchema = z.object({
  prompt: z.string(),
  language: z.enum(['es', 'en']),
  systemPrompt: z.string().optional(),
});

router.post('/insights', async (req, res) => {
  try {
    const { prompt, language, systemPrompt } = insightRequestSchema.parse(req.body);

    // Generate insights using OpenAI
    const insights = await generateFinancialInsights(prompt, language, systemPrompt);

    res.json({
      insights,
      timestamp: new Date().toISOString(),
      provider: 'openai',
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({
      error: 'Failed to generate AI insights',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

router.get('/status', async (req, res) => {
  try {
    const status = await checkOpenAIStatus();

    res.json({
      ...status,
      timestamp: new Date().toISOString(),
      availableModels: getAvailableModels(),
      currentModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    });
  } catch (error) {
    console.error('Error checking OpenAI status:', error);

    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/models', (req, res) => {
  res.json({
    models: getAvailableModels(),
    current: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    timestamp: new Date().toISOString(),
  });
});

export default router;
