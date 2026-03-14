import { CalculateFinancialMetrics } from '@/lib/application/use-cases/CalculateFinancialMetrics';
import type { ProjectData } from '@/types/project';

const exampleProjectData: ProjectData = {
  id: 'example-001',
  name: 'New SaaS Product Launch',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  initialInvestment: 100000,
  discountRate: 10,
  projectDuration: 36,
  yearlyRevenue: 150000,
  revenueGrowth: 20,
  operatingCosts: 30000,
  maintenanceCosts: 10000,
  bestCaseMultiplier: 1.3,
  worstCaseMultiplier: 0.7,
  businessModel: 'saas' as const,
  vanguardInput: {
    manualProcessHoursPerWeek: 20,
    averageHourlyCost: 50,
    automationPotential: 80,
    maintenanceHoursPerSprint: 40,
    totalDevHoursPerSprint: 160,
    devTeamAnnualCost: 500000,
    incidentCostPerMonth: 5000,
    currentRevenue: 150000,
    previousRevenue: 125000,
    currentBurnRate: 100000,
    previousBurnRate: 90000,
  },
  saasInput: {
    averageRevenuePerUser: 100,
    churnRate: 5,
    cacCost: 200,
    grossMargin: 75,
    startingMRR: 10000,
    expansionMRR: 2000,
    churnedMRR: 500,
    contractedMRR: 200,
    revenueGrowthRate: 20,
    profitMargin: 15,
  },
  riskInput: {
    currentCash: 500000,
    monthlyBurnRate: 40000,
    plannedFundraising: 1000000,
    monthlyChurnRate: 5,
    currentMRR: 10000,
    averageContractValue: 1200,
  },
};

async function runExample() {
  console.log('CruxAnalytics Modular Architecture Example');
  const useCase = new CalculateFinancialMetrics();
  const enrichedResults = await useCase.execute(exampleProjectData);
  console.log('Standard Metrics:', enrichedResults.standard.map(m => `${m.name}: ${m.value}`));
  console.log('Vanguard Metrics:', enrichedResults.vanguard.map(m => `${m.name}: ${m.value}`));
  return enrichedResults;
}

export { runExample, exampleProjectData };
