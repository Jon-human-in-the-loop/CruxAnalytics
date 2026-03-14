import { describe, it, expect } from 'vitest';
import { BreakEvenCalculator } from '../lib/infrastructure/calculators/BreakEvenCalculator';
import { CashFlowForecastCalculator } from '../lib/infrastructure/calculators/CashFlowForecastCalculator';
import { PricingCalculator } from '../lib/infrastructure/calculators/PricingCalculator';
import { LoanCalculator } from '../lib/infrastructure/calculators/LoanCalculator';
import { EmployeeROICalculator } from '../lib/infrastructure/calculators/EmployeeROICalculator';
import { MarketingROICalculator } from '../lib/infrastructure/calculators/MarketingROICalculator';

describe('BreakEvenCalculator', () => {
    const calculator = new BreakEvenCalculator();

    it('should calculate break-even units correctly', () => {
        const result = calculator.calculate({
            fixedCosts: 50000,
            pricePerUnit: 25,
            variableCostPerUnit: 10,
        });

        // Break-even = 50000 / (25 - 10) = 3333.33
        expect(result.breakEvenUnits).toBe(3333);
        expect(result.breakEvenRevenue).toBe(83333.33);
        expect(result.contributionMarginPerUnit).toBe(15);
    });

    it('should calculate margin of safety when current sales provided', () => {
        const result = calculator.calculate({
            fixedCosts: 50000,
            pricePerUnit: 25,
            variableCostPerUnit: 10,
            currentSalesUnits: 5000,
        });

        expect(result.marginOfSafety).toBeGreaterThan(0);
        expect(result.isAboveBreakEven).toBe(true);
    });

    it('should detect below break-even scenario', () => {
        const result = calculator.calculate({
            fixedCosts: 50000,
            pricePerUnit: 25,
            variableCostPerUnit: 10,
            currentSalesUnits: 2000,
        });

        expect(result.isAboveBreakEven).toBe(false);
        expect(result.marginOfSafety).toBeLessThan(0);
    });

    it('should throw error when price <= variable cost', () => {
        expect(() => calculator.calculate({
            fixedCosts: 50000,
            pricePerUnit: 10,
            variableCostPerUnit: 15,
        })).toThrow('pricePerUnit must be greater than variableCostPerUnit');
    });
});

describe('CashFlowForecastCalculator', () => {
    const calculator = new CashFlowForecastCalculator();

    it('should generate 12-month forecast by default', () => {
        const result = calculator.calculate({
            startingCash: 50000,
            monthlyRevenue: 30000,
            monthlyExpenses: 25000,
        });

        expect(result.monthlyForecasts).toHaveLength(12);
        expect(result.totalRevenue).toBe(360000);
        expect(result.totalExpenses).toBe(300000);
        expect(result.isHealthy).toBe(true);
    });

    it('should detect deficit months', () => {
        const result = calculator.calculate({
            startingCash: 10000,
            monthlyRevenue: 20000,
            monthlyExpenses: 35000,
        });

        expect(result.deficitMonths.length).toBeGreaterThan(0);
        expect(result.monthsUntilDeficit).toBeLessThanOrEqual(2);
        expect(result.isHealthy).toBe(false);
    });

    it('should apply seasonal factors', () => {
        const result = calculator.calculate({
            startingCash: 50000,
            monthlyRevenue: 30000,
            monthlyExpenses: 25000,
            seasonalFactors: [1.0, 0.8, 0.8, 1.0, 1.2, 1.5, 1.5, 1.5, 1.0, 1.0, 1.2, 1.5],
        });

        // Revenue should vary based on seasonal factors
        expect(result.monthlyForecasts[4].revenue).toBe(36000); // 30000 * 1.2
        expect(result.monthlyForecasts[5].revenue).toBe(45000); // 30000 * 1.5
    });
});

describe('PricingCalculator', () => {
    const calculator = new PricingCalculator();

    it('should calculate target margin price correctly', () => {
        const result = calculator.calculate({
            costPerUnit: 15,
            desiredMargin: 40,
        });

        // Target price = 15 / (1 - 0.4) = 25
        expect(result.targetMarginPrice).toBe(25);
        expect(result.grossProfitPerUnit).toBe(10);
        expect(result.markupPercentage).toBeCloseTo(66.67, 1);
    });

    it('should compare to competitor price', () => {
        const result = calculator.calculate({
            costPerUnit: 15,
            desiredMargin: 40,
            competitorPrice: 30,
        });

        expect(result.competitorComparison).not.toBeNull();
        expect(result.competitorComparison?.position).toBe('below');
    });

    it('should provide price strategies', () => {
        const result = calculator.calculate({
            costPerUnit: 20,
            desiredMargin: 50,
        });

        expect(result.priceStrategies.premium).toBeGreaterThan(result.priceStrategies.competitive);
        expect(result.priceStrategies.penetration).toBeLessThan(result.priceStrategies.competitive);
    });
});

describe('LoanCalculator', () => {
    const calculator = new LoanCalculator();

    it('should calculate monthly payment correctly', () => {
        const result = calculator.calculate({
            principal: 100000,
            annualInterestRate: 8,
            termMonths: 60,
        });

        // Expected monthly payment ~$2,028
        expect(result.monthlyPayment).toBeGreaterThan(2000);
        expect(result.monthlyPayment).toBeLessThan(2100);
        expect(result.totalInterest).toBeGreaterThan(0);
    });

    it('should generate amortization schedule', () => {
        const result = calculator.calculate({
            principal: 50000,
            annualInterestRate: 6,
            termMonths: 36,
        });

        expect(result.amortizationSchedule).toHaveLength(36);
        expect(result.amortizationSchedule[35].balance).toBe(0);
    });

    it('should calculate affordability', () => {
        const result = calculator.calculate({
            principal: 100000,
            annualInterestRate: 8,
            termMonths: 60,
            monthlyRevenue: 50000,
            monthlyExpenses: 40000,
        });

        expect(result.affordability.debtServiceRatio).not.toBeNull();
        expect(result.affordability.isAffordable).not.toBeNull();
    });

    it('should compare loan options', () => {
        const comparison = calculator.compareLoanOptions([
            { principal: 50000, annualInterestRate: 8, termMonths: 36 },
            { principal: 50000, annualInterestRate: 6, termMonths: 36 },
            { principal: 50000, annualInterestRate: 10, termMonths: 36 },
        ]);

        expect(comparison.bestOption).toBe(1); // 6% rate is best
        expect(comparison.savings).toBeGreaterThan(0);
    });
});

describe('EmployeeROICalculator', () => {
    const calculator = new EmployeeROICalculator();

    it('should calculate positive ROI correctly', () => {
        const result = calculator.calculate({
            annualSalary: 60000,
            annualBenefits: 12000,
            onboardingCosts: 5000,
            revenueGenerated: 150000,
            hoursPerWeek: 40,
        });

        expect(result.roiPercentage).toBeGreaterThan(0);
        expect(result.isWorthHiring).toBe(true);
        expect(result.productivityRatio).toBeGreaterThan(1);
    });

    it('should detect unprofitable hire', () => {
        const result = calculator.calculate({
            annualSalary: 80000,
            annualBenefits: 20000,
            onboardingCosts: 10000,
            revenueGenerated: 50000,
            hoursPerWeek: 40,
        });

        expect(result.roiPercentage).toBeLessThan(0);
        expect(result.isWorthHiring).toBe(false);
    });
});

describe('MarketingROICalculator', () => {
    const calculator = new MarketingROICalculator();

    it('should calculate marketing ROI correctly', () => {
        const result = calculator.calculate({
            totalSpend: 5000,
            conversions: 100,
            revenuePerConversion: 100,
            channel: 'facebook',
        });

        // Revenue = 10000, Profit = 5000, ROI = 100%
        expect(result.totalRevenue).toBe(10000);
        expect(result.netProfit).toBe(5000);
        expect(result.roiPercentage).toBe(100);
        expect(result.isProfitable).toBe(true);
    });

    it('should calculate click metrics when provided', () => {
        const result = calculator.calculate({
            totalSpend: 5000,
            conversions: 100,
            revenuePerConversion: 100,
            channel: 'google',
            impressions: 100000,
            clicks: 2000,
        });

        expect(result.clickThroughRate).toBe(2);
        expect(result.conversionRate).toBe(5);
        expect(result.costPerClick).toBe(2.5);
    });

    it('should compare channels', () => {
        const comparison = calculator.compareChannels([
            { totalSpend: 5000, conversions: 50, revenuePerConversion: 100, channel: 'facebook' },
            { totalSpend: 5000, conversions: 100, revenuePerConversion: 100, channel: 'google' },
            { totalSpend: 5000, conversions: 25, revenuePerConversion: 100, channel: 'instagram' },
        ]);

        expect(comparison.bestChannel).toBe('google');
        expect(comparison.worstChannel).toBe('instagram');
    });
});
