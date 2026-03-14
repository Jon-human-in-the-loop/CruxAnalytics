import { BaseCalculator } from './BaseCalculator';
import type { SaaSInput } from '@/types/project';

export class SaaSMetricsCalculator extends BaseCalculator {
  constructor() {
    super('SaaSMetricsCalculator');
  }

  calculate(input: SaaSInput): {
    ltv: number;
    cac: number;
    ltv_cac_ratio: number;
    payback_months: number;
    nrr: number;
    rule_of_40: number;
  } {
    this.validate(input);

    const ltv = this.calculateLTV(input);
    const cac = input.cacCost;
    const ltv_cac_ratio = this.safeDivide(ltv, cac, 0);
    const payback_months = this.calculatePaybackPeriod(input);
    const nrr = this.calculateNRR(input);
    const rule_of_40 = this.calculateRuleOf40(input);

    this.logCalculation('LTV', ltv);
    this.logCalculation('LTV/CAC', ltv_cac_ratio);
    this.logCalculation('Payback Period', payback_months);
    this.logCalculation('NRR', nrr);
    this.logCalculation('Rule of 40', rule_of_40);

    return {
      ltv,
      cac,
      ltv_cac_ratio,
      payback_months,
      nrr,
      rule_of_40,
    };
  }

  protected override validate(input: SaaSInput): void {
    super.validate(input);

    this.assertPositive(input.averageRevenuePerUser, 'averageRevenuePerUser');
    this.assertRange(input.churnRate, 0, 100, 'churnRate');
    this.assertPositive(input.cacCost, 'cacCost');
    this.assertRange(input.grossMargin, 0, 100, 'grossMargin');
    this.assertPositive(input.startingMRR, 'startingMRR');
    this.assertPositive(input.expansionMRR, 'expansionMRR');
    this.assertPositive(input.churnedMRR, 'churnedMRR');
    this.assertPositive(input.contractedMRR, 'contractedMRR');
    this.assertRange(input.revenueGrowthRate, -100, 1000, 'revenueGrowthRate');
    this.assertRange(input.profitMargin, -100, 100, 'profitMargin');
  }

  private calculateLTV(input: SaaSInput): number {
    const { averageRevenuePerUser, grossMargin, churnRate } = input;

    const grossMarginDecimal = grossMargin / 100;
    const churnRateDecimal = churnRate / 100;

    const ltv = this.safeDivide(
      averageRevenuePerUser * grossMarginDecimal,
      churnRateDecimal,
      0
    );

    return this.round(ltv, 2);
  }

  private calculatePaybackPeriod(input: SaaSInput): number {
    const { averageRevenuePerUser, grossMargin, cacCost } = input;

    const grossMarginDecimal = grossMargin / 100;
    const monthlyGrossProfit = averageRevenuePerUser * grossMarginDecimal;

    const payback = this.safeDivide(cacCost, monthlyGrossProfit, 0);

    return this.round(payback, 2);
  }

  private calculateNRR(input: SaaSInput): number {
    const { startingMRR, expansionMRR, churnedMRR, contractedMRR } = input;

    const endingMRR = startingMRR + expansionMRR - churnedMRR - contractedMRR;
    const nrr = this.safeDivide(endingMRR, startingMRR, 0) * 100;

    return this.round(nrr, 2);
  }

  private calculateRuleOf40(input: SaaSInput): number {
    const { revenueGrowthRate, profitMargin } = input;

    const ruleOf40 = revenueGrowthRate + profitMargin;

    return this.round(ruleOf40, 2);
  }

  getLTVCACBenchmarks(): { optimal: number; acceptable: number; industry: number } {
    return {
      optimal: 5.0,
      acceptable: 3.0,
      industry: 3.5,
    };
  }

  getPaybackBenchmarks(): { optimal: number; acceptable: number; industry: number } {
    return {
      optimal: 12,
      acceptable: 18,
      industry: 15,
    };
  }

  getNRRBenchmarks(): { optimal: number; acceptable: number; industry: number } {
    return {
      optimal: 120,
      acceptable: 100,
      industry: 110,
    };
  }

  getRuleOf40Benchmarks(): { optimal: number; acceptable: number; industry: number } {
    return {
      optimal: 50,
      acceptable: 40,
      industry: 40,
    };
  }
}
