/**
 * @fileoverview Vanguard Crux proprietary metrics calculator.
 * Implements OFI (Operational Friction Index), TFDI (Tech-Debt Financial Drag Index),
 * and SER (Strategic Efficiency Ratio) - exclusive Vanguard Crux methodologies.
 * 
 * @module infrastructure/calculators/VanguardMetricsCalculator
 */

import { BaseCalculator } from './BaseCalculator';
import type { VanguardInput } from '@/types/project';

/**
 * Calculator for Vanguard Crux proprietary business intelligence metrics.
 * These metrics represent Vanguard Crux's unique analytical framework.
 * 
 * @class VanguardMetricsCalculator
 * @extends BaseCalculator
 * 
 * @example
 * ```typescript
 * const calculator = new VanguardMetricsCalculator();
 * const metrics = calculator.calculate({
 *   manualProcessHoursPerWeek: 20,
 *   averageHourlyCost: 50,
 *   automationPotential: 80,
 *   maintenanceHoursPerSprint: 40,
 *   totalDevHoursPerSprint: 160,
 *   devTeamAnnualCost: 500000,
 *   incidentCostPerMonth: 5000,
 *   currentRevenue: 1000000,
 *   previousRevenue: 800000,
 *   currentBurnRate: 100000,
 *   previousBurnRate: 90000
 * });
 * ```
 */
export class VanguardMetricsCalculator extends BaseCalculator {
  constructor() {
    super('VanguardMetricsCalculator');
  }

  /**
   * Calculates all Vanguard Crux proprietary metrics.
   * 
   * @param input - Vanguard-specific input data
   * @returns Object containing OFI, TFDI, and SER values
   * 
   * @throws {Error} If validation fails
   */
  calculate(input: VanguardInput): {
    ofi: number;
    tfdi: number;
    ser: number;
  } {
    this.validate(input);

    const ofi = this.calculateOFI(input);
    const tfdi = this.calculateTFDI(input);
    const ser = this.calculateSER(input);

    this.logCalculation('OFI', ofi);
    this.logCalculation('TFDI', tfdi);
    this.logCalculation('SER', ser);

    return { ofi, tfdi, ser };
  }

  /**
   * Validates Vanguard input data.
   * 
   * @protected
   * @override
   */
  protected override validate(input: VanguardInput): void {
    super.validate(input);

    // OFI validation - allow 0 for optional fields
    this.assertFinite(input.manualProcessHoursPerWeek, 'manualProcessHoursPerWeek');
    if (input.manualProcessHoursPerWeek < 0) {
      throw new Error(`${this.calculatorName}: manualProcessHoursPerWeek must be non-negative`);
    }
    this.assertFinite(input.averageHourlyCost, 'averageHourlyCost');
    if (input.averageHourlyCost < 0) {
      throw new Error(`${this.calculatorName}: averageHourlyCost must be non-negative`);
    }
    this.assertRange(input.automationPotential, 0, 100, 'automationPotential');

    // TFDI validation - allow 0 for optional fields
    this.assertFinite(input.maintenanceHoursPerSprint, 'maintenanceHoursPerSprint');
    if (input.maintenanceHoursPerSprint < 0) {
      throw new Error(`${this.calculatorName}: maintenanceHoursPerSprint must be non-negative`);
    }
    this.assertPositive(input.totalDevHoursPerSprint, 'totalDevHoursPerSprint');
    this.assertPositive(input.devTeamAnnualCost, 'devTeamAnnualCost');
    this.assertFinite(input.incidentCostPerMonth, 'incidentCostPerMonth');
    if (input.incidentCostPerMonth < 0) {
      throw new Error(`${this.calculatorName}: incidentCostPerMonth must be non-negative`);
    }

    // SER validation
    this.assertPositive(input.currentRevenue, 'currentRevenue');
    this.assertPositive(input.previousRevenue, 'previousRevenue');
    this.assertPositive(input.currentBurnRate, 'currentBurnRate');
    this.assertPositive(input.previousBurnRate, 'previousBurnRate');

    // Business logic validation
    if (input.maintenanceHoursPerSprint > input.totalDevHoursPerSprint) {
      throw new Error(
        `${this.calculatorName}: maintenanceHoursPerSprint cannot exceed totalDevHoursPerSprint`
      );
    }
  }

  /**
   * Calculates OFI (Operational Friction Index).
   * 
   * **Vanguard Crux Proprietary Methodology**
   * 
   * Measures the financial burden of manual operational processes.
   * Formula: (Manual Process Hours × Cost × 52) / Annual Revenue
   * 
   * Interpretation:
   * - < 0.03: Optimal operational efficiency
   * - 0.03-0.08: Acceptable, but improvement opportunities exist
   * - > 0.08: High friction, automation strongly recommended
   * - Industry average: 0.10
   * 
   * @private
   * @param input - Vanguard input data
   * @returns OFI value (0-1 scale, lower is better)
   */
  private calculateOFI(input: VanguardInput): number {
    const {
      manualProcessHoursPerWeek,
      averageHourlyCost,
      currentRevenue,
    } = input;

    // Calculate annual cost of manual processes
    const annualManualCost = manualProcessHoursPerWeek * averageHourlyCost * 52;

    // Normalize by revenue to get friction index
    const ofi = this.safeDivide(annualManualCost, currentRevenue, 0);

    return this.round(ofi, 4);
  }

  /**
   * Calculates TFDI (Tech-Debt Financial Drag Index).
   * 
   * **Vanguard Crux Proprietary Methodology**
   * 
   * Quantifies the financial impact of technical debt and legacy systems.
   * Formula: (Maintenance Hours / Total Hours) × Team Cost + (Incident Costs × 12)
   * Normalized as percentage of engineering budget.
   * 
   * Interpretation:
   * - < 0.15: Optimal tech health
   * - 0.15-0.25: Acceptable, monitor closely
   * - > 0.25: High drag, refactoring priority
   * - Industry average: 0.30
   * 
   * @private
   * @param input - Vanguard input data
   * @returns TFDI value (0-1 scale, lower is better)
   */
  private calculateTFDI(input: VanguardInput): number {
    const {
      maintenanceHoursPerSprint,
      totalDevHoursPerSprint,
      devTeamAnnualCost,
      incidentCostPerMonth,
    } = input;

    // Calculate maintenance ratio
    const maintenanceRatio = this.safeDivide(
      maintenanceHoursPerSprint,
      totalDevHoursPerSprint,
      0
    );

    // Calculate annual maintenance cost
    const annualMaintenanceCost = maintenanceRatio * devTeamAnnualCost;

    // Add incident costs
    const annualIncidentCost = incidentCostPerMonth * 12;

    // Total tech debt drag
    const totalDrag = annualMaintenanceCost + annualIncidentCost;

    // Normalize by engineering budget
    const tfdi = this.safeDivide(totalDrag, devTeamAnnualCost, 0);

    return this.round(tfdi, 4);
  }

  /**
   * Calculates SER (Strategic Efficiency Ratio).
   * 
   * **Vanguard Crux Proprietary Methodology**
   * 
   * Measures how efficiently resources convert to business outcomes.
   * Formula: (Revenue Growth Rate) / (Burn Rate Increase)
   * 
   * Interpretation:
   * - > 1.5: Excellent efficiency, sustainable growth
   * - 1.0-1.5: Good efficiency, stable trajectory
   * - 0.8-1.0: Acceptable, watch for trends
   * - < 0.8: Concerning, cost optimization needed
   * - Industry target: 1.2
   * 
   * @private
   * @param input - Vanguard input data
   * @returns SER value (ratio, higher is better)
   */
  private calculateSER(input: VanguardInput): number {
    const {
      currentRevenue,
      previousRevenue,
      currentBurnRate,
      previousBurnRate,
    } = input;

    // Calculate revenue growth rate
    const revenueGrowthRate = this.safeDivide(
      currentRevenue - previousRevenue,
      previousRevenue,
      0
    );

    // Calculate burn rate increase
    const burnRateIncrease = this.safeDivide(
      currentBurnRate - previousBurnRate,
      previousBurnRate,
      0.01 // Avoid division by zero, use small denominator
    );

    // Calculate SER
    // If burn rate is decreasing (negative increase), this is excellent
    // so we invert the sign to give a positive SER
    const ser = this.safeDivide(revenueGrowthRate, Math.abs(burnRateIncrease), 0);

    // Adjust for burn rate decrease (bonus multiplier)
    if (burnRateIncrease < 0) {
      return this.round(ser * 1.5, 4); // 50% bonus for decreasing burn rate
    }

    return this.round(ser, 4);
  }

  /**
   * Gets benchmark values for OFI.
   * 
   * @returns Benchmark object
   */
  getOFIBenchmarks(): { optimal: number; acceptable: number; industry: number } {
    return {
      optimal: 0.03,
      acceptable: 0.08,
      industry: 0.10,
    };
  }

  /**
   * Gets benchmark values for TFDI.
   * 
   * @returns Benchmark object
   */
  getTFDIBenchmarks(): { optimal: number; acceptable: number; industry: number } {
    return {
      optimal: 0.15,
      acceptable: 0.25,
      industry: 0.30,
    };
  }

  /**
   * Gets benchmark values for SER.
   * 
   * @returns Benchmark object
   */
  getSERBenchmarks(): { optimal: number; acceptable: number; industry: number } {
    return {
      optimal: 2.0,
      acceptable: 1.0,
      industry: 1.2,
    };
  }
}
