/**
 * @fileoverview Shared UI components for the landing page and app.
 * Premium, glassmorphism-styled components with animations.
 */

import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
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
    return (
        <View
            style={{ borderRadius: 16 }}
            className={`
        rounded-2xl p-6
        bg-white/5 backdrop-blur-xl
        border border-white/10
        shadow-2xl shadow-black/20
        ${className}
      `}
        >
            {gradient && (
                <View className="absolute inset-0 rounded-2xl overflow-hidden opacity-20">
                    <LinearGradient
                        colors={['#14B8A6', '#86EFAC', '#FB923C']}
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
                colors={['#14B8A6', '#86EFAC']}
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
        indigo: 'from-[#14B8A6] to-[#86EFAC]',
        emerald: 'from-[#86EFAC] to-teal-500',
        amber: 'from-[#FB923C] to-orange-500',
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
    return (
        <View className={`mb-8 w-full ${centered ? 'items-center' : ''}`}>
            <Text
                className={`text-3xl font-bold text-white ${centered ? 'text-center' : ''}`}
            >
                {title}
            </Text>
            {subtitle && (
                <Text
                    className={`text-gray-400 text-base mt-2 ${centered ? 'text-center' : ''}`}
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
        default: 'bg-[#14B8A6]/20 text-[#14B8A6] border-[#14B8A6]/30',
        success: 'bg-[#86EFAC]/20 text-[#86EFAC] border-[#86EFAC]/30',
        warning: 'bg-[#FB923C]/20 text-[#FB923C] border-[#FB923C]/30',
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
            className={`flex-1 min-w-[280px] ${highlight ? 'border-indigo-500/50' : ''}`}
        >
            <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#14B8A6] to-[#86EFAC] items-center justify-center mb-4">
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
 * Testimonial card
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
    return (
        <GlassCard className="max-w-md">
            <Text className="text-gray-300 text-lg italic mb-4">"{quote}"</Text>
            <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#86EFAC]" />
                <View>
                    <Text className="text-white font-semibold">{author}</Text>
                    <Text className="text-gray-500 text-sm">{role}</Text>
                </View>
            </View>
        </GlassCard>
    );
}
