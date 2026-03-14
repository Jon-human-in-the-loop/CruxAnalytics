import { BaseCalculator } from './BaseCalculator';
import type { MarketingROIInput } from '@/types/project';

export class MarketingROICalculator extends BaseCalculator {
    /**
     * Industry benchmark CAC by channel
     */
    private readonly channelBenchmarks: Record<string, { avgCAC: number; avgConversionRate: number }> = {
        facebook: { avgCAC: 50, avgConversionRate: 2.5 },
        google: { avgCAC: 45, avgConversionRate: 3.0 },
        instagram: { avgCAC: 55, avgConversionRate: 2.0 },
        email: { avgCAC: 15, avgConversionRate: 5.0 },
        referral: { avgCAC: 25, avgConversionRate: 8.0 },
        other: { avgCAC: 40, avgConversionRate: 2.5 },
    };

    constructor() {
        super('MarketingROICalculator');
    }

    calculate(input: MarketingROIInput): {
        roiPercentage: number;
        roas: number;
        totalRevenue: number;
        netProfit: number;
        costPerAcquisition: number;
        costPerClick: number | null;
        clickThroughRate: number | null;
        conversionRate: number | null;
        revenuePerClick: number | null;
        lifetimeValueToCAC: number | null;
        channelEfficiency: 'excellent' | 'good' | 'average' | 'poor';
        benchmarkComparison: {
            cacVsBenchmark: 'better' | 'same' | 'worse';
            conversionVsBenchmark: 'better' | 'same' | 'worse';
        };
        isProfitable: boolean;
        breakEvenConversions: number;
    } {
        this.validate(input);

        const {
            totalSpend,
            conversions,
            revenuePerConversion,
            channel,
            impressions,
            clicks,
        } = input;

        // Core calculations
        const totalRevenue = conversions * revenuePerConversion;
        const netProfit = totalRevenue - totalSpend;
        const roiPercentage = this.safeDivide(netProfit, totalSpend, 0) * 100;

        // ROAS (Return on Ad Spend) = Revenue / Spend
        const roas = this.safeDivide(totalRevenue, totalSpend, 0);

        // Cost per acquisition
        const costPerAcquisition = this.safeDivide(totalSpend, conversions, 0);

        // Click metrics (if available)
        let costPerClick: number | null = null;
        let clickThroughRate: number | null = null;
        let conversionRate: number | null = null;
        let revenuePerClick: number | null = null;

        if (clicks !== undefined && clicks > 0) {
            costPerClick = this.safeDivide(totalSpend, clicks, 0);
            conversionRate = this.safeDivide(conversions, clicks, 0) * 100;
            revenuePerClick = this.safeDivide(totalRevenue, clicks, 0);
        }

        if (impressions !== undefined && clicks !== undefined && impressions > 0) {
            clickThroughRate = this.safeDivide(clicks, impressions, 0) * 100;
        }

        // Break-even conversions
        const breakEvenConversions = Math.ceil(
            this.safeDivide(totalSpend, revenuePerConversion, 0)
        );

        // Channel efficiency rating
        const channelEfficiency = this.rateChannelEfficiency(roiPercentage, costPerAcquisition, channel);

        // Benchmark comparison
        const benchmarkComparison = this.compareToBenchmarks(
            costPerAcquisition,
            conversionRate,
            channel
        );

        // Estimated LTV/CAC (assuming LTV = 3x first purchase)
        const estimatedLTV = revenuePerConversion * 3;
        const lifetimeValueToCAC = this.safeDivide(estimatedLTV, costPerAcquisition, 0);

        const isProfitable = netProfit > 0;

        this.logCalculation('Marketing ROI', roiPercentage);
        this.logCalculation('ROAS', roas);
        this.logCalculation('CAC', costPerAcquisition);

        return {
            roiPercentage: this.round(roiPercentage, 2),
            roas: this.round(roas, 2),
            totalRevenue: this.round(totalRevenue, 2),
            netProfit: this.round(netProfit, 2),
            costPerAcquisition: this.round(costPerAcquisition, 2),
            costPerClick: costPerClick !== null ? this.round(costPerClick, 2) : null,
            clickThroughRate: clickThroughRate !== null ? this.round(clickThroughRate, 2) : null,
            conversionRate: conversionRate !== null ? this.round(conversionRate, 2) : null,
            revenuePerClick: revenuePerClick !== null ? this.round(revenuePerClick, 2) : null,
            lifetimeValueToCAC: this.round(lifetimeValueToCAC, 2),
            channelEfficiency,
            benchmarkComparison,
            isProfitable,
            breakEvenConversions,
        };
    }

    /**
     * Rates channel efficiency based on ROI and CAC.
     * 
     * @private
     */
    private rateChannelEfficiency(
        roi: number,
        cac: number,
        channel: string
    ): 'excellent' | 'good' | 'average' | 'poor' {
        const benchmark = this.channelBenchmarks[channel];

        if (roi > 200 && cac < benchmark.avgCAC * 0.7) {
            return 'excellent';
        } else if (roi > 100 && cac < benchmark.avgCAC) {
            return 'good';
        } else if (roi > 0) {
            return 'average';
        } else {
            return 'poor';
        }
    }

    /**
     * Compares performance to industry benchmarks.
     * 
     * @private
     */
    private compareToBenchmarks(
        cac: number,
        conversionRate: number | null,
        channel: string
    ): {
        cacVsBenchmark: 'better' | 'same' | 'worse';
        conversionVsBenchmark: 'better' | 'same' | 'worse';
    } {
        const benchmark = this.channelBenchmarks[channel];

        const cacVsBenchmark = cac < benchmark.avgCAC * 0.9
            ? 'better'
            : cac > benchmark.avgCAC * 1.1
                ? 'worse'
                : 'same';

        let conversionVsBenchmark: 'better' | 'same' | 'worse' = 'same';
        if (conversionRate !== null) {
            conversionVsBenchmark = conversionRate > benchmark.avgConversionRate * 1.2
                ? 'better'
                : conversionRate < benchmark.avgConversionRate * 0.8
                    ? 'worse'
                    : 'same';
        }

        return { cacVsBenchmark, conversionVsBenchmark };
    }

    protected override validate(input: MarketingROIInput): void {
        super.validate(input);

        this.assertPositive(input.totalSpend, 'totalSpend');
        this.assertPositive(input.conversions, 'conversions');
        this.assertPositive(input.revenuePerConversion, 'revenuePerConversion');

        if (input.impressions !== undefined) {
            this.assertPositive(input.impressions, 'impressions');
        }

        if (input.clicks !== undefined) {
            this.assertPositive(input.clicks, 'clicks');
        }
    }

    generateRecommendations(
        result: ReturnType<typeof this.calculate>,
        input: MarketingROIInput
    ): string[] {
        const recommendations: string[] = [];

        // Profitability
        if (!result.isProfitable) {
            recommendations.push(
                `⚠️ Campaign is LOSING money. Net loss: $${Math.abs(result.netProfit).toLocaleString()}`
            );
            recommendations.push(
                `Need ${result.breakEvenConversions - input.conversions} more conversions to break even.`
            );
        } else {
            recommendations.push(
                `✅ Campaign is profitable! Net profit: $${result.netProfit.toLocaleString()}`
            );
        }

        // ROAS guidance
        if (result.roas >= 4) {
            recommendations.push(
                `Excellent ROAS of ${result.roas.toFixed(1)}x. Consider increasing budget.`
            );
        } else if (result.roas >= 2) {
            recommendations.push(
                `Good ROAS of ${result.roas.toFixed(1)}x. Campaign is healthy.`
            );
        } else if (result.roas >= 1) {
            recommendations.push(
                `ROAS of ${result.roas.toFixed(1)}x is break-even territory. Optimize targeting.`
            );
        }

        // CAC comparison
        if (result.benchmarkComparison.cacVsBenchmark === 'better') {
            recommendations.push(
                `CAC of $${result.costPerAcquisition} is BELOW industry average for ${input.channel}. Great efficiency!`
            );
        } else if (result.benchmarkComparison.cacVsBenchmark === 'worse') {
            recommendations.push(
                `CAC of $${result.costPerAcquisition} is ABOVE industry average. Review targeting and creative.`
            );
        }

        // Click metrics
        if (result.clickThroughRate !== null && result.clickThroughRate < 1) {
            recommendations.push(
                'Low click-through rate. Test new ad creative and copy.'
            );
        }

        if (result.conversionRate !== null && result.conversionRate < 1) {
            recommendations.push(
                'Low conversion rate. Review landing page experience.'
            );
        }

        // LTV/CAC
        if (result.lifetimeValueToCAC !== null) {
            if (result.lifetimeValueToCAC >= 3) {
                recommendations.push(
                    `Strong LTV/CAC ratio of ${result.lifetimeValueToCAC.toFixed(1)}x. Sustainable acquisition.`
                );
            } else if (result.lifetimeValueToCAC < 1.5) {
                recommendations.push(
                    `LTV/CAC of ${result.lifetimeValueToCAC.toFixed(1)}x is concerning. Reduce CAC or improve retention.`
                );
            }
        }

        return recommendations;
    }

    /**
     * Compare multiple marketing channels.
     * 
     * @param campaigns - Array of marketing inputs to compare
     * @returns Comparison with best channel highlighted
     */
    compareChannels(campaigns: MarketingROIInput[]): {
        results: Array<MarketingROIInput & { roi: number; roas: number; cac: number }>;
        bestChannel: string;
        worstChannel: string;
        recommendations: string[];
    } {
        const results = campaigns.map(campaign => {
            const calc = this.calculate(campaign);
            return {
                ...campaign,
                roi: calc.roiPercentage,
                roas: calc.roas,
                cac: calc.costPerAcquisition,
            };
        });

        const sortedByROI = [...results].sort((a, b) => b.roi - a.roi);
        const bestChannel = sortedByROI[0]?.channel || 'none';
        const worstChannel = sortedByROI[sortedByROI.length - 1]?.channel || 'none';

        const recommendations: string[] = [
            `Best performing channel: ${bestChannel.toUpperCase()} (${sortedByROI[0]?.roi.toFixed(1)}% ROI)`,
            `Worst performing channel: ${worstChannel.toUpperCase()} (${sortedByROI[sortedByROI.length - 1]?.roi.toFixed(1)}% ROI)`,
        ];

        // Budget reallocation suggestion
        if (sortedByROI[0]?.roi > 0 && sortedByROI[sortedByROI.length - 1]?.roi < 0) {
            recommendations.push(
                `Consider shifting budget from ${worstChannel} to ${bestChannel}.`
            );
        }

        return {
            results,
            bestChannel,
            worstChannel,
            recommendations,
        };
    }
}
