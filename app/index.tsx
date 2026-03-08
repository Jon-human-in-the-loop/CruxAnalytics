/**
 * @fileoverview Landing Page for CruxAnalytics (Root Entry Point)
 * A stunning, professional landing page designed to convert visitors
 * and showcase the value of the SME financial analysis tool.
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, Image, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { LanguageSelector } from '@/components/language-selector';
import { useTranslation } from '@/lib/i18n-context';
import {
    GlassCard,
    GradientButton,
    OutlineButton,
    FeatureCard,
    StatNumber,
    SectionHeading,
    TestimonialCard,
    Badge,
} from '@/components/landing/shared-components';

// ============================================
// HERO SECTION
// ============================================
function HeroSection() {
    const router = useRouter();
    const colors = useColors();
    const { t } = useTranslation();

    return (
        <View className="min-h-screen justify-center items-center px-6 py-20 relative overflow-hidden">
            {/* Background gradient orbs */}
            <View className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#14B8A6]/20 blur-[120px]" />
            <View className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#86EFAC]/20 blur-[120px]" />

            {/* Content */}
            <View className="max-w-4xl items-center z-10">
                <Badge variant="success">
                    <View className="flex-row items-center gap-1.5">
                        <Ionicons name="sparkles" size={14} color={colors.success} />
                        <Text className="text-success text-xs font-medium">{t('landing.hero.badge')}</Text>
                    </View>
                </Badge>

                <Text className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center mt-6 leading-tight">
                    {t('landing.hero.title').split('está en riesgo')[0]}
                    <Text className="bg-gradient-to-r from-[#14B8A6] to-[#86EFAC] bg-clip-text text-transparent">
                        {t('landing.hero.title').includes('está en riesgo') ? 'está en riesgo' : 'is at risk'}
                    </Text>
                </Text>

                <Text className="text-xl text-gray-400 text-center mt-6 max-w-2xl leading-relaxed">
                    {t('landing.hero.subtitle')}
                </Text>

                <View className="flex-row gap-4 mt-10">
                    <GradientButton
                        size="lg"
                        className="rounded-2xl"
                        onPress={() => router.push('/(tabs)')}
                    >
                        {t('landing.hero.cta')}
                    </GradientButton>
                </View>

                {/* Trust indicators */}
                <View className="flex-row flex-wrap gap-x-6 gap-y-3 mt-12 opacity-60 justify-center">
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="lock-closed" size={16} color="#9ca3af" />
                        <Text className="text-gray-400 text-sm">{t('landing.hero.privacy')}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="flash" size={16} color={colors.primary} />
                        <Text className="text-gray-400 text-sm">{t('landing.hero.results')}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="bulb" size={16} color={colors.warning} />
                        <Text className="text-gray-400 text-sm">{t('landing.hero.ai')}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

// ============================================
// PROBLEM SECTION
// ============================================
function ProblemSection() {
    const { t } = useTranslation();

    return (
        <View className="px-6 py-20 bg-gradient-to-b from-transparent to-slate-900/50">
            <View className="max-w-6xl mx-auto">
                <SectionHeading
                    title={t('landing.problem.title')}
                    subtitle={t('landing.problem.subtitle')}
                    centered
                />

                {/* Statistics */}
                <View className="flex-row flex-wrap justify-center gap-8 md:gap-16 mt-12">
                    <StatNumber value={80} suffix="%" label={t('landing.problem.stat1')} />
                    <StatNumber value={60} suffix="%" label={t('landing.problem.stat2')} />
                    <StatNumber value={45} suffix="%" label={t('landing.problem.stat3')} />
                </View>

                {/* Pain points */}
                <View className="flex-row flex-wrap gap-6 mt-16 justify-center">
                    <GlassCard className="max-w-xs">
                        <View className="w-16 h-16 rounded-full bg-warning/10 items-center justify-center mb-4">
                            <Ionicons name="alert-circle" size={32} color="#FB923C" />
                        </View>
                        <Text className="text-white font-bold text-lg mb-2">
                            {t('landing.problem.pain1_title')}
                        </Text>
                        <Text className="text-gray-400">
                            {t('landing.problem.pain1_desc')}
                        </Text>
                    </GlassCard>

                    <GlassCard className="max-w-xs">
                        <View className="w-16 h-16 rounded-full bg-error/10 items-center justify-center mb-4">
                            <Ionicons name="cash" size={32} color="#FB923C" />
                        </View>
                        <Text className="text-white font-bold text-lg mb-2">
                            {t('landing.problem.pain2_title')}
                        </Text>
                        <Text className="text-gray-400">
                            {t('landing.problem.pain2_desc')}
                        </Text>
                    </GlassCard>

                    <GlassCard className="max-w-xs">
                        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
                            <Ionicons name="help-circle" size={32} color="#14B8A6" />
                        </View>
                        <Text className="text-white font-bold text-lg mb-2">
                            {t('landing.problem.pain3_title')}
                        </Text>
                        <Text className="text-gray-400">
                            {t('landing.problem.pain3_desc')}
                        </Text>
                    </GlassCard>
                </View>
            </View>
        </View>
    );
}

// ============================================
// SOLUTION SECTION
// ============================================
function SolutionSection() {
    const { t } = useTranslation();

    return (
        <View className="px-6 py-20">
            <View className="max-w-6xl mx-auto">
                <View className="flex-row flex-wrap items-center gap-12">
                    {/* Text */}
                    <View className="flex-1 min-w-[300px]">
                        <Badge>{t('landing.solution.badge')}</Badge>
                        <Text className="text-3xl md:text-4xl font-bold text-white mt-4">
                            {t('landing.solution.title').split('Gratis')[0]}
                            <Text className="text-[#14B8A6]">{t('landing.solution.title').includes('Gratis') ? 'Gratis y en 2 minutos.' : 'Free and in 2 minutes.'}</Text>
                        </Text>
                        <Text className="text-gray-400 text-lg mt-6 leading-relaxed">
                            {t('landing.solution.subtitle')}
                        </Text>

                        <View className="mt-6 gap-4">
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center">
                                    <Ionicons name="checkmark" size={18} color="#10b981" />
                                </View>
                                <Text className="text-white">{t('landing.solution.feature1')}</Text>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center">
                                    <Ionicons name="checkmark" size={18} color="#10b981" />
                                </View>
                                <Text className="text-white">{t('landing.solution.feature2')}</Text>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center">
                                    <Ionicons name="checkmark" size={18} color="#10b981" />
                                </View>
                                <Text className="text-white">{t('landing.solution.feature3')}</Text>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center">
                                    <Ionicons name="checkmark" size={18} color="#10b981" />
                                </View>
                                <Text className="text-white">{t('landing.solution.feature4')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Visual */}
                    <View className="flex-1 min-w-[300px]">
                        <GlassCard gradient className="p-8">
                            <View className="bg-slate-900 rounded-xl p-6">
                                <View className="flex-row items-center gap-2 mb-2">
                                    <Ionicons name="checkmark-circle" size={20} color="#86EFAC" />
                                    <Text className="text-success text-sm font-bold mb-2">{t('landing.solution.visual_status')}</Text>
                                </View>
                                <Text className="text-white text-2xl font-bold">{t('landing.solution.visual_health')}</Text>

                                <View className="flex-row gap-4 mt-6">
                                    <View className="flex-1 bg-slate-800 rounded-lg p-4">
                                        <Text className="text-gray-400 text-xs">{t('landing.solution.visual_breakeven')}</Text>
                                        <Text className="text-white text-xl font-bold">$8,500</Text>
                                        <Text className="text-emerald-400 text-xs">{t('landing.solution.visual_margin')}</Text>
                                    </View>
                                    <View className="flex-1 bg-slate-800 rounded-lg p-4">
                                        <Text className="text-gray-400 text-xs">{t('landing.solution.visual_runway')}</Text>
                                        <Text className="text-white text-xl font-bold">{t('landing.solution.visual_runway_val')}</Text>
                                        <Text className="text-emerald-400 text-xs">{t('landing.solution.visual_health')}</Text>
                                    </View>
                                </View>
                            </View>
                        </GlassCard>
                    </View>
                </View>
            </View>
        </View>
    );
}

// ============================================
// FEATURES SECTION
// ============================================
function FeaturesSection() {
    const { t } = useTranslation();
    const features = [
        {
            icon: <Ionicons name="trending-up" size={24} color="white" />,
            title: t('landing.features.f1_title'),
            description: t('landing.features.f1_desc'),
            highlight: true,
        },
        {
            icon: <Ionicons name="wallet" size={24} color="white" />,
            title: t('landing.features.f2_title'),
            description: t('landing.features.f2_desc'),
            highlight: false,
        },
        {
            icon: <Ionicons name="pricetag" size={24} color="white" />,
            title: t('landing.features.f3_title'),
            description: t('landing.features.f3_desc'),
            highlight: false,
        },
        {
            icon: <Ionicons name="card" size={24} color="white" />,
            title: t('landing.features.f4_title'),
            description: t('landing.features.f4_desc'),
            highlight: false,
        },
        {
            icon: <Ionicons name="people" size={24} color="white" />,
            title: t('landing.features.f5_title'),
            description: t('landing.features.f5_desc'),
            highlight: false,
        },
        {
            icon: <Ionicons name="megaphone" size={24} color="white" />,
            title: t('landing.features.f6_title'),
            description: t('landing.features.f6_desc'),
            highlight: false,
        },
    ];

    return (
        <View className="px-6 py-20 bg-gradient-to-b from-slate-900/50 to-transparent">
            <View className="max-w-6xl mx-auto">
                <SectionHeading
                    title={t('landing.features.title')}
                    subtitle={t('landing.features.subtitle')}
                    centered
                />

                <View className="flex-row flex-wrap gap-6 mt-12 justify-center">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} />
                    ))}
                </View>
            </View>
        </View>
    );
}

// ============================================
// TESTIMONIALS SECTION
// ============================================
function TestimonialsSection() {
    const { t } = useTranslation();

    return (
        <View className="px-6 py-20">
            <View className="max-w-6xl mx-auto">
                <SectionHeading
                    title={t('landing.testimonials.title')}
                    centered
                />

                <View className="flex-row flex-wrap gap-6 mt-12 justify-center">
                    <TestimonialCard
                        quote={t('landing.testimonials.t1_quote')}
                        author={t('landing.testimonials.t1_author')}
                        role={t('landing.testimonials.t1_role')}
                    />
                    <TestimonialCard
                        quote={t('landing.testimonials.t2_quote')}
                        author={t('landing.testimonials.t2_author')}
                        role={t('landing.testimonials.t2_role')}
                    />
                    <TestimonialCard
                        quote={t('landing.testimonials.t3_quote')}
                        author={t('landing.testimonials.t3_author')}
                        role={t('landing.testimonials.t3_role')}
                    />
                </View>
            </View>
        </View>
    );
}

// ============================================
// CTA SECTION
// ============================================
function CTASection() {
    const router = useRouter();
    const { t } = useTranslation();

    return (
        <View className="px-6 py-24">
            <View className="max-w-4xl mx-auto">
                <GlassCard gradient className="items-center p-12">
                    <Text className="text-3xl md:text-4xl font-bold text-white text-center">
                        {t('landing.cta.title')}
                    </Text>
                    <Text className="text-gray-300 text-lg mt-4 text-center max-w-xl">
                        {t('landing.cta.subtitle')}
                    </Text>

                    <GradientButton
                        size="lg"
                        className="mt-8 rounded-2xl"
                        onPress={() => router.push('/(tabs)')}
                    >
                        {t('landing.cta.button')}
                    </GradientButton>

                    <Text className="text-gray-500 text-sm mt-6">
                        {t('landing.cta.privacy')}
                    </Text>
                </GlassCard>
            </View>
        </View>
    );
}

// ============================================
// FOOTER
// ============================================
function Footer() {
    const { t } = useTranslation();

    return (
        <View className="px-6 py-12 border-t border-white/10">
            <View className="max-w-6xl mx-auto flex-row flex-wrap justify-between items-center gap-6">
                <View>
                    <Text className="text-2xl font-bold text-white">
                        Crux<Text className="text-[#14B8A6]">Analytics</Text>
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                        {t('landing.footer.description')}
                    </Text>
                </View>

                <View className="flex-row gap-8">
                    <Pressable onPress={() => Linking.openURL('https://github.com/Jon-ai-tech/CruxAnalytics')}>
                        <Text className="text-gray-400 text-sm hover:text-white transition-colors">
                            {t('landing.footer.github')}
                        </Text>
                    </Pressable>
                    <Pressable onPress={() => Linking.openURL('https://www.vanguardcrux.com/')}>
                        <Text className="text-gray-400 text-sm hover:text-white transition-colors">
                            {t('landing.footer.contact')}
                        </Text>
                    </Pressable>
                </View>

                <Text className="text-gray-600 text-sm">
                    © 2026 CruxAnalytics. Open Source & Free Forever.
                </Text>
            </View>
        </View>
    );
}

// ============================================
// MAIN LANDING PAGE
// ============================================
export default function LandingPage() {
    return (
        <ScrollView
            className="flex-1 bg-slate-950"
            contentContainerStyle={{ flexGrow: 1 }}
        >
            {/* Navigation */}
            <View className="absolute top-0 left-0 right-0 z-50 flex-row justify-between items-center px-6 py-4">
                <Text className="text-xl font-bold text-white">
                    Crux<Text className="text-[#14B8A6]">Analytics</Text>
                </Text>
                <LanguageSelector />
            </View>

            <HeroSection />
            <ProblemSection />
            <SolutionSection />
            <FeaturesSection />
            <TestimonialsSection />
            <CTASection />
            <Footer />
        </ScrollView>
    );
}
