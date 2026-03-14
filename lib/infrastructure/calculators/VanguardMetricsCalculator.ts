import { BaseCalculator } from './BaseCalculator';
import type { VanguardInput } from '@/types/project';

export class VanguardMetricsCalculator extends BaseCalculator {
  constructor() {
    super('VanguardMetricsCalculator');
  }

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
    this.assertFinite(input.totalDevHoursPerSprint, 'totalDevHoursPerSprint');
    if (input.totalDevHoursPerSprint <= 0) input.totalDevHoursPerSprint = 1;

    this.assertFinite(input.devTeamAnnualCost, 'devTeamAnnualCost');
    if (input.devTeamAnnualCost <= 0) input.devTeamAnnualCost = 1;

    this.assertFinite(input.incidentCostPerMonth, 'incidentCostPerMonth');
    if (input.incidentCostPerMonth < 0) throw new Error(`${this.calculatorName}: incidentCostPerMonth must be non-negative`);

    // SER validation - Allow 0 for all fields
    this.assertFinite(input.currentRevenue, 'currentRevenue');
    this.assertFinite(input.previousRevenue, 'previousRevenue');
    this.assertFinite(input.currentBurnRate, 'currentBurnRate');
    this.assertFinite(input.previousBurnRate, 'previousBurnRate');

    if (input.currentRevenue < 0) throw new Error(`${this.calculatorName}: currentRevenue must be non-negative`);
    if (input.previousRevenue < 0) throw new Error(`${this.calculatorName}: previousRevenue must be non-negative`);
    if (input.currentBurnRate < 0) throw new Error(`${this.calculatorName}: currentBurnRate must be non-negative`);
    if (input.previousBurnRate < 0) throw new Error(`${this.calculatorName}: previousBurnRate must be non-negative`);

    // Business logic validation
    if (input.maintenanceHoursPerSprint > input.totalDevHoursPerSprint) {
      throw new Error(
        `${this.calculatorName}: maintenanceHoursPerSprint cannot exceed totalDevHoursPerSprint`
      );
    }
  }

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

  getOFIBenchmarks(): { optimal: number; acceptable: number; industry: number } {
    return {
      optimal: 0.03,
      acceptable: 0.08,
      industry: 0.10,
    };
  }

  getTFDIBenchmarks(): { optimal: number; acceptable: number; industry: number } {
    return {
      optimal: 0.15,
      acceptable: 0.25,
      industry: 0.30,
    };
  }

  getSERBenchmarks(): { optimal: number; acceptable: number; industry: number } {
    return {
      optimal: 2.0,
      acceptable: 1.0,
      industry: 1.2,
    };
  }
}
