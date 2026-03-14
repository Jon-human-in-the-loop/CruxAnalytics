import { businessIntelligence } from '../lib/business-logic';
import { LoggerFactory, LogLevel } from '../lib/data-access';
import { validatePercentage, validatePositiveNumber } from '../lib/validation/input-validator';

/**
 * Example 1: Basic Financial Analysis
 */
async function exampleFinancialAnalysis() {
  console.log('\n=== Example 1: Financial Analysis ===\n');

  const metrics = await businessIntelligence.calculateFinancials({
    investment: 50000,
    savings: 15000,
    discountRate: 0.1,
    timeHorizon: 5,
  });

  console.log('ROI:', metrics.roi.value.value.toFixed(2) + '%');
  console.log('NPV:', '$' + metrics.npv.value.value.toFixed(2));
  console.log('IRR:', metrics.irr.value.value.toFixed(2) + '%');
  console.log('Payback:', metrics.payback.value.value.toFixed(2) + ' years');
  console.log('\nRecommendations:', metrics.roi.context.recommendations);
  console.log('Confidence:', (metrics.roi.context.confidence * 100).toFixed(0) + '%');
}

/**
 * Example 2: Comprehensive Analysis
 */
async function exampleComprehensiveAnalysis() {
  console.log('\n=== Example 2: Comprehensive Analysis ===\n');

  const insights = await businessIntelligence.getComprehensiveInsights(
    {
      investment: 50000,
      savings: 18000,
      discountRate: 0.1,
      timeHorizon: 5,
    },
    {
      repetitiveHours: 60,
      totalHours: 160,
      frictionMultiplier: 1.5,
      manualHoursPerMonth: 80,
      manualHourlyRate: 75,
      automationCost: 50000,
      timeHorizonMonths: 24,
      efficiencyGain: 40,
      lifetime: 36,
      frictionCost: 10000,
      investment: 50000,
    }
  );

  console.log('Overall Score:', insights.executiveSummary.overallScore.toFixed(1) + '/100');
  console.log('\nTop Recommendations:');
  insights.executiveSummary.topRecommendations.slice(0, 3).forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
}

export { exampleFinancialAnalysis, exampleComprehensiveAnalysis };
