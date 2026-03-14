import { calculateFinancialMetrics } from './financial-calculator';
import type { ProjectData } from '@/types/project';

export type SensitivityVariable = 
  | 'initialInvestment'
  | 'yearlyRevenue'
  | 'operatingCosts'
  | 'maintenanceCosts';

export interface SensitivityResult {
  variable: SensitivityVariable;
  variableName: string;
  variation: number; // -30, -20, -10, 0, 10, 20, 30
  npv: number;
  roi: number;
  npvChange: number; // Change from base case
  roiChange: number; // Change from base case
}

export interface TornadoChartData {
  variable: SensitivityVariable;
  variableName: string;
  negativeImpact: number; // NPV at -30%
  positiveImpact: number; // NPV at +30%
  range: number; // Absolute difference
}

/**
 * Calculate sensitivity analysis for a single variable
 */
export function calculateSensitivity(
  project: ProjectData,
  variable: SensitivityVariable,
  variations: number[] = [-30, -20, -10, 0, 10, 20, 30]
): SensitivityResult[] {
  const results: SensitivityResult[] = [];

  // Get base case values
  const baseParams = {
    initialInvestment: project.initialInvestment,
    discountRate: project.discountRate,
    projectDuration: project.projectDuration,
    yearlyRevenue: project.yearlyRevenue,
    revenueGrowth: project.revenueGrowth,
    operatingCosts: project.operatingCosts,
    maintenanceCosts: project.maintenanceCosts,
    multiplier: 1.0,
  };

  const baseCase = calculateFinancialMetrics(baseParams);
  const baseNPV = baseCase.npv;
  const baseROI = baseCase.roi;

  // Calculate for each variation
  for (const variation of variations) {
    const multiplier = 1 + variation / 100;
    const params = { ...baseParams };

    // Apply variation to the specific variable
    switch (variable) {
      case 'initialInvestment':
        params.initialInvestment = project.initialInvestment * multiplier;
        break;
      case 'yearlyRevenue':
        params.yearlyRevenue = project.yearlyRevenue * multiplier;
        break;
      case 'operatingCosts':
        params.operatingCosts = project.operatingCosts * multiplier;
        break;
      case 'maintenanceCosts':
        params.maintenanceCosts = project.maintenanceCosts * multiplier;
        break;
    }

    const result = calculateFinancialMetrics(params);

    results.push({
      variable,
      variableName: getVariableName(variable),
      variation,
      npv: result.npv,
      roi: result.roi,
      npvChange: result.npv - baseNPV,
      roiChange: result.roi - baseROI,
    });
  }

  return results;
}

/**
 * Calculate sensitivity analysis for all variables
 */
export function calculateMultiVariableSensitivity(
  project: ProjectData,
  variations: number[] = [-30, -20, -10, 0, 10, 20, 30]
): Record<SensitivityVariable, SensitivityResult[]> {
  const variables: SensitivityVariable[] = [
    'initialInvestment',
    'yearlyRevenue',
    'operatingCosts',
    'maintenanceCosts',
  ];

  const results: Record<SensitivityVariable, SensitivityResult[]> = {} as any;

  for (const variable of variables) {
    results[variable] = calculateSensitivity(project, variable, variations);
  }

  return results;
}

/**
 * Generate tornado chart data (shows impact range for each variable)
 */
export function generateTornadoChartData(
  project: ProjectData
): TornadoChartData[] {
  const variables: SensitivityVariable[] = [
    'initialInvestment',
    'yearlyRevenue',
    'operatingCosts',
    'maintenanceCosts',
  ];

  const data: TornadoChartData[] = [];

  for (const variable of variables) {
    const results = calculateSensitivity(project, variable, [-30, 0, 30]);

    const negativeCase = results.find((r) => r.variation === -30);
    const positiveCase = results.find((r) => r.variation === 30);
    const baseCase = results.find((r) => r.variation === 0);

    if (negativeCase && positiveCase && baseCase) {
      const negativeImpact = negativeCase.npv - baseCase.npv;
      const positiveImpact = positiveCase.npv - baseCase.npv;
      const range = Math.abs(negativeImpact) + Math.abs(positiveImpact);

      data.push({
        variable,
        variableName: getVariableName(variable),
        negativeImpact,
        positiveImpact,
        range,
      });
    }
  }

  // Sort by range (highest impact first)
  data.sort((a, b) => b.range - a.range);

  return data;
}

/**
 * Get human-readable variable name
 */
export function getVariableName(variable: SensitivityVariable): string {
  const names: Record<SensitivityVariable, string> = {
    initialInvestment: 'Initial Investment',
    yearlyRevenue: 'Yearly Revenue',
    operatingCosts: 'Operating Costs',
    maintenanceCosts: 'Maintenance Costs',
  };
  return names[variable];
}

/**
 * Get variable name in Spanish
 */
export function getVariableNameES(variable: SensitivityVariable): string {
  const names: Record<SensitivityVariable, string> = {
    initialInvestment: 'Inversión Inicial',
    yearlyRevenue: 'Ingresos Anuales',
    operatingCosts: 'Costos Operativos',
    maintenanceCosts: 'Costos de Mantenimiento',
  };
  return names[variable];
}

/**
 * Determine color based on NPV value
 */
export function getSensitivityColor(npv: number, baseNPV: number): string {
  const change = npv - baseNPV;
  const percentChange = (change / Math.abs(baseNPV)) * 100;

  if (percentChange > 10) return '#22C55E'; // Green - positive
  if (percentChange < -10) return '#EF4444'; // Red - negative
  return '#F59E0B'; // Yellow - neutral
}

/**
 * Format sensitivity value for display
 */
export function formatSensitivityValue(
  value: number,
  type: 'currency' | 'percentage'
): string {
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } else {
    return `${value.toFixed(1)}%`;
  }
}
