import { CalculationService } from '@/lib/application/services/CalculationService';
import { XAIService } from '@/lib/application/services/XAIService';
import { Metric } from '@/lib/domain/entities/Metric';
import { ROIContextStrategy } from '@/lib/infrastructure/strategies/ROIContextStrategy';
import { NPVContextStrategy } from '@/lib/infrastructure/strategies/NPVContextStrategy';
import { OFIContextStrategy } from '@/lib/infrastructure/strategies/OFIContextStrategy';
import { TFDIContextStrategy } from '@/lib/infrastructure/strategies/TFDIContextStrategy';
import { SERContextStrategy } from '@/lib/infrastructure/strategies/SERContextStrategy';
import { DefaultContextStrategy } from '@/lib/infrastructure/strategies/DefaultContextStrategy';
import type { ProjectData, EnrichedProjectResults, EnrichedMetric, AuditEntry } from '@/types/project';

/**
 * Use case for calculating all financial metrics with XAI enrichment.
 * Main entry point for metric calculations in the application.
 * 
 * 
 * @example
 * ```typescript
 * const useCase = new CalculateFinancialMetrics();
 * const enrichedResults = await useCase.execute(projectData);
 * 
 * // Access standard metrics with XAI context
 * enrichedResults.standard.forEach(metric => {
 *   console.log(metric.name, metric.value);
 *   console.log(metric.context.recommendations);
 * });
 * 
 * // Access Vanguard metrics
 * enrichedResults.vanguard.forEach(metric => {
 *   console.log(metric.name, metric.value);
 * });
 * ```
 */
export class CalculateFinancialMetrics {
  private calculationService: CalculationService;
  private xaiService: XAIService;

  constructor() {
    this.calculationService = new CalculationService();
    this.xaiService = new XAIService();
    this.registerStrategies();
  }

  /**
   * Registers all XAI context strategies.
   * 
   * @private
   */
  private registerStrategies(): void {
    // Register standard metric strategies
    this.xaiService.registerStrategy('ROI', new ROIContextStrategy());
    this.xaiService.registerStrategy('NPV', new NPVContextStrategy());
    this.xaiService.registerStrategy('IRR', new DefaultContextStrategy('IRR'));
    this.xaiService.registerStrategy('PAYBACK', new DefaultContextStrategy('Payback Period'));

    // Register Vanguard proprietary strategies
    this.xaiService.registerStrategy('OFI', new OFIContextStrategy());
    this.xaiService.registerStrategy('TFDI', new TFDIContextStrategy());
    this.xaiService.registerStrategy('SER', new SERContextStrategy());

    // Register SaaS metric strategies
    this.xaiService.registerStrategy('LTV', new DefaultContextStrategy('LTV'));
    this.xaiService.registerStrategy('LTV_CAC', new DefaultContextStrategy('LTV/CAC'));
    this.xaiService.registerStrategy('NRR', new DefaultContextStrategy('NRR'));
    this.xaiService.registerStrategy('RULE_OF_40', new DefaultContextStrategy('Rule of 40'));

    // Register risk metric strategies
    this.xaiService.registerStrategy('RUNWAY', new DefaultContextStrategy('Runway'));
    this.xaiService.registerStrategy('CHURN_IMPACT', new DefaultContextStrategy('Churn Impact'));
  }

  async execute(projectData: ProjectData): Promise<EnrichedProjectResults> {
    const startTime = Date.now();
    const auditLog: AuditEntry[] = [];

    try {
      // Step 1: Calculate all raw metrics
      const rawResults = await this.calculationService.calculateAll(projectData);

      // Step 2: Enrich standard metrics with XAI context
      const standardMetrics = this.enrichStandardMetrics(rawResults.standard, projectData);
      auditLog.push(this.createAuditEntry('standard_metrics', standardMetrics.map(m => m.name)));

      // Step 3: Enrich Vanguard metrics if available
      const vanguardMetrics = rawResults.vanguard
        ? this.enrichVanguardMetrics(rawResults.vanguard, projectData)
        : [];
      if (vanguardMetrics.length > 0) {
        auditLog.push(this.createAuditEntry('vanguard_metrics', vanguardMetrics.map(m => m.name)));
      }

      // Step 4: Enrich SaaS metrics if available
      const saasMetrics = rawResults.saas
        ? this.enrichSaaSMetrics(rawResults.saas, projectData)
        : [];
      if (saasMetrics.length > 0) {
        auditLog.push(this.createAuditEntry('saas_metrics', saasMetrics.map(m => m.name)));
      }

      // Step 5: Enrich risk metrics if available
      const riskMetrics = rawResults.risk
        ? this.enrichRiskMetrics(rawResults.risk, projectData)
        : [];
      if (riskMetrics.length > 0) {
        auditLog.push(this.createAuditEntry('risk_metrics', riskMetrics.map(m => m.name)));
      }

      // Step 6: Create enriched results
      const enrichedResults: EnrichedProjectResults = {
        standard: standardMetrics,
        vanguard: vanguardMetrics,
        saas: saasMetrics,
        risk: riskMetrics,
        xaiReady: true,
        auditLog,
        generatedAt: new Date().toISOString(),
      };

      const duration = Date.now() - startTime;
      console.log(`[CalculateFinancialMetrics] Completed in ${duration}ms`);

      return enrichedResults;
    } catch (error) {
      auditLog.push(this.createAuditEntry('error', [], error));
      throw error;
    }
  }

  private enrichStandardMetrics(
    rawResults: {
      roi: number;
      npv: number;
      irr: number;
      paybackPeriod: number;
      monthlyCashFlow: number[];
      cumulativeCashFlow: number[];
    },
    projectData: ProjectData
  ): EnrichedMetric[] {
    const metrics: Metric[] = [
      this.xaiService.enrichMetric('ROI', rawResults.roi, projectData),
      this.xaiService.enrichMetric('NPV', rawResults.npv, projectData),
      this.xaiService.enrichMetric('IRR', rawResults.irr, projectData),
      this.xaiService.enrichMetric('Payback Period', rawResults.paybackPeriod, projectData),
    ];

    return metrics.map(m => m.toXAIFormat());
  }

  private enrichVanguardMetrics(
    rawResults: {
      ofi: number;
      tfdi: number;
      ser: number;
    },
    projectData: ProjectData
  ): EnrichedMetric[] {
    const metrics: Metric[] = [
      this.xaiService.enrichMetric('OFI', rawResults.ofi, projectData),
      this.xaiService.enrichMetric('TFDI', rawResults.tfdi, projectData),
      this.xaiService.enrichMetric('SER', rawResults.ser, projectData),
    ];

    return metrics.map(m => m.toXAIFormat());
  }

  /**
   * Enriches SaaS metrics with XAI context.
   * 
   * @private
   */
  private enrichSaaSMetrics(
    rawResults: {
      ltv: number;
      cac: number;
      ltv_cac_ratio: number;
      payback_months: number;
      nrr: number;
      rule_of_40: number;
    },
    projectData: ProjectData
  ): EnrichedMetric[] {
    const metrics: Metric[] = [
      this.xaiService.enrichMetric('LTV', rawResults.ltv, projectData),
      this.xaiService.enrichMetric('LTV/CAC', rawResults.ltv_cac_ratio, projectData),
      this.xaiService.enrichMetric('CAC Payback', rawResults.payback_months, projectData),
      this.xaiService.enrichMetric('NRR', rawResults.nrr, projectData),
      this.xaiService.enrichMetric('Rule of 40', rawResults.rule_of_40, projectData),
    ];

    return metrics.map(m => m.toXAIFormat());
  }

  /**
   * Enriches risk metrics with XAI context.
   * 
   * @private
   */
  private enrichRiskMetrics(
    rawResults: {
      runway_months: number;
      zero_cash_date: string;
      churn_impact_6mo: number;
    },
    projectData: ProjectData
  ): EnrichedMetric[] {
    const metrics: Metric[] = [
      this.xaiService.enrichMetric('Runway', rawResults.runway_months, projectData),
      this.xaiService.enrichMetric('Churn Impact (6mo)', rawResults.churn_impact_6mo, projectData),
    ];

    return metrics.map(m => m.toXAIFormat());
  }

  /**
   * Creates an audit log entry.
   * 
   * @private
   */
  private createAuditEntry(
    action: string,
    metricsCalculated: string[],
    errorDetails?: any
  ): AuditEntry {
    return {
      timestamp: new Date().toISOString(),
      action,
      metricsCalculated,
      engine: 'CalculateFinancialMetrics v2.0',
      errorDetails,
    };
  }
}
