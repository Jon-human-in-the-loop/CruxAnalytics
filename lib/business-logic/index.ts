import type { XAIResult, XAIScenarioResult, XAIContextConfig } from '../xai/types';
import {
  calculateOFI,
  calculateTFDI,
  calculateSER,
  calculateAllBusinessMetrics,
  type OFIResult,
  type TFDIResult,
  type SERResult,
} from './business-intelligence';
import {
  calculateFinancialMetricsXAI,
  calculateScenarioAnalysisXAI,
  FinancialCalculatorFactory,
  type FinancialInputs,
  type ScenarioInputs,
  type FinancialMetric,
  type FinancialStrategy,
} from './financial-core';

/**
 * Comprehensive insights combining all analytics
 */
export interface ComprehensiveInsights {
  /** Financial metrics */
  financial: {
    roi: XAIResult<FinancialMetric>;
    npv: XAIResult<FinancialMetric>;
    irr: XAIResult<FinancialMetric>;
    payback: XAIResult<FinancialMetric>;
  };
  /** Business intelligence metrics */
  businessIntelligence: {
    ofi: XAIResult<OFIResult>;
    tfdi: XAIResult<TFDIResult>;
    ser: XAIResult<SERResult>;
  };
  /** Executive summary */
  executiveSummary: {
    overallScore: number;
    topRecommendations: string[];
    criticalWarnings: string[];
    confidence: number;
  };
}

/**
 * Business Intelligence facade providing unified access to all analytics
 */
export class BusinessIntelligence {
  private calculatorFactory: FinancialCalculatorFactory;

  constructor() {
    this.calculatorFactory = new FinancialCalculatorFactory();
  }

  /**
   * Calculate financial metrics (ROI, NPV, IRR, Payback)
   * 
   * @param inputs - Financial calculation inputs
   * @param config - XAI configuration
   * @returns Financial metrics with XAI context
   */
  async calculateFinancials(
    inputs: FinancialInputs,
    config?: XAIContextConfig
  ): Promise<{
    roi: XAIResult<FinancialMetric>;
    npv: XAIResult<FinancialMetric>;
    irr: XAIResult<FinancialMetric>;
    payback: XAIResult<FinancialMetric>;
  }> {
    return calculateFinancialMetricsXAI(inputs, config);
  }

  /**
   * Calculate scenario analysis (best/expected/worst cases)
   * 
   * @param scenarios - Scenario inputs
   * @param config - XAI configuration
   * @returns Scenario analysis with XAI context
   */
  async calculateScenarios(
    scenarios: ScenarioInputs,
    config?: XAIContextConfig
  ): Promise<XAIScenarioResult<{
    roi: FinancialMetric;
    npv: FinancialMetric;
    irr: FinancialMetric;
    payback: FinancialMetric;
  }>> {
    return calculateScenarioAnalysisXAI(scenarios, config);
  }

  /**
   * Calculate Operational Friction Index (OFI)
   * 
   * @param repetitiveHours - Hours spent on repetitive tasks
   * @param totalHours - Total available hours
   * @param frictionMultiplier - Friction multiplier (default 1.0)
   * @param config - XAI configuration
   * @returns OFI with XAI context
   */
  async calculateOperationalFriction(
    repetitiveHours: number,
    totalHours: number,
    frictionMultiplier = 1.0,
    config?: XAIContextConfig
  ): Promise<XAIResult<OFIResult>> {
    return calculateOFI(repetitiveHours, totalHours, frictionMultiplier, config);
  }

  /**
   * Calculate Tech-Debt Financial Impact (TFDI)
   * 
   * @param manualHoursPerMonth - Monthly manual work hours
   * @param manualHourlyRate - Cost per hour
   * @param automationCost - One-time automation cost
   * @param timeHorizonMonths - Evaluation period in months
   * @param config - XAI configuration
   * @returns TFDI with XAI context
   */
  async calculateTechDebtImpact(
    manualHoursPerMonth: number,
    manualHourlyRate: number,
    automationCost: number,
    timeHorizonMonths: number,
    config?: XAIContextConfig
  ): Promise<XAIResult<TFDIResult>> {
    return calculateTFDI(
      manualHoursPerMonth,
      manualHourlyRate,
      automationCost,
      timeHorizonMonths,
      config
    );
  }

  /**
   * Calculate Sustainability Efficiency Ratio (SER)
   * 
   * @param efficiencyGain - Efficiency improvement percentage
   * @param lifetime - Expected lifetime in months
   * @param frictionCost - Cost of operational friction
   * @param investment - Total investment
   * @param config - XAI configuration
   * @returns SER with XAI context
   */
  async calculateSustainability(
    efficiencyGain: number,
    lifetime: number,
    frictionCost: number,
    investment: number,
    config?: XAIContextConfig
  ): Promise<XAIResult<SERResult>> {
    return calculateSER(efficiencyGain, lifetime, frictionCost, investment, config);
  }

  /**
   * Get comprehensive insights combining all analytics
   * 
   * @param financialInputs - Financial calculation inputs
   * @param biInputs - Business intelligence inputs
   * @param config - XAI configuration
   * @returns Comprehensive insights with executive summary
   */
  async getComprehensiveInsights(
    financialInputs: FinancialInputs,
    biInputs: {
      repetitiveHours: number;
      totalHours: number;
      frictionMultiplier?: number;
      manualHoursPerMonth: number;
      manualHourlyRate: number;
      automationCost: number;
      timeHorizonMonths: number;
      efficiencyGain: number;
      lifetime: number;
      frictionCost: number;
      investment: number;
    },
    config?: XAIContextConfig
  ): Promise<ComprehensiveInsights> {
    const [financial, businessIntelligence] = await Promise.all([
      this.calculateFinancials(financialInputs, config),
      calculateAllBusinessMetrics(biInputs, config),
    ]);

    const allRecommendations = [
      ...financial.roi.context.recommendations,
      ...financial.npv.context.recommendations,
      ...businessIntelligence.ofi.context.recommendations,
      ...businessIntelligence.tfdi.context.recommendations,
      ...businessIntelligence.ser.context.recommendations,
    ];

    const allWarnings = [
      ...financial.roi.context.warnings,
      ...financial.npv.context.warnings,
      ...businessIntelligence.ofi.context.warnings,
      ...businessIntelligence.tfdi.context.warnings,
      ...businessIntelligence.ser.context.warnings,
    ];

    const topRecommendations = [...new Set(allRecommendations)].slice(0, 5);
    const criticalWarnings = [...new Set(allWarnings)];

    const avgConfidence =
      (financial.roi.context.confidence +
        financial.npv.context.confidence +
        businessIntelligence.ofi.context.confidence +
        businessIntelligence.tfdi.context.confidence +
        businessIntelligence.ser.context.confidence) /
      5;

    const roiScore = Math.min(Math.max(financial.roi.value.value / 100, 0), 1);
    const npvScore = financial.npv.value.value > 0 ? 1 : 0;
    const ofiScore = 1 - Math.min(businessIntelligence.ofi.value.ofi / 100, 1);
    const serScore = Math.min(businessIntelligence.ser.value.ser / 3, 1);
    const overallScore = ((roiScore + npvScore + ofiScore + serScore) / 4) * 100;

    return {
      financial,
      businessIntelligence,
      executiveSummary: {
        overallScore,
        topRecommendations,
        criticalWarnings,
        confidence: avgConfidence,
      },
    };
  }

  /**
   * Register a custom financial calculation strategy
   * 
   * @param strategy - Custom financial strategy
   */
  registerCustomStrategy(strategy: FinancialStrategy): void {
    this.calculatorFactory.registerStrategy(strategy);
  }
}

// Export singleton instance
export const businessIntelligence = new BusinessIntelligence();

// Export types
export type {
  FinancialInputs,
  ScenarioInputs,
  FinancialMetric,
  FinancialStrategy,
  OFIResult,
  TFDIResult,
  SERResult,
};
