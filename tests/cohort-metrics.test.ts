import { describe, it, expect } from 'vitest';
import { CohortMetricsCalculator } from '../lib/infrastructure/calculators/CohortMetricsCalculator';

describe('CohortMetricsCalculator', () => {
    const calculator = new CohortMetricsCalculator();

    describe('calculate()', () => {
        it('should calculate positive contribution margin correctly', () => {
            const result = calculator.calculate({
                cohortName: 'Enterprise Q1 2026',
                cohortRevenue: 500000,
                directCosts: 200000,
                customerCount: 50,
                acquisitionCost: 5000,
                servicingCostPerCustomer: 200,
            });

            expect(result.contributionMargin).toBe(60); // (500000-200000)/500000 * 100 = 60%
            expect(result.marginPerCustomer).toBe(6000); // 300000 / 50
            expect(result.isLosingMoney).toBe(false);
            expect(result.cohortName).toBe('Enterprise Q1 2026');
        });

        it('should identify negative margin cohorts', () => {
            const result = calculator.calculate({
                cohortName: 'Loss-Making Segment',
                cohortRevenue: 100000,
                directCosts: 150000,
                customerCount: 100,
                acquisitionCost: 1000,
                servicingCostPerCustomer: 100,
            });

            expect(result.contributionMargin).toBe(-50); // Negative margin
            expect(result.isLosingMoney).toBe(true);
        });

        it('should calculate profitability index correctly', () => {
            const result = calculator.calculate({
                cohortName: 'High Value',
                cohortRevenue: 200000,
                directCosts: 80000,
                customerCount: 20,
                acquisitionCost: 2000,
                servicingCostPerCustomer: 500,
            });

            // marginPerCustomer = (200000-80000)/20 = 6000
            // profitabilityIndex = (6000-2000)/500 = 8
            expect(result.marginPerCustomer).toBe(6000);
            expect(result.profitabilityIndex).toBe(8);
        });
    });

    describe('validation', () => {
        it('should throw error for missing cohort name', () => {
            expect(() => calculator.calculate({
                cohortName: '',
                cohortRevenue: 100000,
                directCosts: 50000,
                customerCount: 10,
                acquisitionCost: 1000,
                servicingCostPerCustomer: 100,
            })).toThrow('cohortName is required');
        });

        it('should throw error for negative revenue', () => {
            expect(() => calculator.calculate({
                cohortName: 'Test',
                cohortRevenue: -100000,
                directCosts: 50000,
                customerCount: 10,
                acquisitionCost: 1000,
                servicingCostPerCustomer: 100,
            })).toThrow('cohortRevenue must be positive');
        });
    });

    describe('benchmarks', () => {
        it('should return contribution margin benchmarks', () => {
            const benchmarks = calculator.getContributionMarginBenchmarks();

            expect(benchmarks.optimal).toBe(40);
            expect(benchmarks.acceptable).toBe(20);
            expect(benchmarks.critical).toBe(0);
        });

        it('should return profitability index benchmarks', () => {
            const benchmarks = calculator.getProfitabilityIndexBenchmarks();

            expect(benchmarks.optimal).toBe(2.0);
            expect(benchmarks.acceptable).toBe(1.0);
            expect(benchmarks.critical).toBe(0);
        });
    });

    describe('recommendations', () => {
        it('should generate recommendations for loss-making cohort', () => {
            const recommendations = calculator.generateRecommendations(-10, -0.5);

            expect(recommendations.length).toBeGreaterThan(0);
            expect(recommendations.some(r => r.includes('CRITICAL'))).toBe(true);
            expect(recommendations.some(r => r.includes('Acquisition costs'))).toBe(true);
        });

        it('should generate recommendations for high-value cohort', () => {
            const recommendations = calculator.generateRecommendations(50, 2.5);

            expect(recommendations.some(r => r.includes('High-value cohort'))).toBe(true);
        });

        it('should generate recommendations for below-average cohort', () => {
            const recommendations = calculator.generateRecommendations(15, 0.8);

            expect(recommendations.some(r => r.includes('below industry average'))).toBe(true);
            expect(recommendations.some(r => r.includes('Marginal'))).toBe(true);
        });
    });
});
