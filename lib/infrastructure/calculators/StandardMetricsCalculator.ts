import { BaseCalculator } from './BaseCalculator';
import { Metric } from '@/lib/domain/entities/Metric';
import type { FinancialCalculationInput } from '@/types/project';

export class StandardMetricsCalculator extends BaseCalculator {
  constructor() {
    super('StandardMetricsCalculator');
  }

  calculate(input: FinancialCalculationInput): {
    roi: number;
    npv: number;
    irr: number;
    paybackPeriod: number;
    monthlyCashFlow: number[];
    cumulativeCashFlow: number[];
  } {
    this.validate(input);

    const {
      initialInvestment,
      discountRate,
      projectDuration,
      yearlyRevenue,
      revenueGrowth,
      operatingCosts,
      maintenanceCosts,
      multiplier = 1.0,
    } = input;

    // Calculate monthly cash flows
    const monthlyCashFlow: number[] = [];
    const cumulativeCashFlow: number[] = [];

    let cumulative = -initialInvestment;

    for (let month = 0; month < projectDuration; month++) {
      // Use geometric compounding for monthly growth (smoother curve)
      const growthFactor = Math.pow(1 + revenueGrowth / 100, month / 12);

      const monthlyRevenue = (yearlyRevenue * growthFactor * multiplier) / 12;
      const monthlyCosts = (operatingCosts + maintenanceCosts) / 12;

      const netCashFlow = monthlyRevenue - monthlyCosts;
      monthlyCashFlow.push(netCashFlow);

      cumulative += netCashFlow;
      cumulativeCashFlow.push(cumulative);
    }

    // Calculate metrics
    const roi = this.calculateROI(initialInvestment, monthlyCashFlow);
    const npv = this.calculateNPV(initialInvestment, monthlyCashFlow, discountRate / 100);
    const paybackPeriod = this.calculatePaybackPeriod(initialInvestment, monthlyCashFlow);
    const irr = this.calculateIRR(initialInvestment, monthlyCashFlow);

    // Log calculations
    this.logCalculation('ROI', roi);
    this.logCalculation('NPV', npv);
    this.logCalculation('IRR', irr);
    this.logCalculation('PaybackPeriod', paybackPeriod);

    return {
      roi,
      npv,
      irr,
      paybackPeriod,
      monthlyCashFlow,
      cumulativeCashFlow,
    };
  }

  protected override validate(input: FinancialCalculationInput): void {
    super.validate(input);

    this.assertFinite(input.initialInvestment, 'initialInvestment');
    if (input.initialInvestment < 0) throw new Error(`${this.calculatorName}: initialInvestment must be non-negative`);

    this.assertRange(input.discountRate, 0, 100, 'discountRate');
    this.assertRange(input.projectDuration, 1, 600, 'projectDuration');

    this.assertFinite(input.yearlyRevenue, 'yearlyRevenue');
    if (input.yearlyRevenue < 0) throw new Error(`${this.calculatorName}: yearlyRevenue must be non-negative`);

    this.assertRange(input.revenueGrowth, -100, 1000, 'revenueGrowth');

    this.assertFinite(input.operatingCosts, 'operatingCosts');
    if (input.operatingCosts < 0) throw new Error(`${this.calculatorName}: operatingCosts must be non-negative`);

    this.assertFinite(input.maintenanceCosts, 'maintenanceCosts');
    if (input.maintenanceCosts < 0) throw new Error(`${this.calculatorName}: maintenanceCosts must be non-negative`);
  }

  private calculateROI(initialInvestment: number, cashFlows: number[]): number {
    const totalRevenue = cashFlows.reduce((sum, cf) => sum + cf, 0);
    const roi = ((totalRevenue - initialInvestment) / initialInvestment) * 100;
    return this.round(roi, 2);
  }

  private calculateNPV(
    initialInvestment: number,
    cashFlows: number[],
    discountRate: number
  ): number {
    let npv = -initialInvestment;

    for (let month = 0; month < cashFlows.length; month++) {
      // Use precise geometric monthly rate: (1 + r)^(1/12) - 1
      const monthlyRate = Math.pow(1 + discountRate, 1 / 12) - 1;
      const discountFactor = Math.pow(1 + monthlyRate, month + 1);
      npv += cashFlows[month] / discountFactor;
    }

    return this.round(npv, 2);
  }

  private calculatePaybackPeriod(
    initialInvestment: number,
    cashFlows: number[]
  ): number {
    let cumulative = -initialInvestment;

    for (let month = 0; month < cashFlows.length; month++) {
      cumulative += cashFlows[month];

      if (cumulative >= 0) {
        // Linear interpolation for more accurate payback period
        const previousCumulative = cumulative - cashFlows[month];
        const fraction = -previousCumulative / cashFlows[month];
        return this.round(month + fraction, 2);
      }
    }

    // If payback is not achieved within project duration
    return cashFlows.length;
  }

  private calculateIRR(
    initialInvestment: number,
    cashFlows: number[],
    maxIterations: number = 100,
    tolerance: number = 0.0001
  ): number {
    // Initial guess for IRR (10% annual rate)
    let rate = 0.10 / 12; // Monthly rate

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let npv = -initialInvestment;
      let derivative = 0;

      // Calculate NPV and its derivative at current rate
      for (let month = 0; month < cashFlows.length; month++) {
        const period = month + 1;
        const discountFactor = Math.pow(1 + rate, period);

        npv += cashFlows[month] / discountFactor;
        derivative -= (period * cashFlows[month]) / Math.pow(1 + rate, period + 1);
      }

      // Check for convergence
      if (Math.abs(npv) < tolerance) {
        // Convert monthly rate to annual percentage
        return this.round((Math.pow(1 + rate, 12) - 1) * 100, 2);
      }

      // Newton-Raphson iteration
      if (Math.abs(derivative) < 1e-10) {
        // Avoid division by zero
        break;
      }

      rate = rate - npv / derivative;

      // Ensure rate stays within reasonable bounds
      if (rate < -0.99 || rate > 10) {
        rate = 0.10 / 12; // Reset to initial guess
        break;
      }
    }

    // If convergence failed, return the current estimate
    // Convert monthly rate to annual percentage
    return this.round((Math.pow(1 + rate, 12) - 1) * 100, 2);
  }
}
