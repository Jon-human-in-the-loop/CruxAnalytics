import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { MetricCard } from '@/components/business/metric-card';
import { useTranslation } from '@/lib/i18n-context';
import { useColors } from '@/hooks/use-colors';
import { decodeSharedProject } from '@/lib/share-links';
import { saveProject } from '@/lib/project-storage';
import type { ProjectData } from '@/types/project';

export default function SharedProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const colors = useColors();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    if (id) {
      loadSharedProject(id);
    }
  }, [id]);

  const loadSharedProject = (shareId: string) => {
    try {
      const decodedProject = decodeSharedProject(shareId);
      if (decodedProject) {
        setProject(decodedProject);
      } else {
        Alert.alert(
          t('share.invalid_link_title'),
          t('share.invalid_link_message')
        );
        router.back();
      }
    } catch (error) {
      console.error('Error loading shared project:', error);
      Alert.alert(
        t('share.error_loading_title'),
        t('share.error_loading_message')
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateProject = async () => {
    if (!project) return;

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      setDuplicating(true);

      // Create a new project with copied data
      const newProject: ProjectData = {
        ...project,
        id: `project-${Date.now()}`,
        name: `${project.name} (${t('share.copy')})`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveProject(newProject);

      Alert.alert(
        t('share.duplicated_title'),
        t('share.duplicated_message'),
        [
          {
            text: t('common.ok'),
            onPress: () => router.push('/'),
          },
        ]
      );
    } catch (error) {
      console.error('Error duplicating project:', error);
      Alert.alert(
        t('validations.error'),
        t('share.duplicate_error')
      );
    } finally {
      setDuplicating(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <Text className="text-lg text-muted">{t('common.loading')}</Text>
      </ScreenContainer>
    );
  }

  if (!project) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <View className="mb-2"><Ionicons name="close-circle" size={28} color="#EF4444" /></View>
        <Text className="text-lg font-bold text-foreground mb-2">
          {t('share.not_found_title')}
        </Text>
        <Text className="text-base text-muted text-center">
          {t('share.not_found_message')}
        </Text>
      </ScreenContainer>
    );
  }

  const results = project.results;

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Read-Only Banner */}
        <View className="bg-primary/10 border-l-4 border-primary px-4 py-3 mb-4">
          <Text className="text-sm font-semibold text-primary">
            {t('share.read_only_banner')}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {t('share.read_only_description')}
          </Text>
        </View>

        {/* Project Header */}
        <View className="px-6 mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            {project.name}
          </Text>
          <Text className="text-sm text-muted">
            {t('share.shared_project')}
          </Text>
        </View>

        {/* Metrics Grid */}
        {results && (
          <View className="px-6 mb-6">
            <View className="flex-row flex-wrap gap-3">
              <View className="flex-1 min-w-[45%]">
                <MetricCard
                  title={t('metrics.roi')}
                  value={`${results.roi.toFixed(1)}%`}
                  subtitle={t('metrics.expected_case')}
                  status={results.roi > 0 ? 'positive' : 'negative'}
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <MetricCard
                  title={t('metrics.npv')}
                  value={`$${results.npv.toLocaleString()}`}
                  subtitle={t('metrics.net_present_value')}
                  status={results.npv > 0 ? 'positive' : 'negative'}
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <MetricCard
                  title={t('metrics.payback.label')}
                  value={`${results.paybackPeriod.toFixed(1)}`}
                  subtitle={t('common.months')}
                  status="neutral"
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <MetricCard
                  title={t('metrics.irr.label')}
                  value={`${results.irr.toFixed(1)}%`}
                  subtitle={t('metrics.internal_rate')}
                  status={results.irr > project.discountRate ? 'positive' : 'negative'}
                />
              </View>
            </View>
          </View>
        )}

        {/* Scenario Comparison */}
        {results && (
          <View className="px-6 mb-6">
            <Text className="text-xl font-bold text-foreground mb-4">
              {t('share.scenario_comparison')}
            </Text>
            <View className="bg-surface rounded-xl p-4 gap-4">
              <View>
                <Text className="text-xs text-muted mb-2">{t('metrics.expected_case')}</Text>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-foreground">ROI</Text>
                  <Text className="text-sm font-semibold text-foreground">{results.roi.toFixed(1)}%</Text>
                </View>
                <View className="flex-row justify-between mt-1">
                  <Text className="text-sm text-foreground">NPV</Text>
                  <Text className="text-sm font-semibold text-foreground">${results.npv.toLocaleString()}</Text>
                </View>
              </View>
              <View>
                <Text className="text-xs text-success mb-2">{t('metrics.best_case')}</Text>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-foreground">ROI</Text>
                  <Text className="text-sm font-semibold text-success">{results.roiBest.toFixed(1)}%</Text>
                </View>
                <View className="flex-row justify-between mt-1">
                  <Text className="text-sm text-foreground">NPV</Text>
                  <Text className="text-sm font-semibold text-success">${results.npvBest.toLocaleString()}</Text>
                </View>
              </View>
              <View>
                <Text className="text-xs text-error mb-2">{t('metrics.worst_case')}</Text>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-foreground">ROI</Text>
                  <Text className="text-sm font-semibold text-error">{results.roiWorst.toFixed(1)}%</Text>
                </View>
                <View className="flex-row justify-between mt-1">
                  <Text className="text-sm text-foreground">NPV</Text>
                  <Text className="text-sm font-semibold text-error">${results.npvWorst.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Project Details */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">
            {t('share.project_details')}
          </Text>
          <View className="bg-surface rounded-xl p-4 gap-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">{t('project_form.initial_investment')}</Text>
              <Text className="text-sm font-semibold text-foreground">
                ${project.initialInvestment.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">{t('project_form.yearly_revenue')}</Text>
              <Text className="text-sm font-semibold text-foreground">
                ${project.yearlyRevenue.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">{t('project_form.operating_costs')}</Text>
              <Text className="text-sm font-semibold text-foreground">
                ${project.operatingCosts.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">{t('project_form.project_duration')}</Text>
              <Text className="text-sm font-semibold text-foreground">
                {project.projectDuration} {t('common.months')}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">{t('project_form.discount_rate')}</Text>
              <Text className="text-sm font-semibold text-foreground">
                {project.discountRate}%
              </Text>
            </View>
          </View>
        </View>

        {/* Duplicate Button */}
        <View className="px-6">
          <TouchableOpacity
            onPress={handleDuplicateProject}
            disabled={duplicating}
            className="bg-primary rounded-xl py-4 items-center active:opacity-80"
          >
            <Text className="text-background font-semibold text-base">
              {duplicating ? t('common.loading') : t('share.duplicate_to_my_projects')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
