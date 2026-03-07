import React, { useState } from 'react';
import { View, Text, Dimensions, ScrollView, Pressable } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useColors } from '@/hooks/use-colors';
import { useTranslation } from '@/lib/i18n-context';
import type { CashFlowData } from '@/types/project';

interface CashFlowChartProps {
  cashFlowData: CashFlowData[];
  currency?: string;
}

type ChartType = 'monthly' | 'cumulative';

export function CashFlowChart({ cashFlowData, currency = '$' }: CashFlowChartProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [chartType, setChartType] = useState<ChartType>('monthly');

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40; // padding

  // Prepare data for charts
  const labels = cashFlowData.map((item) => `M${item.month}`);
  const monthlyData = cashFlowData.map((item) => item.netCashFlow);
  const cumulativeData = cashFlowData.map((item) => item.cumulativeCashFlow);

  // Chart configuration
  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      // Use primary color with opacity
      const primaryColor = colors.primary;
      return `${primaryColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
    },
    labelColor: (opacity = 1) => colors.muted,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // solid lines
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  const barChartConfig = {
    ...chartConfig,
    fillShadowGradient: colors.primary,
    fillShadowGradientOpacity: 1,
  };

  return (
    <View className="gap-4">
      {/* Chart Type Selector */}
      <View className="flex-row gap-2 bg-surface rounded-full p-1">
        <Pressable
          onPress={() => setChartType('monthly')}
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          className={`flex-1 px-4 py-2 rounded-full ${chartType === 'monthly' ? 'bg-primary' : 'bg-transparent'
            }`}
        >
          <Text
            className={`text-center font-semibold ${chartType === 'monthly' ? 'text-background' : 'text-foreground'
              }`}
          >
            {t('charts.monthly')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setChartType('cumulative')}
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          className={`flex-1 px-4 py-2 rounded-full ${chartType === 'cumulative' ? 'bg-primary' : 'bg-transparent'
            }`}
        >
          <Text
            className={`text-center font-semibold ${chartType === 'cumulative' ? 'text-background' : 'text-foreground'
              }`}
          >
            {t('charts.cumulative')}
          </Text>
        </Pressable>
      </View>

      {/* Chart Title */}
      <Text className="text-lg font-bold text-foreground">
        {chartType === 'monthly'
          ? t('charts.monthly_cash_flow')
          : t('charts.cumulative_cash_flow')}
      </Text>

      {/* Chart Container */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="bg-surface rounded-2xl p-4 border border-border">
          {chartType === 'monthly' ? (
            <BarChart
              data={{
                labels: labels.length > 12 ? labels.filter((_, i) => i % 2 === 0) : labels,
                datasets: [
                  {
                    data: monthlyData,
                  },
                ],
              }}
              width={Math.max(chartWidth, labels.length * 40)}
              height={220}
              yAxisLabel={currency}
              yAxisSuffix=""
              formatYLabel={(value) => {
                const num = parseInt(value, 10);
                if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                if (Math.abs(num) >= 1000) return (num / 1000).toFixed(0) + 'k';
                return value;
              }}
              chartConfig={barChartConfig}
              style={{
                borderRadius: 16,
              }}
              fromZero
              showValuesOnTopOfBars={false}
            />
          ) : (
            <LineChart
              data={{
                labels: labels.length > 12 ? labels.filter((_, i) => i % 2 === 0) : labels,
                datasets: [
                  {
                    data: cumulativeData,
                    color: (opacity = 1) => colors.primary,
                    strokeWidth: 3,
                  },
                ],
              }}
              width={Math.max(chartWidth, labels.length * 40)}
              height={220}
              yAxisLabel={currency}
              yAxisSuffix=""
              formatYLabel={(value) => {
                const num = parseInt(value, 10);
                if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                if (Math.abs(num) >= 1000) return (num / 1000).toFixed(0) + 'k';
                return value;
              }}
              chartConfig={chartConfig}
              bezier
              style={{
                borderRadius: 16,
              }}
              withDots={labels.length <= 24}
              withInnerLines
              withOuterLines
              withVerticalLines
              withHorizontalLines
            />
          )}
        </View>
      </ScrollView>

      {/* Legend */}
      <View className="bg-surface rounded-xl p-4 border border-border">
        <View className="flex-row items-center gap-2 mb-2">
          <View className="w-4 h-4 rounded-full bg-primary" />
          <Text className="text-sm text-foreground font-medium">
            {chartType === 'monthly'
              ? t('charts.net_cash_flow')
              : t('charts.cumulative_total')}
          </Text>
        </View>
        <Text className="text-xs text-muted">
          {chartType === 'monthly'
            ? t('charts.monthly_description')
            : t('charts.cumulative_description')}
        </Text>
      </View>
    </View>
  );
}
