import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onValueChange: (value: number) => void;
  className?: string;
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '%',
  onValueChange,
  className,
}: SliderControlProps) {
  const colors = useColors();

  const formatValue = (val: number) => {
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(0)}${suffix}`;
  };

  return (
    <View className={cn('mb-4', className)}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-foreground font-medium">{label}</Text>
        <Text className="text-sm font-semibold text-primary">
          {formatValue(value)}
        </Text>
      </View>

      <Slider
        value={value}
        onValueChange={onValueChange}
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />

      <View className="flex-row items-center justify-between mt-1">
        <Text className="text-xs text-muted">{formatValue(min)}</Text>
        <Text className="text-xs text-muted">{formatValue(max)}</Text>
      </View>
    </View>
  );
}
