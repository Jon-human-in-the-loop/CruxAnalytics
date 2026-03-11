/**
 * @fileoverview Shared UI components for the landing page and app.
 * Premium, glassmorphism-styled components with animations.
 * Updated: investor-grade components added (TractionStat, RoadmapCard, PricingCard)
 */

import React from 'react';
import { View, Text, Pressable, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Glass-styled card with blur effect and gradient border
 */
export function GlassCard({
    children,
    className = '',
    gradient = false,
}: {
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
}) {
    const isSmall = Dimensions.get('window').width < 600;
    const paddingClass = className.includes('p-') ? '' : (isSmall ? 'p-4' : 'p-6');

    return (
        <View
            style={{ borderRadius: 16 }}
            className={`
        rounded-2xl ${paddingClass}
        bg-white/5 backdrop-blur-xl
        border border-white/10
        shadow-2xl shadow-black/20
        ${className}
      `}
        >
            {gradient && (
                <View className="absolute inset-0 rounded-2xl overflow-hidden opacity-20">
                    <LinearGradient
                        colors={['#00C0D4', '#A7F3D0', '#FDBA74']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ flex: 1 }}
                    />
                </View>
            )}
            {children}
        </View>
    );
}

/**
 * Gradient button with hover effects
 */
export function GradientButton({
    children,
    onPress,
    size = 'md',
    className = '',
}: {
    children: React.ReactNode;
    onPress?: () => void;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    return (
        <Pressable
            onPress={onPress}
            style={{ borderRadius: 16, overflow: 'hidden' }}
            className={`
        rounded-2xl overflow-hidden
        active:scale-95 transition-transform
        ${className}
      `}
        >
            <LinearGradient
                colors={['#00C0D4', '#A7F3D0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className={`${sizeClasses[size]} items-center justify-center`}
            >
                <Text className="text-white font-bold text-center">{children}</Text>
            </LinearGradient>
        </Pressable>
    );
}

/**
 * Secondary outline button
 */
export function OutlineButton({
    children,
    onPress,
    className = '',
}: {
    children: React.ReactNode;
    onPress?: () => void;
    className?: string;
}) {
    return (
        <Pressable
            onPress={onPress}
            className={`
        px-6 py-3 rounded-xl
        border border-white/30
        bg-white/5
        active:bg-white/10 transition-colors
        ${className}
      `}
        >
            <Text className="text-white font-semibold text-center">{children}</Text>
        </Pressable>
    );
}

/**
 * Metric card with icon and value
 */
export function MetricCard({
    icon,
    label,
    value,
    subValue,
    trend,
    color = 'indigo',
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'indigo' | 'emerald' | 'amber' | 'rose';
}) {
    const colorClasses = {
        indigo: 'from-[#00C0D4] to-[#A7F3D0]',
        emerald: 'from-[#A7F3D0] to-teal-500',
        amber: 'from-[#FDBA74] to-orange-500',
        rose: 'from-rose-500 to-pink-500',
    };

    const trendColors = {
        up: 'text-emerald-400',
        down: 'text-rose-400',
        neutral: 'text-gray-400',
    };

    return (
        <GlassCard className="flex-1 min-w-[160px]">
            <View className="flex-row items-center gap-3 mb-3">
                <View
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} items-center justify-center`}
                >
                    {icon}
                </View>
                <Text className="text-gray-400 text-sm flex-1">{label}</Text>
            </View>
            <Text className="text-white text-2xl font-bold">{value}</Text>
            {subValue && (
                <Text className={`text-sm mt-1 ${trend ? trendColors[trend] : 'text-gray-500'}`}>
                    {subValue}
                </Text>
            )}
        </GlassCard>
    );
}

/**
 * Section heading
 */
export function SectionHeading({
    title,
    subtitle,
    centered = false,
}: {
    title: string;
    subtitle?: string;
    centered?: boolean;
}) {
    const isSmall = Dimensions.get('window').width < 600;

    return (
        <View className={`${isSmall ? 'mb-4' : 'mb-8'} w-full ${centered ? 'items-center' : ''}`}>
            <Text
                className={`${isSmall ? 'text-2xl' : 'text-3xl'} font-bold text-white ${centered ? 'text-center' : ''}`}
            >
                {title}
            </Text>
            {subtitle && (
                <Text
                    className={`text-gray-400 ${isSmall ? 'text-sm' : 'text-base'} mt-2 ${centered ? 'text-center' : ''}`}
                >
                    {subtitle}
                </Text>
            )}
        </View>
    );
}

/**
 * Badge component
 */
export function Badge({
    children,
    variant = 'default',
    className = '',
}: {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    className?: string;
}) {
    const variantClasses = {
        default: 'bg-[#00C0D4]/20 text-[#00C0D4] border-[#00C0D4]/30',
        success: 'bg-[#A7F3D0]/20 text-[#A7F3D0] border-[#A7F3D0]/30',
        warning: 'bg-[#FDBA74]/20 text-[#FDBA74] border-[#FDBA74]/30',
        danger: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    };

    return (
        <View
            style={{ borderRadius: 8 }}
            className={`px-3 py-1 rounded-lg border ${variantClasses[variant]} ${className}`}
        >
            <Text className="text-xs font-medium">{children}</Text>
        </View>
    );
}

/**
 * Feature card for landing page
 */
export function FeatureCard({
    icon,
    title,
    description,
    highlight,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    highlight?: boolean;
}) {
    return (
        <GlassCard
            gradient={highlight}
            className={`flex-1 min-w-[280px] ${highlight ? 'border-[#00C0D4]/50' : ''}`}
        >
            <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00C0D4] to-[#A7F3D0] items-center justify-center mb-4">
                {icon}
            </View>
            <Text className="text-white text-xl font-bold mb-2">{title}</Text>
            <Text className="text-gray-400 leading-relaxed">{description}</Text>
        </GlassCard>
    );
}

/**
 * Stats number with animation placeholder
 */
export function StatNumber({
    value,
    label,
    suffix = '',
}: {
    value: number;
    label: string;
    suffix?: string;
}) {
    return (
        <View className="items-center">
            <Text className="text-4xl md:text-5xl font-bold text-white">
                {value.toLocaleString()}{suffix}
            </Text>
            <Text className="text-gray-400 mt-2">{label}</Text>
        </View>
    );
}

/**
 * Testimonial card — with avatar initials
 */
export function TestimonialCard({
    quote,
    author,
    role,
    avatar,
}: {
    quote: string;
    author: string;
    role: string;
    avatar?: string;
}) {
    // Generate initials from author name
    const initials = author
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <GlassCard className="max-w-md">
            {/* Stars */}
            <View className="flex-row gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <Text key={i} style={{ color: '#FDBA74', fontSize: 14 }}>★</Text>
                ))}
            </View>
            <Text className="text-gray-300 text-base leading-relaxed mb-4">"{quote}"</Text>
            <View className="flex-row items-center gap-3">
                <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #00C0D4, #A7F3D0)' }}
                >
                    <LinearGradient
                        colors={['#00C0D4', '#A7F3D0']}
                        style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ color: '#0A0A0A', fontWeight: '700', fontSize: 14 }}>{initials}</Text>
                    </LinearGradient>
                </View>
                <View>
                    <Text className="text-white font-semibold">{author}</Text>
                    <Text className="text-gray-500 text-sm">{role}</Text>
                </View>
            </View>
        </GlassCard>
    );
}

/**
 * Traction stat card — for investor section
 */
export function TractionStat({
    value,
    label,
    color = 'teal',
}: {
    value: string;
    label: string;
    color?: 'teal' | 'mint' | 'coral';
}) {
    const colorMap = {
        teal: '#00C0D4',
        mint: '#A7F3D0',
        coral: '#FDBA74',
    };

    return (
        <GlassCard className="flex-1 min-w-[140px] items-center p-6">
            <Text
                className="text-3xl md:text-4xl font-bold text-center"
                style={{ color: colorMap[color] }}
            >
                {value}
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2">{label}</Text>
        </GlassCard>
    );
}

/**
 * Roadmap step card
 */
export function RoadmapCard({
    quarter,
    title,
    description,
    status,
    isLast = false,
}: {
    quarter: string;
    title: string;
    description: string;
    status: 'completed' | 'in_progress' | 'planned';
    isLast?: boolean;
}) {
    const statusConfig = {
        completed: { color: '#A7F3D0', label: '✓', bg: 'bg-[#A7F3D0]/20 border-[#A7F3D0]/40' },
        in_progress: { color: '#00C0D4', label: '→', bg: 'bg-[#00C0D4]/20 border-[#00C0D4]/40' },
        planned: { color: '#6b7280', label: '○', bg: 'bg-white/5 border-white/10' },
    };

    const config = statusConfig[status];

    return (
        <View className="flex-row gap-4 mb-6">
            {/* Timeline */}
            <View className="items-center" style={{ width: 40 }}>
                <View
                    className={`w-10 h-10 rounded-full border-2 items-center justify-center ${config.bg}`}
                >
                    <Text style={{ color: config.color, fontWeight: '700', fontSize: 16 }}>
                        {config.label}
                    </Text>
                </View>
                {!isLast && (
                    <View
                        className="flex-1 w-0.5 mt-2"
                        style={{ backgroundColor: status === 'completed' ? '#A7F3D0' : '#374151', minHeight: 32 }}
                    />
                )}
            </View>

            {/* Content */}
            <View className="flex-1 pb-4">
                <Text className="text-xs font-mono uppercase tracking-wider mb-1"
                    style={{ color: config.color }}>
                    {quarter}
                </Text>
                <Text className="text-white font-bold text-lg mb-1">{title}</Text>
                <Text className="text-gray-400 text-sm leading-relaxed">{description}</Text>
            </View>
        </View>
    );
}

/**
 * Pricing tier card for business model section
 */
export function PricingCard({
    name,
    price,
    description,
    features,
    badge,
    highlighted = false,
}: {
    name: string;
    price: string;
    description: string;
    features: string[];
    badge?: string;
    highlighted?: boolean;
}) {
    return (
        <GlassCard
            gradient={highlighted}
            className={`flex-1 min-w-[240px] max-w-[320px] relative ${highlighted ? 'border-[#00C0D4]/60' : ''}`}
        >
            {badge && (
                <View
                    className="absolute -top-3 left-1/2 px-3 py-1 rounded-full"
                    style={{
                        transform: [{ translateX: -40 }],
                        backgroundColor: highlighted ? '#00C0D4' : '#374151',
                    }}
                >
                    <Text style={{ color: highlighted ? '#0A0A0A' : '#9ca3af', fontSize: 11, fontWeight: '700' }}>
                        {badge}
                    </Text>
                </View>
            )}

            <Text className="text-gray-400 text-sm mb-1">{name}</Text>
            <Text className="text-white text-3xl font-bold mb-1">{price}</Text>
            <Text className="text-gray-500 text-sm mb-5">{description}</Text>

            <View className="gap-2">
                {features.map((feature, i) => (
                    <View key={i} className="flex-row items-center gap-2">
                        <Text style={{ color: '#A7F3D0', fontSize: 14 }}>✓</Text>
                        <Text className="text-gray-300 text-sm">{feature}</Text>
                    </View>
                ))}
            </View>
        </GlassCard>
    );
}

/**
 * Vanguard metric showcase card
 */
export function VanguardMetricCard({
    acronym,
    title,
    description,
    badge,
    color = 'teal',
}: {
    acronym: string;
    title: string;
    description: string;
    badge: string;
    color?: 'teal' | 'mint' | 'coral';
}) {
    const colorMap = {
        teal: { primary: '#00C0D4', bg: 'bg-[#00C0D4]/10', border: 'border-[#00C0D4]/30' },
        mint: { primary: '#A7F3D0', bg: 'bg-[#A7F3D0]/10', border: 'border-[#A7F3D0]/30' },
        coral: { primary: '#FDBA74', bg: 'bg-[#FDBA74]/10', border: 'border-[#FDBA74]/30' },
    };

    const c = colorMap[color];

    return (
        <GlassCard className={`flex-1 min-w-[260px] border ${c.border}`}>
            {/* Acronym badge */}
            <View className={`w-14 h-14 rounded-2xl ${c.bg} items-center justify-center mb-4`}>
                <Text style={{ color: c.primary, fontSize: 20, fontWeight: '900', fontFamily: 'monospace' }}>
                    {acronym}
                </Text>
            </View>

            <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-white font-bold text-lg">{title}</Text>
            </View>

            <Text className="text-gray-400 text-sm leading-relaxed mb-4">{description}</Text>

            <View
                className="px-2 py-1 rounded-md self-start"
                style={{ backgroundColor: `${c.primary}20`, borderWidth: 1, borderColor: `${c.primary}40` }}
            >
                <Text style={{ color: c.primary, fontSize: 11, fontWeight: '700' }}>{badge}</Text>
            </View>
        </GlassCard>
    );
}
