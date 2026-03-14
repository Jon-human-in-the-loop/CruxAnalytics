import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: 'https://api.openai.com/v1',
  dangerouslyAllowBrowser: false,
});

const FINANCIAL_ANALYST_SYSTEM_PROMPT = `Eres un analista financiero senior especializado en evaluación de proyectos empresariales y business cases. Tu experiencia incluye:

- Análisis de ROI, NPV, TIR y métricas financieras avanzadas
- Evaluación de riesgos y viabilidad de proyectos
- Recomendaciones estratégicas basadas en datos
- Identificación de factores críticos de éxito y fracaso

Tu tarea es analizar los resultados financieros de un proyecto y proporcionar:
1. Un diagnóstico claro de viabilidad (Viable, Revisar, No Viable)
2. Análisis de fortalezas y debilidades
3. Recomendaciones accionables y específicas
4. Identificación de riesgos potenciales

Sé conciso, profesional y enfócate en insights prácticos que el usuario pueda implementar.`;

export async function generateFinancialInsights(
  prompt: string,
  language: 'es' | 'en' = 'es',
  customSystemPrompt?: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured. Please add it to your environment variables.');
  }

  const systemPrompt = customSystemPrompt || (
    language === 'en'
      ? FINANCIAL_ANALYST_SYSTEM_PROMPT.replace(/eres/gi, 'you are').replace(/tu tarea/gi, 'your task')
      : FINANCIAL_ANALYST_SYSTEM_PROMPT
  );

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from OpenAI');

    return response;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is missing or invalid. Please configure OPENAI_API_KEY in your environment.');
      }
      if (error.message.includes('quota')) {
        throw new Error('OpenAI API quota exceeded. Please check your OpenAI account billing.');
      }
      throw error;
    }
    throw new Error('Failed to generate AI insights');
  }
}

export async function checkOpenAIStatus(): Promise<{
  connected: boolean;
  model: string;
  error?: string;
}> {
  if (!process.env.OPENAI_API_KEY) {
    return { connected: false, model: 'none', error: 'OPENAI_API_KEY not configured' };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5,
    });
    return { connected: true, model: completion.model };
  } catch (error) {
    return {
      connected: false,
      model: 'none',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function getAvailableModels(): string[] {
  return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
}
