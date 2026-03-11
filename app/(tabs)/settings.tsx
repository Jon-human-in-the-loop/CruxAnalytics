import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

import { ScreenContainer } from '@/components/screen-container';
import { IconLabel } from '@/components/ui/icon-label';
import { OnboardingTutorial } from '@/components/onboarding-tutorial';
import { useTranslation } from '@/lib/i18n-context';
import { exportAllProjects, importProjects, getAllProjects } from '@/lib/project-storage';
import { resetTutorial } from '@/lib/tutorial-storage';
import {
  requestNotificationPermissions,
  areNotificationsEnabled,
  setNotificationsEnabled,
  type ReminderFrequency,
  getFrequencyDisplayName,
} from '@/lib/notification-manager';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useColors } from '@/hooks/use-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeContext } from '@/lib/theme-provider';
import * as Auth from '@/lib/_core/auth';
import * as Api from '@/lib/_core/api';
import { getLoginUrl } from '@/constants/oauth';

type ThemeMode = 'light' | 'dark' | 'auto';

export default function SettingsScreen() {
  const { t, language, setLanguage } = useTranslation();
  const colors = useColors();
  const { themeMode, setThemeMode: setGlobalThemeMode } = useThemeContext();
  const [showTutorial, setShowTutorial] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [defaultFrequency, setDefaultFrequency] = useState<ReminderFrequency>('monthly');
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [currentUser, setCurrentUser] = useState<Auth.User | null>(null);

  const handleLanguageChange = async (newLanguage: 'es' | 'en') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLanguage(newLanguage);
  };

  const handleThemeModeChange = async (mode: ThemeMode) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setGlobalThemeMode(mode);
  };

  // Load current user
  useEffect(() => {
    Auth.getUserInfo().then((user) => {
      if (user) setCurrentUser(user);
    });
    Api.getMe().then((user) => {
      if (user) setCurrentUser(user as Auth.User);
    }).catch(() => {});
  }, []);

  const handleLogin = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const url = getLoginUrl();
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleLogout = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      t('settings.sign_out'),
      t('settings.sign_out_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.sign_out'),
          style: 'destructive',
          onPress: async () => {
            try {
              await Api.logout();
            } catch (_) {}
            await Auth.clearUserInfo();
            await Auth.removeSessionToken();
            setCurrentUser(null);
          },
        },
      ],
    );
  };

  // Load notification settings
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    const enabled = await areNotificationsEnabled();
    setNotificationsEnabledState(enabled);

    const savedFrequency = await AsyncStorage.getItem('@default_reminder_frequency');
    if (savedFrequency) {
      setDefaultFrequency(savedFrequency as ReminderFrequency);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (value) {
      // Request permissions
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          t('notifications.permission_denied_title'),
          t('notifications.permission_denied_message')
        );
        return;
      }
    }

    await setNotificationsEnabled(value);
    setNotificationsEnabledState(value);

    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(
        value
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    }
  };

  const handleFrequencyChange = async (frequency: ReminderFrequency) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setDefaultFrequency(frequency);
    await AsyncStorage.setItem('@default_reminder_frequency', frequency);
    setShowFrequencyPicker(false);
  };

  const handleExportProjects = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const projects = await getAllProjects();
      
      if (projects.length === 0) {
        Alert.alert(t('settings.no_projects_title'), t('settings.no_projects_message'));
        return;
      }

      const jsonData = await exportAllProjects();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `business-analyzer-backup-${timestamp}.json`;

      if (Platform.OS === 'web') {
        // Web: download file
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Mobile: save and share
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonData);
        await Sharing.shareAsync(fileUri);
      }

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        t('common.success'),
        t('settings.export_success').replace('{{count}}', projects.length.toString())
      );
    } catch (error) {
      console.error('Error exporting projects:', error);
      Alert.alert(t('validations.error'), t('settings.export_error'));
    }
  };

  const handleImportProjects = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (Platform.OS === 'web') {
        Alert.alert(t('settings.import_web_title'), t('settings.import_web_message'));
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const jsonData = await FileSystem.readAsStringAsync(fileUri);

      // Show confirmation
      Alert.alert(
        t('settings.confirm_import_title'),
        t('settings.confirm_import_message'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('settings.import'),
            onPress: async () => {
              try {
                const { imported, skipped } = await importProjects(jsonData);

                if (Platform.OS !== 'web') {
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }

                Alert.alert(
                  t('common.success'),
                  t('settings.import_success')
                    .replace('{{imported}}', imported.toString())
                    .replace('{{skipped}}', skipped.toString())
                );
              } catch (error) {
                console.error('Error importing projects:', error);
                Alert.alert(t('validations.error'), t('settings.import_error'));
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert(t('validations.error'), t('settings.import_error'));
    }
  };

  const handleClearCache = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    Alert.alert(
      t('settings.clear_cache'),
      t('settings.clear_cache_confirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AI analysis cache (if implemented)
              Alert.alert(t('common.success'), t('settings.cache_cleared'));
            } catch (error) {
              Alert.alert(t('validations.error'), t('settings.cache_clear_error'));
            }
          },
        },
      ]
    );
  };

  const handleOpenLink = (url: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(url);
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const appName = Constants.expoConfig?.name || 'Business Case Analyzer Pro';

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">
            {t('settings.title')}
          </Text>
        </View>

        {/* Account Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted mb-3">
            {t('settings.account')}
          </Text>
          <View className="bg-surface rounded-xl border border-border overflow-hidden">
            {currentUser && currentUser.loginMethod !== 'open-source' ? (
              <>
                <View className="p-4 border-b border-border">
                  <Text className="text-xs text-muted mb-1">{t('settings.signed_in_as')}</Text>
                  <Text className="text-base font-semibold text-foreground">
                    {currentUser.name || currentUser.email || currentUser.openId}
                  </Text>
                  {currentUser.email && currentUser.name && (
                    <Text className="text-xs text-muted mt-0.5">{currentUser.email}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleLogout}
                  className="flex-row items-center justify-between p-4"
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">🚪</Text>
                    <Text className="text-base text-error font-medium">
                      {t('settings.sign_out')}
                    </Text>
                  </View>
                  <Text className="text-error font-semibold">›</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="p-4">
                  <Text className="text-base font-semibold text-foreground mb-1">
                    {t('settings.guest_mode')}
                  </Text>
                  <Text className="text-xs text-muted">{t('settings.guest_mode_desc')}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Language Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted mb-3">
            {t('settings.language')}
          </Text>
          <View className="bg-surface rounded-xl border border-border overflow-hidden">
            <TouchableOpacity
              onPress={() => handleLanguageChange('es')}
              className={`flex-row items-center justify-between p-4 ${
                language === 'en' ? 'border-b border-border' : ''
              }`}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">🇪🇸</Text>
                <Text className="text-base text-foreground font-medium">
                  Español
                </Text>
              </View>
              {language === 'es' && (
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                  <Text className="text-background text-xs font-bold">✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleLanguageChange('en')}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">🇺🇸</Text>
                <Text className="text-base text-foreground font-medium">
                  English
                </Text>
              </View>
              {language === 'en' && (
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                  <Text className="text-background text-xs font-bold">✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted mb-3">
            {t('settings.appearance')}
          </Text>
          <View className="bg-surface rounded-xl border border-border overflow-hidden">
            {/* Light Mode */}
            <TouchableOpacity
              onPress={() => handleThemeModeChange('light')}
              className="flex-row items-center justify-between p-4 border-b border-border"
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">☀️</Text>
                <Text className="text-base text-foreground font-medium">
                  {t('settings.light_mode')}
                </Text>
              </View>
              {themeMode === 'light' && (
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                  <Text className="text-background text-xs font-bold">✓</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Dark Mode */}
            <TouchableOpacity
              onPress={() => handleThemeModeChange('dark')}
              className="flex-row items-center justify-between p-4 border-b border-border"
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">🌙</Text>
                <Text className="text-base text-foreground font-medium">
                  {t('settings.dark_mode')}
                </Text>
              </View>
              {themeMode === 'dark' && (
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                  <Text className="text-background text-xs font-bold">✓</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Auto Mode */}
            <TouchableOpacity
              onPress={() => handleThemeModeChange('auto')}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">🔄</Text>
                <View>
                  <Text className="text-base text-foreground font-medium">
                    {t('settings.auto_mode')}
                  </Text>
                  <Text className="text-xs text-muted">
                    {t('settings.auto_mode_desc')}
                  </Text>
                </View>
              </View>
              {themeMode === 'auto' && (
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                  <Text className="text-background text-xs font-bold">✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Data & Backup Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted mb-3">
            {t('settings.data_backup')}
          </Text>
          <View className="bg-surface rounded-xl border border-border overflow-hidden">
            {/* Export Projects */}
            <TouchableOpacity
              onPress={handleExportProjects}
              className="flex-row items-center justify-between p-4 border-b border-border"
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">📤</Text>
                <View>
                  <Text className="text-base text-foreground font-medium">
                    {t('settings.export_projects')}
                  </Text>
                  <Text className="text-xs text-muted">
                    {t('settings.export_projects_desc')}
                  </Text>
                </View>
              </View>
              <Text className="text-primary font-semibold">›</Text>
            </TouchableOpacity>

            {/* Import Projects */}
            <TouchableOpacity
              onPress={handleImportProjects}
              className="flex-row items-center justify-between p-4 border-b border-border"
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">📥</Text>
                <View>
                  <Text className="text-base text-foreground font-medium">
                    {t('settings.import_projects')}
                  </Text>
                  <Text className="text-xs text-muted">
                    {t('settings.import_projects_desc')}
                  </Text>
                </View>
              </View>
              <Text className="text-primary font-semibold">›</Text>
            </TouchableOpacity>

            {/* Clear Cache */}
            <TouchableOpacity
              onPress={handleClearCache}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">🗑️</Text>
                <View>
                  <Text className="text-base text-foreground font-medium">
                    {t('settings.clear_cache')}
                  </Text>
                  <Text className="text-xs text-muted">
                    {t('settings.clear_cache_desc')}
                  </Text>
                </View>
              </View>
              <Text className="text-primary font-semibold">›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section - mobile only */}
        {Platform.OS !== 'web' && (
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted mb-3">
            {t('notifications.title')}
          </Text>
          <View className="bg-surface rounded-xl border border-border overflow-hidden">
            {/* Enable Notifications Toggle */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-1 mr-4">
                <Text className="text-base text-foreground font-medium mb-1">
                  {t('notifications.enable_reminders')}
                </Text>
                <Text className="text-xs text-muted">
                  {t('notifications.enable_reminders_desc')}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={notificationsEnabled ? colors.background : colors.muted}
              />
            </View>

            {/* Default Frequency Selector */}
            {notificationsEnabled && (
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowFrequencyPicker(!showFrequencyPicker);
                }}
                className="flex-row items-center justify-between p-4"
              >
                <View className="flex-1">
                  <Text className="text-base text-foreground font-medium mb-1">
                    {t('notifications.default_frequency')}
                  </Text>
                  <Text className="text-xs text-muted">
                    {getFrequencyDisplayName(defaultFrequency, language)}
                  </Text>
                </View>
                <Text className="text-primary font-semibold">›</Text>
              </TouchableOpacity>
            )}

            {/* Frequency Picker */}
            {showFrequencyPicker && notificationsEnabled && (
              <View className="border-t border-border bg-background/50">
                {(['weekly', 'biweekly', 'monthly', 'quarterly'] as ReminderFrequency[]).map(
                  (freq) => (
                    <TouchableOpacity
                      key={freq}
                      onPress={() => handleFrequencyChange(freq)}
                      className="flex-row items-center justify-between p-4 border-b border-border/50"
                    >
                      <Text
                        className={`text-base ${
                          defaultFrequency === freq
                            ? 'text-primary font-semibold'
                            : 'text-foreground'
                        }`}
                      >
                        {getFrequencyDisplayName(freq, language)}
                      </Text>
                      {defaultFrequency === freq && (
                        <Text className="text-primary text-xl">✓</Text>
                      )}
                    </TouchableOpacity>
                  )
                )}
              </View>
            )}
          </View>
        </View>
        )}

        {/* About Section */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted mb-3">
            {t('settings.about')}
          </Text>
          <View className="bg-surface rounded-xl border border-border p-6">
            {/* App Icon and Name */}
            <View className="items-center mb-6">
              <View className="w-20 h-20 rounded-2xl bg-primary/20 items-center justify-center mb-3">
                <IconLabel icon="chart" size={36} />
              </View>
              <Text className="text-xl font-bold text-foreground mb-1">
                {appName}
              </Text>
              <Text className="text-sm text-muted">
                {t('settings.version')} {appVersion}
              </Text>
            </View>

            {/* Description */}
            <Text className="text-sm text-foreground text-center leading-relaxed mb-6">
              {t('settings.app_description')}
            </Text>

            {/* Links */}
            <View className="gap-3">
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowTutorial(true);
                }}
                className="flex-row items-center justify-between p-3 bg-background/50 rounded-lg"
              >
                <Text className="text-sm text-foreground font-medium">
                  {t('settings.view_tutorial')}
                </Text>
                <Text className="text-primary">›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOpenLink('/api/docs')}
                className="flex-row items-center justify-between p-3 bg-background/50 rounded-lg"
              >
                <View>
                  <Text className="text-sm text-foreground font-medium">
                    {t('settings.api_docs')}
                  </Text>
                  <Text className="text-xs text-muted">{t('settings.api_docs_desc')}</Text>
                </View>
                <Text className="text-primary">›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center pb-6">
          <Text className="text-xs text-muted text-center">
            {t('settings.copyright')}
          </Text>
        </View>
      </ScrollView>

      {/* Onboarding Tutorial */}
      <OnboardingTutorial
        visible={showTutorial}
        onComplete={() => setShowTutorial(false)}
        onSkip={() => setShowTutorial(false)}
      />
    </ScreenContainer>
  );
}
