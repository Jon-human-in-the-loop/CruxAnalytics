import { StandardMetricsCalculator } from '@/lib/infrastructure/calculators/StandardMetricsCalculator';
import { VanguardMetricsCalculator } from '@/lib/infrastructure/calculators/VanguardMetricsCalculator';
import { SaaSMetricsCalculator } from '@/lib/infrastructure/calculators/SaaSMetricsCalculator';
import { RiskMetricsCalculator } from '@/lib/infrastructure/calculators/RiskMetricsCalculator';
import type {
  FinancialCalculationInput,
  VanguardInput,
  SaaSInput,
  RiskInput,
  ProjectData,
} from '@/types/project';

/**
 * Service for orchestrating all metric calculations.
 * Provides unified interface for calculating standard, vanguard, SaaS, and risk metrics.
 * 
 * 
 * @example
 * ```typescript
 * const service = new CalculationService();
 * 
 * // Calculate standard metrics
 * const standardResults = await service.calculateStandard(input);
 * 
 * // Calculate all available metrics for a project
 * const allResults = await service.calculateAll(projectData);
 * ```
 */
export class CalculationService {
  private standardCalculator: StandardMetricsCalculator;
  private vanguardCalculator: VanguardMetricsCalculator;
  private saasCalculator: SaaSMetricsCalculator;
  private riskCalculator: RiskMetricsCalculator;

  constructor() {
    this.standardCalculator = new StandardMetricsCalculator();
    this.vanguardCalculator = new VanguardMetricsCalculator();
    this.saasCalculator = new SaaSMetricsCalculator();
    this.riskCalculator = new RiskMetricsCalculator();
  }

  async calculateStandard(input: FinancialCalculationInput): Promise<{
    roi: number;
    npv: number;
    irr: number;
    paybackPeriod: number;
    monthlyCashFlow: number[];
    cumulativeCashFlow: number[];
  }> {
    return Promise.resolve(this.standardCalculator.calculate(input));
  }

  async calculateVanguard(input: VanguardInput): Promise<{
    ofi: number;
    tfdi: number;
    ser: number;
  }> {
    return Promise.resolve(this.vanguardCalculator.calculate(input));
  }

  async calculateSaaS(input: SaaSInput): Promise<{
    ltv: number;
    cac: number;
    ltv_cac_ratio: number;
    payback_months: number;
    nrr: number;
    rule_of_40: number;
  }> {
    return Promise.resolve(this.saasCalculator.calculate(input));
  }

  async calculateRisk(input: RiskInput): Promise<{
    runway_months: number;
    zero_cash_date: string;
    churn_impact_6mo: number;
  }> {
    return Promise.resolve(this.riskCalculator.calculate(input));
  }

  async calculateAll(projectData: ProjectData): Promise<{
    standard: ReturnType<StandardMetricsCalculator['calculate']>;
    vanguard?: ReturnType<VanguardMetricsCalculator['calculate']>;
    saas?: ReturnType<SaaSMetricsCalculator['calculate']>;
    risk?: ReturnType<RiskMetricsCalculator['calculate']>;
  }> {
    const results: any = {};

    // Always calculate standard metrics
    const standardInput: FinancialCalculationInput = {
      initialInvestment: projectData.initialInvestment,
      discountRate: projectData.discountRate,
      projectDuration: projectData.projectDuration,
      yearlyRevenue: projectData.yearlyRevenue,
      revenueGrowth: projectData.revenueGrowth,
      operatingCosts: projectData.operatingCosts,
      maintenanceCosts: projectData.maintenanceCosts,
    };
    results.standard = await this.calculateStandard(standardInput);

    // Calculate Vanguard metrics if input is provided
    if (projectData.vanguardInput) {
      try {
        results.vanguard = await this.calculateVanguard(projectData.vanguardInput);
      } catch (error) {
        console.error('Error calculating Vanguard metrics:', error);
        // Continue without Vanguard metrics
      }
    }

    // Calculate SaaS metrics if input is provided
    if (projectData.saasInput) {
      try {
        results.saas = await this.calculateSaaS(projectData.saasInput);
      } catch (error) {
        console.error('Error calculating SaaS metrics:', error);
        // Continue without SaaS metrics
      }
    }

    // Calculate risk metrics if input is provided
    if (projectData.riskInput) {
      try {
        results.risk = await this.calculateRisk(projectData.riskInput);
      } catch (error) {
        console.error('Error calculating risk metrics:', error);
        // Continue without risk metrics
      }
    }

    return results;
  }

  /**
   * Gets all benchmark values for reference.
   * 
   * @returns Object containing all benchmarks
   */
  getAllBenchmarks(): {
    vanguard: {
      ofi: ReturnType<VanguardMetricsCalculator['getOFIBenchmarks']>;
      tfdi: ReturnType<VanguardMetricsCalculator['getTFDIBenchmarks']>;
      ser: ReturnType<VanguardMetricsCalculator['getSERBenchmarks']>;
    };
    saas: {
      ltv_cac: ReturnType<SaaSMetricsCalculator['getLTVCACBenchmarks']>;
      payback: ReturnType<SaaSMetricsCalculator['getPaybackBenchmarks']>;
      nrr: ReturnType<SaaSMetricsCalculator['getNRRBenchmarks']>;
      rule_of_40: ReturnType<SaaSMetricsCalculator['getRuleOf40Benchmarks']>;
    };
    risk: {
      runway: ReturnType<RiskMetricsCalculator['getRunwayBenchmarks']>;
      churn_impact: ReturnType<RiskMetricsCalculator['getChurnImpactBenchmarks']>;
    };
  } {
    return {
      vanguard: {
        ofi: this.vanguardCalculator.getOFIBenchmarks(),
        tfdi: this.vanguardCalculator.getTFDIBenchmarks(),
        ser: this.vanguardCalculator.getSERBenchmarks(),
      },
      saas: {
        ltv_cac: this.saasCalculator.getLTVCACBenchmarks(),
        payback: this.saasCalculator.getPaybackBenchmarks(),
        nrr: this.saasCalculator.getNRRBenchmarks(),
        rule_of_40: this.saasCalculator.getRuleOf40Benchmarks(),
      },
      risk: {
        runway: this.riskCalculator.getRunwayBenchmarks(),
        churn_impact: this.riskCalculator.getChurnImpactBenchmarks(),
      },
    };
  }
}
