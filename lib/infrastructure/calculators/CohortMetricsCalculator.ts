import { BaseCalculator } from './BaseCalculator';
import type { CohortInput } from '@/types/project';

export class CohortMetricsCalculator extends BaseCalculator {
    constructor() {
        super('CohortMetricsCalculator');
    }

    calculate(input: CohortInput): {
        contributionMargin: number;
        marginPerCustomer: number;
        profitabilityIndex: number;
        isLosingMoney: boolean;
        cohortName: string;
    } {
        this.validate(input);

        const contributionMargin = this.calculateContributionMargin(input);
        const marginPerCustomer = this.calculateMarginPerCustomer(input);
        const profitabilityIndex = this.calculateProfitabilityIndex(input);
        const isLosingMoney = contributionMargin < 0;

        this.logCalculation('Contribution Margin', contributionMargin, {
            cohort: input.cohortName,
        });
        this.logCalculation('Margin per Customer', marginPerCustomer);
        this.logCalculation('Profitability Index', profitabilityIndex);

        return {
            contributionMargin,
            marginPerCustomer,
            profitabilityIndex,
            isLosingMoney,
            cohortName: input.cohortName,
        };
    }

    protected override validate(input: CohortInput): void {
        super.validate(input);

        if (!input.cohortName || input.cohortName.trim() === '') {
            throw new Error(`${this.calculatorName}: cohortName is required`);
        }
        this.assertPositive(input.cohortRevenue, 'cohortRevenue');
        this.assertPositive(input.directCosts, 'directCosts');
        this.assertPositive(input.customerCount, 'customerCount');
        this.assertPositive(input.acquisitionCost, 'acquisitionCost');
        this.assertPositive(input.servicingCostPerCustomer, 'servicingCostPerCustomer');
    }

    private calculateContributionMargin(input: CohortInput): number {
        const { cohortRevenue, directCosts } = input;

        const margin = this.safeDivide(
            (cohortRevenue - directCosts),
            cohortRevenue,
            0
        ) * 100;

        return this.round(margin, 2);
    }

    private calculateMarginPerCustomer(input: CohortInput): number {
        const { cohortRevenue, directCosts, customerCount } = input;

        const totalMargin = cohortRevenue - directCosts;
        const marginPerCustomer = this.safeDivide(totalMargin, customerCount, 0);

        return this.round(marginPerCustomer, 2);
    }

    private calculateProfitabilityIndex(input: CohortInput): number {
        const marginPerCustomer = this.calculateMarginPerCustomer(input);
        const { acquisitionCost, servicingCostPerCustomer } = input;

        // How many months of servicing cost does the margin cover after recovering CAC
        const netMargin = marginPerCustomer - acquisitionCost;
        const index = this.safeDivide(netMargin, servicingCostPerCustomer, 0);

        return this.round(index, 2);
    }

    getContributionMarginBenchmarks(): { optimal: number; acceptable: number; critical: number } {
        return {
            optimal: 40,
            acceptable: 20,
            critical: 0,
        };
    }

    getProfitabilityIndexBenchmarks(): { optimal: number; acceptable: number; critical: number } {
        return {
            optimal: 2.0,
            acceptable: 1.0,
            critical: 0,
        };
    }

    generateRecommendations(
        contributionMargin: number,
        profitabilityIndex: number
    ): string[] {
        const recommendations: string[] = [];

        if (contributionMargin < 0) {
            recommendations.push(
                'CRITICAL: This cohort is losing money. Consider discontinuing service or restructuring pricing immediately.'
            );
            recommendations.push(
                'Analyze which cost components are driving losses and explore cost reduction opportunities.'
            );
        } else if (contributionMargin < 20) {
            recommendations.push(
                'Contribution margin is below industry average (20%). Review pricing strategy for this segment.'
            );
            recommendations.push(
                'Consider upselling higher-margin products/services to this cohort.'
            );
        } else if (contributionMargin >= 40) {
            recommendations.push(
                'High-value cohort identified. Consider investing in expansion and customer acquisition for this segment.'
            );
            recommendations.push(
                'Analyze what makes this cohort profitable and replicate success factors in other segments.'
            );
        }

        if (profitabilityIndex < 0) {
            recommendations.push(
                'Acquisition costs exceed lifetime contribution. Reduce CAC or increase customer value.'
            );
        } else if (profitabilityIndex < 1) {
            recommendations.push(
                'Marginal profitability. Focus on retention to extend customer lifetime value.'
            );
        }

        return recommendations;
    }
}
