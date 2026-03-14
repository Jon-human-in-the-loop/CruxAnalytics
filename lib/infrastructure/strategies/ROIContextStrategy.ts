import type { IContextStrategy } from '@/lib/application/strategies/IContextStrategy';
import type { MetricContext } from '@/types/project';

/**
 * Strategy for generating XAI context for ROI metric.
 * Provides detailed interpretation, benchmarks, and recommendations.
 * 
 * @implements {IContextStrategy}
 */
export class ROIContextStrategy implements IContextStrategy {
  /**
   * Generates XAI context for ROI metric.
   * 
   * @param value - ROI percentage value
   * @param projectData - Project data for context
   * @returns Complete metric context with XAI information
   */
  generateContext(value: number, projectData: any): MetricContext {
    const interpretation = this.interpretValue(value);
    const recommendations = this.generateRecommendations(value, projectData);

    return {
      category: 'financial',
      formula: '((Total Revenue - Initial Investment) / Initial Investment) × 100',
      assumptions: [
        'Linear revenue growth over project duration',
        'No inflation adjustment applied',
        'Operating and maintenance costs remain constant',
        'Revenue projections based on provided growth rate',
      ],
      constraints: [
        `Project duration: ${projectData.projectDuration || 'N/A'} months`,
        `Initial investment: $${(projectData.initialInvestment || 0).toLocaleString()}`,
        'Does not account for opportunity cost',
        'Excludes tax implications',
      ],
      interpretation,
      benchmarks: {
        optimal: 150,
        acceptable: 80,
        industry: 100,
      },
      recommendations,
    };
  }

  /**
   * Gets the metric name.
   */
  getMetricName(): string {
    return 'ROI';
  }

  /**
   * Interprets the ROI value.
   * 
   * @private
   */
  private interpretValue(value: number): 'positive' | 'negative' | 'neutral' {
    if (value >= 80) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  }

  private generateRecommendations(value: number, projectData: any): string[] {
    const recommendations: string[] = [];

    if (value >= 150) {
      recommendations.push('Excellent ROI - Strong investment opportunity');
      recommendations.push('Consider accelerating project timeline to realize returns faster');
      recommendations.push('Document success factors for future project replication');
    } else if (value >= 80) {
      recommendations.push('Acceptable ROI - Viable investment with standard returns');
      recommendations.push('Look for cost optimization opportunities to improve returns');
      recommendations.push('Monitor actual vs. projected performance closely');
    } else if (value >= 0) {
      recommendations.push('Low ROI - Marginal investment value');
      recommendations.push('Consider reducing initial investment or increasing revenue projections');
      recommendations.push('Explore alternative project structures or phased approach');
      recommendations.push('Evaluate if non-financial benefits justify the investment');
    } else {
      recommendations.push('Negative ROI - Investment not recommended without changes');
      recommendations.push('Significantly reduce costs or increase revenue projections');
      recommendations.push('Consider alternative projects with better returns');
      recommendations.push('Re-evaluate project viability and strategic alignment');
    }

    // Add Vanguard Crux-specific recommendations
    if (value < 100) {
      recommendations.push(
        'Vanguard Crux Insight: Consider operational efficiency improvements (see OFI metric)'
      );
    }

    return recommendations;
  }
}
