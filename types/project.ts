export interface ProjectData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  description?: string;

  // Basic Information
  initialInvestment: number;
  discountRate: number;
  projectDuration: number; // in months

  // Revenue Projections
  yearlyRevenue: number;
  revenueGrowth: number; // percentage

  // Costs
  operatingCosts: number;
  maintenanceCosts: number;

  // Scenario Analysis
  bestCaseMultiplier: number;
  worstCaseMultiplier: number;

  // Calculated Results
  results?: ProjectResults;

  // Scenarios
  scenarios?: ScenarioSnapshot[];

  // New fields for modular architecture
  businessModel?: 'standard' | 'saas' | 'ecommerce' | 'manufacturing';
  vanguardInput?: VanguardInput;
  saasInput?: SaaSInput;
  riskInput?: RiskInput;
}

export interface ProjectResults {
  // Expected Case
  roi: number;
  npv: number;
  paybackPeriod: number;
  irr: number;

  // Best Case
  roiBest: number;
  npvBest: number;
  paybackBest: number;
  irrBest: number;

  // Worst Case
  roiWorst: number;
  npvWorst: number;
  paybackWorst: number;
  irrWorst: number;

  // Cash Flow Data
  monthlyCashFlow: number[];
  cumulativeCashFlow: number[];

  // Vanguard Proprietary Metrics
  vanguard?: {
    ofi: number;
    tfdi: number;
    ser: number;
  };

  // AI Insights
  aiInsights?: string;
  aiGeneratedAt?: string;
}

export interface ScenarioSnapshot {
  id: string;
  name: string;
  createdAt: string;
  isBase: boolean;

  // Adjustments (percentage changes from original)
  salesAdjustment: number; // -50 to +50
  costsAdjustment: number; // -50 to +50
  discountAdjustment: number; // -5 to +5

  // Calculated Results for this scenario
  results: {
    roi: number;
    npv: number;
    paybackPeriod: number;
    irr: number;
    monthlyCashFlow: number[];
    cumulativeCashFlow: number[];
  };
}

export interface ComparisonData {
  baseScenario: ScenarioSnapshot;
  dynamicScenario: ScenarioSnapshot;
  differences: {
    roiDiff: number;
    npvDiff: number;
    paybackDiff: number;
    irrDiff: number;
  };
}

export interface FinancialCalculationInput {
  initialInvestment: number;
  discountRate: number;
  projectDuration: number;
  yearlyRevenue: number;
  revenueGrowth: number;
  operatingCosts: number;
  maintenanceCosts: number;
  multiplier?: number; // For scenario analysis
}

export interface FinancialCalculationResult {
  roi: number;
  npv: number;
  paybackPeriod: number;
  irr: number;
  monthlyCashFlow: number[];
  cumulativeCashFlow: number[];
}

export interface CashFlowData {
  month: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}

export interface VanguardInput {
  // OFI inputs
  manualProcessHoursPerWeek: number;
  averageHourlyCost: number;
  automationPotential: number; // 0-100%

  // TFDI inputs
  maintenanceHoursPerSprint: number;
  totalDevHoursPerSprint: number;
  devTeamAnnualCost: number;
  incidentCostPerMonth: number;

  // SER inputs
  currentRevenue: number;
  previousRevenue: number;
  currentBurnRate: number;
  previousBurnRate: number;
}

export interface SaaSInput {
  averageRevenuePerUser: number;
  churnRate: number; // monthly %
  cacCost: number;
  grossMargin: number; // %
  startingMRR: number;
  expansionMRR: number;
  churnedMRR: number;
  contractedMRR: number;
  revenueGrowthRate: number; // %
  profitMargin: number; // %
}

/**
 * Risk metrics input
 */
export interface RiskInput {
  currentCash: number;
  monthlyBurnRate: number;
  plannedFundraising?: number;
  monthlyChurnRate: number;
  currentMRR: number;
  averageContractValue: number;
}

/**
 * XAI Context for Explainable AI
 */
export interface MetricContext {
  category: 'financial' | 'operational' | 'strategic' | 'risk';
  formula: string;
  assumptions: string[];
  constraints: string[];
  interpretation: 'positive' | 'negative' | 'neutral';
  benchmarks?: {
    industry: number;
    optimal: number;
    acceptable: number;
  };
  recommendations?: string[];
}

/**
 * Enhanced metric with XAI support
 */
export interface EnrichedMetric {
  name: string;
  value: number;
  context: MetricContext;
  timestamp: string;
}

/**
 * Complete results with all metric categories
 */
export interface EnrichedProjectResults {
  standard: EnrichedMetric[];      // ROI, NPV, IRR, Payback
  vanguard: EnrichedMetric[];      // OFI, TFDI, SER
  saas: EnrichedMetric[];          // LTV/CAC, NRR, Rule of 40
  risk: EnrichedMetric[];          // Runway, Churn Impact
  xaiReady: boolean;               // Flag for LLM processing
  auditLog: AuditEntry[];          // Technical traceability
  generatedAt: string;
}

/**
 * Audit log entry
 */
export interface AuditEntry {
  timestamp: string;
  action: string;
  metricsCalculated: string[];
  engine: string;
  userId?: string;
  errorDetails?: any;
}
