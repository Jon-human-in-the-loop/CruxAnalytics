import type { XAIResult, XAIScenarioResult, XAIContextConfig } from '../xai/types';
import { generateFinancialMetricsContext } from '../xai/context-generator';
import {
  validateNonNegativeNumber,
  validatePositiveNumber,
  validateNumber,
} from '../validation/input-validator';

/**
 * Financial metric result
 */
export interface FinancialMetric {
  /** Name of the metric */
  name: string;
  /** Calculated value */
  value: number;
  /** Unit of measurement */
  unit: string;
}

/**
 * Financial calculation strategy interface
 */
export interface FinancialStrategy {
  /** Calculate the financial metric */
  calculate(inputs: FinancialInputs): Promise<FinancialMetric>;
  /** Get strategy name */
  getName(): string;
}

export interface FinancialInputs {
  /** Initial investment amount */
  investment: number;
  /** Annual savings or revenue */
  savings: number;
  /** Discount rate as decimal (e.g., 0.1 for 10%) */
  discountRate: number;
  /** Time horizon in years */
  timeHorizon: number;
  /** Optional: Custom cash flows per period */
  cashFlows?: number[];
}

/**
 * ROI (Return on Investment) Strategy
 * Formula: ((Savings × TimeHorizon) - Investment) / Investment × 100
 */
export class ROIStrategy implements FinancialStrategy {
  getName(): string {
    return 'ROI';
  }

  async calculate(inputs: FinancialInputs): Promise<FinancialMetric> {
    validateNonNegativeNumber(inputs.investment, 'investment');
    validateNonNegativeNumber(inputs.savings, 'savings');
    validatePositiveNumber(inputs.timeHorizon, 'timeHorizon');

    const totalReturn = inputs.savings * inputs.timeHorizon;
    const netGain = totalReturn - inputs.investment;
    const roi = inputs.investment > 0 ? (netGain / inputs.investment) * 100 : 0;

    return {
      name: 'ROI',
      value: roi,
      unit: '%',
    };
  }
}

/**
 * NPV (Net Present Value) Strategy
 * Formula: Sum of (CashFlow / (1 + r)^t) - Investment
 */
export class NPVStrategy implements FinancialStrategy {
  getName(): string {
    return 'NPV';
  }

  async calculate(inputs: FinancialInputs): Promise<FinancialMetric> {
    validateNonNegativeNumber(inputs.investment, 'investment');
    validateNonNegativeNumber(inputs.savings, 'savings');
    validateNumber(inputs.discountRate, 0, 1, 'discountRate');
    validatePositiveNumber(inputs.timeHorizon, 'timeHorizon');

    const cashFlows = inputs.cashFlows || Array(inputs.timeHorizon).fill(inputs.savings);

    let npv = -inputs.investment;
    for (let t = 1; t <= cashFlows.length; t++) {
      const discountFactor = Math.pow(1 + inputs.discountRate, t);
      npv += cashFlows[t - 1] / discountFactor;
    }

    return {
      name: 'NPV',
      value: npv,
      unit: '$',
    };
  }
}

/**
 * IRR (Internal Rate of Return) Strategy
 * Formula: Discount rate where NPV = 0 (calculated using Newton-Raphson method)
 */
export class IRRStrategy implements FinancialStrategy {
  getName(): string {
    return 'IRR';
  }

  async calculate(inputs: FinancialInputs): Promise<FinancialMetric> {
    validateNonNegativeNumber(inputs.investment, 'investment');
    validateNonNegativeNumber(inputs.savings, 'savings');
    validatePositiveNumber(inputs.timeHorizon, 'timeHorizon');

    const cashFlows = [-inputs.investment, ...(inputs.cashFlows || Array(inputs.timeHorizon).fill(inputs.savings))];

    const irr = this.calculateIRR(cashFlows);

    return {
      name: 'IRR',
      value: irr * 100,
      unit: '%',
    };
  }

  private calculateIRR(cashFlows: number[]): number {
    let guess = 0.1;
    const maxIterations = 100;
    const tolerance = 0.0001;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;

      for (let t = 0; t < cashFlows.length; t++) {
        const factor = Math.pow(1 + guess, t);
        npv += cashFlows[t] / factor;
        dnpv -= (t * cashFlows[t]) / (factor * (1 + guess));
      }

      const newGuess = guess - npv / dnpv;

      if (Math.abs(newGuess - guess) < tolerance) {
        return newGuess;
      }

      guess = newGuess;
    }

    return guess;
  }
}

/**
 * Payback Period Strategy
 * Formula: Time until cumulative cash flows equal investment
 */
export class PaybackStrategy implements FinancialStrategy {
  getName(): string {
    return 'Payback';
  }

  async calculate(inputs: FinancialInputs): Promise<FinancialMetric> {
    validateNonNegativeNumber(inputs.investment, 'investment');
    validatePositiveNumber(inputs.savings, 'savings');
    validatePositiveNumber(inputs.timeHorizon, 'timeHorizon');

    const annualSavings = inputs.cashFlows?.[0] ?? inputs.savings;

    if (annualSavings <= 0) {
      return {
        name: 'Payback',
        value: Infinity,
        unit: 'years',
      };
    }

    const paybackYears = inputs.investment / annualSavings;

    return {
      name: 'Payback',
      value: paybackYears,
      unit: 'years',
    };
  }
}

/**
 * Factory for creating and managing financial calculation strategies
 */
export class FinancialCalculatorFactory {
  private strategies: Map<string, FinancialStrategy> = new Map();

  constructor() {
    this.registerStrategy(new ROIStrategy());
    this.registerStrategy(new NPVStrategy());
    this.registerStrategy(new IRRStrategy());
    this.registerStrategy(new PaybackStrategy());
  }

  /**
   * Register a custom strategy
   */
  registerStrategy(strategy: FinancialStrategy): void {
    this.strategies.set(strategy.getName(), strategy);
  }

  /**
   * Get a strategy by name
   */
  getStrategy(name: string): FinancialStrategy | undefined {
    return this.strategies.get(name);
  }

  /**
   * Calculate all registered metrics
   */
  async calculateAll(inputs: FinancialInputs): Promise<FinancialMetric[]> {
    const calculations = Array.from(this.strategies.values()).map((strategy) =>
      strategy.calculate(inputs)
    );
    return Promise.all(calculations);
  }
}

export async function calculateFinancialMetricsXAI(
  inputs: FinancialInputs,
  config?: XAIContextConfig
): Promise<{
  roi: XAIResult<FinancialMetric>;
  npv: XAIResult<FinancialMetric>;
  irr: XAIResult<FinancialMetric>;
  payback: XAIResult<FinancialMetric>;
}> {
  const factory = new FinancialCalculatorFactory();

  const [roi, npv, irr, payback] = await Promise.all([
    factory.getStrategy('ROI')!.calculate(inputs),
    factory.getStrategy('NPV')!.calculate(inputs),
    factory.getStrategy('IRR')!.calculate(inputs),
    factory.getStrategy('Payback')!.calculate(inputs),
  ]);

  const createXAIResult = (metric: FinancialMetric): XAIResult<FinancialMetric> => ({
    value: metric,
    context: generateFinancialMetricsContext(metric.name, metric.value, inputs, config),
    metadata: {
      calculationMethod: metric.name,
      inputs,
      timestamp: new Date(),
      version: '1.0.0',
    },
  });

  return {
    roi: createXAIResult(roi),
    npv: createXAIResult(npv),
    irr: createXAIResult(irr),
    payback: createXAIResult(payback),
  };
}

/**
 * Scenario analysis inputs
 */
export interface ScenarioInputs {
  best: FinancialInputs;
  expected: FinancialInputs;
  worst: FinancialInputs;
}

export async function calculateScenarioAnalysisXAI(
  scenarios: ScenarioInputs,
  config?: XAIContextConfig
): Promise<XAIScenarioResult<{
  roi: FinancialMetric;
  npv: FinancialMetric;
  irr: FinancialMetric;
  payback: FinancialMetric;
}>> {
  const [bestMetrics, expectedMetrics, worstMetrics] = await Promise.all([
    calculateFinancialMetricsXAI(scenarios.best, config),
    calculateFinancialMetricsXAI(scenarios.expected, config),
    calculateFinancialMetricsXAI(scenarios.worst, config),
  ]);

  const keyDifferences = [
    `ROI range: ${worstMetrics.roi.value.value.toFixed(1)}% to ${bestMetrics.roi.value.value.toFixed(1)}%`,
    `NPV range: $${worstMetrics.npv.value.value.toFixed(0)} to $${bestMetrics.npv.value.value.toFixed(0)}`,
    `Payback range: ${worstMetrics.payback.value.value.toFixed(1)} to ${bestMetrics.payback.value.value.toFixed(1)} years`,
  ];

  const expectedNPV = expectedMetrics.npv.value.value;
  const riskAnalysis =
    expectedNPV > 0
      ? 'Expected NPV is positive, indicating favorable investment outlook.'
      : 'Expected NPV is negative, indicating investment risk.';

  const recommendedScenario: 'best' | 'expected' | 'worst' =
    bestMetrics.roi.value.value > 50 ? 'best' : 'expected';

  return {
    best: {
      value: {
        roi: bestMetrics.roi.value,
        npv: bestMetrics.npv.value,
        irr: bestMetrics.irr.value,
        payback: bestMetrics.payback.value,
      },
      context: bestMetrics.roi.context,
      metadata: bestMetrics.roi.metadata,
    },
    expected: {
      value: {
        roi: expectedMetrics.roi.value,
        npv: expectedMetrics.npv.value,
        irr: expectedMetrics.irr.value,
        payback: expectedMetrics.payback.value,
      },
      context: expectedMetrics.roi.context,
      metadata: expectedMetrics.roi.metadata,
    },
    worst: {
      value: {
        roi: worstMetrics.roi.value,
        npv: worstMetrics.npv.value,
        irr: worstMetrics.irr.value,
        payback: worstMetrics.payback.value,
      },
      context: worstMetrics.roi.context,
      metadata: worstMetrics.roi.metadata,
    },
    comparison: {
      keyDifferences,
      riskAnalysis,
      recommendedScenario,
      overallConfidence: 0.8,
    },
  };
}
