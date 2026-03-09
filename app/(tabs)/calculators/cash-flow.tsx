/**
 * @fileoverview Cash Flow Forecast Calculator Page
 * 12-month projection with visual timeline and alert system
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    GlassCard,
    GradientButton,
    SectionHeading,
    Badge,
} from '@/components/landing/shared-components';
import { router } from 'expo-router';
import { CashFlowForecastCalculator } from '@/lib/infrastructure/calculators/CashFlowForecastCalculator';
import { useTranslation } from '@/lib/i18n-context';
import { LanguageSelector } from '@/components/language-selector';
import { generateCashFlowPDF, printPDF } from '@/lib/export/pdf-generator';

function InputField({
    label,
    value,
    onChange,
    prefix,
    suffix,
    hint,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    prefix?: string;
    suffix?: string;
    hint?: string;
}) {
    return (
        <View className="mb-4">
            <Text className="text-gray-300 font-medium mb-2">{label}</Text>
            <View className="flex-row items-center bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
                {prefix && <Text className="text-gray-500 pl-4">{prefix}</Text>}
                <TextInput
                    className="flex-1 px-4 py-3 text-white text-lg"
                    value={value}
                    onChangeText={onChange}
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                />
                {suffix && <Text className="text-gray-500 pr-4">{suffix}</Text>}
            </View>
            {hint && <Text className="text-gray-500 text-xs mt-1">{hint}</Text>}
        </View>
    );
}

function CashFlowTimeline({ forecasts }: { forecasts: Array<{ month: number; netCash: number; balance: number }> }) {
    const { t } = useTranslation();
    const maxBalance = Math.max(...forecasts.map(f => Math.abs(f.balance)));

    return (
        <GlassCard>
            <Text className="text-white font-semibold mb-4">{t('calculators.cash_flow.projection_12_months')}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2 pb-2">
                    {forecasts.map((forecast, index) => {
                        const height = Math.abs(forecast.balance) / maxBalance * 100;
                        const isPositive = forecast.balance >= 0;

                        return (
                            <View key={index} className="items-center" style={{ width: 44 }}>
                                {/* Bar */}
                                <View
                                    className="justify-end bg-slate-800 rounded-lg overflow-hidden"
                                    style={{ height: 48, width: 18 }}
                                >
                                    <View
                                        className={`w-full rounded-t-lg ${isPositive ? 'bg-[#86EFAC]' : 'bg-[#FB923C]'}`}
                                        style={{ height: `${Math.max(height, 10)}%` }}
                                    />
                                </View>
                                {/* Month label */}
                                <Text className="text-gray-400 text-xs mt-1">{forecast.month}</Text>
                                {/* Value */}
                                <Text className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    ${forecast.balance != null ? (forecast.balance / 1000).toFixed(0) : '0'}k
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </GlassCard>
    );
}

function AlertsPanel({ alerts }: { alerts?: string[] }) {
    const { t } = useTranslation();
    const safeAlerts = alerts ?? [];
    if (safeAlerts.length === 0) {
        return (
            <GlassCard className="border border-[#86EFAC]/30">
                <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">✅</Text>
                    <View>
                        <Text className="text-emerald-400 font-bold">{t('calculators.cash_flow.no_critical_alerts')}</Text>
                        <Text className="text-gray-400 text-sm">{t('calculators.cash_flow.cash_flow_healthy_desc')}</Text>
                    </View>
                </View>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="border border-[#FB923C]/30">
            <Text className="text-white font-semibold mb-4">{t('calculators.cash_flow.alerts')}</Text>
            <View className="gap-2">
                {safeAlerts.map((alert, index) => (
                    <View key={index} className="flex-row items-start gap-2">
                        <Text className="text-rose-400">•</Text>
                        <Text className="text-gray-300 flex-1">{alert}</Text>
                    </View>
                ))}
            </View>
        </GlassCard>
    );
}

export default function CashFlowPage() {
    const { t } = useTranslation();
    const [exporting, setExporting] = useState(false);
    const [startingCash, setStartingCash] = useState('50000');
    const [monthlyRevenue, setMonthlyRevenue] = useState('30000');
    const [monthlyExpenses, setMonthlyExpenses] = useState('25000');
    const [expectedGrowth, setExpectedGrowth] = useState('5');

    const calculator = useMemo(() => new CashFlowForecastCalculator(), []);

    const result = useMemo(() => {
        try {
            const starting = parseFloat(startingCash) || 0;
            const revenue = parseFloat(monthlyRevenue) || 0;
            const expenses = parseFloat(monthlyExpenses) || 0;
            const growth = parseFloat(expectedGrowth) || 0;

            if (starting <= 0 || revenue <= 0 || expenses <= 0) return null;

            return calculator.calculate({
                startingCash: starting,
                monthlyRevenue: revenue,
                monthlyExpenses: expenses,
                expectedGrowthRate: growth,
            });
        } catch {
            return null;
        }
    }, [startingCash, monthlyRevenue, monthlyExpenses, expectedGrowth, calculator]);

    // Generate recommendations using translations
    const recommendations = useMemo(() => {
        if (!result) return [];

        const recs: string[] = [];

        if (!result.isHealthy) {
            recs.push(t('calculators.cash_flow.recommendations.negative_flow'));
        }

        if (result.monthsUntilDeficit && result.monthsUntilDeficit < 6) {
            recs.push(t('calculators.cash_flow.recommendations.deficit_warning', { months: result.monthsUntilDeficit.toString() }));
        }

        if (result.endingCashBalance < result.minimumCashReserveNeeded) {
            recs.push(t('calculators.cash_flow.recommendations.below_reserve'));
        }

        const netMargin = ((parseFloat(monthlyRevenue) - parseFloat(monthlyExpenses)) / parseFloat(monthlyRevenue)) * 100;
        if (netMargin < 20) {
            recs.push(t('calculators.cash_flow.recommendations.low_margin'));
        }

        if (result.isHealthy && recs.length === 0) {
            recs.push(t('calculators.cash_flow.recommendations.healthy_invest'));
            recs.push(t('calculators.cash_flow.recommendations.growth_opportunity'));
        }

        return recs;
    }, [result, monthlyRevenue, monthlyExpenses, t]);

    const handleExportPDF = async () => {
        if (!result) return;

        setExporting(true);
        try {
            const html = generateCashFlowPDF({
                inputs: {
                    startingCash: parseFloat(startingCash) || 0,
                    monthlyRevenue: parseFloat(monthlyRevenue) || 0,
                    monthlyExpenses: parseFloat(monthlyExpenses) || 0,
                    expectedGrowthRate: parseFloat(expectedGrowth) || 0,
                },
                results: {
                    endingCash: result.endingCashBalance,
                    monthsUntilDeficit: result.monthsUntilDeficit,
                    isHealthy: result.isHealthy,
                    minimumCashReserve: result.minimumCashReserveNeeded,
                },
                recommendations,
            });
            await printPDF(html);
        } catch (error) {
            Alert.alert(t('common.error'), t('common.export_failed') || 'No se pudo exportar el PDF');
        } finally {
            setExporting(false);
        }
    };

    return (
        <ScrollView
            className="flex-1 bg-[#020617]"
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 40 }}
        >
            <View className="max-w-5xl mx-auto">
                {/* Top Navigation */}
                <View className="flex-row items-center justify-between mb-8">
                    <Pressable
                        onPress={() => router.back()}
                        className="p-3 bg-white/10 rounded-full border border-white/20 active:scale-95 transition-transform"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </Pressable>
                    <LanguageSelector />
                </View>

                {/* Header Title Section */}
                <View className="mb-6">
                    <SectionHeading
                        title={t('calculators.cash_flow.title')}
                        subtitle={t('calculators.cash_flow.subtitle')}
                    />
                </View>

                <View className="gap-6">
                    {/* Input Form */}
                    <View className="w-full">
                        <GlassCard>
                            <Text className="text-white font-semibold text-lg mb-6">{t('calculators.enter_data')}</Text>

                            <InputField
                                label={t('calculators.cash_flow.starting_cash')}
                                value={startingCash}
                                onChange={setStartingCash}
                                prefix="$"
                                hint={t('calculators.cash_flow.starting_cash_hint')}
                            />

                            <InputField
                                label={t('calculators.cash_flow.monthly_revenue')}
                                value={monthlyRevenue}
                                onChange={setMonthlyRevenue}
                                prefix="$"
                                hint={t('calculators.cash_flow.monthly_revenue_hint')}
                            />

                            <InputField
                                label={t('calculators.cash_flow.monthly_expenses')}
                                value={monthlyExpenses}
                                onChange={setMonthlyExpenses}
                                prefix="$"
                                hint={t('calculators.cash_flow.monthly_expenses_hint')}
                            />

                            <InputField
                                label={t('calculators.cash_flow.expected_growth')}
                                value={expectedGrowth}
                                onChange={setExpectedGrowth}
                                suffix="%"
                                hint={t('calculators.cash_flow.expected_growth_hint')}
                            />
                        </GlassCard>
                    </View>

                    {/* Results */}
                    <View className="w-full gap-4">
                        {result ? (
                            <>
                                {/* Summary Cards */}
                                <View className="flex-row flex-wrap gap-4">
                                    <GlassCard className="flex-1 min-w-[140px]">
                                        <Text className="text-gray-400 text-sm">{t('calculators.cash_flow.final_balance')}</Text>
                                        <Text className={`text-2xl font-bold ${result.endingCashBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            ${(result.endingCashBalance ?? 0).toLocaleString()}
                                        </Text>
                                    </GlassCard>

                                    <GlassCard className="flex-1 min-w-[140px]">
                                        <Text className="text-gray-400 text-sm">{t('calculators.cash_flow.runway')}</Text>
                                        <Text className="text-2xl font-bold text-white">
                                            {result.monthsUntilDeficit ?? '∞'} {t('calculators.cash_flow.months')}
                                        </Text>
                                    </GlassCard>

                                    <GlassCard className="flex-1 min-w-[140px]">
                                        <Text className="text-gray-400 text-sm">{t('calculators.cash_flow.minimum_reserve')}</Text>
                                        <Text className="text-2xl font-bold text-amber-400">
                                            ${(result.minimumCashReserveNeeded ?? 0).toLocaleString()}
                                        </Text>
                                    </GlassCard>
                                </View>

                                {/* Health Status */}
                                <GlassCard className={`border-2 ${result.isHealthy ? 'border-[#86EFAC]/50' : 'border-[#FB923C]/50'}`}>
                                    <View className="flex-row items-center gap-3">
                                        <Text className="text-3xl">{result.isHealthy ? '🟢' : '🔴'}</Text>
                                        <View>
                                            <Text className="text-white font-bold text-lg">
                                                {result.isHealthy ? t('calculators.cash_flow.healthy_cash_flow') : t('calculators.cash_flow.cash_flow_at_risk')}
                                            </Text>
                                            <Text className={result.isHealthy ? 'text-emerald-400' : 'text-rose-400'}>
                                                {result.isHealthy
                                                    ? t('calculators.cash_flow.sufficient_liquidity')
                                                    : t('calculators.cash_flow.run_out_warning', { months: String(result.monthsUntilDeficit ?? '?') })
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                </GlassCard>

                                {/* Timeline Chart */}
                                <CashFlowTimeline forecasts={result.monthlyForecasts.map(f => ({ month: f.month, netCash: f.netCashFlow, balance: f.endingCash }))} />

                                {/* Alerts */}
                                <AlertsPanel alerts={calculator.generateAlerts(result)} />

                                {/* Recommendations */}
                                {recommendations && recommendations.length > 0 && (
                                    <GlassCard>
                                        <Text className="text-white font-semibold mb-4">{t('calculators.recommendations')}</Text>
                                        <View className="gap-2">
                                            {recommendations.map((rec, i) => (
                                                <View key={i} className="flex-row gap-2">
                                                    <Text className="text-[#14B8A6]">{i + 1}.</Text>
                                                    <Text className="text-gray-300 flex-1">{rec}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </GlassCard>
                                )}

                                <GradientButton
                                    size="lg"
                                    onPress={exporting ? undefined : handleExportPDF}
                                    className={exporting ? 'opacity-50' : ''}
                                >
                                    📄 {exporting ? t('common.exporting') : t('calculators.export_pdf')}
                                </GradientButton>
                            </>
                        ) : (
                            <GlassCard className="items-center py-12">
                                <Ionicons name="wallet" size={48} color="#6b7280" />
                                <Text className="text-gray-400 mt-4 text-center">
                                    {t('calculators.no_data')}
                                </Text>
                            </GlassCard>
                        )}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
