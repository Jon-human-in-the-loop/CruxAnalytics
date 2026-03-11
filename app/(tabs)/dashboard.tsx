import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { IconLabel } from '@/components/ui/icon-label';
import { SkeletonProjectCard } from '@/components/business/skeleton-project-card';
import { useTranslation } from '@/lib/i18n-context';
import { getAllProjects } from '@/lib/project-storage';
import { eventEmitter, Events } from '@/lib/event-emitter';
import { calculateBreakEven } from '@/lib/break-even-calculator';
import type { ProjectData } from '@/types/project';

interface ProjectMetrics {
  id: string;
  name: string;
  roi: number;
  npv: number;
  paybackPeriod: number;
  breakEvenMonth: number | null;
  createdAt: string;
}

interface AggregateMetrics {
  totalProjects: number;
  totalInvestment: number;
  averageROI: number;
  totalNPV: number;
  bestProject: ProjectMetrics | null;
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectMetrics[]>([]);
  const [aggregateMetrics, setAggregateMetrics] = useState<AggregateMetrics>({
    totalProjects: 0,
    totalInvestment: 0,
    averageROI: 0,
    totalNPV: 0,
    bestProject: null,
  });
  const [sortBy, setSortBy] = useState<'roi' | 'npv' | 'payback'>('roi');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadProjects();
  }, []);

  // Listen to project events for auto-refresh
  useEffect(() => {
    const unsubscribeCreated = eventEmitter.on(Events.PROJECT_CREATED, () => {
      loadProjects();
    });

    const unsubscribeUpdated = eventEmitter.on(Events.PROJECT_UPDATED, () => {
      loadProjects();
    });

    const unsubscribeDeleted = eventEmitter.on(Events.PROJECT_DELETED, () => {
      loadProjects();
    });

    const unsubscribeDuplicated = eventEmitter.on(Events.PROJECT_DUPLICATED, () => {
      loadProjects();
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeDuplicated();
    };
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const allProjects = await getAllProjects();

      // Extract metrics from each project
      const projectMetrics: ProjectMetrics[] = allProjects
        .filter((p) => p.results) // Only projects with calculated results
        .map((p) => {
          const breakEvenData = calculateBreakEven(p);
          return {
            id: p.id,
            name: p.name,
            roi: p.results!.roi,
            npv: p.results!.npv,
            paybackPeriod: p.results!.paybackPeriod,
            breakEvenMonth: breakEvenData.breakEvenPoint.achieved ? breakEvenData.breakEvenPoint.month : null,
            createdAt: p.createdAt,
          };
        });

      // Calculate aggregate metrics
      const totalInvestment = allProjects.reduce((sum, p) => sum + p.initialInvestment, 0);
      const averageROI = projectMetrics.length > 0
        ? projectMetrics.reduce((sum, p) => sum + p.roi, 0) / projectMetrics.length
        : 0;
      const totalNPV = projectMetrics.reduce((sum, p) => sum + p.npv, 0);
      const bestProject = projectMetrics.length > 0
        ? projectMetrics.reduce((best, current) => (current.roi > best.roi ? current : best))
        : null;

      setProjects(projectMetrics);
      setAggregateMetrics({
        totalProjects: allProjects.length,
        totalInvestment,
        averageROI,
        totalNPV,
        bestProject,
      });
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'roi':
        comparison = a.roi - b.roi;
        break;
      case 'npv':
        comparison = a.npv - b.npv;
        break;
      case 'payback':
        comparison = a.paybackPeriod - b.paybackPeriod;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (metric: 'roi' | 'npv' | 'payback') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (sortBy === metric) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(metric);
      setSortOrder('desc');
    }
  };

  const getBarWidth = (value: number, maxValue: number): number => {
    if (maxValue === 0) return 0;
    return Math.min((Math.abs(value) / Math.abs(maxValue)) * 100, 100);
  };

  const maxROI = Math.max(...projects.map((p) => Math.abs(p.roi)), 1);
  const maxNPV = Math.max(...projects.map((p) => Math.abs(p.npv)), 1);
  const maxPayback = Math.max(...projects.map((p) => p.paybackPeriod), 1);

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <Text className="text-2xl font-bold text-foreground mb-6">
          {t('dashboard.title')}
        </Text>
        <SkeletonProjectCard />
        <SkeletonProjectCard />
        <SkeletonProjectCard />
      </ScreenContainer>
    );
  }

  if (projects.length === 0) {
    return (
      <ScreenContainer className="p-6">
        <Text className="text-2xl font-bold text-foreground mb-6">
          {t('dashboard.title')}
        </Text>
        <View className="flex-1 items-center justify-center">
          <View className="mb-4"><IconLabel icon="chart" size={56} contained /></View>
          <Text className="text-lg font-semibold text-foreground mb-2 text-center">
            {t('dashboard.no_projects')}
          </Text>
          <Text className="text-sm text-muted text-center mb-6">
            {t('dashboard.no_projects_description')}
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              router.push('/new-project');
            }}
            className="bg-primary px-6 py-3 rounded-xl"
          >
            <Text className="text-background font-semibold">
              {t('home.create_project')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text className="text-2xl font-bold text-foreground mb-6">
          {t('dashboard.title')}
        </Text>

        {/* Aggregate Metrics Cards */}
        <View className="gap-3 mb-6">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-xl border border-border p-4">
              <Text className="text-xs text-muted mb-1">{t('dashboard.total_projects')}</Text>
              <Text className="text-2xl font-bold text-foreground">
                {aggregateMetrics.totalProjects}
              </Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl border border-border p-4">
              <Text className="text-xs text-muted mb-1">{t('dashboard.average_roi')}</Text>
              <Text className={`text-2xl font-bold ${aggregateMetrics.averageROI > 0 ? 'text-success' : 'text-error'}`}>
                {aggregateMetrics.averageROI.toFixed(1)}%
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-xl border border-border p-4">
              <Text className="text-xs text-muted mb-1">{t('dashboard.total_investment')}</Text>
              <Text className="text-xl font-bold text-foreground">
                ${aggregateMetrics.totalInvestment.toLocaleString()}
              </Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl border border-border p-4">
              <Text className="text-xs text-muted mb-1">{t('dashboard.total_npv')}</Text>
              <Text className={`text-xl font-bold ${aggregateMetrics.totalNPV > 0 ? 'text-success' : 'text-error'}`}>
                ${aggregateMetrics.totalNPV.toLocaleString()}
              </Text>
            </View>
          </View>

          {aggregateMetrics.bestProject && (
            <View className="bg-primary/10 rounded-xl border border-primary p-4">
              <Text className="text-xs text-primary mb-1">{t('dashboard.best_project')}</Text>
              <Text className="text-lg font-bold text-foreground">
                {aggregateMetrics.bestProject.name}
              </Text>
              <Text className="text-sm text-success font-semibold">
                ROI: {aggregateMetrics.bestProject.roi.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        {/* Sort Buttons */}
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            onPress={() => handleSort('roi')}
            className={`flex-1 py-2 rounded-lg ${sortBy === 'roi' ? 'bg-primary' : 'bg-surface border border-border'
              }`}
          >
            <Text
              className={`text-center font-semibold text-sm ${sortBy === 'roi' ? 'text-background' : 'text-foreground'
                }`}
            >
              ROI {sortBy === 'roi' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSort('npv')}
            className={`flex-1 py-2 rounded-lg ${sortBy === 'npv' ? 'bg-primary' : 'bg-surface border border-border'
              }`}
          >
            <Text
              className={`text-center font-semibold text-sm ${sortBy === 'npv' ? 'text-background' : 'text-foreground'
                }`}
            >
              NPV {sortBy === 'npv' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSort('payback')}
            className={`flex-1 py-2 rounded-lg ${sortBy === 'payback' ? 'bg-primary' : 'bg-surface border border-border'
              }`}
          >
            <Text
              className={`text-center font-semibold text-sm ${sortBy === 'payback' ? 'text-background' : 'text-foreground'
                }`}
            >
              Payback {sortBy === 'payback' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comparison Charts */}
        <View className="bg-surface rounded-xl border border-border p-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-4">
            {t('dashboard.comparison_chart')}
          </Text>

          {sortedProjects.map((project) => {
            const value = sortBy === 'roi' ? project.roi : sortBy === 'npv' ? project.npv : project.paybackPeriod;
            const maxValue = sortBy === 'roi' ? maxROI : sortBy === 'npv' ? maxNPV : maxPayback;
            const barWidth = getBarWidth(value, maxValue);
            const isPositive = value > 0;
            const barColor = sortBy === 'payback' ? '#0a7ea4' : isPositive ? '#22C55E' : '#EF4444';

            return (
              <TouchableOpacity
                key={project.id}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push(`/project/${project.id}` as any);
                }}
                className="mb-4"
              >
                <Text className="text-sm font-semibold text-foreground mb-1" numberOfLines={1}>
                  {project.name}
                </Text>
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-8 rounded justify-center px-2"
                    style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                  >
                    <Text className="text-xs font-bold text-white">
                      {sortBy === 'roi'
                        ? `${value.toFixed(1)}%`
                        : sortBy === 'npv'
                          ? `$${value.toLocaleString()}`
                          : `${value.toFixed(1)} ${t('common.months')}`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Project Table */}
        <View className="bg-surface rounded-xl border border-border p-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-4">
            {t('dashboard.all_projects')}
          </Text>

          {sortedProjects.map((project) => (
            <TouchableOpacity
              key={project.id}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push(`/project/${project.id}` as any);
              }}
              className="border-b border-border pb-3 mb-3"
            >
              <Text className="text-base font-semibold text-foreground mb-2" numberOfLines={1}>
                {project.name}
              </Text>
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-xs text-muted">ROI</Text>
                  <Text className={`text-sm font-bold ${project.roi > 0 ? 'text-success' : 'text-error'}`}>
                    {project.roi.toFixed(1)}%
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">NPV</Text>
                  <Text className={`text-sm font-bold ${project.npv > 0 ? 'text-success' : 'text-error'}`}>
                    ${project.npv.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Payback</Text>
                  <Text className="text-sm font-bold text-foreground">
                    {project.paybackPeriod.toFixed(1)} {t('common.months')}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Break-even</Text>
                  <Text className="text-sm font-bold text-foreground">
                    {project.breakEvenMonth !== null ? `${t('common.months')} ${project.breakEvenMonth}` : 'N/A'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
