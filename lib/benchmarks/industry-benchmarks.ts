/**
 * Industry benchmark data structure
 */
export interface IndustryBenchmark {
    industry: string;
    displayName: string;
    metrics: {
        grossMarginPercent: { p25: number; median: number; p75: number; optimal: number };
        netMarginPercent: { p25: number; median: number; p75: number; optimal: number };
        operatingMarginPercent: { p25: number; median: number; p75: number; optimal: number };
        laborCostPercent: { p25: number; median: number; p75: number; optimal: number };
        rentCostPercent: { p25: number; median: number; p75: number; optimal: number };
        inventoryTurnover: { p25: number; median: number; p75: number; optimal: number };
        currentRatio: { p25: number; median: number; p75: number; optimal: number };
        daysReceivable: { p25: number; median: number; p75: number; optimal: number };
        daysPayable: { p25: number; median: number; p75: number; optimal: number };
        revenueGrowthPercent: { p25: number; median: number; p75: number; optimal: number };
    };
    kpis: {
        name: string;
        description: string;
        targetValue: number;
        unit: string;
    }[];
}

/**
 * Comprehensive industry benchmark database
 */
export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
        // RESTAURANT / FOOD SERVICE
        restaurant: {
        industry: 'restaurant',
        displayName: 'Restaurant / Food Service',
        metrics: {
            grossMarginPercent: { p25: 55, median: 62, p75: 70, optimal: 65 },
            netMarginPercent: { p25: 2, median: 5, p75: 10, optimal: 8 },
            operatingMarginPercent: { p25: 3, median: 8, p75: 15, optimal: 12 },
            laborCostPercent: { p25: 25, median: 30, p75: 38, optimal: 28 },
            rentCostPercent: { p25: 5, median: 8, p75: 12, optimal: 7 },
            inventoryTurnover: { p25: 20, median: 30, p75: 45, optimal: 35 },
            currentRatio: { p25: 0.8, median: 1.2, p75: 1.8, optimal: 1.5 },
            daysReceivable: { p25: 0, median: 3, p75: 7, optimal: 2 },
            daysPayable: { p25: 15, median: 25, p75: 35, optimal: 25 },
            revenueGrowthPercent: { p25: 2, median: 5, p75: 12, optimal: 8 },
        },
        kpis: [
            { name: 'Food Cost', description: 'Cost of ingredients as % of food sales', targetValue: 28, unit: '%' },
            { name: 'Beverage Cost', description: 'Cost of beverages as % of beverage sales', targetValue: 22, unit: '%' },
            { name: 'Table Turnover', description: 'Number of seatings per table per day', targetValue: 2.5, unit: 'turns' },
            { name: 'Average Ticket', description: 'Average revenue per customer', targetValue: 25, unit: '$' },
            { name: 'RevPASH', description: 'Revenue per available seat hour', targetValue: 15, unit: '$' },
        ],
    },

        // E-COMMERCE
        ecommerce: {
        industry: 'ecommerce',
        displayName: 'E-commerce / Online Retail',
        metrics: {
            grossMarginPercent: { p25: 30, median: 42, p75: 55, optimal: 45 },
            netMarginPercent: { p25: 3, median: 8, p75: 15, optimal: 12 },
            operatingMarginPercent: { p25: 5, median: 10, p75: 18, optimal: 14 },
            laborCostPercent: { p25: 8, median: 12, p75: 18, optimal: 10 },
            rentCostPercent: { p25: 1, median: 3, p75: 5, optimal: 2 },
            inventoryTurnover: { p25: 4, median: 8, p75: 15, optimal: 10 },
            currentRatio: { p25: 1.2, median: 1.8, p75: 2.5, optimal: 2.0 },
            daysReceivable: { p25: 0, median: 2, p75: 5, optimal: 1 },
            daysPayable: { p25: 20, median: 35, p75: 50, optimal: 40 },
            revenueGrowthPercent: { p25: 10, median: 20, p75: 40, optimal: 25 },
        },
        kpis: [
            { name: 'Conversion Rate', description: 'Visitors who become customers', targetValue: 2.5, unit: '%' },
            { name: 'Cart Abandonment', description: 'Carts not completed', targetValue: 70, unit: '%' },
            { name: 'AOV', description: 'Average order value', targetValue: 80, unit: '$' },
            { name: 'CAC', description: 'Customer acquisition cost', targetValue: 45, unit: '$' },
            { name: 'LTV', description: 'Customer lifetime value', targetValue: 200, unit: '$' },
            { name: 'Return Rate', description: 'Orders returned', targetValue: 8, unit: '%' },
        ],
    },

        // PROFESSIONAL SERVICES
        services: {
        industry: 'services',
        displayName: 'Professional Services / Consulting',
        metrics: {
            grossMarginPercent: { p25: 50, median: 65, p75: 80, optimal: 70 },
            netMarginPercent: { p25: 10, median: 18, p75: 30, optimal: 22 },
            operatingMarginPercent: { p25: 12, median: 22, p75: 35, optimal: 28 },
            laborCostPercent: { p25: 40, median: 50, p75: 60, optimal: 48 },
            rentCostPercent: { p25: 3, median: 6, p75: 10, optimal: 5 },
            inventoryTurnover: { p25: 0, median: 0, p75: 0, optimal: 0 }, // N/A for services
            currentRatio: { p25: 1.5, median: 2.2, p75: 3.5, optimal: 2.5 },
            daysReceivable: { p25: 30, median: 45, p75: 60, optimal: 35 },
            daysPayable: { p25: 20, median: 30, p75: 45, optimal: 30 },
            revenueGrowthPercent: { p25: 5, median: 12, p75: 25, optimal: 15 },
        },
        kpis: [
            { name: 'Billable Utilization', description: 'Billable hours vs available hours', targetValue: 75, unit: '%' },
            { name: 'Average Hourly Rate', description: 'Revenue per billable hour', targetValue: 150, unit: '$' },
            { name: 'Client Retention', description: 'Clients retained year-over-year', targetValue: 85, unit: '%' },
            { name: 'Revenue per Employee', description: 'Annual revenue per staff member', targetValue: 150000, unit: '$' },
            { name: 'Proposal Win Rate', description: 'Proposals that become projects', targetValue: 35, unit: '%' },
        ],
    },

        // RETAIL
        retail: {
        industry: 'retail',
        displayName: 'Retail Store / Physical Shop',
        metrics: {
            grossMarginPercent: { p25: 28, median: 38, p75: 48, optimal: 42 },
            netMarginPercent: { p25: 1, median: 4, p75: 8, optimal: 5 },
            operatingMarginPercent: { p25: 3, median: 6, p75: 10, optimal: 7 },
            laborCostPercent: { p25: 12, median: 16, p75: 22, optimal: 15 },
            rentCostPercent: { p25: 6, median: 10, p75: 15, optimal: 9 },
            inventoryTurnover: { p25: 3, median: 6, p75: 10, optimal: 7 },
            currentRatio: { p25: 1.2, median: 1.8, p75: 2.5, optimal: 2.0 },
            daysReceivable: { p25: 0, median: 5, p75: 15, optimal: 3 },
            daysPayable: { p25: 25, median: 40, p75: 60, optimal: 45 },
            revenueGrowthPercent: { p25: 1, median: 4, p75: 10, optimal: 6 },
        },
        kpis: [
            { name: 'Sales per Sq Ft', description: 'Annual sales per square foot', targetValue: 300, unit: '$' },
            { name: 'Basket Size', description: 'Items per transaction', targetValue: 3.5, unit: 'items' },
            { name: 'Conversion Rate', description: 'Visitors who purchase', targetValue: 20, unit: '%' },
            { name: 'Shrinkage', description: 'Inventory loss from theft/damage', targetValue: 1.5, unit: '%' },
            { name: 'GMROI', description: 'Gross margin return on inventory investment', targetValue: 3.0, unit: 'x' },
        ],
    },

        // MANUFACTURING
        manufacturing: {
        industry: 'manufacturing',
        displayName: 'Manufacturing / Production',
        metrics: {
            grossMarginPercent: { p25: 22, median: 32, p75: 42, optimal: 35 },
            netMarginPercent: { p25: 3, median: 7, p75: 12, optimal: 9 },
            operatingMarginPercent: { p25: 5, median: 10, p75: 16, optimal: 12 },
            laborCostPercent: { p25: 15, median: 22, p75: 30, optimal: 20 },
            rentCostPercent: { p25: 3, median: 5, p75: 8, optimal: 5 },
            inventoryTurnover: { p25: 4, median: 7, p75: 12, optimal: 9 },
            currentRatio: { p25: 1.3, median: 2.0, p75: 2.8, optimal: 2.2 },
            daysReceivable: { p25: 35, median: 50, p75: 70, optimal: 45 },
            daysPayable: { p25: 30, median: 45, p75: 65, optimal: 50 },
            revenueGrowthPercent: { p25: 2, median: 6, p75: 12, optimal: 8 },
        },
        kpis: [
            { name: 'OEE', description: 'Overall equipment effectiveness', targetValue: 85, unit: '%' },
            { name: 'Yield Rate', description: 'Good units vs total units produced', targetValue: 95, unit: '%' },
            { name: 'Capacity Utilization', description: 'Actual output vs max capacity', targetValue: 80, unit: '%' },
            { name: 'On-Time Delivery', description: 'Orders delivered on schedule', targetValue: 95, unit: '%' },
            { name: 'Material Cost %', description: 'Material cost as % of revenue', targetValue: 45, unit: '%' },
        ],
    },
};

/**
 * Get benchmarks for a specific industry
 * 
 * @param industry - Industry identifier
 * @returns Industry benchmark data or undefined
 */
export function getIndustryBenchmarks(industry: string): IndustryBenchmark | undefined {
    return INDUSTRY_BENCHMARKS[industry];
}

/**
 * Compare a metric value to industry benchmarks
 * 
 * @param industry - Industry identifier
 * @param metric - Metric name
 * @param value - Actual value to compare
 * @returns Comparison result with percentile position
 */
export function compareToIndustry(
    industry: string,
    metric: keyof IndustryBenchmark['metrics'],
    value: number
): {
    percentile: 'top25' | 'aboveMedian' | 'belowMedian' | 'bottom25';
    vsMedian: number;
    vsOptimal: number;
    message: string;
    benchmark: { p25: number; median: number; p75: number; optimal: number };
} {
    const benchmarks = getIndustryBenchmarks(industry);

    if (!benchmarks) {
        throw new Error(`Industry not found: ${industry}`);
    }

    const benchmark = benchmarks.metrics[metric];

    // Determine percentile position
    let percentile: 'top25' | 'aboveMedian' | 'belowMedian' | 'bottom25';

    // For most metrics, higher is better
    const higherIsBetter = !metric.includes('Cost') && !metric.includes('days');

    if (higherIsBetter) {
        if (value >= benchmark.p75) {
            percentile = 'top25';
        } else if (value >= benchmark.median) {
            percentile = 'aboveMedian';
        } else if (value >= benchmark.p25) {
            percentile = 'belowMedian';
        } else {
            percentile = 'bottom25';
        }
    } else {
        // For cost metrics, lower is better
        if (value <= benchmark.p25) {
            percentile = 'top25';
        } else if (value <= benchmark.median) {
            percentile = 'aboveMedian';
        } else if (value <= benchmark.p75) {
            percentile = 'belowMedian';
        } else {
            percentile = 'bottom25';
        }
    }

    const vsMedian = ((value - benchmark.median) / benchmark.median) * 100;
    const vsOptimal = ((value - benchmark.optimal) / benchmark.optimal) * 100;

    // Generate message
    let message: string;
    switch (percentile) {
        case 'top25':
            message = `Your ${metric} is in the TOP 25% of the industry!`;
            break;
        case 'aboveMedian':
            message = `Your ${metric} is above the industry median.`;
            break;
        case 'belowMedian':
            message = `Your ${metric} is below the industry median.`;
            break;
        case 'bottom25':
            message = `Your ${metric} is in the BOTTOM 25% of the industry.`;
            break;
    }

    return {
        percentile,
        vsMedian: Math.round(vsMedian * 10) / 10,
        vsOptimal: Math.round(vsOptimal * 10) / 10,
        message,
        benchmark,
    };
}

/**
 * Get available industries
 */
export function getAvailableIndustries(): string[] {
    return Object.keys(INDUSTRY_BENCHMARKS);
}

/**
 * Get KPIs for an industry
 * 
 * @param industry - Industry identifier
 * @returns Array of KPI definitions
 */
export function getIndustryKPIs(industry: string): IndustryBenchmark['kpis'] {
    const benchmarks = getIndustryBenchmarks(industry);
    return benchmarks?.kpis || [];
}

/**
 * Generate a health score for a business based on key metrics
 * 
 * @param industry - Industry identifier
 * @param metrics - Object with metric values
 * @returns Overall health score 0-100
 */
export function calculateBusinessHealthScore(
    industry: string,
    metrics: Partial<Record<keyof IndustryBenchmark['metrics'], number>>
): {
    overallScore: number;
    category: 'excellent' | 'good' | 'fair' | 'poor';
    breakdown: Array<{
        metric: string;
        value: number;
        score: number;
        weight: number;
    }>;
} {
    const benchmarks = getIndustryBenchmarks(industry);

    if (!benchmarks) {
        throw new Error(`Industry not found: ${industry}`);
    }

    const weights: Partial<Record<keyof IndustryBenchmark['metrics'], number>> = {
        grossMarginPercent: 25,
        netMarginPercent: 20,
        currentRatio: 15,
        laborCostPercent: 15,
        revenueGrowthPercent: 15,
        inventoryTurnover: 10,
    };

    const breakdown: Array<{
        metric: string;
        value: number;
        score: number;
        weight: number;
    }> = [];

    let totalWeight = 0;
    let weightedScore = 0;

    for (const [metric, value] of Object.entries(metrics)) {
        const metricKey = metric as keyof IndustryBenchmark['metrics'];
        const weight = weights[metricKey] || 0;

        if (weight === 0 || value === undefined) continue;

        const benchmark = benchmarks.metrics[metricKey];
        const higherIsBetter = !metric.includes('Cost') && !metric.includes('days');

        let score: number;
        if (higherIsBetter) {
            if (value >= benchmark.optimal) {
                score = 100;
            } else if (value >= benchmark.p75) {
                score = 85;
            } else if (value >= benchmark.median) {
                score = 70;
            } else if (value >= benchmark.p25) {
                score = 50;
            } else {
                score = 30;
            }
        } else {
            // For cost metrics, lower is better
            if (value <= benchmark.optimal) {
                score = 100;
            } else if (value <= benchmark.p25) {
                score = 85;
            } else if (value <= benchmark.median) {
                score = 70;
            } else if (value <= benchmark.p75) {
                score = 50;
            } else {
                score = 30;
            }
        }

        breakdown.push({ metric, value, score, weight });
        totalWeight += weight;
        weightedScore += score * weight;
    }

    const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

    let category: 'excellent' | 'good' | 'fair' | 'poor';
    if (overallScore >= 85) {
        category = 'excellent';
    } else if (overallScore >= 70) {
        category = 'good';
    } else if (overallScore >= 50) {
        category = 'fair';
    } else {
        category = 'poor';
    }

    return { overallScore, category, breakdown };
}
