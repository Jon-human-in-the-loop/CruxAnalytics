import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { MetricCard } from '@/components/business/metric-card';
import { useTranslation } from '@/lib/i18n-context';
import {
  getProject,
  getAllScenarios,
  deleteScenario,
  restoreScenarioAsBase,
} from '@/lib/project-storage';
import type { ProjectData, ScenarioSnapshot } from '@/types/project';

export default function SnapshotsHistoryScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const loadedProject = await getProject(id);
      if (loadedProject) {
        setProject(loadedProject);
        const loadedScenarios = await getAllScenarios(id);
        setScenarios(loadedScenarios);
      } else {
        Alert.alert(t('validations.error'), t('validations.project_not_found'));
        router.back();
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
      Alert.alert(t('validations.error'), t('errors.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      t('snapshots.delete_title'),
      t('snapshots.delete_description'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteScenario(id, scenarioId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(t('common.success'), t('snapshots.deleted_successfully'));
              loadData(); // Reload scenarios
            } catch (error) {
              console.error('Error deleting scenario:', error);
              Alert.alert(t('validations.error'), t('errors.save_failed'));
            }
          },
        },
      ]
    );
  };

  const handleToggleCompareMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompareMode(!compareMode);
    setSelectedSnapshots([]);
  };

  const handleSelectSnapshot = (scenarioId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (selectedSnapshots.includes(scenarioId)) {
      setSelectedSnapshots(selectedSnapshots.filter(id => id !== scenarioId));
    } else if (selectedSnapshots.length < 2) {
      setSelectedSnapshots([...selectedSnapshots, scenarioId]);
    } else {
      // Replace the first selected with the new one
      setSelectedSnapshots([selectedSnapshots[1], scenarioId]);
    }
  };

  const handleCompareSnapshots = () => {
    if (selectedSnapshots.length === 2) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/compare-snapshots/${id}?a=${selectedSnapshots[0]}&b=${selectedSnapshots[1]}` as any);
    }
  };

  const handleRestoreScenario = async (scenarioId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      t('snapshots.restore_title'),
      t('snapshots.restore_description'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('snapshots.restore'),
          onPress: async () => {
            try {
              await restoreScenarioAsBase(id, scenarioId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(t('common.success'), t('snapshots.restored_successfully'));
              loadData(); // Reload scenarios
            } catch (error) {
              console.error('Error restoring scenario:', error);
              Alert.alert(t('validations.error'), t('errors.save_failed'));
            }
          },
        },
      ]
    );
  };

  // Show spinner immediately while loading to avoid blank flash
  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-muted">{t('common.loading')}</Text>
      </ScreenContainer>
    );
  }

  if (!project) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <Text className="text-foreground text-center">{t('validations.project_not_found')}</Text>
      </ScreenContainer>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(t('common.language_code'), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAdjustment = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-6">
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 active:opacity-70"
          >
            <Text className="text-primary font-semibold">← {t('common.go_back')}</Text>
          </TouchableOpacity>

          <Text className="text-3xl font-bold text-foreground mb-2">
            {t('snapshots.title')}
          </Text>
          <Text className="text-base text-muted">
            {project?.name}
          </Text>
        </View>

        {/* Compare Mode Controls */}
        {scenarios.length >= 2 && (
          <View className="mb-6">
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleToggleCompareMode}
                className={`flex-1 py-3 rounded-xl active:opacity-70 ${compareMode ? 'bg-primary' : 'bg-surface border border-primary'
                  }`}
              >
                <Text className={`text-center font-semibold ${compareMode ? 'text-white' : 'text-primary'
                  }`}>
                  {compareMode ? t('common.cancel') : t('snapshots.compare_snapshots')}
                </Text>
              </TouchableOpacity>

              {compareMode && selectedSnapshots.length === 2 && (
                <TouchableOpacity
                  onPress={handleCompareSnapshots}
                  className="flex-1 bg-primary py-3 rounded-xl active:opacity-70"
                >
                  <Text className="text-white text-center font-semibold">
                    {t('snapshots.compare')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {compareMode && (
              <Text className="text-sm text-muted text-center mt-2">
                {t('snapshots.select_two')} ({selectedSnapshots.length}/2)
              </Text>
            )}
          </View>
        )}

        {/* Scenarios List */}
        {scenarios.length === 0 ? (
          <View className="flex-1 justify-center items-center py-12">
            <Text className="text-6xl mb-4">📊</Text>
            <Text className="text-xl font-bold text-foreground mb-2">
              {t('snapshots.no_snapshots')}
            </Text>
            <Text className="text-base text-muted text-center px-6 mb-6">
              {t('snapshots.no_snapshots_description')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/compare/${id}` as any)}
              className="bg-primary px-6 py-3 rounded-full active:opacity-70"
            >
              <Text className="text-white font-semibold">{t('compare.compare_scenarios')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-4">
            {scenarios.map((scenario) => (
              <TouchableOpacity
                key={scenario.id}
                onPress={() => compareMode && handleSelectSnapshot(scenario.id)}
                disabled={!compareMode}
                activeOpacity={compareMode ? 0.7 : 1}
                className={`bg-surface rounded-xl p-4 border ${compareMode && selectedSnapshots.includes(scenario.id)
                  ? 'border-primary border-2'
                  : 'border-border'
                  }`}
              >
                {/* Scenario Header */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-lg font-bold text-foreground">
                        {scenario.name}
                      </Text>
                      {scenario.isBase && (
                        <View className="bg-primary px-2 py-1 rounded">
                          <Text className="text-xs text-white font-semibold">
                            {t('snapshots.base_scenario')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xs text-muted">
                      {t('snapshots.created_at')}: {formatDate(scenario.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Adjustments */}
                <View className="mb-3 bg-background rounded-lg p-3">
                  <Text className="text-sm font-semibold text-muted mb-2">
                    {t('snapshots.adjustments')}
                  </Text>
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-xs text-muted">{t('snapshots.sales')}</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        {formatAdjustment(scenario.salesAdjustment)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted">{t('snapshots.costs')}</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        {formatAdjustment(scenario.costsAdjustment)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted">{t('snapshots.discount')}</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        {formatAdjustment(scenario.discountAdjustment)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Metrics */}
                <View className="gap-2 mb-3">
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <MetricCard
                        title="ROI"
                        value={`${scenario.results.roi.toFixed(2)}%`}
                        status={scenario.results.roi > 0 ? 'positive' : 'negative'}
                      />
                    </View>
                    <View className="flex-1">
                      <MetricCard
                        title="NPV"
                        value={`$${Math.round(scenario.results.npv).toLocaleString()}`}
                        status={scenario.results.npv > 0 ? 'positive' : 'negative'}
                      />
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <MetricCard
                        title={t('metrics.irr.label')}
                        value={`${scenario.results.irr.toFixed(2)}%`}
                        status="neutral"
                      />
                    </View>
                    <View className="flex-1">
                      <MetricCard
                        title={t('metrics.payback.label')}
                        value={`${scenario.results.paybackPeriod.toFixed(1)} ${t('common.months')}`}
                        status="neutral"
                      />
                    </View>
                  </View>
                </View>

                {/* Actions */}
                {!compareMode && (
                  <View className="flex-row gap-2">
                    {!scenario.isBase && (
                      <TouchableOpacity
                        onPress={() => handleRestoreScenario(scenario.id)}
                        className="flex-1 bg-primary px-4 py-2 rounded-lg active:opacity-70"
                      >
                        <Text className="text-white font-semibold text-center">
                          🔄 {t('snapshots.restore')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDeleteScenario(scenario.id)}
                      className="flex-1 bg-surface px-4 py-2 rounded-lg border border-error active:opacity-70"
                    >
                      <Text className="text-error font-semibold text-center">
                        🗑️ {t('common.delete')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Selection Indicator in Compare Mode */}
                {compareMode && selectedSnapshots.includes(scenario.id) && (
                  <View className="bg-primary py-2 rounded-lg">
                    <Text className="text-white font-semibold text-center">
                      ✓ {t('common.selected')} ({selectedSnapshots.indexOf(scenario.id) + 1})
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
