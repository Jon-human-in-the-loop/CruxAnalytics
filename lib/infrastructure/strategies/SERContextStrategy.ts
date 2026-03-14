import type { IContextStrategy } from '@/lib/application/strategies/IContextStrategy';
import type { MetricContext } from '@/types/project';

export class SERContextStrategy implements IContextStrategy {
  generateContext(value: number, projectData: any): MetricContext {
    const interpretation = this.interpretValue(value);
    const recommendations = this.generateRecommendations(value, projectData);

    return {
      category: 'strategic',
      formula: '(Revenue Growth Rate) / (Burn Rate Increase)',
      assumptions: [
        'Revenue growth is sustainable and not one-time events',
        'Burn rate changes reflect operational reality',
        'Growth investments show in burn rate before revenue impact',
        'Market conditions remain relatively stable',
      ],
      constraints: [
        'Sensitive to timing differences between investment and returns',
        'May not capture full strategic value of investments',
        'Does not account for market expansion costs',
        'Excludes non-financial strategic outcomes',
      ],
      interpretation,
      benchmarks: {
        optimal: 2.0,
        acceptable: 1.0,
        industry: 1.2,
      },
      recommendations,
    };
  }

  getMetricName(): string {
    return 'SER';
  }

  private interpretValue(value: number): 'positive' | 'negative' | 'neutral' {
    if (value >= 1.5) return 'positive';
    if (value < 0.8) return 'negative';
    return 'neutral';
  }

  private generateRecommendations(value: number, projectData: any): string[] {
    const recommendations: string[] = [];

    const currentRevenue = projectData.vanguardInput?.currentRevenue || 0;
    const previousRevenue = projectData.vanguardInput?.previousRevenue || 1;
    const currentBurn = projectData.vanguardInput?.currentBurnRate || 0;
    const previousBurn = projectData.vanguardInput?.previousBurnRate || 1;

    const revenueGrowth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    const burnChange = ((currentBurn - previousBurn) / previousBurn) * 100;

    if (value >= 2.0) {
      recommendations.push('✅ Excellent strategic efficiency - Best-in-class capital efficiency');
      recommendations.push(
        `Revenue growing ${revenueGrowth.toFixed(0)}% while burn rate increase is minimal`
      );
      recommendations.push('Sustainable growth trajectory with strong unit economics');
      recommendations.push('Current strategy demonstrates superior resource allocation');
      recommendations.push('Consider accelerating growth investments while maintaining efficiency');
      recommendations.push('Document success factors for institutional knowledge');
    } else if (value >= 1.5) {
      recommendations.push('✅ Strong efficiency - Above industry standard performance');
      recommendations.push('Growth is outpacing cost increases significantly');
      recommendations.push('Maintain current operational discipline while scaling');
      recommendations.push('Monitor key efficiency metrics as you grow');
    } else if (value >= 1.0) {
      recommendations.push('✓ Good efficiency - Stable and sustainable trajectory');
      recommendations.push('Revenue growth matches or slightly exceeds burn rate growth');
      recommendations.push('Look for opportunities to improve operational leverage');
      recommendations.push('Consider: process automation, economies of scale, pricing optimization');
      recommendations.push(
        'Vanguard Crux Insight: Review OFI and TFDI metrics for efficiency improvements'
      );
    } else if (value >= 0.8) {
      recommendations.push('⚠️ Acceptable but concerning - Cost growth outpacing revenue');
      recommendations.push(
        `Burn rate increasing ${Math.abs(burnChange).toFixed(0)}% while revenue growth is ${revenueGrowth.toFixed(0)}%`
      );
      recommendations.push('Review and optimize major cost centers');
      recommendations.push('Evaluate if growth investments are delivering expected returns');
      recommendations.push('Consider extending payback periods or adjusting growth pace');
    } else {
      recommendations.push('🚨 Concerning efficiency - Unsustainable trajectory');
      recommendations.push('Costs are growing much faster than revenue');
      recommendations.push('Immediate action required to improve unit economics');
      recommendations.push('Critical review of all growth investments needed');
      recommendations.push('Consider: Reducing burn rate OR accelerating revenue growth');
      recommendations.push(
        'Vanguard Crux Recommendation: Comprehensive operational efficiency audit'
      );

      // Calculate required improvements
      const targetSER = 1.2;
      const requiredRevenueGrowth = targetSER * Math.abs(burnChange);
      const requiredBurnReduction = revenueGrowth / targetSER;

      recommendations.push(
        `To reach target SER of ${targetSER}: Either increase revenue growth to ${requiredRevenueGrowth.toFixed(0)}% OR reduce burn rate increase to ${requiredBurnReduction.toFixed(0)}%`
      );
    }

    // Special case: Burn rate is decreasing (negative growth)
    if (burnChange < 0) {
      recommendations.push(
        '🎯 Exceptional: Burn rate is decreasing while revenue grows - optimal efficiency'
      );
    }

    // Industry comparison
    const industryGap = ((value - 1.2) / 1.2) * 100;
    if (industryGap > 0) {
      recommendations.push(
        `Performance is ${Math.abs(industryGap).toFixed(0)}% better than industry target`
      );
    } else {
      recommendations.push(
        `Performance is ${Math.abs(industryGap).toFixed(0)}% below industry target - improvement needed`
      );
    }

    return recommendations;
  }
}
