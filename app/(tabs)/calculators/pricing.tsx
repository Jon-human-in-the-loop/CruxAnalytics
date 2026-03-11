/**
 * @fileoverview Pricing Calculator Page
 * Helps determine optimal pricing with competitor comparison
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
import { IconLabel } from '@/components/ui/icon-label';
import { router } from 'expo-router';
import { PricingCalculator } from '@/lib/infrastructure/calculators/PricingCalculator';
import { useTranslation } from '@/lib/i18n-context';
import { LanguageSelector } from '@/components/language-selector';
import { generatePricingPDF, printPDF } from '@/lib/export/pdf-generator';

function InputField({
    label, value, onChange, prefix, suffix, hint,
}: {
    label: string; value: string; onChange: (val: string) => void;
    prefix?: string; suffix?: string; hint?: string;
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

function PriceStrategyCard({
    strategy, price, benefits, recommended,
}: {
    strategy: string; price: number; benefits: string; recommended?: boolean;
}) {
    const { t } = useTranslation();

    return (
        <GlassCard className={`flex-1 min-w-[150px] ${recommended ? 'border-2 border-[#14B8A6]' : ''}`}>
            {recommended && (
                <Badge variant="success" className="mb-2">
                    {t('calculators.pricing.recommended')}
                </Badge>
            )}
            <Text className="text-gray-400 text-sm">{strategy}</Text>
            <Text className="text-2xl font-bold text-white">${price != null ? price.toFixed(2) : '0.00'}</Text>
            <Text className="text-gray-500 text-xs mt-2">{benefits}</Text>
        </GlassCard>
    );
}

export default function PricingPage() {
    const { t } = useTranslation();
    const [exporting, setExporting] = useState(false);
    const [costPerUnit, setCostPerUnit] = useState('15');
    const [desiredMargin, setDesiredMargin] = useState('40');
    const [competitorPrice, setCompetitorPrice] = useState('30');

    const calculator = useMemo(() => new PricingCalculator(), []);

    const result = useMemo(() => {
        try {
            const cost = parseFloat(costPerUnit) || 0;
            const margin = parseFloat(desiredMargin) || 0;
            const competitor = competitorPrice ? parseFloat(competitorPrice) : undefined;

            if (cost <= 0 || margin < 0 || margin >= 100) return null;

            return calculator.calculate({
                costPerUnit: cost,
                desiredMargin: margin,
                competitorPrice: competitor,
            });
        } catch {
            return null;
        }
    }, [costPerUnit, desiredMargin, competitorPrice, calculator]);

    // Generate recommendations using translations
    const recommendations = useMemo(() => {
        if (!result) return [];

        const recs: string[] = [];
        const cost = parseFloat(costPerUnit);
        const margin = parseFloat(desiredMargin);

        if (result.competitorComparison) {
            const percentDiff = Math.abs(result.competitorComparison.percentageDiff).toFixed(1);
            if (result.competitorComparison.position === 'above') {
                recs.push(t('calculators.pricing.recommendations.high_vs_competition', { percent: percentDiff }));
            } else {
                recs.push(t('calculators.pricing.recommendations.low_vs_competition', { percent: percentDiff }));
            }
        }

        if (margin > 50) {
            recs.push(t('calculators.pricing.recommendations.high_margin'));
        }

        recs.push(t('calculators.pricing.recommendations.test_prices'));
        recs.push(t('calculators.pricing.recommendations.monitor_prices'));

        return recs;
    }, [result, costPerUnit, desiredMargin, t]);

    const handleExportPDF = async () => {
        if (!result) return;

        setExporting(true);
        try {
            const html = generatePricingPDF({
                inputs: {
                    costPerUnit: parseFloat(costPerUnit) || 0,
                    desiredMargin: parseFloat(desiredMargin) || 0,
                    competitorPrice: competitorPrice ? parseFloat(competitorPrice) : undefined,
                },
                results: {
                    recommendedPrice: result.recommendedPrice,
                    grossProfitPerUnit: result.grossProfitPerUnit,
                    markup: result.markupPercentage,
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
                        title={t('calculators.pricing.title')}
                        subtitle={t('calculators.pricing.subtitle')}
                    />
                </View>

                <View className="gap-6">
                    {/* Form */}
                    <View className="w-full">
                        <GlassCard>
                            <Text className="text-white font-semibold text-lg mb-6">
                                {t('calculators.enter_data')}
                            </Text>

                            <InputField
                                label={t('calculators.pricing.cost_per_unit')}
                                value={costPerUnit}
                                onChange={setCostPerUnit}
                                prefix="$"
                                hint={t('calculators.pricing.cost_per_unit_hint')}
                            />

                            <InputField
                                label={t('calculators.pricing.desired_margin')}
                                value={desiredMargin}
                                onChange={setDesiredMargin}
                                suffix="%"
                                hint={t('calculators.pricing.desired_margin_hint')}
                            />

                            <InputField
                                label={t('calculators.pricing.competitor_price')}
                                value={competitorPrice}
                                onChange={setCompetitorPrice}
                                prefix="$"
                                hint={t('calculators.pricing.competitor_price_hint')}
                            />
                        </GlassCard>
                    </View>

                    {/* Results */}
                    <View className="w-full gap-4">
                        {result ? (
                            <>
                                {/* Main Price */}
                                <GlassCard gradient className="items-center py-8">
                                    <Text className="text-gray-400">{t('calculators.pricing.recommended_price')}</Text>
                                    <Text className="text-5xl font-bold text-white mt-2">
                                        ${result.recommendedPrice != null ? result.recommendedPrice.toFixed(2) : '0.00'}
                                    </Text>
                                    <View className="flex-row gap-4 mt-4">
                                        <Badge variant="success">
                                            {`$${result.grossProfitPerUnit != null ? result.grossProfitPerUnit.toFixed(2) : '0.00'} ${t('calculators.pricing.profit_per_unit')}`}
                                        </Badge>
                                        <Badge variant="default">
                                            {`${result.markupPercentage != null ? result.markupPercentage.toFixed(0) : '0'}% ${t('calculators.pricing.markup')}`}
                                        </Badge>
                                    </View>
                                </GlassCard>

                                {/* Price Range */}
                                <GlassCard>
                                    <Text className="text-white font-semibold mb-4">
                                        {t('calculators.pricing.price_range')}
                                    </Text>
                                    <View className="flex-row items-center gap-4">
                                        <View className="items-center">
                                            <Text className="text-gray-400 text-xs">{t('calculators.pricing.minimum')}</Text>
                                            <Text className="text-white text-xl font-bold">${result.recommendedPriceRange.low}</Text>
                                        </View>
                                        <View className="flex-1 h-2 bg-slate-700 rounded-full">
                                            <View className="h-full bg-gradient-to-r from-[#14B8A6] to-[#86EFAC] rounded-full" style={{ width: '60%' }} />
                                        </View>
                                        <View className="items-center">
                                            <Text className="text-gray-400 text-xs">{t('calculators.pricing.maximum')}</Text>
                                            <Text className="text-white text-xl font-bold">${result.recommendedPriceRange.high}</Text>
                                        </View>
                                    </View>
                                </GlassCard>

                                {/* Strategies */}
                                <Text className="text-white font-semibold">{t('calculators.pricing.pricing_strategies')}</Text>
                                <View className="flex-row flex-wrap gap-4">
                                    <PriceStrategyCard
                                        strategy={t('calculators.pricing.premium')}
                                        price={result.priceStrategies.premium}
                                        benefits={t('calculators.pricing.premium_benefits')}
                                    />
                                    <PriceStrategyCard
                                        strategy={t('calculators.pricing.competitive')}
                                        price={result.priceStrategies.competitive}
                                        benefits={t('calculators.pricing.competitive_benefits')}
                                        recommended
                                    />
                                    <PriceStrategyCard
                                        strategy={t('calculators.pricing.penetration')}
                                        price={result.priceStrategies.penetration}
                                        benefits={t('calculators.pricing.penetration_benefits')}
                                    />
                                </View>

                                {/* Competitor Comparison */}
                                {result.competitorComparison && (
                                    <GlassCard className={`border ${result.competitorComparison.position === 'above' ? 'border-[#FB923C]/30' : 'border-[#86EFAC]/30'}`}>
                                        <View className="flex-row items-center gap-3">
                                            <Text className="text-2xl">
                                                {result.competitorComparison.position === 'above' ? '⬆️' : '⬇️'}
                                            </Text>
                                            <View>
                                                <Text className="text-white font-bold">
                                                    {result.competitorComparison.position === 'above'
                                                        ? `${result.competitorComparison.percentageDiff != null ? Math.abs(result.competitorComparison.percentageDiff).toFixed(1) : '0'}% ${t('calculators.pricing.above_competitor')}`
                                                        : `${result.competitorComparison.percentageDiff != null ? Math.abs(result.competitorComparison.percentageDiff).toFixed(1) : '0'}% ${t('calculators.pricing.below_competitor')}`
                                                    }
                                                </Text>
                                                <Text className="text-gray-400 text-sm">
                                                    {t('calculators.pricing.difference')}: ${result.competitorComparison.difference != null ? Math.abs(result.competitorComparison.difference).toFixed(2) : '0.00'}
                                                </Text>
                                            </View>
                                        </View>
                                    </GlassCard>
                                )}

                                {/* Recommendations */}
                                {recommendations.length > 0 && (
                                    <GlassCard>
                                        <View className="flex-row items-center gap-2 mb-4"><IconLabel icon="bulb" size={18} /><Text className="text-white font-semibold">{t('calculators.recommendations')}</Text></View>
                                        <View className="gap-2">
                                            {recommendations.map((rec, i) => (
                                                <Text key={i} className="text-gray-300">• {rec}</Text>
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
                                <Ionicons name="pricetag" size={48} color="#6b7280" />
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
