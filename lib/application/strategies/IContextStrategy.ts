import type { MetricContext } from '@/types/project';

/**
 * Strategy interface for generating XAI context for metrics.
 * Different strategies implement context generation for different metric types.
 * 
 * @interface IContextStrategy
 * 
 * @example
 * ```typescript
 * class ROIContextStrategy implements IContextStrategy {
 *   generateContext(value: number, projectData: any): MetricContext {
 *     return {
 *       category: 'financial',
 *       formula: '((Total Revenue - Initial Investment) / Initial Investment) × 100',
 *       assumptions: [...],
 *       constraints: [...],
 *       interpretation: value > 0 ? 'positive' : 'negative',
 *       benchmarks: { industry: 100, optimal: 150, acceptable: 80 },
 *       recommendations: [...]
 *     };
 *   }
 * }
 * ```
 */
export interface IContextStrategy {
  /**
   * Generates XAI context for a metric value.
   * 
   * @param value - The calculated metric value
   * @param projectData - The project data used for context
   * @returns MetricContext with full XAI information
   */
  generateContext(value: number, projectData: any): MetricContext;

  /**
   * Gets the metric name this strategy handles
   */
  getMetricName(): string;
}
