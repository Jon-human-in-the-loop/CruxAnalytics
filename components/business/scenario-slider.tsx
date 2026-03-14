import React from 'react';
import { View, Text, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';

interface ScenarioSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step: number;
  unit?: string;
  description?: string;
}

export function ScenarioSlider({
  label,
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step,
  unit = '%',
  description,
}: ScenarioSliderProps) {
  const colors = useColors();

  const handleValueChange = (newValue: number) => {
    onValueChange(newValue);

    // Haptic feedback on value change (only on mobile)
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getValueColor = () => {
    if (value > 0) return colors.success;
    if (value < 0) return colors.error;
    return colors.foreground;
  };

  const formatValue = (val: number) => {
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(step < 1 ? 1 : 0)}${unit}`;
  };

  return (
    <View className="bg-surface rounded-xl p-4 border border-border">
      {/* Label and Value */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-base font-semibold text-foreground">{label}</Text>
        <Text
          className="text-lg font-bold"
          style={{ color: getValueColor() }}
        >
          {formatValue(value)}
        </Text>
      </View>

      {/* Description */}
      {description && (
        <Text className="text-xs text-muted mb-3">{description}</Text>
      )}

      {/* Slider */}
      <View className="flex-row items-center gap-2">
        <Text className="text-xs text-muted w-12 text-right">
          {formatValue(minimumValue)}
        </Text>
        <View className="flex-1">
          <Slider
            value={value}
            onValueChange={handleValueChange}
            minimumValue={minimumValue}
            maximumValue={maximumValue}
            step={step}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
        </View>
        <Text className="text-xs text-muted w-12">
          {formatValue(maximumValue)}
        </Text>
      </View>

      {/* Range indicator */}
      <View className="mt-2">
        <View className="h-1 bg-border rounded-full overflow-hidden">
          <View
            className="h-full bg-primary"
            style={{
              width: `${((value - minimumValue) / (maximumValue - minimumValue)) * 100}%`,
            }}
          />
        </View>
      </View>
    </View>
  );
}
