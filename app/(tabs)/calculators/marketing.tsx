/**
 * @fileoverview Marketing ROI Calculator Page
 * Measures advertising effectiveness by channel
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    GlassCard,
    GradientButton,
    SectionHeading,
    Badge,
} from '@/components/landing/shared-components';
import { IconLabel } from '@/components/ui/icon-label';
import { router } from 'expo-router';
import { MarketingROICalculator } from '@/lib/infrastructure/calculators/MarketingROICalculator';
import { useTranslation } from '@/lib/i18n-context';
import { LanguageSelector } from '@/components/language-selector';
import { generateMarketingROIPDF, printPDF } from '@/lib/export/pdf-generator';

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

function ChannelSelector({ selected, onSelect, t }: { selected: string; onSelect: (channel: string) => void, t: any }) {
    const channels = [
        { id: 'facebook', label: t('calculators.marketing_roi.channels.facebook'), icon: 'globe', color: 'bg-blue-500/20 border-blue-500' },
        { id: 'google', label: t('calculators.marketing_roi.channels.google'), icon: 'globe', color: 'bg-green-500/20 border-green-500' },
        { id: 'instagram', label: t('calculators.marketing_roi.channels.instagram'), icon: 'phone', color: 'bg-pink-500/20 border-pink-500' },
        { id: 'email', label: t('calculators.marketing_roi.channels.email'), icon: 'clipboard', color: 'bg-[#FB923C]/20 border-[#FB923C]' },
        { id: 'referral', label: t('calculators.marketing_roi.channels.referral'), icon: 'people', color: 'bg-[#86EFAC]/20 border-[#86EFAC]' },
        { id: 'other', label: t('calculators.marketing_roi.channels.other'), icon: 'chart', color: 'bg-gray-500/20 border-gray-500' },
    ];

    return (
        <View className="mb-4">
            <Text className="text-gray-300 font-medium mb-2">{t('calculators.marketing_roi.marketing_channel')}</Text>
            <View className="flex-row flex-wrap gap-2">
                {channels.map((channel) => (
                    <Pressable
                        key={channel.id}
                        onPress={() => onSelect(channel.id)}
                        className={`px-4 py-2 rounded-xl border ${selected === channel.id
                            ? channel.color
                            : 'bg-slate-800 border-white/10'
                            }`}
                    >
                        <Text className="text-white">{channel.icon} {channel.label}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

function FunnelVisual({ impressions, clicks, conversions, t }: { impressions?: number; clicks?: number; conversions: number, t: any }) {
    const maxWidth = 100;
    const clicksWidth = impressions && clicks ? (clicks / impressions) * maxWidth : maxWidth;
    const conversionsWidth = clicks ? (conversions / clicks) * clicksWidth : maxWidth * 0.5;
    const barHeight = Dimensions.get('window').width < 600 ? 12 : 24;

    return (
        <GlassCard>
            <View className="flex-row items-center gap-2 mb-4"><IconLabel icon="chart" size={18} /><Text className="text-white font-semibold">{t('calculators.marketing_roi.funnel_title')}</Text></View>

            <View className="gap-3">
                {impressions && (
                    <View>
                        <View className="flex-row justify-between mb-1">
                            <Text className="text-gray-400 text-sm">{t('calculators.marketing_roi.impressions')}</Text>
                            <Text className="text-white">{impressions.toLocaleString()}</Text>
                        </View>
                        <View style={{ height: barHeight }} className="bg-slate-700 rounded-full overflow-hidden">
                            <View className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                        </View>
                    </View>
                )}

                {clicks && (
                    <View>
                        <View className="flex-row justify-between mb-1">
                            <Text className="text-gray-400 text-sm">{t('calculators.marketing_roi.clicks')}</Text>
                            <Text className="text-white">{clicks.toLocaleString()}</Text>
                        </View>
                        <View style={{ height: barHeight }} className="bg-slate-700 rounded-full overflow-hidden">
                            <View
                                className="h-full bg-[#14B8A6] rounded-full"
                                style={{ width: `${clicksWidth}%` }}
                            />
                        </View>
                    </View>
                )}

                <View>
                    <View className="flex-row justify-between mb-1">
                        <Text className="text-gray-400 text-sm">{t('calculators.marketing_roi.conversions')}</Text>
                        <Text className="text-emerald-400 font-bold">{conversions.toLocaleString()}</Text>
                    </View>
                    <View style={{ height: barHeight }} className="bg-slate-700 rounded-full overflow-hidden">
                        <View
                            className="h-full bg-[#86EFAC] rounded-full"
                            style={{ width: `${Math.max(conversionsWidth, 5)}%` }}
                        />
                    </View>
                </View>
            </View>
        </GlassCard>
    );
}

export default function MarketingPage() {
    const { t } = useTranslation();
    const [exporting, setExporting] = useState(false);
    const [totalSpend, setTotalSpend] = useState('5000');
    const [conversions, setConversions] = useState('100');
    const [revenuePerConversion, setRevenuePerConversion] = useState('150');
    const [channel, setChannel] = useState('facebook');
    const [impressions, setImpressions] = useState('50000');
    const [clicks, setClicks] = useState('2000');

    const calculator = useMemo(() => new MarketingROICalculator(), []);

    const result = useMemo(() => {
        try {
            const spend = parseFloat(totalSpend) || 0;
            const conv = parseInt(conversions) || 0;
            const revenue = parseFloat(revenuePerConversion) || 0;
            const impr = impressions ? parseInt(impressions) : undefined;
            const clk = clicks ? parseInt(clicks) : undefined;

            if (spend <= 0 || conv <= 0 || revenue <= 0) return null;

            return calculator.calculate({
                totalSpend: spend,
                conversions: conv,
                revenuePerConversion: revenue,
                channel,
                impressions: impr,
                clicks: clk,
            });
        } catch {
            return null;
        }
    }, [totalSpend, conversions, revenuePerConversion, channel, impressions, clicks, calculator]);

    // Generate recommendations using translations
    const recommendations = useMemo(() => {
        if (!result) return [];

        const recs: string[] = [];

        if (result.roiPercentage >= 200) {
            recs.push(t('calculators.marketing_roi.recommendations.excellent_roi'));
        } else if (result.roiPercentage >= 100) {
            recs.push(t('calculators.marketing_roi.recommendations.good_roi'));
        } else {
            recs.push(t('calculators.marketing_roi.recommendations.losing_campaign'));
        }

        if (result.benchmarkComparison.cacVsBenchmark === 'worse') {
            recs.push(t('calculators.marketing_roi.recommendations.cac_high'));
        }

        recs.push(t('calculators.marketing_roi.recommendations.test_audience'));
        recs.push(t('calculators.marketing_roi.recommendations.optimize_campaign'));

        return recs;
    }, [result, t]);

    const handleExportPDF = async () => {
        if (!result) return;

        setExporting(true);
        try {
            const html = generateMarketingROIPDF({
                inputs: {
                    totalSpend: parseFloat(totalSpend) || 0,
                    conversions: parseInt(conversions) || 0,
                    revenuePerConversion: parseFloat(revenuePerConversion) || 0,
                },
                results: {
                    roiPercentage: result.roiPercentage,
                    costPerAcquisition: result.costPerAcquisition,
                    totalRevenue: result.totalRevenue,
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
                        title={`📢 ${t('calculators.marketing_roi.title')}`}
                        subtitle={t('calculators.marketing_roi.subtitle')}
                    />
                </View>

                <View className="gap-6">
                    {/* Form */}
                    <View className="w-full">
                        <GlassCard>
                            <Text className="text-white font-semibold text-lg mb-6">
                                {t('calculators.enter_data')}
                            </Text>

                            <ChannelSelector selected={channel} onSelect={setChannel} t={t} />

                            <InputField
                                label={t('calculators.marketing_roi.campaign_cost')}
                                value={totalSpend}
                                onChange={setTotalSpend}
                                prefix="$"
                            />

                            <InputField
                                label={t('calculators.marketing_roi.leads_generated')}
                                value={conversions}
                                onChange={setConversions}
                            />

                            <InputField
                                label={t('calculators.marketing_roi.average_sale')}
                                value={revenuePerConversion}
                                onChange={setRevenuePerConversion}
                                prefix="$"
                            />

                            <View className="h-px bg-white/10 my-4" />
                            <Text className="text-gray-400 text-sm mb-4">{t('calculators.marketing_roi.optional_metrics')}</Text>

                            <InputField
                                label={t('calculators.marketing_roi.impressions')}
                                value={impressions}
                                onChange={setImpressions}
                            />

                            <InputField
                                label={t('calculators.marketing_roi.clicks')}
                                value={clicks}
                                onChange={setClicks}
                            />
                        </GlassCard>
                    </View>

                    {/* Results */}
                    <View className="w-full gap-4">
                        {result ? (
                            <>
                                {/* Main Metrics */}
                                <View className="flex-row flex-wrap gap-4">
                                    <GlassCard gradient className="flex-1 min-w-[140px] items-center py-6">
                                        <Text className="text-gray-400 text-sm">{t('calculators.marketing_roi.roi')}</Text>
                                        <Text className={`text-4xl font-bold ${result.roiPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {result.roiPercentage != null ? result.roiPercentage.toFixed(0) : '0'}%
                                        </Text>
                                    </GlassCard>

                                    <GlassCard className="flex-1 min-w-[140px] items-center py-6">
                                        <Text className="text-gray-400 text-sm">ROAS</Text>
                                        <Text className="text-3xl font-bold text-indigo-400">
                                            {result.roas != null ? result.roas.toFixed(1) : '0.0'}x
                                        </Text>
                                        <Text className="text-gray-500 text-xs">Return on Ad Spend</Text>
                                    </GlassCard>
                                </View>

                                {/* Profit/Loss */}
                                <GlassCard className={`border-2 ${result.isProfitable ? 'border-[#86EFAC]/50' : 'border-[#FB923C]/50'}`}>
                                    <View className="flex-row items-center gap-3">
                                        <IconLabel icon={result.isProfitable ? 'money' : 'chart-down'} size={36} />
                                        <View>
                                            <Text className="text-white font-bold text-lg">
                                                {result.isProfitable
                                                    ? t('calculators.marketing_roi.excellent_campaign')
                                                    : t('calculators.marketing_roi.losing_campaign')
                                                }
                                            </Text>
                                            <Text className={result.isProfitable ? 'text-emerald-400' : 'text-rose-400'}>
                                                {result.isProfitable
                                                    ? `${t('calculators.marketing_roi.net_profit')}: $${result.netProfit.toLocaleString()}`
                                                    : `${t('calculators.marketing_roi.loss')}: $${Math.abs(result.netProfit).toLocaleString()}`
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                </GlassCard>

                                {/* Detailed Metrics */}
                                <View className="flex-row flex-wrap gap-4">
                                    <GlassCard className="flex-1 min-w-[100px]">
                                        <Text className="text-gray-400 text-xs">{t('calculators.marketing_roi.cpa')}</Text>
                                        <Text className="text-xl font-bold text-white">${result.costPerAcquisition}</Text>
                                        <Badge variant={result.benchmarkComparison.cacVsBenchmark === 'better' ? 'success' : result.benchmarkComparison.cacVsBenchmark === 'worse' ? 'danger' : 'warning'}>
                                            {t(`calculators.marketing_roi.cac_levels.${result.benchmarkComparison.cacVsBenchmark}`)}
                                        </Badge>
                                    </GlassCard>

                                    {result.clickThroughRate && (
                                        <GlassCard className="flex-1 min-w-[100px]">
                                            <Text className="text-gray-400 text-xs">CTR</Text>
                                            <Text className="text-xl font-bold text-white">{result.clickThroughRate}%</Text>
                                        </GlassCard>
                                    )}

                                    {result.conversionRate && (
                                        <GlassCard className="flex-1 min-w-[100px]">
                                            <Text className="text-gray-400 text-xs">{t('calculators.marketing_roi.conversion_rate')}</Text>
                                            <Text className="text-xl font-bold text-white">{result.conversionRate}%</Text>
                                        </GlassCard>
                                    )}

                                    {result.costPerClick && (
                                        <GlassCard className="flex-1 min-w-[100px]">
                                            <Text className="text-gray-400 text-xs">{t('calculators.marketing_roi.cpl')}</Text>
                                            <Text className="text-xl font-bold text-white">${result.costPerClick}</Text>
                                        </GlassCard>
                                    )}
                                </View>

                                {/* Funnel */}
                                {(impressions || clicks) && (
                                    <FunnelVisual
                                        impressions={impressions ? parseInt(impressions) : undefined}
                                        clicks={clicks ? parseInt(clicks) : undefined}
                                        conversions={parseInt(conversions)}
                                        t={t}
                                    />
                                )}

                                {/* LTV/CAC */}
                                {result.lifetimeValueToCAC && (
                                    <GlassCard>
                                        <View className="flex-row items-center gap-2 mb-2"><IconLabel icon="chart-up" size={18} /><Text className="text-white font-semibold">LTV/CAC Ratio</Text></View>
                                        <View className="flex-row items-center gap-4">
                                            <Text className={`text-3xl font-bold ${result.lifetimeValueToCAC >= 3 ? 'text-emerald-400' : result.lifetimeValueToCAC >= 1 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                {result.lifetimeValueToCAC != null ? result.lifetimeValueToCAC.toFixed(1) : '0.0'}x
                                            </Text>
                                            <Text className="text-gray-400 text-sm flex-1">
                                                {result.lifetimeValueToCAC >= 3
                                                    ? t('calculators.marketing_roi.excellent_description')
                                                    : result.lifetimeValueToCAC >= 1
                                                        ? t('calculators.marketing_roi.good_description')
                                                        : t('calculators.marketing_roi.losing_description')
                                                }
                                            </Text>
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
                                <Ionicons name="megaphone" size={48} color="#6b7280" />
                                <Text className="text-gray-400 mt-4 text-center">
                                    {t('calculators.no_data')}
                                </Text>
                            </GlassCard>
                        )}
                    </View>
                </View>
            </View>
        </ScrollView >
    );
}
