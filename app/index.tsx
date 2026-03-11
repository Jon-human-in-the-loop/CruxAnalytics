/**
 * @fileoverview Landing Page for CruxAnalytics (Root Entry Point)
 * Investor-grade landing page: traction, Vanguard metrics, business model, roadmap.
 * Updated: feature/investor-landing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
    TractionStat,
    RoadmapCard,
    PricingCard,
    VanguardMetricCard,
} from '@/components/landing/shared-components';

// ============================================
// NAV BAR (sticky)
// ============================================
function NavBar() {
    const router = useRouter();
    const { t } = useTranslation();
    const [scrolled, setScrolled] = useState(false);

    return (
        <View
            className="absolute top-0 left-0 right-0 z-50"
            style={{
                backgroundColor: scrolled ? 'rgba(10,10,10,0.92)' : 'transparent',
                borderBottomWidth: scrolled ? 1 : 0,
                borderBottomColor: 'rgba(255,255,255,0.08)',
            }}
        >
            <View className="flex-row justify-between items-center px-6 py-4 max-w-6xl mx-auto w-full">
                {/* Logo */}
                <Text className="text-xl font-bold text-white">
                    Crux<Text style={{ color: '#00C0D4' }}>Analytics</Text>
                </Text>

                {/* Nav links — hidden on mobile */}
                <View className="hidden md:flex flex-row gap-8 items-center">
                    <Text className="text-gray-400 text-sm hover:text-white transition-colors cursor-pointer">
                        {t('landing.nav.features')}
                    </Text>
                    <Text className="text-gray-400 text-sm hover:text-white transition-colors cursor-pointer">
                        {t('landing.nav.traction')}
                    </Text>
                    <Text className="text-gray-400 text-sm hover:text-white transition-colors cursor-pointer">
                        {t('landing.nav.roadmap')}
                    </Text>
                </View>

                {/* Right side */}
                <View className="flex-row items-center gap-3">
                    <LanguageSelector />
                    <GradientButton
                        size="sm"
                        className="rounded-xl hidden md:flex"
                        onPress={() => router.push('/(tabs)')}
                    >
                        {t('landing.nav.enter_app')}
                    </GradientButton>
                </View>
            </View>
        </View>
    );
}

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
            <View className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
                style={{ backgroundColor: '#00C0D4', filter: 'blur(120px)' } as any} />
            <View className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
                style={{ backgroundColor: '#A7F3D0', filter: 'blur(120px)' } as any} />

            {/* Content */}
            <View className="max-w-4xl items-center z-10">
                <Badge variant="success">
                    <View className="flex-row items-center gap-1.5">
                        <Ionicons name="sparkles" size={14} color={colors.success} />
                        <Text style={{ color: '#A7F3D0', fontSize: 12, fontWeight: '500' }}>
                            {t('landing.hero.badge')}
                        </Text>
                    </View>
                </Badge>

                {/* Title */}
                <Text className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center mt-6 leading-tight">
                    {t('landing.hero.title').split(
                        t('common.language_code') === 'es' ? 'está en riesgo' : 'is at risk'
                    )[0]}
                    <Text style={{ color: '#00C0D4' }}>
                        {t('common.language_code') === 'es' ? 'está en riesgo' : 'is at risk'}
                    </Text>
                </Text>

                <Text className="text-xl text-gray-400 text-center mt-6 max-w-2xl leading-relaxed">
                    {t('landing.hero.subtitle')}
                </Text>

                <View className="flex-row flex-wrap gap-4 mt-10 justify-center">
                    <GradientButton
                        size="lg"
                        className="rounded-2xl"
                        onPress={() => router.push('/(tabs)')}
                    >
                        {t('landing.hero.cta')}
                    </GradientButton>
                    <OutlineButton
                        className="rounded-2xl"
                        onPress={() => Linking.openURL('https://github.com/Jon-human-in-the-loop/CruxAnalytics')}
                    >
                        GitHub →
                    </OutlineButton>
                </View>

                {/* Trust indicators */}
                <View className="flex-row flex-wrap gap-x-6 gap-y-3 mt-12 opacity-60 justify-center">
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="lock-closed" size={16} color="#9ca3af" />
                        <Text className="text-gray-400 text-sm">{t('landing.hero.privacy')}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="flash" size={16} color="#00C0D4" />
                        <Text className="text-gray-400 text-sm">{t('landing.hero.results')}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <Ionicons name="bulb" size={16} color="#FDBA74" />
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
                        <View className="w-16 h-16 rounded-full items-center justify-center mb-4"
                            style={{ backgroundColor: 'rgba(253,186,116,0.1)' }}>
                            <Ionicons name="alert-circle" size={32} color="#FDBA74" />
                        </View>
                        <Text className="text-white font-bold text-lg mb-2">
                            {t('landing.problem.pain1_title')}
                        </Text>
                        <Text className="text-gray-400">
                            {t('landing.problem.pain1_desc')}
                        </Text>
                    </GlassCard>

                    <GlassCard className="max-w-xs">
                        <View className="w-16 h-16 rounded-full items-center justify-center mb-4"
                            style={{ backgroundColor: 'rgba(253,186,116,0.1)' }}>
                            <Ionicons name="cash" size={32} color="#FDBA74" />
                        </View>
                        <Text className="text-white font-bold text-lg mb-2">
                            {t('landing.problem.pain2_title')}
                        </Text>
                        <Text className="text-gray-400">
                            {t('landing.problem.pain2_desc')}
                        </Text>
                    </GlassCard>

                    <GlassCard className="max-w-xs">
                        <View className="w-16 h-16 rounded-full items-center justify-center mb-4"
                            style={{ backgroundColor: 'rgba(0,192,212,0.1)' }}>
                            <Ionicons name="help-circle" size={32} color="#00C0D4" />
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
                            {t('landing.solution.title').split(
                                t('common.language_code') === 'es' ? 'Gratis' : 'Free'
                            )[0]}
                            <Text style={{ color: '#00C0D4' }}>
                                {t('common.language_code') === 'es' ? 'Gratis y en 2 minutos.' : 'Free and in 2 minutes.'}
                            </Text>
                        </Text>
                        <Text className="text-gray-400 text-lg mt-6 leading-relaxed">
                            {t('landing.solution.subtitle')}
                        </Text>

                        <View className="mt-6 gap-4">
                            {[
                                t('landing.solution.feature1'),
                                t('landing.solution.feature2'),
                                t('landing.solution.feature3'),
                                t('landing.solution.feature4'),
                            ].map((feat, i) => (
                                <View key={i} className="flex-row items-center gap-3">
                                    <View className="w-8 h-8 rounded-full items-center justify-center"
                                        style={{ backgroundColor: 'rgba(167,243,208,0.2)' }}>
                                        <Ionicons name="checkmark" size={18} color="#A7F3D0" />
                                    </View>
                                    <Text className="text-white">{feat}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Visual mock */}
                    <View className="flex-1 min-w-[300px]">
                        <GlassCard gradient className="p-8">
                            <View className="bg-slate-900 rounded-xl p-6">
                                <View className="flex-row items-center gap-2 mb-2">
                                    <Ionicons name="checkmark-circle" size={20} color="#A7F3D0" />
                                    <Text className="text-sm font-bold"
                                        style={{ color: '#A7F3D0' }}>
                                        {t('landing.solution.visual_status')}
                                    </Text>
                                </View>
                                <Text className="text-white text-2xl font-bold">
                                    {t('landing.solution.visual_health')}
                                </Text>

                                <View className="flex-row gap-4 mt-6">
                                    <View className="flex-1 rounded-lg p-4"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                        <Text className="text-gray-400 text-xs">
                                            {t('landing.solution.visual_breakeven')}
                                        </Text>
                                        <Text className="text-white text-xl font-bold">$8,500</Text>
                                        <Text style={{ color: '#A7F3D0', fontSize: 12 }}>
                                            {t('landing.solution.visual_margin')}
                                        </Text>
                                    </View>
                                    <View className="flex-1 rounded-lg p-4"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                        <Text className="text-gray-400 text-xs">
                                            {t('landing.solution.visual_runway')}
                                        </Text>
                                        <Text className="text-white text-xl font-bold">
                                            {t('landing.solution.visual_runway_val')}
                                        </Text>
                                        <Text style={{ color: '#A7F3D0', fontSize: 12 }}>
                                            {t('landing.solution.visual_health')}
                                        </Text>
                                    </View>
                                </View>

                                {/* Vanguard metrics mini preview */}
                                <View className="mt-4 pt-4"
                                    style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
                                    <Text className="text-gray-500 text-xs mb-3 uppercase tracking-wider">
                                        Vanguard Crux Metrics
                                    </Text>
                                    <View className="flex-row gap-3">
                                        {[
                                            { label: 'OFI', value: '12%', color: '#00C0D4' },
                                            { label: 'TFDI', value: '8%', color: '#A7F3D0' },
                                            { label: 'SER', value: '2.4x', color: '#FDBA74' },
                                        ].map(m => (
                                            <View key={m.label} className="flex-1 items-center">
                                                <Text style={{ color: m.color, fontSize: 16, fontWeight: '700' }}>
                                                    {m.value}
                                                </Text>
                                                <Text className="text-gray-500 text-xs">{m.label}</Text>
                                            </View>
                                        ))}
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
// TRACTION SECTION (NEW — investor-grade)
// ============================================
function TractionSection() {
    const { t } = useTranslation();

    return (
        <View className="px-6 py-20">
            <View className="max-w-6xl mx-auto">
                <View className="items-center mb-4">
                    <Badge variant="success">{t('landing.traction.badge')}</Badge>
                </View>
                <SectionHeading
                    title={t('landing.traction.title')}
                    subtitle={t('landing.traction.subtitle')}
                    centered
                />

                {/* Stats grid */}
                <View className="flex-row flex-wrap gap-4 mt-12 justify-center">
                    <TractionStat
                        value={t('landing.traction.stat1_value')}
                        label={t('landing.traction.stat1_label')}
                        color="teal"
                    />
                    <TractionStat
                        value={t('landing.traction.stat2_value')}
                        label={t('landing.traction.stat2_label')}
                        color="mint"
                    />
                    <TractionStat
                        value={t('landing.traction.stat3_value')}
                        label={t('landing.traction.stat3_label')}
                        color="coral"
                    />
                    <TractionStat
                        value={t('landing.traction.stat4_value')}
                        label={t('landing.traction.stat4_label')}
                        color="teal"
                    />
                </View>

                {/* Founder quote */}
                <View className="mt-12 max-w-2xl mx-auto">
                    <GlassCard gradient className="items-center p-8">
                        <Text className="text-2xl text-center font-bold text-white mb-4">
                            "{t('landing.traction.quote')}"
                        </Text>
                        <Text className="text-gray-400 text-sm">
                            — {t('landing.traction.quote_author')}
                        </Text>
                    </GlassCard>
                </View>
            </View>
        </View>
    );
}

// ============================================
// VANGUARD METRICS SECTION (NEW — differentiator)
// ============================================
function VanguardMetricsSection() {
    const { t } = useTranslation();

    return (
        <View className="px-6 py-20"
            style={{ backgroundColor: 'rgba(0,192,212,0.03)' }}>
            <View className="max-w-6xl mx-auto">
                <View className="items-center mb-4">
                    <Badge>{t('landing.vanguard_section.badge')}</Badge>
                </View>
                <SectionHeading
                    title={t('landing.vanguard_section.title')}
                    subtitle={t('landing.vanguard_section.subtitle')}
                    centered
                />

                <View className="flex-row flex-wrap gap-6 mt-12 justify-center">
                    <VanguardMetricCard
                        acronym="OFI"
                        title={t('landing.vanguard_section.m1_title')}
                        description={t('landing.vanguard_section.m1_desc')}
                        badge={t('landing.vanguard_section.m1_badge')}
                        color="teal"
                    />
                    <VanguardMetricCard
                        acronym="TFDI"
                        title={t('landing.vanguard_section.m2_title')}
                        description={t('landing.vanguard_section.m2_desc')}
                        badge={t('landing.vanguard_section.m2_badge')}
                        color="mint"
                    />
                    <VanguardMetricCard
                        acronym="SER"
                        title={t('landing.vanguard_section.m3_title')}
                        description={t('landing.vanguard_section.m3_desc')}
                        badge={t('landing.vanguard_section.m3_badge')}
                        color="coral"
                    />
                </View>
            </View>
        </View>
    );
}

// ============================================
// BUSINESS MODEL SECTION (NEW — investor-grade)
// ============================================
function BusinessModelSection() {
    const { t } = useTranslation();

    const tiers = [
        {
            name: t('landing.business_model.tier1_name'),
            price: t('landing.business_model.tier1_price'),
            description: t('landing.business_model.tier1_desc'),
            features: [
                t('landing.business_model.tier1_f1'),
                t('landing.business_model.tier1_f2'),
                t('landing.business_model.tier1_f3'),
                t('landing.business_model.tier1_f4'),
            ],
            highlighted: false,
        },
        {
            name: t('landing.business_model.tier2_name'),
            price: t('landing.business_model.tier2_price'),
            description: t('landing.business_model.tier2_desc'),
            badge: t('landing.business_model.tier2_badge'),
            features: [
                t('landing.business_model.tier2_f1'),
                t('landing.business_model.tier2_f2'),
                t('landing.business_model.tier2_f3'),
                t('landing.business_model.tier2_f4'),
            ],
            highlighted: true,
        },
        {
            name: t('landing.business_model.tier3_name'),
            price: t('landing.business_model.tier3_price'),
            description: t('landing.business_model.tier3_desc'),
            badge: t('landing.business_model.tier3_badge'),
            features: [
                t('landing.business_model.tier3_f1'),
                t('landing.business_model.tier3_f2'),
                t('landing.business_model.tier3_f3'),
                t('landing.business_model.tier3_f4'),
            ],
            highlighted: false,
        },
    ];

    return (
        <View className="px-6 py-20 bg-gradient-to-b from-transparent to-slate-900/50">
            <View className="max-w-6xl mx-auto">
                <View className="items-center mb-4">
                    <Badge variant="warning">{t('landing.business_model.badge')}</Badge>
                </View>
                <SectionHeading
                    title={t('landing.business_model.title')}
                    subtitle={t('landing.business_model.subtitle')}
                    centered
                />

                <View className="flex-row flex-wrap gap-6 mt-16 justify-center">
                    {tiers.map((tier, i) => (
                        <PricingCard key={i} {...tier} />
                    ))}
                </View>
            </View>
        </View>
    );
}

// ============================================
// ROADMAP SECTION (NEW — investor-grade)
// ============================================
function RoadmapSection() {
    const { t } = useTranslation();

    const steps = [
        {
            quarter: t('landing.roadmap.q1_label'),
            title: t('landing.roadmap.q1_title'),
            description: t('landing.roadmap.q1_desc'),
            status: 'completed' as const,
        },
        {
            quarter: t('landing.roadmap.q2_label'),
            title: t('landing.roadmap.q2_title'),
            description: t('landing.roadmap.q2_desc'),
            status: 'in_progress' as const,
        },
        {
            quarter: t('landing.roadmap.q3_label'),
            title: t('landing.roadmap.q3_title'),
            description: t('landing.roadmap.q3_desc'),
            status: 'planned' as const,
        },
        {
            quarter: t('landing.roadmap.q4_label'),
            title: t('landing.roadmap.q4_title'),
            description: t('landing.roadmap.q4_desc'),
            status: 'planned' as const,
            isLast: true,
        },
    ];

    return (
        <View className="px-6 py-20">
            <View className="max-w-6xl mx-auto">
                <View className="items-center mb-4">
                    <Badge>{t('landing.roadmap.badge')}</Badge>
                </View>
                <SectionHeading
                    title={t('landing.roadmap.title')}
                    subtitle={t('landing.roadmap.subtitle')}
                    centered
                />

                <View className="max-w-2xl mx-auto mt-12">
                    {steps.map((step, i) => (
                        <RoadmapCard key={i} {...step} />
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
        <View className="px-6 py-20 bg-gradient-to-b from-slate-900/50 to-transparent">
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
        <View className="px-6 py-12"
            style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
            <View className="max-w-6xl mx-auto flex-row flex-wrap justify-between items-center gap-6">
                <View>
                    <Text className="text-2xl font-bold text-white">
                        Crux<Text style={{ color: '#00C0D4' }}>Analytics</Text>
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                        {t('landing.footer.description')}
                    </Text>
                </View>

                <View className="flex-row gap-8">
                    <Pressable
                        onPress={() => Linking.openURL('https://github.com/Jon-human-in-the-loop/CruxAnalytics')}
                    >
                        <Text className="text-gray-400 text-sm hover:text-white transition-colors">
                            {t('landing.footer.github')}
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => Linking.openURL('https://www.vanguardcrux.com/')}
                    >
                        <Text className="text-gray-400 text-sm hover:text-white transition-colors">
                            {t('landing.footer.contact')}
                        </Text>
                    </Pressable>
                </View>

                <Text className="text-gray-600 text-sm">
                    {t('landing.footer.copyright')}
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
            <NavBar />

            <HeroSection />
            <ProblemSection />
            <SolutionSection />
            <FeaturesSection />
            <TractionSection />
            <VanguardMetricsSection />
            <BusinessModelSection />
            <RoadmapSection />
            <TestimonialsSection />
            <CTASection />
            <Footer />
        </ScrollView>
    );
}
