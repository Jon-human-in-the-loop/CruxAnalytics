import { BaseCalculator } from './BaseCalculator';
import type { EmployeeROIInput } from '@/types/project';

export class EmployeeROICalculator extends BaseCalculator {
    constructor() {
        super('EmployeeROICalculator');
    }

    calculate(input: EmployeeROIInput): {
        totalCost: number;
        roiPercentage: number;
        netContribution: number;
        revenuePerDollarSpent: number;
        costPerHour: number;
        revenuePerHour: number;
        breakEvenRevenue: number;
        productivityRatio: number;
        isWorthHiring: boolean;
        paybackMonths: number | null;
        benchmarkComparison: {
            costEfficiency: 'above' | 'average' | 'below';
            productivityLevel: 'high' | 'average' | 'low';
        };
    } {
        this.validate(input);

        const {
            annualSalary,
            annualBenefits,
            onboardingCosts,
            revenueGenerated,
            hoursPerWeek,
        } = input;

        // Calculate total cost
        const recurringAnnualCost = annualSalary + annualBenefits;
        const totalFirstYearCost = recurringAnnualCost + onboardingCosts;

        // Calculate ROI
        const netContribution = revenueGenerated - totalFirstYearCost;
        const roiPercentage = this.safeDivide(netContribution, totalFirstYearCost, 0) * 100;

        // Revenue per dollar spent
        const revenuePerDollarSpent = this.safeDivide(revenueGenerated, totalFirstYearCost, 0);

        // Hourly metrics
        const annualHours = hoursPerWeek * 52;
        const costPerHour = this.safeDivide(recurringAnnualCost, annualHours, 0);
        const revenuePerHour = this.safeDivide(revenueGenerated, annualHours, 0);

        // Break-even revenue
        const breakEvenRevenue = totalFirstYearCost;

        // Productivity ratio (revenue per hour / cost per hour)
        const productivityRatio = this.safeDivide(revenuePerHour, costPerHour, 0);

        // Is worth hiring (ROI > 0 and productivity > 1)
        const isWorthHiring = roiPercentage > 0 && productivityRatio > 1;

        // Payback period (months to recover onboarding cost)
        let paybackMonths: number | null = null;
        if (netContribution > 0) {
            const monthlyNetContribution = netContribution / 12;
            paybackMonths = this.round(
                onboardingCosts / monthlyNetContribution,
                1
            );
        }

        // Benchmark comparison
        const benchmarkComparison = this.getBenchmarkComparison(
            productivityRatio,
            costPerHour,
            input.roleType
        );

        this.logCalculation('Employee ROI', roiPercentage);
        this.logCalculation('Productivity Ratio', productivityRatio);
        this.logCalculation('Net Contribution', netContribution);

        return {
            totalCost: this.round(totalFirstYearCost, 2),
            roiPercentage: this.round(roiPercentage, 2),
            netContribution: this.round(netContribution, 2),
            revenuePerDollarSpent: this.round(revenuePerDollarSpent, 2),
            costPerHour: this.round(costPerHour, 2),
            revenuePerHour: this.round(revenuePerHour, 2),
            breakEvenRevenue: this.round(breakEvenRevenue, 2),
            productivityRatio: this.round(productivityRatio, 2),
            isWorthHiring,
            paybackMonths,
            benchmarkComparison,
        };
    }

    private getBenchmarkComparison(
        productivityRatio: number,
        costPerHour: number,
        roleType?: string
    ): {
        costEfficiency: 'above' | 'average' | 'below';
        productivityLevel: 'high' | 'average' | 'low';
    } {
        // Industry benchmarks by role
        const benchmarks: Record<string, { avgCostPerHour: number; avgProductivity: number }> = {
            sales: { avgCostPerHour: 35, avgProductivity: 3.0 },
            operations: { avgCostPerHour: 28, avgProductivity: 2.0 },
            technical: { avgCostPerHour: 45, avgProductivity: 2.5 },
            administrative: { avgCostPerHour: 22, avgProductivity: 1.5 },
        };

        const benchmark = benchmarks[roleType || 'operations'];

        const costEfficiency = costPerHour < benchmark.avgCostPerHour * 0.9
            ? 'above'
            : costPerHour > benchmark.avgCostPerHour * 1.1
                ? 'below'
                : 'average';

        const productivityLevel = productivityRatio > benchmark.avgProductivity * 1.2
            ? 'high'
            : productivityRatio < benchmark.avgProductivity * 0.8
                ? 'low'
                : 'average';

        return { costEfficiency, productivityLevel };
    }

    protected override validate(input: EmployeeROIInput): void {
        super.validate(input);

        this.assertPositive(input.annualSalary, 'annualSalary');
        this.assertPositive(input.annualBenefits, 'annualBenefits');
        this.assertPositive(input.onboardingCosts, 'onboardingCosts');
        this.assertPositive(input.revenueGenerated, 'revenueGenerated');
        this.assertRange(input.hoursPerWeek, 1, 80, 'hoursPerWeek');
    }

    generateRecommendations(result: ReturnType<typeof this.calculate>): string[] {
        const recommendations: string[] = [];

        if (!result.isWorthHiring) {
            recommendations.push(
                '⚠️ This hire may not generate positive ROI based on projected revenue.'
            );
            recommendations.push(
                'Consider: Can this role generate more revenue with better tools/training?'
            );
        } else {
            recommendations.push(
                `✅ Positive ROI: Employee generates $${result.revenuePerDollarSpent.toFixed(2)} for every $1 spent.`
            );
        }

        if (result.roiPercentage > 100) {
            recommendations.push(
                'Excellent ROI! Consider hiring additional similar roles.'
            );
        } else if (result.roiPercentage > 50) {
            recommendations.push(
                'Good ROI. This is a valuable team member.'
            );
        } else if (result.roiPercentage > 0) {
            recommendations.push(
                'Moderate ROI. Look for ways to increase productivity or reduce costs.'
            );
        }

        // Benchmark feedback
        if (result.benchmarkComparison.productivityLevel === 'high') {
            recommendations.push(
                'Productivity is ABOVE industry average. Great performer!'
            );
        } else if (result.benchmarkComparison.productivityLevel === 'low') {
            recommendations.push(
                'Productivity is BELOW industry average. Consider training or process improvements.'
            );
        }

        if (result.paybackMonths !== null) {
            recommendations.push(
                `Onboarding investment recovered in ${result.paybackMonths} months.`
            );
        }

        return recommendations;
    }

    /**
     * Calculate optimal salary range based on expected revenue.
     * 
     * @param expectedRevenue - Expected annual revenue for the role
     * @param targetROI - Target ROI percentage (default 50%)
     * @returns Salary range and total cost budget
     */
    calculateOptimalSalaryRange(
        expectedRevenue: number,
        targetROI: number = 50
    ): {
        maxTotalCost: number;
        recommendedSalaryRange: { min: number; max: number };
        assumedBenefitsRatio: number;
    } {
        // Max cost to achieve target ROI: Revenue / (1 + ROI)
        const maxTotalCost = expectedRevenue / (1 + targetROI / 100);

        // Assuming benefits are ~20% of salary
        const assumedBenefitsRatio = 0.20;
        const salaryPortion = maxTotalCost / (1 + assumedBenefitsRatio);

        return {
            maxTotalCost: this.round(maxTotalCost, 0),
            recommendedSalaryRange: {
                min: this.round(salaryPortion * 0.85, 0),
                max: this.round(salaryPortion, 0),
            },
            assumedBenefitsRatio,
        };
    }
}
