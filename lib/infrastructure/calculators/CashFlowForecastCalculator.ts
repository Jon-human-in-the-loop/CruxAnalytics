import { BaseCalculator } from './BaseCalculator';
import type { CashFlowForecastInput } from '@/types/project';

export interface MonthlyForecast {
    month: number;
    monthName: string;
    revenue: number;
    expenses: number;
    netCashFlow: number;
    endingCash: number;
    isDeficit: boolean;
}

export class CashFlowForecastCalculator extends BaseCalculator {
    private readonly monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    constructor() {
        super('CashFlowForecastCalculator');
    }

    calculate(input: CashFlowForecastInput): {
        monthlyForecasts: MonthlyForecast[];
        totalRevenue: number;
        totalExpenses: number;
        totalNetCashFlow: number;
        endingCashBalance: number;
        lowestCashBalance: number;
        lowestCashMonth: number;
        deficitMonths: number[];
        monthsUntilDeficit: number | null;
        minimumCashReserveNeeded: number;
        averageMonthlyNetFlow: number;
        isHealthy: boolean;
    } {
        this.validate(input);

        const forecastMonths = input.forecastMonths || 12;
        const monthlyForecasts: MonthlyForecast[] = [];

        let currentCash = input.startingCash;
        let totalRevenue = 0;
        let totalExpenses = 0;
        let lowestCash = input.startingCash;
        let lowestCashMonth = 0;
        const deficitMonths: number[] = [];

        for (let month = 1; month <= forecastMonths; month++) {
            // Calculate revenue with growth and seasonality
            const growthMultiplier = Math.pow(
                1 + (input.revenueGrowthRate || 0) / 100,
                month - 1
            );
            const seasonalFactor = input.seasonalFactors?.[month - 1] || 1.0;
            const revenue = input.monthlyRevenue * growthMultiplier * seasonalFactor;

            // Calculate expenses with growth
            const expenseGrowthMultiplier = Math.pow(
                1 + (input.expenseGrowthRate || 0) / 100,
                month - 1
            );
            let expenses = input.monthlyExpenses * expenseGrowthMultiplier;

            // Add one-time expenses
            const oneTimeExpense = input.oneTimeExpenses?.find(e => e.month === month);
            if (oneTimeExpense) {
                expenses += oneTimeExpense.amount;
            }

            // Add expected receivables
            const receivable = input.expectedReceivables?.find(r => r.month === month);
            const additionalRevenue = receivable?.amount || 0;

            const totalMonthRevenue = revenue + additionalRevenue;
            const netCashFlow = totalMonthRevenue - expenses;
            currentCash += netCashFlow;

            totalRevenue += totalMonthRevenue;
            totalExpenses += expenses;

            const isDeficit = currentCash < 0;
            if (isDeficit) {
                deficitMonths.push(month);
            }

            if (currentCash < lowestCash) {
                lowestCash = currentCash;
                lowestCashMonth = month;
            }

            monthlyForecasts.push({
                month,
                monthName: this.monthNames[(month - 1) % 12],
                revenue: this.round(totalMonthRevenue, 2),
                expenses: this.round(expenses, 2),
                netCashFlow: this.round(netCashFlow, 2),
                endingCash: this.round(currentCash, 2),
                isDeficit,
            });
        }

        const totalNetCashFlow = totalRevenue - totalExpenses;
        const averageMonthlyNetFlow = totalNetCashFlow / forecastMonths;

        // Calculate minimum reserve needed (cover 3 months of expenses if negative flow)
        const minimumCashReserveNeeded = averageMonthlyNetFlow < 0
            ? Math.abs(averageMonthlyNetFlow) * 3
            : input.monthlyExpenses * 2;

        const monthsUntilDeficit = deficitMonths.length > 0 ? deficitMonths[0] : null;
        const isHealthy = deficitMonths.length === 0 && lowestCash >= minimumCashReserveNeeded;

        this.logCalculation('Total Revenue', totalRevenue);
        this.logCalculation('Total Expenses', totalExpenses);
        this.logCalculation('Ending Cash', currentCash);

        return {
            monthlyForecasts,
            totalRevenue: this.round(totalRevenue, 2),
            totalExpenses: this.round(totalExpenses, 2),
            totalNetCashFlow: this.round(totalNetCashFlow, 2),
            endingCashBalance: this.round(currentCash, 2),
            lowestCashBalance: this.round(lowestCash, 2),
            lowestCashMonth,
            deficitMonths,
            monthsUntilDeficit,
            minimumCashReserveNeeded: this.round(minimumCashReserveNeeded, 2),
            averageMonthlyNetFlow: this.round(averageMonthlyNetFlow, 2),
            isHealthy,
        };
    }

    protected override validate(input: CashFlowForecastInput): void {
        super.validate(input);

        this.assertFinite(input.startingCash, 'startingCash');
        this.assertPositive(input.monthlyRevenue, 'monthlyRevenue');
        this.assertPositive(input.monthlyExpenses, 'monthlyExpenses');

        if (input.forecastMonths !== undefined) {
            this.assertRange(input.forecastMonths, 1, 60, 'forecastMonths');
        }

        if (input.seasonalFactors) {
            input.seasonalFactors.forEach((factor, index) => {
                this.assertRange(factor, 0.1, 3.0, `seasonalFactors[${index}]`);
            });
        }
    }

    generateAlerts(result: ReturnType<typeof this.calculate>): string[] {
        const alerts: string[] = [];

        if (result.monthsUntilDeficit !== null) {
            alerts.push(
                `⚠️ CRITICAL: Cash will go negative in month ${result.monthsUntilDeficit}!`
            );
            alerts.push(
                'Immediate action required: Reduce expenses, increase sales, or secure financing.'
            );
        }

        if (result.lowestCashBalance < result.minimumCashReserveNeeded) {
            alerts.push(
                `⚠️ Cash reserve drops below recommended minimum of $${result.minimumCashReserveNeeded.toLocaleString()}`
            );
            alerts.push(
                `Lowest point: $${result.lowestCashBalance.toLocaleString()} in month ${result.lowestCashMonth}`
            );
        }

        if (result.averageMonthlyNetFlow < 0) {
            alerts.push(
                `📉 Average monthly cash burn: $${Math.abs(result.averageMonthlyNetFlow).toLocaleString()}`
            );
            alerts.push('Business is cash-flow negative. Review cost structure.');
        } else if (result.averageMonthlyNetFlow > 0) {
            alerts.push(
                `📈 Average monthly cash gain: $${result.averageMonthlyNetFlow.toLocaleString()}`
            );
        }

        if (result.isHealthy) {
            alerts.push('✅ Cash flow forecast looks healthy!');
        }

        return alerts;
    }
}
