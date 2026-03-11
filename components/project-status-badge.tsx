import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/lib/i18n-context';

export type ProjectStatus = 'viable' | 'review' | 'not_viable';

interface ProjectStatusBadgeProps {
  roi: number;
  npv: number;
}

/**
 * Determines project status based on financial metrics
 * - Viable: ROI > 20% AND NPV > 0 (Strong project)
 * - Review: ROI 0-20% OR NPV > 0 (Marginal project, needs review)
 * - Not Viable: ROI < 0 AND NPV < 0 (Weak project)
 */
export function getProjectStatus(roi: number, npv: number): ProjectStatus {
  if (roi > 20 && npv > 0) {
    return 'viable';
  } else if (roi < 0 && npv < 0) {
    return 'not_viable';
  } else {
    return 'review';
  }
}

export function ProjectStatusBadge({ roi, npv }: ProjectStatusBadgeProps) {
  const { t } = useTranslation();
  const status = getProjectStatus(roi, npv);

  const config = {
    viable: {
      icon: 'ellipse' as const,
      iconColor: '#A7F3D0',
      label: t('status.viable'),
      bgColor: 'bg-success/10',
      textColor: 'text-success',
      borderColor: 'border-success/30',
    },
    review: {
      icon: 'ellipse' as const,
      iconColor: '#FDBA74',
      label: t('status.review'),
      bgColor: 'bg-warning/10',
      textColor: 'text-warning',
      borderColor: 'border-warning/30',
    },
    not_viable: {
      icon: 'ellipse' as const,
      iconColor: '#EF4444',
      label: t('status.not_viable'),
      bgColor: 'bg-error/10',
      textColor: 'text-error',
      borderColor: 'border-error/30',
    },
  };

  const { icon, iconColor, label, bgColor, textColor, borderColor } = config[status];

  return (
    <View className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${bgColor} border ${borderColor}`}>
      <Ionicons name={icon} size={8} color={iconColor} />
      <Text className={`text-xs font-semibold ${textColor}`}>{label}</Text>
    </View>
  );
}
