import type { IContextStrategy } from '@/lib/application/strategies/IContextStrategy';
import type { MetricContext } from '@/types/project';

/**
 * Strategy for generating XAI context for NPV metric.
 * Focuses on time value of money and value creation analysis.
 * 
 * @implements {IContextStrategy}
 */
export class NPVContextStrategy implements IContextStrategy {
  /**
   * Generates XAI context for NPV metric.
   */
  generateContext(value: number, projectData: any): MetricContext {
    const interpretation = this.interpretValue(value);
    const recommendations = this.generateRecommendations(value, projectData);

    return {
      category: 'financial',
      formula: 'NPV = -Initial Investment + Σ(Cash Flow_t / (1 + r)^t)',
      assumptions: [
        `Discount rate: ${projectData.discountRate || 'N/A'}% annually`,
        'Cash flows occur at end of each period',
        'Discount rate remains constant',
        'All projected cash flows are realized',
      ],
      constraints: [
        'Sensitive to discount rate changes',
        'Assumes reinvestment at discount rate',
        'Does not consider project size differences',
        'Excludes non-monetary benefits',
      ],
      interpretation,
      benchmarks: {
        optimal: projectData.initialInvestment * 0.5 || 50000,
        acceptable: 0,
        industry: projectData.initialInvestment * 0.25 || 25000,
      },
      recommendations,
    };
  }

  getMetricName(): string {
    return 'NPV';
  }

  private interpretValue(value: number): 'positive' | 'negative' | 'neutral' {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  }

  private generateRecommendations(value: number, projectData: any): string[] {
    const recommendations: string[] = [];

    if (value > 0) {
      const initialInvestment = projectData.initialInvestment || 1;
      const valueCreationRatio = value / initialInvestment;

      if (valueCreationRatio > 0.5) {
        recommendations.push(
          `Strong value creation: NPV represents ${(valueCreationRatio * 100).toFixed(0)}% of initial investment`
        );
        recommendations.push('Project creates significant shareholder value');
        recommendations.push('Proceed with implementation as planned');
      } else if (valueCreationRatio > 0.2) {
        recommendations.push('Moderate value creation opportunity');
        recommendations.push('Consider sensitivity analysis on key assumptions');
        recommendations.push('Monitor discount rate impact on value');
      } else {
        recommendations.push('Marginal value creation');
        recommendations.push('Small changes in assumptions could make project unviable');
        recommendations.push('Build in larger safety margins');
        recommendations.push('Consider whether other projects offer better value');
      }
    } else if (value === 0) {
      recommendations.push('Breakeven NPV - Project returns exactly match discount rate');
      recommendations.push('No value created or destroyed');
      recommendations.push('Consider opportunity cost of capital');
      recommendations.push('Look for ways to improve project returns');
    } else {
      recommendations.push('Negative NPV - Project destroys value');
      recommendations.push('Returns are below cost of capital');
      recommendations.push('Not recommended without significant improvements');
      recommendations.push('Consider: reducing costs, increasing revenues, or shorter timeline');
    }

    // Vanguard Crux insight
    if (value < projectData.initialInvestment * 0.3) {
      recommendations.push(
        'Vanguard Crux Insight: Analyze Strategic Efficiency Ratio (SER) to optimize resource allocation'
      );
    }

    return recommendations;
  }
}
