import type { IContextStrategy } from '@/lib/application/strategies/IContextStrategy';
import type { MetricContext } from '@/types/project';

/**
 * Default strategy for generating XAI context.
 * Used as fallback when no specific strategy is registered for a metric.
 * 
 * @implements {IContextStrategy}
 */
export class DefaultContextStrategy implements IContextStrategy {
  private metricName: string;

  constructor(metricName: string = 'Unknown Metric') {
    this.metricName = metricName;
  }

  /**
   * Generates basic XAI context.
   */
  generateContext(value: number, projectData: any): MetricContext {
    const interpretation = value >= 0 ? 'positive' : 'negative';

    return {
      category: 'financial',
      formula: 'Standard calculation methodology (see documentation)',
      assumptions: [
        'Input data is accurate and complete',
        'Standard calculation methodology applied',
        'Historical data is representative of future performance',
      ],
      constraints: [
        'Context generated using default strategy',
        'Consult detailed documentation for specific formula',
        'Results subject to input data accuracy',
      ],
      interpretation,
      recommendations: [
        'Review detailed metric documentation for interpretation guidance',
        'Validate input data accuracy',
        'Compare against historical benchmarks',
        'Consider consulting with Vanguard Crux analyst for detailed interpretation',
      ],
    };
  }

  getMetricName(): string {
    return this.metricName;
  }
}
