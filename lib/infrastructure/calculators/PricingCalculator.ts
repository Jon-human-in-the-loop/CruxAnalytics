import { BaseCalculator } from './BaseCalculator';
import type { PricingInput } from '@/types/project';

export class PricingCalculator extends BaseCalculator {
    constructor() {
        super('PricingCalculator');
    }

    calculate(input: PricingInput): {
        minimumPrice: number;
        targetMarginPrice: number;
        markupPercentage: number;
        grossProfitPerUnit: number;
        breakEvenPrice: number | null;
        competitorComparison: {
            difference: number;
            percentageDiff: number;
            position: 'above' | 'below' | 'same';
        } | null;
        recommendedPrice: number;
        recommendedPriceRange: { low: number; high: number };
        priceStrategies: {
            premium: number;
            competitive: number;
            penetration: number;
        };
    } {
        this.validate(input);

        const { costPerUnit, desiredMargin, competitorPrice, targetVolume, fixedCostsPerPeriod } = input;

        // Minimum price (break-even at unit level)
        const minimumPrice = costPerUnit;

        // Target margin price: cost / (1 - margin%)
        const targetMarginPrice = costPerUnit / (1 - desiredMargin / 100);

        // Markup percentage
        const markupPercentage = ((targetMarginPrice - costPerUnit) / costPerUnit) * 100;

        // Gross profit per unit
        const grossProfitPerUnit = targetMarginPrice - costPerUnit;

        // Break-even price including fixed costs
        let breakEvenPrice: number | null = null;
        if (fixedCostsPerPeriod && targetVolume) {
            const fixedCostPerUnit = fixedCostsPerPeriod / targetVolume;
            breakEvenPrice = costPerUnit + fixedCostPerUnit;
        }

        // Competitor comparison
        let competitorComparison = null;
        if (competitorPrice) {
            const difference = targetMarginPrice - competitorPrice;
            const percentageDiff = (difference / competitorPrice) * 100;
            competitorComparison = {
                difference: this.round(difference, 2),
                percentageDiff: this.round(percentageDiff, 2),
                position: difference > 0.5 ? 'above' as const :
                    difference < -0.5 ? 'below' as const : 'same' as const,
            };
        }

        // Price strategies
        const priceStrategies = {
            premium: this.round(targetMarginPrice * 1.15, 2),      // 15% above target
            competitive: this.round(competitorPrice || targetMarginPrice, 2),
            penetration: this.round(targetMarginPrice * 0.85, 2),  // 15% below target
        };

        // Recommended price
        const recommendedPrice = this.calculateRecommendedPrice(
            targetMarginPrice,
            competitorPrice,
            minimumPrice
        );

        const recommendedPriceRange = {
            low: this.round(Math.max(minimumPrice * 1.1, recommendedPrice * 0.9), 2),
            high: this.round(recommendedPrice * 1.15, 2),
        };

        this.logCalculation('Target Margin Price', targetMarginPrice);
        this.logCalculation('Recommended Price', recommendedPrice);

        return {
            minimumPrice: this.round(minimumPrice, 2),
            targetMarginPrice: this.round(targetMarginPrice, 2),
            markupPercentage: this.round(markupPercentage, 2),
            grossProfitPerUnit: this.round(grossProfitPerUnit, 2),
            breakEvenPrice: breakEvenPrice ? this.round(breakEvenPrice, 2) : null,
            competitorComparison,
            recommendedPrice,
            recommendedPriceRange,
            priceStrategies,
        };
    }

    private calculateRecommendedPrice(
        targetMarginPrice: number,
        competitorPrice?: number,
        minimumPrice?: number
    ): number {
        let recommendedPrice = targetMarginPrice;

        // If competitor price exists, adjust toward it (not too aggressive)
        if (competitorPrice) {
            // Weight: 70% our target, 30% competitor
            recommendedPrice = targetMarginPrice * 0.7 + competitorPrice * 0.3;
        }

        // Ensure we're above minimum
        if (minimumPrice && recommendedPrice < minimumPrice * 1.1) {
            recommendedPrice = minimumPrice * 1.1;
        }

        return this.round(recommendedPrice, 2);
    }

    protected override validate(input: PricingInput): void {
        super.validate(input);

        this.assertPositive(input.costPerUnit, 'costPerUnit');
        this.assertRange(input.desiredMargin, 0, 99, 'desiredMargin');

        if (input.competitorPrice !== undefined) {
            this.assertPositive(input.competitorPrice, 'competitorPrice');
        }

        if (input.targetVolume !== undefined) {
            this.assertPositive(input.targetVolume, 'targetVolume');
        }

        if (input.fixedCostsPerPeriod !== undefined) {
            this.assertPositive(input.fixedCostsPerPeriod, 'fixedCostsPerPeriod');
        }
    }

    generateRecommendations(
        result: ReturnType<typeof this.calculate>,
        input: PricingInput
    ): string[] {
        const recommendations: string[] = [];

        // Margin recommendations
        if (input.desiredMargin < 20) {
            recommendations.push(
                'Low margin target (< 20%). Consider if this is sustainable long-term.'
            );
        } else if (input.desiredMargin > 60) {
            recommendations.push(
                'High margin target (> 60%). Ensure value proposition justifies premium pricing.'
            );
        }

        // Competitor positioning
        if (result.competitorComparison) {
            if (result.competitorComparison.position === 'above') {
                recommendations.push(
                    `Your price is ${Math.abs(result.competitorComparison.percentageDiff).toFixed(1)}% above competitors.`
                );
                recommendations.push('Ensure your product/service has clear differentiators.');
            } else if (result.competitorComparison.position === 'below') {
                recommendations.push(
                    `Your price is ${Math.abs(result.competitorComparison.percentageDiff).toFixed(1)}% below competitors.`
                );
                recommendations.push('You may have room to increase prices.');
            }
        }

        // Price range
        recommendations.push(
            `Recommended price range: $${result.recommendedPriceRange.low} - $${result.recommendedPriceRange.high}`
        );

        // Profit per unit
        recommendations.push(
            `At recommended price, you earn $${result.grossProfitPerUnit.toFixed(2)} per unit.`
        );

        return recommendations;
    }
}
