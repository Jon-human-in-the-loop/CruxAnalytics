export interface StrategicContext {
  interpretation: string;
  recommendations: string[];
  warnings: string[];
  confidence: number;
  influencingFactors: string[];
  generatedAt: Date;
}

export interface XAIResult<T> {
  value: T;
  context: StrategicContext;
  metadata: {
    calculationMethod: string;
    inputs: Record<string, unknown>;
    timestamp: Date;
    version: string;
  };
}

export interface XAIContextConfig {
  language?: 'en' | 'es';
  includeDetailsMode?: boolean;
  confidenceThreshold?: number;
  customTemplates?: Record<string, string>;
  sections?: {
    interpretation?: boolean;
    recommendations?: boolean;
    warnings?: boolean;
    influencingFactors?: boolean;
  };
}

export interface XAIScenarioResult<T> {
  best: XAIResult<T>;
  expected: XAIResult<T>;
  worst: XAIResult<T>;
  comparison: {
    keyDifferences: string[];
    riskAnalysis: string;
    recommendedScenario: 'best' | 'expected' | 'worst';
    overallConfidence: number;
  };
}

export interface MetricThresholds {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

export type PerformanceLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
