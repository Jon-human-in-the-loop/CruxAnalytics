import { BaseCalculator } from './BaseCalculator';
import type { LoanInput } from '@/types/project';

/**
 * Amortization schedule entry
 */
export interface AmortizationEntry {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
}

export class LoanCalculator extends BaseCalculator {
    constructor() {
        super('LoanCalculator');
    }

    calculate(input: LoanInput): {
        monthlyPayment: number;
        totalPayment: number;
        totalInterest: number;
        effectiveAnnualRate: number;
        totalCostWithFees: number;
        amortizationSchedule: AmortizationEntry[];
        firstYearPrincipal: number;
        firstYearInterest: number;
        affordability: {
            debtServiceRatio: number | null;
            isAffordable: boolean | null;
            maxAffordablePayment: number | null;
            cushionAfterPayment: number | null;
        };
        payoffSummary: {
            halfwayPoint: number;
            principalAtHalfway: number;
        };
    } {
        this.validate(input);

        const { principal, annualInterestRate, termMonths, originationFee } = input;

        const monthlyRate = annualInterestRate / 100 / 12;

        // Calculate monthly payment using amortization formula
        const monthlyPayment = this.calculateMonthlyPayment(principal, monthlyRate, termMonths);

        // Generate amortization schedule
        const amortizationSchedule = this.generateAmortizationSchedule(
            principal,
            monthlyRate,
            termMonths,
            monthlyPayment
        );

        const totalPayment = monthlyPayment * termMonths;
        const totalInterest = totalPayment - principal;

        // Calculate costs with fees
        const fees = originationFee ? principal * (originationFee / 100) : 0;
        const totalCostWithFees = totalPayment + fees;

        // Effective annual rate (includes fees)
        const effectiveAnnualRate = this.calculateEffectiveRate(
            principal - fees,
            monthlyPayment,
            termMonths
        );

        // First year breakdown
        const firstYear = amortizationSchedule.slice(0, Math.min(12, termMonths));
        const firstYearPrincipal = firstYear.reduce((sum, entry) => sum + entry.principal, 0);
        const firstYearInterest = firstYear.reduce((sum, entry) => sum + entry.interest, 0);

        // Affordability analysis
        const affordability = this.calculateAffordability(input, monthlyPayment);

        // Payoff summary
        const halfwayPoint = Math.floor(termMonths / 2);
        const principalAtHalfway = amortizationSchedule[halfwayPoint - 1]?.balance || 0;

        this.logCalculation('Monthly Payment', monthlyPayment);
        this.logCalculation('Total Interest', totalInterest);
        this.logCalculation('Effective Rate', effectiveAnnualRate);

        return {
            monthlyPayment: this.round(monthlyPayment, 2),
            totalPayment: this.round(totalPayment, 2),
            totalInterest: this.round(totalInterest, 2),
            effectiveAnnualRate: this.round(effectiveAnnualRate, 2),
            totalCostWithFees: this.round(totalCostWithFees, 2),
            amortizationSchedule,
            firstYearPrincipal: this.round(firstYearPrincipal, 2),
            firstYearInterest: this.round(firstYearInterest, 2),
            affordability,
            payoffSummary: {
                halfwayPoint,
                principalAtHalfway: this.round(principalAtHalfway, 2),
            },
        };
    }

    private calculateMonthlyPayment(
        principal: number,
        monthlyRate: number,
        termMonths: number
    ): number {
        if (monthlyRate === 0) {
            return principal / termMonths;
        }

        const payment = principal *
            (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
            (Math.pow(1 + monthlyRate, termMonths) - 1);

        return payment;
    }

    /**
     * Generates full amortization schedule.
     * 
     * @private
     */
    private generateAmortizationSchedule(
        principal: number,
        monthlyRate: number,
        termMonths: number,
        monthlyPayment: number
    ): AmortizationEntry[] {
        const schedule: AmortizationEntry[] = [];
        let balance = principal;

        for (let month = 1; month <= termMonths; month++) {
            const interest = balance * monthlyRate;
            const principalPaid = monthlyPayment - interest;
            balance -= principalPaid;

            schedule.push({
                month,
                payment: this.round(monthlyPayment, 2),
                principal: this.round(principalPaid, 2),
                interest: this.round(interest, 2),
                balance: this.round(Math.max(0, balance), 2),
            });
        }

        return schedule;
    }

    private calculateEffectiveRate(
        netProceeds: number,
        monthlyPayment: number,
        termMonths: number
    ): number {
        // Simplified calculation - could use Newton-Raphson for exact APR
        const totalPaid = monthlyPayment * termMonths;
        const totalInterest = totalPaid - netProceeds;
        const averageBalance = netProceeds / 2;
        const years = termMonths / 12;

        return (totalInterest / averageBalance / years) * 100;
    }

    private calculateAffordability(
        input: LoanInput,
        monthlyPayment: number
    ): {
        debtServiceRatio: number | null;
        isAffordable: boolean | null;
        maxAffordablePayment: number | null;
        cushionAfterPayment: number | null;
    } {
        if (!input.monthlyRevenue || !input.monthlyExpenses) {
            return {
                debtServiceRatio: null,
                isAffordable: null,
                maxAffordablePayment: null,
                cushionAfterPayment: null,
            };
        }

        const netCashFlow = input.monthlyRevenue - input.monthlyExpenses;
        const debtServiceRatio = (monthlyPayment / netCashFlow) * 100;

        // Generally, debt service should be < 40% of available cash flow
        const isAffordable = debtServiceRatio <= 40;
        const maxAffordablePayment = netCashFlow * 0.4;
        const cushionAfterPayment = netCashFlow - monthlyPayment;

        return {
            debtServiceRatio: this.round(debtServiceRatio, 2),
            isAffordable,
            maxAffordablePayment: this.round(maxAffordablePayment, 2),
            cushionAfterPayment: this.round(cushionAfterPayment, 2),
        };
    }

    protected override validate(input: LoanInput): void {
        super.validate(input);

        this.assertPositive(input.principal, 'principal');
        this.assertRange(input.annualInterestRate, 0, 100, 'annualInterestRate');
        this.assertRange(input.termMonths, 1, 360, 'termMonths');

        if (input.originationFee !== undefined) {
            this.assertRange(input.originationFee, 0, 10, 'originationFee');
        }
    }

    generateRecommendations(
        result: ReturnType<typeof this.calculate>,
        input: LoanInput
    ): string[] {
        const recommendations: string[] = [];

        // Interest cost
        const interestRatio = (result.totalInterest / input.principal) * 100;
        recommendations.push(
            `Total interest cost: ${interestRatio.toFixed(1)}% of principal ($${result.totalInterest.toLocaleString()})`
        );

        // Affordability
        if (result.affordability.isAffordable === false) {
            recommendations.push(
                '⚠️ WARNING: This loan may stretch your cash flow too thin.'
            );
            recommendations.push(
                `Maximum affordable payment: $${result.affordability.maxAffordablePayment?.toLocaleString()}/month`
            );
            recommendations.push(
                'Consider: longer term, smaller amount, or lower rate.'
            );
        } else if (result.affordability.isAffordable === true) {
            recommendations.push(
                `✅ Loan is affordable. Cash cushion after payment: $${result.affordability.cushionAfterPayment?.toLocaleString()}/month`
            );
        }

        // Rate comparison
        if (input.annualInterestRate > 15) {
            recommendations.push(
                'High interest rate. Explore SBA loans or credit unions for better rates.'
            );
        } else if (input.annualInterestRate < 5) {
            recommendations.push(
                'Excellent interest rate! This is a competitive offer.'
            );
        }

        // Term advice
        if (input.termMonths > 84) {
            recommendations.push(
                'Long term means more interest paid. Consider shorter term if affordable.'
            );
        }

        return recommendations;
    }

    /**
     * Compare multiple loan options.
     * 
     * @param loans - Array of loan inputs to compare
     * @returns Comparison with best option highlighted
     */
    compareLoanOptions(loans: LoanInput[]): {
        options: Array<LoanInput & { totalCost: number; monthlyPayment: number }>;
        bestOption: number;
        savings: number;
    } {
        const results = loans.map(loan => {
            const calc = this.calculate(loan);
            return {
                ...loan,
                totalCost: calc.totalCostWithFees,
                monthlyPayment: calc.monthlyPayment,
            };
        });

        const sortedByTotalCost = [...results].sort((a, b) => a.totalCost - b.totalCost);
        const bestOption = results.indexOf(sortedByTotalCost[0]);
        const worstCost = sortedByTotalCost[sortedByTotalCost.length - 1].totalCost;
        const savings = worstCost - sortedByTotalCost[0].totalCost;

        return {
            options: results,
            bestOption,
            savings: this.round(savings, 2),
        };
    }
}
