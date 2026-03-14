import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    GlassCard,
    GradientButton,
    SectionHeading,
    Badge,
} from '@/components/landing/shared-components';
import { IconLabel } from '@/components/ui/icon-label';
import { router } from 'expo-router';
import { BreakEvenCalculator } from '@/lib/infrastructure/calculators/BreakEvenCalculator';
import { useTranslation } from '@/lib/i18n-context';
import { LanguageSelector } from '@/components/language-selector';
import { generateBreakEvenPDF, printPDF } from '@/lib/export/pdf-generator';

// INPUT FIELD COMPONENT
function InputField({
    label,
    value,
    onChange,
    placeholder,
    prefix,
    suffix,
    hint,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    prefix?: string;
    suffix?: string;
    hint?: string;
}) {
    return (
        <View className="mb-4">
            <Text className="text-gray-300 font-medium mb-2">{label}</Text>
            <View className="flex-row items-center bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
                {prefix && (
                    <Text className="text-gray-500 pl-4">{prefix}</Text>
                )}
                <TextInput
                    className="flex-1 px-4 py-3 text-white text-lg"
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                />
                {suffix && (
                    <Text className="text-gray-500 pr-4">{suffix}</Text>
                )}
            </View>
            {hint && <Text className="text-gray-500 text-xs mt-1">{hint}</Text>}
        </View>
    );
}

// RESULT CARD COMPONENT
function ResultCard({
    label,
    value,
    icon,
    color,
    large,
}: {
    label: string;
    value: string;
    icon: string;
    color: 'indigo' | 'emerald' | 'amber' | 'rose';
    large?: boolean;
}) {
    const bgColorMap = {
        indigo: 'bg-[#14B8A6]',
        emerald: 'bg-[#86EFAC]',
        amber: 'bg-[#FB923C]',
        rose: 'bg-rose-500',
    };

    const isSmall = Dimensions.get('window').width < 600;

    return (
        <GlassCard className={large ? 'w-full' : (isSmall ? '' : 'flex-1 min-w-[140px]')}>
            <View className="flex-row items-center gap-3 mb-2">
                <View className={`w-10 h-10 rounded-lg ${bgColorMap[color]} items-center justify-center`}>
                    <IconLabel icon={icon} size={22} color="white" />
                </View>
                <Text className="text-gray-400 text-sm flex-1">{label}</Text>
            </View>
            <Text className={`text-white font-bold ${large ? (isSmall ? 'text-2xl' : 'text-3xl') : (isSmall ? 'text-xl' : 'text-2xl')}`}>
                {value}
            </Text>
        </GlassCard>
    );
}

// BREAK-EVEN CHART (Simplified)
function BreakEvenChart({
    breakEvenUnits,
    currentUnits,
    pricePerUnit,
    variableCost,
    fixedCosts,
}: {
    breakEvenUnits: number;
    currentUnits: number | null;
    pricePerUnit: number;
    variableCost: number;
    fixedCosts: number;
}) {
    const { t } = useTranslation();
    const maxUnits = Math.max(breakEvenUnits * 1.5, currentUnits || 0);
    const breakEvenPercent = (breakEvenUnits / maxUnits) * 100;
    const currentPercent = currentUnits ? (currentUnits / maxUnits) * 100 : null;
    const barHeight = Dimensions.get('window').width < 600 ? 20 : 32;

    return (
        <GlassCard className="p-4">
            <Text className="text-white font-semibold mb-3">{t('calculators.break_even.visualization')}</Text>

            {/* Chart Bar */}
            <View className="bg-slate-800 rounded-full overflow-hidden relative" style={{ height: barHeight }}>
                {/* Loss zone */}
                <View
                    className="absolute left-0 top-0 bottom-0 bg-[#FB923C]/30"
                    style={{ width: `${breakEvenPercent}%` }}
                />
                {/* Profit zone */}
                <View
                    className="absolute right-0 top-0 bottom-0 bg-[#86EFAC]/30"
                    style={{ width: `${100 - breakEvenPercent}%` }}
                />

                {/* Break-even marker */}
                <View
                    className="absolute top-0 bottom-0 w-1 bg-white"
                    style={{ left: `${breakEvenPercent}%` }}
                />

                {/* Current position */}
                {currentPercent !== null && (
                    <View
                        className="absolute top-0 bottom-0 w-3 h-3 rounded-full bg-[#14B8A6] border-2 border-white self-center"
                        style={{ left: `${currentPercent}%`, marginTop: 10 }}
                    />
                )}
            </View>

            {/* Labels */}
            <View className="flex-row justify-between mt-2">
                <View>
                    <View className="flex-row items-center gap-1"><IconLabel icon="dot-red" size={10} /><Text className="text-rose-400 text-xs">{t('calculators.break_even.loss')}</Text></View>
                    <Text className="text-gray-500 text-xs">0 - {breakEvenUnits.toLocaleString()} {t('calculators.units')}</Text>
                </View>
                <View className="items-center">
                    <View className="flex-row items-center gap-1"><IconLabel icon="flash" size={14} color="#FDBA74" /><Text className="text-white text-xs font-bold">{t('calculators.break_even.break_even')}</Text></View>
                    <Text className="text-gray-500 text-xs">{breakEvenUnits.toLocaleString()} {t('calculators.units')}</Text>
                </View>
                <View className="items-end">
                    <View className="flex-row items-center gap-1"><IconLabel icon="dot-green" size={10} /><Text className="text-emerald-400 text-xs">{t('calculators.break_even.profit')}</Text></View>
                    <Text className="text-gray-500 text-xs">{breakEvenUnits.toLocaleString()}+ {t('calculators.units')}</Text>
                </View>
            </View>
        </GlassCard>
    );
}

// RECOMMENDATIONS COMPONENT
function Recommendations({ items }: { items: string[] }) {
    const { t } = useTranslation();
    return (
        <GlassCard>
            <Text className="text-white font-semibold mb-4">{t('calculators.recommendations')}</Text>
            <View className="gap-3">
                {items.map((item, index) => (
                    <View key={index} className="flex-row gap-3">
                        <View className="w-6 h-6 rounded-full bg-[#14B8A6]/20 items-center justify-center">
                            <Text className="text-indigo-400 text-xs font-bold">{index + 1}</Text>
                        </View>
                        <Text className="text-gray-300 flex-1">{item}</Text>
                    </View>
                ))}
            </View>
        </GlassCard>
    );
}

// MAIN PAGE
export default function BreakEvenPage() {
    const { t } = useTranslation();
    const [exporting, setExporting] = useState(false);
    const [fixedCosts, setFixedCosts] = useState('10000');
    const [pricePerUnit, setPricePerUnit] = useState('50');
    const [variableCost, setVariableCost] = useState('25');
    const [currentSales, setCurrentSales] = useState('');

    const calculator = useMemo(() => new BreakEvenCalculator(), []);

    const result = useMemo(() => {
        try {
            const fixed = parseFloat(fixedCosts) || 0;
            const price = parseFloat(pricePerUnit) || 0;
            const variable = parseFloat(variableCost) || 0;
            const current = currentSales ? parseInt(currentSales) : undefined;

            if (fixed <= 0 || price <= 0 || variable <= 0 || price <= variable) {
                return null;
            }

            return calculator.calculate({
                fixedCosts: fixed,
                pricePerUnit: price,
                variableCostPerUnit: variable,
                currentSalesUnits: current,
            });
        } catch {
            return null;
        }
    }, [fixedCosts, pricePerUnit, variableCost, currentSales, calculator]);

    const recommendations = useMemo(() => {
        if (!result) return [];

        const recs: string[] = [];

        if (result.marginOfSafety !== null) {
            if (result.isAboveBreakEven) {
                recs.push(t('calculators.break_even.recommendations.above_break_even', {
                    percent: Math.abs(result.marginOfSafety).toFixed(1)
                }));
            } else {
                recs.push(t('calculators.break_even.recommendations.below_break_even', {
                    units: Math.abs(result.marginOfSafetyUnits || 0).toString()
                }));
            }
        }

        // Suggest price increase if margin is low
        if (result.contributionMarginRatio < 40) {
            const suggestedIncrease = 10;
            recs.push(t('calculators.break_even.recommendations.increase_price', {
                percent: suggestedIncrease.toString()
            }));
        }

        // Suggest cost reduction
        const currentFixed = parseFloat(fixedCosts) || 0;
        const reduction = Math.round(currentFixed * 0.1);
        if (reduction > 0) {
            recs.push(t('calculators.break_even.recommendations.reduce_costs', {
                amount: reduction.toString()
            }));
        }

        // General recommendations
        if (result.contributionMarginRatio > 50) {
            recs.push(t('calculators.break_even.recommendations.increase_volume'));
        }

        recs.push(t('calculators.break_even.recommendations.monitor_costs'));

        return recs;
    }, [result, fixedCosts, t]);

    const handleExportPDF = async () => {
        if (!result) return;

        setExporting(true);
        try {
            const html = generateBreakEvenPDF({
                inputs: {
                    fixedCosts: parseFloat(fixedCosts) || 0,
                    pricePerUnit: parseFloat(pricePerUnit) || 0,
                    variableCostPerUnit: parseFloat(variableCost) || 0,
                    currentSalesUnits: currentSales ? parseInt(currentSales) : undefined,
                },
                results: {
                    breakEvenUnits: result.breakEvenUnits,
                    breakEvenRevenue: result.breakEvenRevenue,
                    contributionMarginPerUnit: result.contributionMarginPerUnit,
                    marginOfSafety: result.marginOfSafety ?? undefined,
                    isAboveBreakEven: result.isAboveBreakEven ?? undefined,
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

    const isSmall = Dimensions.get('window').width < 600;

    return (
        <ScrollView
            className="flex-1 bg-[#020617]"
            contentContainerStyle={{ paddingHorizontal: isSmall ? 12 : 20, paddingVertical: isSmall ? 16 : 40 }}
        >
            <View className="w-full">
                {/* Top Navigation */}
                <View className={`flex-row items-center justify-between ${isSmall ? 'mb-4' : 'mb-8'}`}>
                    <Pressable
                        onPress={() => router.back()}
                        className="p-3 bg-white/10 rounded-full border border-white/20 active:scale-95 transition-transform"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </Pressable>
                    <LanguageSelector />
                </View>

                {/* Header Title Section */}
                <View className={isSmall ? 'mb-2' : 'mb-6'}>
                    <SectionHeading
                        title={`⚖️ ${t('calculators.break_even.title')}`}
                        subtitle={t('calculators.break_even.subtitle')}
                    />
                </View>

                <View className={isSmall ? 'gap-6' : 'flex-row gap-6 items-start'}>
                    {/* Input Form */}
                    <View className={isSmall ? 'w-full' : 'flex-1'}>
                        <GlassCard>
                            <Text className={`text-white font-semibold ${isSmall ? 'text-base mb-4' : 'text-lg mb-6'}`}>
                                {t('calculators.enter_data')}
                            </Text>

                            <InputField
                                label={t('calculators.break_even.fixed_costs')}
                                value={fixedCosts}
                                onChange={setFixedCosts}
                                prefix="$"
                                hint={t('calculators.break_even.fixed_costs_hint')}
                            />

                            <InputField
                                label={t('calculators.break_even.unit_price')}
                                value={pricePerUnit}
                                onChange={setPricePerUnit}
                                prefix="$"
                                hint={t('calculators.break_even.unit_price_hint')}
                            />

                            <InputField
                                label={t('calculators.break_even.variable_cost')}
                                value={variableCost}
                                onChange={setVariableCost}
                                prefix="$"
                                hint={t('calculators.break_even.variable_cost_hint')}
                            />

                            <InputField
                                label={t('calculators.break_even.current_sales')}
                                value={currentSales}
                                onChange={setCurrentSales}
                                suffix={t('calculators.units')}
                                hint={t('calculators.break_even.current_sales_hint')}
                            />
                        </GlassCard>
                    </View>

                    {/* Results */}
                    <View className={isSmall ? 'w-full gap-4' : 'flex-1 gap-4'}>
                        {result ? (
                            <>
                                {/* Main Results */}
                                <View className={`${isSmall ? 'gap-3' : 'flex-row flex-wrap gap-4'}`}>
                                    <ResultCard
                                        label={t('calculators.break_even.break_even_units')}
                                        value={result.breakEvenUnits.toLocaleString()}
                                        icon="target"
                                        color="indigo"
                                        large
                                    />

                                    <View className={`${isSmall ? 'gap-3' : 'flex-row flex-wrap gap-4'}`}>
                                        <ResultCard
                                            label={t('calculators.break_even.break_even_revenue')}
                                            value={`$${result.breakEvenRevenue.toLocaleString()}`}
                                            icon="money"
                                            color="emerald"
                                        />

                                        <ResultCard
                                            label={t('calculators.break_even.contribution_margin')}
                                            value={result.contributionMarginPerUnit != null ? `$${result.contributionMarginPerUnit.toFixed(2)}` : '$0.00'}
                                            icon="chart"
                                            color="amber"
                                        />
                                    </View>
                                </View>

                                {/* Margin of Safety */}
                                {result.marginOfSafety !== undefined && (
                                    <GlassCard className={`border-2 ${result.isAboveBreakEven ? 'border-[#86EFAC]/50' : 'border-[#FB923C]/50'}`}>
                                        <View className="flex-row items-center gap-3">
                                            <IconLabel icon={result.isAboveBreakEven ? 'success' : 'warning'} size={isSmall ? 28 : 34} />
                                            <View>
                                                <Text className="text-white font-bold text-lg">
                                                    {result.isAboveBreakEven ? t('calculators.break_even.above_break_even') : t('calculators.break_even.below_break_even')}
                                                </Text>
                                                <Text className={result.isAboveBreakEven ? 'text-emerald-400' : 'text-rose-400'}>
                                                    {t('calculators.break_even.safety_margin')}: {result.marginOfSafety != null ? result.marginOfSafety.toFixed(1) : '0'}%
                                                </Text>
                                            </View>
                                        </View>
                                    </GlassCard>
                                )}

                                {/* Chart */}
                                <BreakEvenChart
                                    breakEvenUnits={result.breakEvenUnits}
                                    currentUnits={currentSales ? parseInt(currentSales) : null}
                                    pricePerUnit={parseFloat(pricePerUnit)}
                                    variableCost={parseFloat(variableCost)}
                                    fixedCosts={parseFloat(fixedCosts)}
                                />

                                {/* Recommendations */}
                                <Recommendations items={recommendations} />

                                {/* Export */}
                                <GradientButton
                                    size="lg"
                                    onPress={exporting ? undefined : handleExportPDF}
                                    className={exporting ? 'opacity-50' : ''}
                                >
                                    📄 {exporting ? t('common.exporting') : t('calculators.export_pdf')}
                                </GradientButton>
                            </>
                        ) : (
                            <GlassCard className={`items-center ${isSmall ? 'py-6' : 'py-12'}`}>
                                <Ionicons name="calculator" size={48} color="#6b7280" />
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
