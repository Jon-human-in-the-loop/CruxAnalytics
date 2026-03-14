import { BaseCalculator } from './BaseCalculator';
import type { RiskInput } from '@/types/project';

export class RiskMetricsCalculator extends BaseCalculator {
  constructor() {
    super('RiskMetricsCalculator');
  }

  calculate(input: RiskInput): {
    runway_months: number;
    zero_cash_date: string;
    churn_impact_6mo: number;
  } {
    this.validate(input);

    const runway_months = this.calculateRunway(input);
    const zero_cash_date = this.calculateZeroCashDate(input);
    const churn_impact_6mo = this.calculateChurnImpact(input);

    this.logCalculation('Runway (months)', runway_months);
    this.logCalculation('Churn Impact (6mo)', churn_impact_6mo);

    return {
      runway_months,
      zero_cash_date,
      churn_impact_6mo,
    };
  }

  protected override validate(input: RiskInput): void {
    super.validate(input);

    this.assertPositive(input.currentCash, 'currentCash');
    this.assertPositive(input.monthlyBurnRate, 'monthlyBurnRate');
    if (input.plannedFundraising !== undefined) {
      this.assertPositive(input.plannedFundraising, 'plannedFundraising');
    }
    this.assertRange(input.monthlyChurnRate, 0, 100, 'monthlyChurnRate');
    this.assertPositive(input.currentMRR, 'currentMRR');
    this.assertPositive(input.averageContractValue, 'averageContractValue');
  }

  private calculateRunway(input: RiskInput): number {
    const { currentCash, monthlyBurnRate, plannedFundraising = 0 } = input;

    const totalCash = currentCash + plannedFundraising;
    const runway = this.safeDivide(totalCash, monthlyBurnRate, 0);

    return this.round(runway, 2);
  }

  private calculateZeroCashDate(input: RiskInput): string {
    const runway_months = this.calculateRunway(input);

    const today = new Date();
    const zeroCashDate = new Date(today);
    zeroCashDate.setMonth(zeroCashDate.getMonth() + Math.floor(runway_months));

    return zeroCashDate.toISOString().split('T')[0]; // Return YYYY-MM-DD
  }

  private calculateChurnImpact(input: RiskInput): number {
    const { monthlyChurnRate } = input;

    const monthlyChurnDecimal = monthlyChurnRate / 100;

    // Compound probability over 6 months
    const retentionRate = 1 - monthlyChurnDecimal;
    const sixMonthRetention = Math.pow(retentionRate, 6);
    const sixMonthChurn = (1 - sixMonthRetention) * 100;

    return this.round(sixMonthChurn, 2);
  }

  getRunwayBenchmarks(): { optimal: number; acceptable: number; critical: number } {
    return {
      optimal: 18,
      acceptable: 12,
      critical: 6,
    };
  }

  getChurnImpactBenchmarks(): { optimal: number; acceptable: number; critical: number } {
    return {
      optimal: 10,
      acceptable: 20,
      critical: 30,
    };
  }
}
