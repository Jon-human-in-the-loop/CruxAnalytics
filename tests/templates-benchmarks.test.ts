import { describe, it, expect } from 'vitest';
import {
    BUSINESS_TEMPLATES,
    getBusinessTemplate,
    applyBreakEvenTemplate,
    applyPricingTemplate,
    assessMetricHealth,
} from '../lib/templates/business-templates';
import {
    INDUSTRY_BENCHMARKS,
    getIndustryBenchmarks,
    compareToIndustry,
    calculateBusinessHealthScore,
} from '../lib/benchmarks/industry-benchmarks';

describe('Business Templates', () => {
    it('should have templates for all industries', () => {
        expect(BUSINESS_TEMPLATES.length).toBeGreaterThanOrEqual(5);

        const industries = BUSINESS_TEMPLATES.map(t => t.industry);
        expect(industries).toContain('restaurant');
        expect(industries).toContain('ecommerce');
        expect(industries).toContain('services');
        expect(industries).toContain('retail');
    });

    it('should get template by ID', () => {
        const template = getBusinessTemplate('restaurant');

        expect(template).not.toBeUndefined();
        expect(template?.name).toBe('Restaurante / Café');
        expect(template?.benchmarks.grossMargin.optimal).toBe(65);
    });

    it('should apply break-even template with overrides', () => {
        const input = applyBreakEvenTemplate('restaurant', {
            fixedCosts: 20000,
        });

        expect(input.fixedCosts).toBe(20000); // Overridden
        expect(input.pricePerUnit).toBe(15); // From template
    });

    it('should apply pricing template', () => {
        const input = applyPricingTemplate('ecommerce');

        expect(input.desiredMargin).toBe(40);
        expect(input.costPerUnit).toBe(25);
    });

    it('should assess metric health correctly', () => {
        const healthyMargin = assessMetricHealth('restaurant', 'grossMargin', 68);
        expect(healthyMargin.status).toBe('healthy');

        const criticalMargin = assessMetricHealth('restaurant', 'grossMargin', 40);
        expect(criticalMargin.status).toBe('critical');
    });
});

describe('Industry Benchmarks', () => {
    it('should have benchmarks for all industries', () => {
        const industries = Object.keys(INDUSTRY_BENCHMARKS);

        expect(industries).toContain('restaurant');
        expect(industries).toContain('ecommerce');
        expect(industries).toContain('services');
        expect(industries).toContain('retail');
        expect(industries).toContain('manufacturing');
    });

    it('should get benchmarks by industry', () => {
        const benchmarks = getIndustryBenchmarks('restaurant');

        expect(benchmarks).not.toBeUndefined();
        expect(benchmarks?.metrics.grossMarginPercent.median).toBe(62);
        expect(benchmarks?.kpis.length).toBeGreaterThan(0);
    });

    it('should compare to industry correctly', () => {
        const comparison = compareToIndustry('restaurant', 'grossMarginPercent', 70);

        expect(comparison.percentile).toBe('top25');
        expect(comparison.vsMedian).toBeGreaterThan(0);
    });

    it('should identify below-median performance', () => {
        const comparison = compareToIndustry('ecommerce', 'grossMarginPercent', 35);

        expect(comparison.percentile).toBe('belowMedian');
        expect(comparison.message).toContain('below');
    });

    it('should calculate business health score', () => {
        const score = calculateBusinessHealthScore('restaurant', {
            grossMarginPercent: 65,
            netMarginPercent: 8,
            laborCostPercent: 28,
        });

        expect(score.overallScore).toBeGreaterThanOrEqual(70);
        expect(score.category).toBe('good');
        expect(score.breakdown.length).toBeGreaterThan(0);
    });

    it('should identify poor business health', () => {
        const score = calculateBusinessHealthScore('retail', {
            grossMarginPercent: 20,
            netMarginPercent: -2,
            laborCostPercent: 35,
        });

        expect(score.overallScore).toBeLessThan(50);
        expect(score.category).toBe('poor');
    });
});
