import type { IContextStrategy } from '@/lib/application/strategies/IContextStrategy';
import type { MetricContext } from '@/types/project';

export class OFIContextStrategy implements IContextStrategy {
  /**
   * Generates XAI context for OFI metric.
   */
  generateContext(value: number, projectData: any): MetricContext {
    const interpretation = this.interpretValue(value);
    const recommendations = this.generateRecommendations(value, projectData);

    return {
      category: 'operational',
      formula: '(Manual Process Hours × Cost × 52) / Annual Revenue',
      assumptions: [
        'Manual processes identified are representative of total operational friction',
        '52 working weeks per year (standard business year)',
        'Hourly costs include fully-loaded labor rates',
        'Current revenue baseline remains stable during analysis',
      ],
      constraints: [
        'Does not capture indirect costs of manual processes',
        'Assumes linear relationship between hours and cost',
        'May underestimate opportunity cost of innovation',
        'Excludes quality impact of manual processes',
      ],
      interpretation,
      benchmarks: {
        optimal: 0.03,
        acceptable: 0.08,
        industry: 0.10,
      },
      recommendations,
    };
  }

  getMetricName(): string {
    return 'OFI';
  }

  private interpretValue(value: number): 'positive' | 'negative' | 'neutral' {
    if (value <= 0.03) return 'positive';
    if (value >= 0.08) return 'negative';
    return 'neutral';
  }

  private generateRecommendations(value: number, projectData: any): string[] {
    const recommendations: string[] = [];

    // Calculate potential savings
    const manualHours = projectData.vanguardInput?.manualProcessHoursPerWeek || 0;
    const hourlyCost = projectData.vanguardInput?.averageHourlyCost || 0;
    const automationPotential = projectData.vanguardInput?.automationPotential || 0;
    const annualCost = manualHours * hourlyCost * 52;
    const potentialSavings = annualCost * (automationPotential / 100);

    if (value <= 0.03) {
      recommendations.push('✅ Optimal operational efficiency - Best-in-class performance');
      recommendations.push('Maintain current automation levels');
      recommendations.push('Document and share best practices across organization');
      recommendations.push('Consider opportunities for further optimization in adjacent areas');
    } else if (value <= 0.08) {
      recommendations.push('⚠️ Acceptable efficiency but improvement opportunities exist');
      recommendations.push(
        `Potential annual savings through automation: $${potentialSavings.toLocaleString()}`
      );
      recommendations.push('Prioritize high-volume, repeatable processes for automation');
      recommendations.push('Conduct detailed ROI analysis for automation initiatives');
      recommendations.push('Vanguard Crux can help identify quick-win automation opportunities');
    } else {
      recommendations.push('🚨 High operational friction - Automation strongly recommended');
      recommendations.push(
        `Critical: Potential annual savings: $${potentialSavings.toLocaleString()}`
      );
      recommendations.push('Manual processes are significantly impacting profitability');
      recommendations.push('Immediate automation initiative recommended');
      recommendations.push(
        'Vanguard Crux Diagnostic: Schedule operational efficiency assessment'
      );

      // Calculate ROI of automation
      const automationCostEstimate = potentialSavings * 0.3; // 30% of annual savings
      const automationROI = (potentialSavings / automationCostEstimate) * 100;
      recommendations.push(
        `Estimated automation ROI: ${automationROI.toFixed(0)}% (payback < 4 months)`
      );
    }

    // Industry comparison
    const industryGap = ((value - 0.10) / 0.10) * 100;
    if (industryGap > 0) {
      recommendations.push(
        `Performance is ${Math.abs(industryGap).toFixed(0)}% above industry average - priority improvement area`
      );
    } else {
      recommendations.push(
        `Performance is ${Math.abs(industryGap).toFixed(0)}% better than industry average`
      );
    }

    return recommendations;
  }
}
