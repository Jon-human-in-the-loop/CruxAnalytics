import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { IconLabel } from '@/components/ui/icon-label';
import { useColors } from '@/hooks/use-colors';
import { useTranslation } from '@/lib/i18n-context';
import * as Haptics from 'expo-haptics';

interface AIInsightCardProps {
  analysis: string | null;
  loading: boolean;
  error: string | null;
  onRegenerate?: () => void;
}

export function AIInsightCard({
  analysis,
  loading,
  error,
  onRegenerate,
}: AIInsightCardProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const handleRegenerate = () => {
    if (onRegenerate) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onRegenerate();
    }
  };

  return (
    <View className="bg-surface rounded-2xl p-6 border border-border">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
            <IconLabel icon="ai" size={22} />
          </View>
          <View>
            <Text className="text-lg font-bold text-foreground">
              {t('ai.title')}
            </Text>
            <Text className="text-xs text-muted">{t('ai.subtitle')}</Text>
          </View>
        </View>

        {analysis && onRegenerate && !loading && (
          <TouchableOpacity
            onPress={handleRegenerate}
            className="px-3 py-1.5 rounded-full bg-primary/10 active:opacity-70"
          >
            <Text className="text-xs font-semibold text-primary">
              {t('ai.regenerate')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading && (
        <View className="py-8 items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-sm text-muted text-center">
            {t('ai.generating')}
          </Text>
        </View>
      )}

      {error && !loading && (
        <View className="py-4">
          <View className="bg-error/10 rounded-xl p-4 border border-error/30">
            <Text className="text-sm text-error font-medium mb-2">
              {t('ai.error_title')}
            </Text>
            <Text className="text-xs text-error font-medium">{error}</Text>
          </View>
          {onRegenerate && (
            <TouchableOpacity
              onPress={handleRegenerate}
              className="mt-4 bg-primary py-3 rounded-xl active:opacity-80"
            >
              <Text className="text-center text-background font-semibold">
                {t('ai.retry')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {analysis && !loading && !error && (
        <View>
          {/* Analysis Text */}
          <View className="bg-background/50 rounded-xl p-4 mb-4">
            <Text
              className="text-sm text-foreground leading-relaxed"
              style={{ color: colors.foreground }} // Ensure visibility on all devices
            >
              {analysis.replace(/\*\*/g, '')}
            </Text>
          </View>

          {/* Info Footer */}
          <View className="flex-row items-center gap-2">
            <View className="w-1.5 h-1.5 rounded-full bg-success" />
            <Text className="text-xs text-muted">{t('ai.powered_by')}</Text>
          </View>
        </View>
      )}

      {!analysis && !loading && !error && (
        <View className="py-4">
          <Text className="text-sm text-muted text-center mb-4">
            {t('ai.no_analysis')}
          </Text>
          {onRegenerate && (
            <TouchableOpacity
              onPress={handleRegenerate}
              className="bg-primary py-3 rounded-xl active:opacity-80"
            >
              <Text className="text-center text-background font-semibold">
                {t('ai.generate')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
