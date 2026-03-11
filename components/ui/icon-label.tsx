/**
 * @fileoverview Professional icon component that replaces emoji usage
 * Maps semantic icon names to Ionicons for a professional enterprise look.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Mapping of semantic icon names to Ionicons
 */
const ICON_MAP: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    // Analytics & Charts
    'chart': { name: 'bar-chart', color: '#00C0D4' },
    'chart-up': { name: 'trending-up', color: '#A7F3D0' },
    'chart-down': { name: 'trending-down', color: '#FB923C' },
    'analytics': { name: 'analytics', color: '#00C0D4' },
    'stats': { name: 'stats-chart', color: '#00C0D4' },
    'pie': { name: 'pie-chart', color: '#00C0D4' },

    // Business & Finance
    'target': { name: 'flag', color: '#00C0D4' },
    'money': { name: 'cash', color: '#A7F3D0' },
    'wallet': { name: 'wallet', color: '#A7F3D0' },
    'rocket': { name: 'rocket', color: '#00C0D4' },
    'briefcase': { name: 'briefcase', color: '#00C0D4' },
    'calculator': { name: 'calculator', color: '#00C0D4' },

    // Status
    'success': { name: 'checkmark-circle', color: '#A7F3D0' },
    'warning': { name: 'warning', color: '#FB923C' },
    'error': { name: 'close-circle', color: '#EF4444' },
    'info': { name: 'information-circle', color: '#00C0D4' },
    'flash': { name: 'flash', color: '#FDBA74' },

    // People & Teams
    'people': { name: 'people', color: '#00C0D4' },
    'person': { name: 'person', color: '#00C0D4' },

    // Actions & Tools
    'bulb': { name: 'bulb', color: '#FDBA74' },
    'settings': { name: 'settings', color: '#94A3B8' },
    'clipboard': { name: 'clipboard', color: '#94A3B8' },
    'key': { name: 'key', color: '#FDBA74' },
    'lock': { name: 'lock-closed', color: '#94A3B8' },
    'shield': { name: 'shield-checkmark', color: '#A7F3D0' },
    'globe': { name: 'globe', color: '#00C0D4' },
    'phone': { name: 'phone-portrait', color: '#00C0D4' },
    'copy': { name: 'copy', color: '#94A3B8' },
    'sparkle': { name: 'sparkles', color: '#FDBA74' },

    // AI & Tech
    'ai': { name: 'hardware-chip', color: '#00C0D4' },
    'robot': { name: 'hardware-chip', color: '#00C0D4' },

    // Indicators
    'dot-red': { name: 'ellipse', color: '#EF4444' },
    'dot-green': { name: 'ellipse', color: '#A7F3D0' },
    'dot-yellow': { name: 'ellipse', color: '#FDBA74' },
};

/**
 * Maps old emoji strings to semantic icon names
 */
const EMOJI_TO_SEMANTIC: Record<string, string> = {
    '📊': 'chart',
    '📈': 'chart-up',
    '📉': 'chart-down',
    '💰': 'money',
    '🎯': 'target',
    '🚀': 'rocket',
    '💡': 'bulb',
    '🔒': 'lock',
    '⚡': 'flash',
    '🏆': 'success',
    '💼': 'briefcase',
    '🤖': 'ai',
    '📱': 'phone',
    '🌍': 'globe',
    '✨': 'sparkle',
    '🔥': 'flash',
    '💎': 'sparkle',
    '⭐': 'sparkle',
    '🏢': 'briefcase',
    '👥': 'people',
    '🧠': 'ai',
    '📋': 'clipboard',
    '🔑': 'key',
    '💵': 'money',
    '🏗️': 'settings',
    '🛡️': 'shield',
    '⚙️': 'settings',
    '🌐': 'globe',
    '🔴': 'dot-red',
    '🟢': 'dot-green',
    '✅': 'success',
    '⚠️': 'warning',
};

interface IconLabelProps {
    /** Semantic icon name (e.g., 'chart', 'money') or emoji string */
    icon: string;
    /** Size of the icon in pixels */
    size?: number;
    /** Override color */
    color?: string;
    /** Whether to show in a circular background container */
    contained?: boolean;
    /** Background color for contained variant */
    containerColor?: string;
}

/**
 * Professional icon component that replaces emojis with Ionicons.
 * Accepts either a semantic name or an emoji and renders the appropriate icon.
 */
export function IconLabel({
    icon,
    size = 20,
    color,
    contained = false,
    containerColor,
}: IconLabelProps) {
    // Resolve emoji to semantic name if needed
    const semanticName = EMOJI_TO_SEMANTIC[icon] || icon;
    const iconConfig = ICON_MAP[semanticName];

    if (!iconConfig) {
        // Fallback: render as text (shouldn't happen with proper mapping)
        return <Text style={{ fontSize: size }}>{icon}</Text>;
    }

    const finalColor = color || iconConfig.color;
    const iconElement = (
        <Ionicons name={iconConfig.name} size={size} color={finalColor} />
    );

    if (contained) {
        const bgColor = containerColor || `${finalColor}20`;
        return (
            <View
                style={{
                    width: size * 2,
                    height: size * 2,
                    borderRadius: size * 0.6,
                    backgroundColor: bgColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {iconElement}
            </View>
        );
    }

    return iconElement;
}

/**
 * Utility: strips emoji from a string and returns clean text
 */
export function stripEmoji(text: string): string {
    return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{200D}\u{20E3}\u{FE0F}]/gu, '').trim();
}

export { ICON_MAP, EMOJI_TO_SEMANTIC };
