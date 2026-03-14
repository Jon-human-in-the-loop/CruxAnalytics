import type { IContextStrategy } from '@/lib/application/strategies/IContextStrategy';
import type { MetricContext } from '@/types/project';

export class TFDIContextStrategy implements IContextStrategy {
  generateContext(value: number, projectData: any): MetricContext {
    const interpretation = this.interpretValue(value);
    const recommendations = this.generateRecommendations(value, projectData);

    return {
      category: 'strategic',
      formula: '(Maintenance Hours / Total Hours) × Team Cost + (Incident Costs × 12)',
      assumptions: [
        'Maintenance hours accurately represent tech debt burden',
        'Sprint hours are representative of typical development cycles',
        'Incident costs include direct response and opportunity cost',
        'Engineering team cost is fully loaded (salary + benefits + overhead)',
      ],
      constraints: [
        'Does not capture velocity impact on features',
        'May not include all hidden tech debt costs',
        'Assumes consistent sprint patterns',
        'Excludes recruitment and retention costs from tech debt',
      ],
      interpretation,
      benchmarks: {
        optimal: 0.15,
        acceptable: 0.25,
        industry: 0.30,
      },
      recommendations,
    };
  }

  getMetricName(): string {
    return 'TFDI';
  }

  private interpretValue(value: number): 'positive' | 'negative' | 'neutral' {
    if (value <= 0.15) return 'positive';
    if (value >= 0.25) return 'negative';
    return 'neutral';
  }

  private generateRecommendations(value: number, projectData: any): string[] {
    const recommendations: string[] = [];

    const maintenanceHours = projectData.vanguardInput?.maintenanceHoursPerSprint || 0;
    const totalHours = projectData.vanguardInput?.totalDevHoursPerSprint || 1;
    const teamCost = projectData.vanguardInput?.devTeamAnnualCost || 0;
    const incidentCost = projectData.vanguardInput?.incidentCostPerMonth || 0;

    const maintenanceRatio = maintenanceHours / totalHours;
    const opportunityCost = teamCost * (1 - maintenanceRatio) - teamCost * maintenanceRatio;

    if (value <= 0.15) {
      recommendations.push('✅ Optimal tech health - Sustainable engineering velocity');
      recommendations.push('Technical debt is well-managed and under control');
      recommendations.push('Engineering team can focus on innovation and features');
      recommendations.push('Maintain current refactoring and quality practices');
      recommendations.push('Continue monitoring for early warning signs of debt accumulation');
    } else if (value <= 0.25) {
      recommendations.push('⚠️ Moderate tech debt - Monitor closely and plan improvements');
      recommendations.push(
        `${(maintenanceRatio * 100).toFixed(0)}% of engineering capacity consumed by maintenance`
      );
      recommendations.push('Schedule dedicated refactoring sprints quarterly');
      recommendations.push('Implement stricter code review standards');
      recommendations.push('Consider incremental modernization of legacy components');
      recommendations.push(
        `Opportunity cost: $${Math.abs(opportunityCost).toLocaleString()} in lost innovation capacity`
      );
    } else {
      recommendations.push('🚨 High tech debt drag - Immediate refactoring initiative required');
      recommendations.push(
        `CRITICAL: ${(maintenanceRatio * 100).toFixed(0)}% of capacity spent on maintenance vs. features`
      );
      recommendations.push(
        `Annual drag on engineering: $${(value * teamCost).toLocaleString()}`
      );
      recommendations.push('Technical debt is materially impacting business outcomes');
      recommendations.push('Dedicate 20-30% of next 3 sprints to targeted refactoring');
      recommendations.push(
        'Vanguard Crux Recommendation: Comprehensive technical debt assessment'
      );

      // Calculate refactoring ROI
      const targetTFDI = 0.15;
      const potentialSavings = (value - targetTFDI) * teamCost;
      const refactoringInvestment = potentialSavings * 0.4; // 40% of annual savings
      const refactoringROI = (potentialSavings / refactoringInvestment) * 100;

      recommendations.push(
        `Refactoring ROI estimate: ${refactoringROI.toFixed(0)}% annually (payback < 5 months)`
      );
      recommendations.push(
        `By reducing TFDI to ${targetTFDI}: Annual savings of $${potentialSavings.toLocaleString()}`
      );
    }

    // Industry comparison
    const industryGap = ((value - 0.30) / 0.30) * 100;
    if (value > 0.30) {
      recommendations.push(
        `⚠️ Performance is ${Math.abs(industryGap).toFixed(0)}% worse than industry average - urgent attention needed`
      );
    } else {
      recommendations.push(
        `Performance is ${Math.abs(industryGap).toFixed(0)}% better than industry average`
      );
    }

    return recommendations;
  }
}
