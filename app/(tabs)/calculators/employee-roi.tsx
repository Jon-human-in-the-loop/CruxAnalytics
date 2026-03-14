import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    GlassCard,
    GradientButton,
    SectionHeading,
    Badge,
} from '@/components/landing/shared-components';
import { IconLabel } from '@/components/ui/icon-label';
import { router } from 'expo-router';
import { EmployeeROICalculator } from '@/lib/infrastructure/calculators/EmployeeROICalculator';
import { useTranslation } from '@/lib/i18n-context';
import { LanguageSelector } from '@/components/language-selector';
import { generateEmployeeROIPDF, printPDF } from '@/lib/export/pdf-generator';

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

function RoleSelector({ selected, onSelect, t }: { selected: string; onSelect: (role: string) => void, t: any }) {
    const roles = [
        { id: 'sales', label: t('calculators.employee_roi.roles.sales'), icon: 'briefcase' },
        { id: 'operations', label: t('calculators.employee_roi.roles.operations'), icon: 'settings' },
        { id: 'technical', label: t('calculators.employee_roi.roles.technical'), icon: 'ai' },
        { id: 'administrative', label: t('calculators.employee_roi.roles.administrative'), icon: 'clipboard' },
    ];

    return (
        <View className="mb-4">
            <Text className="text-gray-300 font-medium mb-2">{t('calculators.employee_roi.role_type')}</Text>
            <View className="flex-row flex-wrap gap-2">
                {roles.map((role) => (
                    <Pressable
                        key={role.id}
                        onPress={() => onSelect(role.id)}
                        className={`px-4 py-2 rounded-xl border ${selected === role.id
                            ? 'bg-[#14B8A6]/20 border-[#14B8A6]'
                            : 'bg-slate-800 border-white/10'
                            }`}
                    >
                        <View className="flex-row items-center gap-2"><IconLabel icon={role.icon} size={16} color="white" /><Text className="text-white">{role.label}</Text></View>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

function ROIGauge({ roi }: { roi: number }) {
    const getColor = () => {
        if (roi >= 100) return { bg: 'bg-[#86EFAC]', text: 'text-emerald-400' };
        if (roi >= 50) return { bg: 'bg-[#FB923C]', text: 'text-amber-400' };
        if (roi >= 0) return { bg: 'bg-orange-500', text: 'text-orange-400' };
        return { bg: 'bg-[#FB923C]', text: 'text-rose-400' };
    };

    const colors = getColor();
    const fillPercent = Math.min(Math.max((roi + 100) / 2, 0), 100);
    const small = Dimensions.get('window').width < 600;

    return (
        <View className="items-center">
            <View
                className="rounded-full border-8 border-white/10 items-center justify-center relative overflow-hidden"
                style={{ width: small ? 112 : 192, height: small ? 112 : 192 }}
            >
                <View
                    className={`absolute bottom-0 left-0 right-0 ${colors.bg} opacity-20`}
                    style={{ height: `${fillPercent}%` }}
                />
                <View className="items-center">
                    <Text className={`font-bold ${colors.text}`} style={{ fontSize: small ? 28 : 48 }}>
                        {roi != null ? roi.toFixed(0) : '0'}%
                    </Text>
                    <Text className="text-gray-400 text-sm">ROI</Text>
                </View>
            </View>
        </View>
    );
}

export default function EmployeeROIPage() {
    const { t } = useTranslation();
    const [exporting, setExporting] = useState(false);
    const [annualSalary, setAnnualSalary] = useState('60000');
    const [annualBenefits, setAnnualBenefits] = useState('12000');
    const [onboardingCosts, setOnboardingCosts] = useState('5000');
    const [revenueGenerated, setRevenueGenerated] = useState('150000');
    const [hoursPerWeek, setHoursPerWeek] = useState('40');
    const [roleType, setRoleType] = useState('operations');

    const calculator = useMemo(() => new EmployeeROICalculator(), []);

    const result = useMemo(() => {
        try {
            const salary = parseFloat(annualSalary) || 0;
            const benefits = parseFloat(annualBenefits) || 0;
            const onboarding = parseFloat(onboardingCosts) || 0;
            const revenue = parseFloat(revenueGenerated) || 0;
            const hours = parseFloat(hoursPerWeek) || 0;

            if (salary <= 0 || benefits <= 0 || onboarding <= 0 || revenue <= 0 || hours <= 0) return null;

            return calculator.calculate({
                annualSalary: salary,
                annualBenefits: benefits,
                onboardingCosts: onboarding,
                revenueGenerated: revenue,
                hoursPerWeek: hours,
                roleType,
            });
        } catch {
            return null;
        }
    }, [annualSalary, annualBenefits, onboardingCosts, revenueGenerated, hoursPerWeek, roleType, calculator]);

    // Generate recommendations using translations
    const recommendations = useMemo(() => {
        if (!result) return [];

        const recs: string[] = [];

        if (result.roiPercentage >= 50) {
            recs.push(t('calculators.employee_roi.recommendations.positive_hire'));
        } else if (result.roiPercentage < 0) {
            recs.push(t('calculators.employee_roi.recommendations.negative_roi'));
        } else {
            recs.push(t('calculators.employee_roi.recommendations.adjust_expectations'));
        }

        if (result.paybackMonths && result.paybackMonths <= 6) {
            recs.push(t('calculators.employee_roi.recommendations.fast_payback', {
                months: result.paybackMonths.toString()
            }));
        }

        recs.push(t('calculators.employee_roi.recommendations.optimize_role'));

        return recs;
    }, [result, t]);

    const handleExportPDF = async () => {
        if (!result) return;

        setExporting(true);
        try {
            const html = generateEmployeeROIPDF({
                inputs: {
                    annualSalary: parseFloat(annualSalary) || 0,
                    annualBenefits: parseFloat(annualBenefits) || 0,
                    onboardingCosts: parseFloat(onboardingCosts) || 0,
                    revenueGenerated: parseFloat(revenueGenerated) || 0,
                },
                results: {
                    totalCost: result.totalCost,
                    roiPercentage: result.roiPercentage,
                    paybackMonths: result.paybackMonths ?? null,
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
                        title={t('calculators.employee_roi.title')}
                        subtitle={t('calculators.employee_roi.subtitle')}
                    />
                </View>

                <View className={isSmall ? 'gap-6' : 'flex-row gap-6 items-start'}>
                    {/* Form */}
                    <View className={isSmall ? 'w-full' : 'flex-1'}>
                        <GlassCard>
                            <Text className="text-white font-semibold text-lg mb-6">
                                {t('calculators.enter_data')}
                            </Text>

                            <RoleSelector selected={roleType} onSelect={setRoleType} t={t} />

                            <InputField
                                label={t('calculators.employee_roi.annual_salary')}
                                value={annualSalary}
                                onChange={setAnnualSalary}
                                prefix="$"
                            />

                            <InputField
                                label={t('calculators.employee_roi.additional_costs')}
                                value={annualBenefits}
                                onChange={setAnnualBenefits}
                                prefix="$"
                            />

                            <InputField
                                label={t('calculators.employee_roi.onboarding_costs')}
                                value={onboardingCosts}
                                onChange={setOnboardingCosts}
                                prefix="$"
                                hint={t('calculators.employee_roi.onboarding_hint')}
                            />

                            <InputField
                                label={t('calculators.employee_roi.expected_revenue')}
                                value={revenueGenerated}
                                onChange={setRevenueGenerated}
                                prefix="$"
                            />

                            <InputField
                                label={t('calculators.employee_roi.hours_per_week')}
                                value={hoursPerWeek}
                                onChange={setHoursPerWeek}
                                suffix="hrs"
                            />
                        </GlassCard>
                    </View>

                    {/* Results */}
                    <View className={isSmall ? 'w-full gap-4' : 'flex-1 gap-4'}>
                        {result ? (
                            <>
                                {/* Main Result */}
                                <GlassCard gradient className="items-center py-8">
                                    <ROIGauge roi={result.roiPercentage} />
                                    <View className="flex-row gap-4 mt-6">
                                        <Badge variant={result.isViable ? 'success' : 'danger'}>
                                            {result.isViable ? 'VIABLE' : 'RISKY'}
                                        </Badge>
                                    </View>
                                </GlassCard>

                                {/* Metrics */}
                                <View className="flex-row flex-wrap gap-4">
                                    <GlassCard className="flex-1 min-w-[140px]">
                                        <Text className="text-gray-400 text-sm">{t('calculators.employee_roi.total_cost')}</Text>
                                        <Text className="text-2xl font-bold text-white">
                                            ${result.totalCost.toLocaleString()}
                                        </Text>
                                        <Text className="text-gray-500 text-xs">{t('calculators.employee_roi.first_year')}</Text>
                                    </GlassCard>

                                    <GlassCard className="flex-1 min-w-[140px]">
                                        <Text className="text-gray-400 text-sm">{t('calculators.employee_roi.net_benefit')}</Text>
                                        <Text className={`text-2xl font-bold ${result.netContribution >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            ${result.netContribution.toLocaleString()}
                                        </Text>
                                        <Text className="text-gray-500 text-xs">{t('calculators.employee_roi.revenue_minus_cost')}</Text>
                                    </GlassCard>

                                    <GlassCard className="flex-1 min-w-[140px]">
                                        <Text className="text-gray-400 text-sm">{t('calculators.employee_roi.per_dollar_invested')}</Text>
                                        <Text className="text-2xl font-bold text-indigo-400">
                                            ${result.revenuePerDollarSpent != null ? result.revenuePerDollarSpent.toFixed(2) : '0.00'}
                                        </Text>
                                        <Text className="text-gray-500 text-xs">{t('calculators.employee_roi.return')}</Text>
                                    </GlassCard>
                                </View>

                                {/* Productivity */}
                                <GlassCard>
                                    <View className="flex-row items-center gap-2 mb-4"><IconLabel icon="chart" size={18} /><Text className="text-white font-semibold">{t('calculators.employee_roi.productivity_title')}</Text></View>
                                    <View className="flex-row justify-between">
                                        <View className="items-center flex-1">
                                            <Text className="text-gray-400 text-xs">{t('calculators.employee_roi.cost_per_hour')}</Text>
                                            <Text className="text-white text-xl font-bold">${result.costPerHour}</Text>
                                        </View>
                                        <View className="items-center flex-1">
                                            <Text className="text-gray-400 text-xs">{t('calculators.employee_roi.revenue_per_hour')}</Text>
                                            <Text className="text-emerald-400 text-xl font-bold">${result.revenuePerHour}</Text>
                                        </View>
                                        <View className="items-center flex-1">
                                            <Text className="text-gray-400 text-xs">{t('calculators.employee_roi.ratio')}</Text>
                                            <Text className="text-indigo-400 text-xl font-bold">{result.productivityRatio}x</Text>
                                        </View>
                                    </View>

                                    <View className="mt-4 pt-4 border-t border-white/10">
                                        <View className="flex-row items-center gap-2">
                                            <Badge variant={result.benchmarkComparison.productivityLevel === 'high' ? 'success' : result.benchmarkComparison.productivityLevel === 'low' ? 'danger' : 'warning'}>
                                                {`${t('calculators.employee_roi.productivity_label')} ${t(`calculators.employee_roi.productivity_levels.${result.benchmarkComparison.productivityLevel}`)}`}
                                            </Badge>
                                            <Text className="text-gray-500 text-xs">{t('calculators.employee_roi.vs_industry')}</Text>
                                        </View>
                                    </View>
                                </GlassCard>

                                {/* Payback */}
                                {result.paybackMonths && (
                                    <GlassCard>
                                        <View className="flex-row items-center gap-3">
                                            <IconLabel icon="flash" size={28} color="#00C0D4" />
                                            <View>
                                                <Text className="text-white font-bold">{t('calculators.employee_roi.payback')}</Text>
                                                <Text className="text-indigo-400">
                                                    {result.paybackMonths} {t('calculators.employee_roi.months')} {t('calculators.employee_roi.payback_desc')}
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
                                <Ionicons name="people" size={48} color="#6b7280" />
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
