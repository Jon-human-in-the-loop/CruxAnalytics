import type { IContextStrategy } from '@/application/strategies/IContextStrategy';
import { Metric } from '@/lib/domain/entities/Metric';
import type { ProjectData } from '@/types/project';

/**
 * Service for generating XAI (Explainable AI) context for metrics.
 * Uses Strategy pattern to delegate context generation to appropriate strategies.
 * 
 * 
 * @example
 * ```typescript
 * const xaiService = new XAIService();
 * 
 * // Register strategies
 * xaiService.registerStrategy('ROI', new ROIContextStrategy());
 * xaiService.registerStrategy('NPV', new NPVContextStrategy());
 * 
 * // Generate enriched metric
 * const roiMetric = xaiService.enrichMetric('ROI', 125.5, projectData);
 * console.log(roiMetric.toXAIFormat());
 * ```
 */
export class XAIService {
  private strategies: Map<string, IContextStrategy> = new Map();

  constructor() {
    // Strategies will be registered externally or in a factory
  }

  /**
   * Registers a context generation strategy for a specific metric.
   * 
   * @param metricName - Name of the metric (e.g., 'ROI', 'NPV')
   * @param strategy - Strategy implementation for generating context
   * 
   * @example
   * ```typescript
   * xaiService.registerStrategy('OFI', new OFIContextStrategy());
   * ```
   */
  registerStrategy(metricName: string, strategy: IContextStrategy): void {
    this.strategies.set(metricName.toUpperCase(), strategy);
  }

  /**
   * Registers multiple strategies at once.
   * 
   * @param strategies - Array of strategies to register
   */
  registerStrategies(strategies: IContextStrategy[]): void {
    strategies.forEach((strategy) => {
      this.registerStrategy(strategy.getMetricName(), strategy);
    });
  }

  /**
   * Enriches a metric with XAI context.
   * Creates a Metric domain entity with full explainability context.
   * 
   * @param name - Metric name
   * @param value - Calculated metric value
   * @param projectData - Project data for context generation
   * @returns Metric entity with XAI context
   * 
   * @throws {Error} If metric value is invalid
   * 
   * @example
   * ```typescript
   * const npvMetric = xaiService.enrichMetric('NPV', 50000, projectData);
   * const xaiData = npvMetric.toXAIFormat();
   * // Send to LLM for interpretation
   * ```
   */
  enrichMetric(name: string, value: number, projectData: ProjectData): Metric {
    const strategy = this.strategies.get(name.toUpperCase());

    if (!strategy) {
      // Use default strategy if specific one not found
      const defaultContext = this.generateDefaultContext(name, value);
      return new Metric(name, value, defaultContext);
    }

    const context = strategy.generateContext(value, projectData);
    return new Metric(name, value, context);
  }

  /**
   * Enriches multiple metrics at once.
   * 
   * @param metrics - Array of { name, value } pairs
   * @param projectData - Project data for context generation
   * @returns Array of enriched Metric entities
   * 
   * @example
   * ```typescript
   * const enrichedMetrics = xaiService.enrichMetrics([
   *   { name: 'ROI', value: 125.5 },
   *   { name: 'NPV', value: 50000 },
   * ], projectData);
   * ```
   */
  enrichMetrics(
    metrics: Array<{ name: string; value: number }>,
    projectData: ProjectData
  ): Metric[] {
    return metrics.map((metric) =>
      this.enrichMetric(metric.name, metric.value, projectData)
    );
  }

  /**
   * Checks if a strategy is registered for a metric.
   * 
   * @param metricName - Name of the metric to check
   * @returns true if strategy exists
   */
  hasStrategy(metricName: string): boolean {
    return this.strategies.has(metricName.toUpperCase());
  }

  /**
   * Gets all registered metric names.
   * 
   * @returns Array of metric names
   */
  getRegisteredMetrics(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Generates a default context for metrics without specific strategies.
   * Provides basic context structure.
   * 
   * @private
   * @param name - Metric name
   * @param value - Metric value
   * @returns Default MetricContext
   */
  private generateDefaultContext(
    name: string,
    value: number
  ): import('@/types/project').MetricContext {
    return {
      category: 'financial',
      formula: 'Not specified',
      assumptions: ['Standard calculation methodology'],
      constraints: ['Subject to input data accuracy'],
      interpretation: value >= 0 ? 'positive' : 'negative',
      recommendations: [
        'Review detailed documentation for this metric',
        'Validate input data accuracy',
      ],
    };
  }

  /**
   * Clears all registered strategies.
   * Useful for testing or reconfiguration.
   */
  clearStrategies(): void {
    this.strategies.clear();
  }
}
