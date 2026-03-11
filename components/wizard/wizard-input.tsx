import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '@/lib/utils';

export interface QuickSuggestion {
  label: string;
  value: string;
}

interface WizardInputProps {
  question: string;
  helper?: string;
  helpText?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  suggestions?: QuickSuggestion[];
  error?: string;
}

export function WizardInput({
  question,
  helper,
  helpText,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  suggestions = [],
  error,
}: WizardInputProps) {
  const handleSuggestionPress = (suggestionValue: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onChangeText(suggestionValue);
  };

  return (
    <View className="gap-4">
      {/* Question */}
      <View>
        <Text className="text-2xl font-bold text-foreground mb-2 font-heading">
          {question}
        </Text>
        {helper && (
          <Text className="text-sm text-muted font-body">
            {helper}
          </Text>
        )}
      </View>

      {/* Input */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        className={cn(
          'bg-surface border rounded-xl px-4 py-4 text-foreground text-lg font-body',
          error ? 'border-error' : 'border-border'
        )}
      />

      {/* Error */}
      {error && (
        <Text className="text-sm text-error font-body-medium">
          {error}
        </Text>
      )}

      {/* Quick Suggestions */}
      {suggestions.length > 0 && (
        <View>
          <Text className="text-xs text-muted mb-2 font-body">
            {/* TODO: Add translation key - temporary placeholder */}
            Common values:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.value}
                onPress={() => handleSuggestionPress(suggestion.value)}
                className="bg-surface border border-border rounded-lg px-3 py-2"
              >
                <Text className="text-sm text-foreground font-body-medium">
                  {suggestion.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Help Text */}
      {helpText && (
        <View className="bg-accent-mint/10 rounded-lg p-3">
          <Text className="text-xs text-foreground leading-relaxed font-body">
            {helpText}
          </Text>
        </View>
      )}
    </View>
  );
}
