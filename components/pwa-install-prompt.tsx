import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { IconLabel } from '@/components/ui/icon-label';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useTranslation } from '@/lib/i18n-context';
import { useColors } from '@/hooks/use-colors';

const DISMISSED_KEY = 'pwa_install_dismissed';

export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const colors = useColors();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkDismissed();
  }, []);

  useEffect(() => {
    // Mostrar el banner si es instalable, no está instalado y no fue descartado
    setIsVisible(isInstallable && !isInstalled && !isDismissed);
  }, [isInstallable, isInstalled, isDismissed]);

  const checkDismissed = async () => {
    try {
      const dismissed = await AsyncStorage.getItem(DISMISSED_KEY);
      setIsDismissed(dismissed === 'true');
    } catch (error) {
      console.error('Error checking dismissed state:', error);
    }
  };

  const handleInstall = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const accepted = await promptInstall();

    if (accepted) {
      setIsVisible(false);
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const handleDismiss = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await AsyncStorage.setItem(DISMISSED_KEY, 'true');
      setIsDismissed(true);
      setIsVisible(false);
    } catch (error) {
      console.error('Error saving dismissed state:', error);
    }
  };

  if (!isVisible || Platform.OS !== 'web') {
    return null;
  }

  return (
    <View className="bg-primary/10 border-t border-primary/20 p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <IconLabel icon="phone" size={22} />
            <Text className="text-base font-bold text-foreground">
              {t('pwa.install_title')}
            </Text>
          </View>
          <Text className="text-sm text-muted">
            {t('pwa.install_description')}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={handleDismiss}
            className="px-4 py-2 rounded-lg bg-surface active:opacity-70"
          >
            <Text className="text-sm font-semibold text-muted">
              {t('common.dismiss')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleInstall}
            className="px-4 py-2 rounded-lg bg-primary active:opacity-80"
          >
            <Text className="text-sm font-semibold text-background">
              {t('pwa.install')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
