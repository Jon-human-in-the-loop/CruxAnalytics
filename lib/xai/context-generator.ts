import type {
  StrategicContext,
  XAIContextConfig,
  MetricThresholds,
  PerformanceLevel,
} from './types';

/**
 * Default configuration for context generation
 */
const DEFAULT_CONFIG: Required<XAIContextConfig> = {
  language: 'en',
  includeDetailsMode: false,
  confidenceThreshold: 0.7,
  customTemplates: {},
  sections: {
    interpretation: true,
    recommendations: true,
    warnings: true,
    influencingFactors: true,
  },
};

/**
 * Localized content for different languages
 */
const LOCALIZED_CONTENT = {
  en: {
    excellent: 'excellent',
    good: 'good',
    fair: 'fair',
    poor: 'poor',
    critical: 'critical',
    performance: 'performance',
    indicates: 'indicates',
    consider: 'Consider',
    warning: 'Warning',
    influenced_by: 'Influenced by',
  },
  es: {
    excellent: 'excelente',
    good: 'bueno',
    fair: 'aceptable',
    poor: 'pobre',
    critical: 'crítico',
    performance: 'rendimiento',
    indicates: 'indica',
    consider: 'Considere',
    warning: 'Advertencia',
    influenced_by: 'Influenciado por',
  },
};

function determinePerformanceLevel(
  value: number,
  thresholds: MetricThresholds,
  isInverted = false
): PerformanceLevel {
  const comparisons = isInverted
    ? {
        excellent: value <= thresholds.excellent,
        good: value <= thresholds.good,
        fair: value <= thresholds.fair,
        poor: value <= thresholds.poor,
      }
    : {
        excellent: value >= thresholds.excellent,
        good: value >= thresholds.good,
        fair: value >= thresholds.fair,
        poor: value >= thresholds.poor,
      };

  if (comparisons.excellent) return 'excellent';
  if (comparisons.good) return 'good';
  if (comparisons.fair) return 'fair';
  if (comparisons.poor) return 'poor';
  return 'critical';
}

function calculateConfidence(indicators: {
  dataCompleteness: number;
  inputVariability: number;
  calculationComplexity: number;
}): number {
  const { dataCompleteness, inputVariability, calculationComplexity } = indicators;

  const weights = {
    dataCompleteness: 0.5,
    inputVariability: 0.3,
    calculationComplexity: 0.2,
  };

  const variabilityScore = 1 - Math.min(inputVariability, 1);
  const complexityScore = 1 - Math.min(calculationComplexity / 10, 1);

  const confidence =
    dataCompleteness * weights.dataCompleteness +
    variabilityScore * weights.inputVariability +
    complexityScore * weights.calculationComplexity;

  return Math.max(0, Math.min(1, confidence));
}

export function generateOperationalFrictionContext(
  ofi: number,
  inputs: {
    repetitiveHours: number;
    totalHours: number;
    frictionMultiplier: number;
  },
  config: XAIContextConfig = {}
): StrategicContext {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const lang = LOCALIZED_CONTENT[cfg.language];

  const thresholds: MetricThresholds = {
    excellent: 10,
    good: 25,
    fair: 40,
    poor: 60,
  };

  const level = determinePerformanceLevel(ofi, thresholds, true);

  const interpretation = generateInterpretation(ofi, level, 'OFI', lang);
  const recommendations = generateOFIRecommendations(ofi, level, lang);
  const warnings = generateOFIWarnings(ofi, level, lang);
  const influencingFactors = [
    `Repetitive hours: ${inputs.repetitiveHours}`,
    `Total hours: ${inputs.totalHours}`,
    `Friction multiplier: ${inputs.frictionMultiplier}`,
  ];

  const confidence = calculateConfidence({
    dataCompleteness: 1.0,
    inputVariability: Math.abs(inputs.frictionMultiplier - 1) * 0.2,
    calculationComplexity: 2,
  });

  return {
    interpretation,
    recommendations: cfg.sections.recommendations ? recommendations : [],
    warnings: cfg.sections.warnings ? warnings : [],
    confidence,
    influencingFactors: cfg.sections.influencingFactors ? influencingFactors : [],
    generatedAt: new Date(),
  };
}

export function generateTechDebtContext(
  tfdi: { totalCost: number; breakEvenPoint: number; netSavings: number },
  inputs: {
    manualHourlyRate: number;
    automationCost: number;
    timeHorizonMonths: number;
  },
  config: XAIContextConfig = {}
): StrategicContext {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const lang = LOCALIZED_CONTENT[cfg.language];

  const roiPercentage = (tfdi.netSavings / inputs.automationCost) * 100;
  const thresholds: MetricThresholds = {
    excellent: 200,
    good: 100,
    fair: 50,
    poor: 10,
  };

  const level = determinePerformanceLevel(roiPercentage, thresholds, false);

  const interpretation = `Tech-debt financial impact analysis shows ${level} ROI potential. ` +
    `Break-even point at ${tfdi.breakEvenPoint.toFixed(1)} months with net savings of $${tfdi.netSavings.toFixed(0)} over ${inputs.timeHorizonMonths} months.`;

  const recommendations: string[] = [];
  if (level === 'excellent' || level === 'good') {
    recommendations.push('Strong business case for automation investment');
    recommendations.push('Prioritize implementation to capture savings quickly');
  } else if (level === 'fair') {
    recommendations.push('Moderate ROI - evaluate if strategic benefits justify investment');
    recommendations.push('Consider phased implementation to reduce upfront costs');
  } else {
    recommendations.push('Weak financial justification - investigate cost reduction options');
    recommendations.push('Re-evaluate scope or explore alternative solutions');
  }

  const warnings: string[] = [];
  if (tfdi.breakEvenPoint > inputs.timeHorizonMonths * 0.8) {
    warnings.push('Break-even point is close to end of evaluation period');
  }
  if (tfdi.netSavings < 0) {
    warnings.push('Negative net savings - investment may not be financially viable');
  }

  const confidence = calculateConfidence({
    dataCompleteness: 1.0,
    inputVariability: 0.2,
    calculationComplexity: 3,
  });

  return {
    interpretation,
    recommendations,
    warnings,
    confidence,
    influencingFactors: [
      `Manual hourly rate: $${inputs.manualHourlyRate}`,
      `Automation cost: $${inputs.automationCost}`,
      `Time horizon: ${inputs.timeHorizonMonths} months`,
    ],
    generatedAt: new Date(),
  };
}

export function generateSustainabilityContext(
  ser: number,
  inputs: {
    efficiencyGain: number;
    lifetime: number;
    frictionCost: number;
    investment: number;
  },
  config: XAIContextConfig = {}
): StrategicContext {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const lang = LOCALIZED_CONTENT[cfg.language];

  const thresholds: MetricThresholds = {
    excellent: 3.0,
    good: 2.0,
    fair: 1.5,
    poor: 1.0,
  };

  const level = determinePerformanceLevel(ser, thresholds, false);

  const interpretation = `Sustainability Efficiency Ratio of ${ser.toFixed(2)} indicates ${level} long-term value creation. ` +
    `For every dollar invested, ${ser.toFixed(2)} dollars of value are generated over the solution's lifetime.`;

  const recommendations: string[] = [];
  if (level === 'excellent') {
    recommendations.push('Exceptional sustainability profile - strong candidate for investment');
    recommendations.push('Document and share as best practice case study');
  } else if (level === 'good') {
    recommendations.push('Good sustainability metrics support investment decision');
    recommendations.push('Monitor efficiency gains to ensure projections are met');
  } else if (level === 'fair') {
    recommendations.push('Marginal sustainability case - look for optimization opportunities');
    recommendations.push('Consider extending lifetime or reducing friction costs');
  } else {
    recommendations.push('Poor sustainability profile - investment may not be justified');
    recommendations.push('Revisit assumptions or explore alternative approaches');
  }

  const warnings: string[] = [];
  if (ser < 1.0) {
    warnings.push('SER below 1.0 indicates negative long-term value');
  }
  if (inputs.lifetime < 12) {
    warnings.push('Short lifetime may not capture full value potential');
  }

  const confidence = calculateConfidence({
    dataCompleteness: 1.0,
    inputVariability: 0.15,
    calculationComplexity: 3,
  });

  return {
    interpretation,
    recommendations,
    warnings,
    confidence,
    influencingFactors: [
      `Efficiency gain: ${inputs.efficiencyGain}%`,
      `Expected lifetime: ${inputs.lifetime} months`,
      `Friction cost: $${inputs.frictionCost}`,
      `Investment: $${inputs.investment}`,
    ],
    generatedAt: new Date(),
  };
}

export function generateFinancialMetricsContext(
  metricName: string,
  value: number,
  inputs: Record<string, unknown>,
  config: XAIContextConfig = {}
): StrategicContext {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const lang = LOCALIZED_CONTENT[cfg.language];

  let interpretation: string;
  let recommendations: string[];
  let warnings: string[];
  let thresholds: MetricThresholds;
  let level: PerformanceLevel;

  switch (metricName) {
    case 'ROI':
      thresholds = { excellent: 50, good: 25, fair: 10, poor: 0 };
      level = determinePerformanceLevel(value, thresholds, false);
      interpretation = `ROI of ${value.toFixed(2)}% indicates ${level} return on investment.`;
      recommendations = level === 'excellent' || level === 'good'
        ? ['Strong investment case', 'Proceed with implementation']
        : ['Review cost structure', 'Seek higher-value opportunities'];
      warnings = value < 0 ? ['Negative ROI - investment will lose money'] : [];
      break;

    case 'NPV':
      thresholds = { excellent: 100000, good: 50000, fair: 10000, poor: 0 };
      level = determinePerformanceLevel(value, thresholds, false);
      interpretation = `NPV of $${value.toFixed(2)} indicates ${level} net present value.`;
      recommendations = value > 0
        ? ['Positive NPV supports investment', 'Monitor discount rate assumptions']
        : ['Negative NPV - reconsider investment', 'Evaluate alternative options'];
      warnings = value < 0 ? ['Negative NPV - investment destroys value'] : [];
      break;

    case 'IRR':
      thresholds = { excellent: 30, good: 20, fair: 10, poor: 5 };
      level = determinePerformanceLevel(value, thresholds, false);
      interpretation = `IRR of ${value.toFixed(2)}% indicates ${level} internal rate of return.`;
      recommendations = value > 15
        ? ['IRR exceeds typical hurdle rates', 'Strong candidate for funding']
        : ['IRR below typical hurdle rates', 'Evaluate strategic justification'];
      warnings = value < 5 ? ['Very low IRR - poor investment prospect'] : [];
      break;

    case 'Payback':
      thresholds = { excellent: 6, good: 12, fair: 24, poor: 36 };
      level = determinePerformanceLevel(value, thresholds, true);
      interpretation = `Payback period of ${value.toFixed(1)} months indicates ${level} capital recovery speed.`;
      recommendations = value <= 12
        ? ['Fast payback supports investment', 'Quick return of capital']
        : ['Extended payback period', 'Ensure long-term benefits justify wait'];
      warnings = value > 36 ? ['Very long payback period - high risk'] : [];
      break;

    default:
      interpretation = `${metricName}: ${value}`;
      recommendations = [];
      warnings = [];
      level = 'fair';
  }

  const confidence = calculateConfidence({
    dataCompleteness: 1.0,
    inputVariability: 0.1,
    calculationComplexity: 4,
  });

  return {
    interpretation,
    recommendations,
    warnings,
    confidence,
    influencingFactors: Object.entries(inputs).map(([key, val]) => `${key}: ${val}`),
    generatedAt: new Date(),
  };
}

function generateInterpretation(
  value: number,
  level: PerformanceLevel,
  metricName: string,
  lang: typeof LOCALIZED_CONTENT.en
): string {
  return `${metricName} of ${value.toFixed(2)}% ${lang.indicates} ${lang[level]} ${lang.performance}.`;
}

function generateOFIRecommendations(
  ofi: number,
  level: PerformanceLevel,
  lang: typeof LOCALIZED_CONTENT.en
): string[] {
  const recommendations: string[] = [];

  if (level === 'excellent') {
    recommendations.push('Maintain current operational efficiency');
    recommendations.push('Document best practices for replication');
  } else if (level === 'good') {
    recommendations.push('Good efficiency - identify remaining optimization opportunities');
    recommendations.push('Monitor for process drift');
  } else if (level === 'fair') {
    recommendations.push('Moderate friction - prioritize automation of repetitive tasks');
    recommendations.push('Conduct workflow analysis to identify bottlenecks');
  } else {
    recommendations.push('High friction detected - urgent optimization needed');
    recommendations.push('Implement automation for high-volume repetitive work');
    recommendations.push('Review resource allocation and process design');
  }

  return recommendations;
}

function generateOFIWarnings(
  ofi: number,
  level: PerformanceLevel,
  lang: typeof LOCALIZED_CONTENT.en
): string[] {
  const warnings: string[] = [];

  if (ofi > 60) {
    warnings.push('Critical friction level - significant productivity loss');
  }
  if (ofi > 40) {
    warnings.push('High operational friction reducing team efficiency');
  }
  if (ofi > 80) {
    warnings.push('Severe friction - immediate action required');
  }

  return warnings;
}
