import type { ProjectData } from '@/types/project';

export interface BreakEvenPoint {
  month: number;
  amount: number;
  achieved: boolean;
}

export interface BreakEvenData {
  breakEvenPoint: BreakEvenPoint;
  cumulativeRevenue: number[];
  cumulativeCosts: number[];
  months: number[];
}

export function calculateBreakEven(project: ProjectData): BreakEvenData {
  const {
    initialInvestment,
    projectDuration,
    yearlyRevenue,
    revenueGrowth,
    operatingCosts,
    maintenanceCosts,
  } = project;

  const cumulativeRevenue: number[] = [];
  const cumulativeCosts: number[] = [];
  const months: number[] = [];

  let totalRevenue = 0;
  let totalCosts = initialInvestment; // Start with initial investment

  let breakEvenMonth = -1;
  let breakEvenAmount = 0;

  for (let month = 0; month < projectDuration; month++) {
    const year = Math.floor(month / 12);
    const growthFactor = Math.pow(1 + revenueGrowth / 100, year);

    // Calculate monthly revenue
    const monthlyRevenue = (yearlyRevenue * growthFactor) / 12;
    totalRevenue += monthlyRevenue;

    // Calculate monthly costs
    const monthlyCosts = (operatingCosts + maintenanceCosts) / 12;
    totalCosts += monthlyCosts;

    // Store cumulative values
    cumulativeRevenue.push(totalRevenue);
    cumulativeCosts.push(totalCosts);
    months.push(month + 1);

    // Check if break-even is achieved
    if (breakEvenMonth === -1 && totalRevenue >= totalCosts) {
      breakEvenMonth = month + 1;
      breakEvenAmount = totalRevenue;
    }
  }

  return {
    breakEvenPoint: {
      month: breakEvenMonth,
      amount: breakEvenAmount,
      achieved: breakEvenMonth !== -1,
    },
    cumulativeRevenue,
    cumulativeCosts,
    months,
  };
}

/**
 * Get break-even percentage (what % of project duration until break-even)
 */
export function getBreakEvenPercentage(
  breakEvenMonth: number,
  projectDuration: number
): number {
  if (breakEvenMonth === -1) return 100;
  return (breakEvenMonth / projectDuration) * 100;
}

/**
 * Format break-even month as "X years Y months" or "Y months"
 */
export function formatBreakEvenPeriod(months: number, language: 'es' | 'en'): string {
  if (months === -1) {
    return language === 'es' ? 'No alcanzado' : 'Not achieved';
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return language === 'es'
      ? `${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`
      : `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
  }

  if (remainingMonths === 0) {
    return language === 'es'
      ? `${years} ${years === 1 ? 'año' : 'años'}`
      : `${years} ${years === 1 ? 'year' : 'years'}`;
  }

  return language === 'es'
    ? `${years} ${years === 1 ? 'año' : 'años'} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`
    : `${years} ${years === 1 ? 'year' : 'years'} and ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
}
