import type { XAIResult, XAIContextConfig } from '../xai/types';
import {
  generateOperationalFrictionContext,
  generateTechDebtContext,
  generateSustainabilityContext,
} from '../xai/context-generator';
import {
  validateNonNegativeNumber,
  validatePositiveNumber,
} from '../validation/input-validator';

/**
 * Operational Friction Index (OFI) result
 */
export interface OFIResult {
  /** OFI percentage (0-100+) */
  ofi: number;
  /** Raw friction score before percentage conversion */
  frictionScore: number;
  /** Breakdown of contributing factors */
  breakdown: {
    repetitiveHours: number;
    totalHours: number;
    repetitiveRatio: number;
    frictionMultiplier: number;
  };
}

/**
 * Tech-Debt Financial Impact (TFDI) result
 */
export interface TFDIResult {
  /** Total cost of manual work over time horizon */
  totalCost: number;
  /** Months until automation investment breaks even */
  breakEvenPoint: number;
  /** Net savings after subtracting automation cost */
  netSavings: number;
  /** Monthly savings from automation */
  monthlySavings: number;
}

/**
 * Sustainability Efficiency Ratio (SER) result
 */
export interface SERResult {
  /** SER value (ratio of value to cost) */
  ser: number;
  /** Total value generated over lifetime */
  totalValue: number;
  /** Total cost (friction + investment) */
  totalCost: number;
  /** Value per dollar invested */
  valuePerDollar: number;
}

export async function calculateOFI(
  repetitiveHours: number,
  totalHours: number,
  frictionMultiplier = 1.0,
  config?: XAIContextConfig
): Promise<XAIResult<OFIResult>> {
  validateNonNegativeNumber(repetitiveHours, 'repetitiveHours');
  validatePositiveNumber(totalHours, 'totalHours');
  validatePositiveNumber(frictionMultiplier, 'frictionMultiplier');

  if (repetitiveHours > totalHours) {
    throw new Error('repetitiveHours cannot exceed totalHours');
  }

  const repetitiveRatio = repetitiveHours / totalHours;
  const frictionScore = repetitiveRatio * frictionMultiplier;
  const ofi = frictionScore * 100;

  const result: OFIResult = {
    ofi,
    frictionScore,
    breakdown: {
      repetitiveHours,
      totalHours,
      repetitiveRatio,
      frictionMultiplier,
    },
  };

  const context = generateOperationalFrictionContext(
    ofi,
    { repetitiveHours, totalHours, frictionMultiplier },
    config
  );

  return {
    value: result,
    context,
    metadata: {
      calculationMethod: 'OFI = (repetitiveHours / totalHours) × 100 × frictionMultiplier',
      inputs: { repetitiveHours, totalHours, frictionMultiplier },
      timestamp: new Date(),
      version: '1.0.0',
    },
  };
}

export async function calculateTFDI(
  manualHoursPerMonth: number,
  manualHourlyRate: number,
  automationCost: number,
  timeHorizonMonths: number,
  config?: XAIContextConfig
): Promise<XAIResult<TFDIResult>> {
  validateNonNegativeNumber(manualHoursPerMonth, 'manualHoursPerMonth');
  validateNonNegativeNumber(manualHourlyRate, 'manualHourlyRate');
  validateNonNegativeNumber(automationCost, 'automationCost');
  validatePositiveNumber(timeHorizonMonths, 'timeHorizonMonths');

  const monthlySavings = manualHoursPerMonth * manualHourlyRate;
  const totalCost = monthlySavings * timeHorizonMonths;
  const netSavings = totalCost - automationCost;
  const breakEvenPoint = monthlySavings > 0 ? automationCost / monthlySavings : Infinity;

  const result: TFDIResult = {
    totalCost,
    breakEvenPoint,
    netSavings,
    monthlySavings,
  };

  const context = generateTechDebtContext(
    result,
    { manualHourlyRate, automationCost, timeHorizonMonths },
    config
  );

  return {
    value: result,
    context,
    metadata: {
      calculationMethod: 'TFDI = Manual Cost Over Time - Automation Cost',
      inputs: {
        manualHoursPerMonth,
        manualHourlyRate,
        automationCost,
        timeHorizonMonths,
      },
      timestamp: new Date(),
      version: '1.0.0',
    },
  };
}

export async function calculateSER(
  efficiencyGain: number,
  lifetime: number,
  frictionCost: number,
  investment: number,
  config?: XAIContextConfig
): Promise<XAIResult<SERResult>> {
  validateNonNegativeNumber(efficiencyGain, 'efficiencyGain');
  validatePositiveNumber(lifetime, 'lifetime');
  validateNonNegativeNumber(frictionCost, 'frictionCost');
  validateNonNegativeNumber(investment, 'investment');

  if (efficiencyGain > 100) {
    throw new Error('efficiencyGain cannot exceed 100%');
  }

  const totalValue = (efficiencyGain / 100) * lifetime * (frictionCost + investment);
  const totalCost = frictionCost + investment;
  const ser = totalCost > 0 ? totalValue / totalCost : 0;
  const valuePerDollar = ser;

  const result: SERResult = {
    ser,
    totalValue,
    totalCost,
    valuePerDollar,
  };

  const context = generateSustainabilityContext(
    ser,
    { efficiencyGain, lifetime, frictionCost, investment },
    config
  );

  return {
    value: result,
    context,
    metadata: {
      calculationMethod:
        'SER = (efficiencyGain × lifetime × totalCost) / totalCost',
      inputs: { efficiencyGain, lifetime, frictionCost, investment },
      timestamp: new Date(),
      version: '1.0.0',
    },
  };
}

export async function calculateAllBusinessMetrics(
  inputs: {
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
): Promise<{
  ofi: XAIResult<OFIResult>;
  tfdi: XAIResult<TFDIResult>;
  ser: XAIResult<SERResult>;
}> {
  const [ofi, tfdi, ser] = await Promise.all([
    calculateOFI(
      inputs.repetitiveHours,
      inputs.totalHours,
      inputs.frictionMultiplier,
      config
    ),
    calculateTFDI(
      inputs.manualHoursPerMonth,
      inputs.manualHourlyRate,
      inputs.automationCost,
      inputs.timeHorizonMonths,
      config
    ),
    calculateSER(
      inputs.efficiencyGain,
      inputs.lifetime,
      inputs.frictionCost,
      inputs.investment,
      config
    ),
  ]);

  return { ofi, tfdi, ser };
}
