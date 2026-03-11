import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { IconLabel } from '@/components/ui/icon-label';
import { MetricCard } from '@/components/business/metric-card';
import { CashFlowChart } from '@/components/business/cash-flow-chart';
import { AIInsightCard } from '@/components/business/ai-insight-card';
import { ShareModal } from '@/components/share-modal';
import { SensitivityMatrix } from '@/components/sensitivity-matrix';
import { TornadoChart } from '@/components/tornado-chart';
import { BreakEvenChart } from '@/components/break-even-chart';
import { generateSensitivityPDF, shareSensitivityPDF } from '@/lib/sensitivity-pdf-generator';
import { calculateBreakEven, formatBreakEvenPeriod } from '@/lib/break-even-calculator';
import { eventEmitter, Events } from '@/lib/event-emitter';
import type { BreakEvenData } from '@/lib/break-even-calculator';
import { useTranslation } from '@/lib/i18n-context';
import { generateAIInsights } from '@/lib/ai-insights';
import type { CashFlowData } from '@/types/project';
import { getProject, deleteProject, duplicateProject } from '@/lib/project-storage';
import { generatePDFReport, sharePDFReport } from '@/lib/pdf-generator';
import type { ProjectData } from '@/types/project';
import { useDeviceId } from '@/hooks/use-device-id';
import { confirmAction } from '@/lib/platform-utils';

export default function ProjectDetailsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deviceId } = useDeviceId();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sensitivity' | 'advanced'>('overview');
  const [sensitivityMetric, setSensitivityMetric] = useState<'npv' | 'roi'>('npv');
  const [exportingSensitivity, setExportingSensitivity] = useState(false);
  const [breakEvenData, setBreakEvenData] = useState<BreakEvenData | null>(null);

  useEffect(() => {
    loadProject();
  }, [id]);

  const generateAIAnalysis = async () => {
    if (!project || !project.results) return;

    try {
      setAiLoading(true);
      setAiError(null);

      const response = await generateAIInsights({
        project,
        results: project.results,
        language: t('common.language_code') as 'es' | 'en',
        deviceId: deviceId || undefined,
      });

      setAiAnalysis(response.insights);
    } catch (error) {
      console.error('Error generating AI analysis:', error);

      setAiError(t('ai.error_message'));
    } finally {
      setAiLoading(false);
    }
  };

  // Auto-generate AI analysis on load if not already present
  useEffect(() => {
    if (project && project.results && !aiAnalysis && !aiLoading) {
      generateAIAnalysis();
    }
  }, [project]);

  const loadProject = async () => {
    if (!id) return;

    try {
      const projectData = await getProject(id);
      setProject(projectData);

      // Calculate break-even data
      if (projectData) {
        const beData = calculateBreakEven(projectData);
        setBreakEvenData(beData);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      Alert.alert(t('validations.error'), t('validations.project_not_found'));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubUpdated = eventEmitter.on(Events.PROJECT_UPDATED, (updatedProject: ProjectData) => {
      if (updatedProject.id === id) {
        setProject(updatedProject);
      }
    });

    const unsubDuplicated = eventEmitter.on(Events.PROJECT_DUPLICATED, () => {
      // Duplication usually happens from this screen, but it might happen elsewhere
      // No action needed here usually as duplication leads to a new screen
    });

    return () => {
      unsubUpdated();
      unsubDuplicated();
    };
  }, [id]);

  const handleExportPDF = async () => {
    if (!project || !project.results) return;

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setExporting(true);

    try {
      const pdfPath = await generatePDFReport({
        project,
        chartImages: {},
        language: t('common.language_code') as 'es' | 'en',
      });

      await sharePDFReport(pdfPath, project, t('common.language_code') as 'es' | 'en');

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert(t('validations.error'), t('validations.export_error'));
    } finally {
      setExporting(false);
    }
  };

  const handleExportSensitivity = async () => {
    if (!project) return;

    try {
      setExportingSensitivity(true);

      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const pdfPath = await generateSensitivityPDF({
        project,
        metric: sensitivityMetric,
        language: t('common.language_code') as 'es' | 'en',
      });

      await shareSensitivityPDF(pdfPath, project, sensitivityMetric, t('common.language_code') as 'es' | 'en');

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error exporting sensitivity analysis:', error);
      Alert.alert(t('validations.error'), t('validations.export_error'));
    } finally {
      setExportingSensitivity(false);
    }
  };

  const handleDuplicate = async () => {
    if (!project) return;

    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const duplicated = await duplicateProject(project.id);

      if (!duplicated) {
        throw new Error('Failed to duplicate project');
      }

      // Emit event to refresh other screens
      eventEmitter.emit(Events.PROJECT_DUPLICATED, duplicated.id);

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        t('common.success'),
        t('common.project_duplicated'),
        [
          {
            text: t('common.view'),
            onPress: () => router.push(`/project/${duplicated.id}` as any),
          },
          {
            text: t('common.ok'),
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error duplicating project:', error);
      Alert.alert(t('validations.error'), t('validations.duplicate_error'));
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    const confirmed = await confirmAction(
      t('common.confirm_delete'),
      t('common.confirm_delete_message'),
      t('common.delete'),
      t('common.cancel'),
      true
    );

    if (confirmed) {
      try {
        await deleteProject(project.id);

        // Emit event to refresh other screens
        eventEmitter.emit(Events.PROJECT_DELETED, project.id);

        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        router.back();
      } catch (error) {
        console.error('Error deleting project:', error);
        Alert.alert(t('validations.error'), t('validations.delete_error'));
      }
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t('common.loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!project || !project.results) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-foreground text-lg font-semibold mb-2">
            {t('validations.project_not_found')}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary px-6 py-3 rounded-xl mt-4"
          >
            <Text className="text-background font-semibold">
              {t('common.go_back')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const { results } = project;

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4"
          >
            <Text className="text-primary font-semibold">← {t('common.back')}</Text>
          </TouchableOpacity>

          <Text className="text-3xl font-bold text-foreground mb-2">
            {project.name}
          </Text>
          <Text className="text-sm text-muted">
            {t('results.created')}: {new Date(project.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2 mb-6">
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setActiveTab('overview');
            }}
            className={`flex-1 py-3 rounded-xl ${activeTab === 'overview'
              ? 'bg-primary'
              : 'bg-surface border border-border'
              }`}
          >
            <Text
              className={`text-center font-semibold ${activeTab === 'overview' ? 'text-background' : 'text-foreground'
                }`}
            >
              {t('sensitivity.overview')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setActiveTab('sensitivity');
            }}
            className={`flex-1 py-3 rounded-xl ${activeTab === 'sensitivity'
              ? 'bg-primary'
              : 'bg-surface border border-border'
              }`}
          >
            <Text
              className={`text-center font-semibold ${activeTab === 'sensitivity' ? 'text-background' : 'text-foreground'
                }`}
            >
              {t('sensitivity.title')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setActiveTab('advanced');
            }}
            className={`flex-1 py-3 rounded-xl ${activeTab === 'advanced'
              ? 'bg-primary'
              : 'bg-surface border border-border'
              }`}
          >
            <Text
              className={`text-center font-semibold ${activeTab === 'advanced' ? 'text-background' : 'text-foreground'
                }`}
            >
              {t('results.advanced_title')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Expected Case Metrics */}
            <View className="mb-6">
              <Text className="text-xl font-bold text-foreground mb-4">
                {t('results.expected_case')}
              </Text>
              <View className="gap-3">
                <MetricCard
                  title={t('results.roi')}
                  value={`${results.roi.toFixed(2)}%`}
                  subtitle={t('metrics.roi_description')}
                  status={results.roi > 0 ? 'positive' : 'negative'}
                />
                <MetricCard
                  title={t('results.npv')}
                  value={`$${results.npv.toLocaleString()}`}
                  subtitle={t('metrics.npv_description')}
                  status={results.npv > 0 ? 'positive' : 'negative'}
                />
                <MetricCard
                  title={t('metrics.irr.label')}
                  value={`${results.irr.toFixed(2)}%`}
                  subtitle={t('metrics.irr_description')}
                  status={results.irr > project.discountRate ? 'positive' : 'neutral'}
                />
                <MetricCard
                  title={t('metrics.payback.label')}
                  value={`${results.paybackPeriod.toFixed(1)} ${t('common.months')}`}
                  subtitle={t('metrics.payback_description')}
                  status="neutral"
                />
              </View>
            </View>

            {/* Best Case */}
            <View className="mb-6">
              <Text className="text-xl font-bold text-foreground mb-4">
                {t('results.best_case')}
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <MetricCard
                    title="ROI"
                    value={`${results.roiBest.toFixed(2)}%`}
                    status="positive"
                  />
                </View>
                <View className="flex-1">
                  <MetricCard
                    title="NPV"
                    value={`$${Math.round(results.npvBest).toLocaleString()}`}
                    status="positive"
                  />
                </View>
              </View>
            </View>

            {/* Worst Case */}
            <View className="mb-6">
              <Text className="text-xl font-bold text-foreground mb-4">
                {t('results.worst_case')}
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <MetricCard
                    title={t('results.roi')}
                    value={`${results.roiWorst.toFixed(2)}%`}
                    status="negative"
                  />
                </View>
                <View className="flex-1">
                  <MetricCard
                    title={t('results.npv')}
                    value={`$${Math.round(results.npvWorst).toLocaleString()}`}
                    status="negative"
                  />
                </View>
              </View>
            </View>

            {/* Cash Flow Charts */}
            {results.monthlyCashFlow && results.monthlyCashFlow.length > 0 && (
              <View className="mb-6">
                <CashFlowChart
                  cashFlowData={results.monthlyCashFlow.map((netFlow, index) => ({
                    month: index + 1,
                    netCashFlow: netFlow,
                    cumulativeCashFlow: results.cumulativeCashFlow[index],
                  }))}
                  currency="$"
                />
              </View>
            )}

            {/* Break-Even Analysis */}
            {breakEvenData && (
              <View className="mb-6">
                <Text className="text-xl font-bold text-foreground mb-4">
                  {t('break_even.title')}
                </Text>

                {/* Break-Even Metrics */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <View className="bg-surface rounded-xl p-4 border border-border">
                      <Text className="text-sm text-muted mb-1">
                        {t('break_even.break_even_month')}
                      </Text>
                      <Text className="text-2xl font-bold text-primary">
                        {breakEvenData.breakEvenPoint.achieved
                          ? formatBreakEvenPeriod(
                            breakEvenData.breakEvenPoint.month,
                            t('common.language_code') as 'es' | 'en'
                          )
                          : t('break_even.not_achieved')}
                      </Text>
                    </View>
                  </View>

                  {breakEvenData.breakEvenPoint.achieved && (
                    <View className="flex-1">
                      <View className="bg-surface rounded-xl p-4 border border-border">
                        <Text className="text-sm text-muted mb-1">
                          {t('break_even.amount_at_break_even')}
                        </Text>
                        <Text className="text-2xl font-bold text-foreground">
                          ${breakEvenData.breakEvenPoint.amount.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Break-Even Chart */}
                <BreakEvenChart data={breakEvenData} />
              </View>
            )}

            {/* AI Insights */}
            <View className="mb-6">
              <AIInsightCard
                analysis={aiAnalysis}
                loading={aiLoading}
                error={aiError}
                onRegenerate={generateAIAnalysis}
              />
            </View>

            {/* Project Parameters */}
            <View className="mb-6">
              <Text className="text-xl font-bold text-foreground mb-4">
                {t('results.parameters')}
              </Text>
              <View className="bg-surface rounded-xl p-4 border border-border gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-muted">{t('project_form.initial_investment')}:</Text>
                  <Text className="text-foreground font-semibold">
                    ${project.initialInvestment.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted">{t('project_form.project_duration')}:</Text>
                  <Text className="text-foreground font-semibold">
                    {project.projectDuration} {t('common.months')}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted">{t('project_form.yearly_revenue')}:</Text>
                  <Text className="text-foreground font-semibold">
                    ${project.yearlyRevenue.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted">{t('project_form.discount_rate')}:</Text>
                  <Text className="text-foreground font-semibold">
                    {project.discountRate}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-3 mb-6">
              {/* Edit and Duplicate Row */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    router.push(`/edit-project/${id}` as any);
                  }}
                  className="flex-1 bg-primary py-4 rounded-xl active:opacity-80"
                >
                  <Text className="text-center text-background font-semibold text-base">
                    ✏️ {t('common.edit')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDuplicate}
                  className="flex-1 bg-surface border border-primary py-4 rounded-xl active:opacity-80"
                >
                  <Text className="text-center text-primary font-semibold text-base">
                    {t('common.duplicate')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Compare and Export Row */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    router.push(`/compare/${id}` as any);
                  }}
                  className="flex-1 bg-surface py-4 rounded-xl border-2 border-primary active:opacity-80"
                >
                  <Text className="text-center text-primary font-semibold text-base">
                    {t('compare.compare_scenarios')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleExportPDF}
                  disabled={exporting}
                  className="flex-1 bg-surface border border-border py-4 rounded-xl active:opacity-80"
                >
                  <Text className="text-center text-foreground font-semibold text-base">
                    {exporting ? t('pdf_export.generating') : t('common.export')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Snapshots and Share Row */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    router.push(`/snapshots/${id}` as any);
                  }}
                  className="flex-1 bg-surface border border-primary py-4 rounded-xl active:opacity-80"
                >
                  <Text className="text-center text-primary font-semibold text-base">
                    {t('snapshots.view_history')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    setShowShareModal(true);
                  }}
                  className="flex-1 bg-surface border border-border py-4 rounded-xl active:opacity-80"
                >
                  <Text className="text-center text-foreground font-semibold text-base">
                    🔗 {t('share.share')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                onPress={handleDelete}
                className="bg-surface border border-error rounded-xl py-4 items-center active:opacity-80"
              >
                <Text className="text-error font-semibold text-base">
                  🗑️ {t('common.delete_project')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Sensitivity Tab Content */}
        {activeTab === 'sensitivity' && (
          <>
            {/* Metric Selector */}
            <View className="flex-row gap-2 mb-6">
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSensitivityMetric('npv');
                }}
                className={`flex-1 py-2 rounded-lg ${sensitivityMetric === 'npv'
                  ? 'bg-primary'
                  : 'bg-surface border border-border'
                  }`}
              >
                <Text
                  className={`text-center font-semibold text-sm ${sensitivityMetric === 'npv' ? 'text-background' : 'text-foreground'
                    }`}
                >
                  {t('results.npv')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSensitivityMetric('roi');
                }}
                className={`flex-1 py-2 rounded-lg ${sensitivityMetric === 'roi'
                  ? 'bg-primary'
                  : 'bg-surface border border-border'
                  }`}
              >
                <Text
                  className={`text-center font-semibold text-sm ${sensitivityMetric === 'roi' ? 'text-background' : 'text-foreground'
                    }`}
                >
                  {t('results.roi')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View className="bg-surface rounded-xl border border-border p-4 mb-6">
              <Text className="text-sm text-foreground">
                {t('sensitivity.description')}
              </Text>
            </View>

            {/* Sensitivity Matrix */}
            <View className="mb-6">
              <SensitivityMatrix project={project} metric={sensitivityMetric} />
            </View>

            {/* Tornado Chart */}
            <View className="mb-6">
              <TornadoChart project={project} />
            </View>

            {/* Export Button */}
            <TouchableOpacity
              onPress={handleExportSensitivity}
              disabled={exportingSensitivity}
              className="bg-primary py-4 rounded-xl active:opacity-80 mb-6"
            >
              <Text className="text-center text-background font-semibold text-base">
                {exportingSensitivity
                  ? t('pdf_export.generating')
                  : `📄 ${t('sensitivity.export_analysis')}`}
              </Text>
            </TouchableOpacity>
          </>
        )}
        {/* Advanced Calculations Tab Content */}
        {activeTab === 'advanced' && (
          <View className="mb-6">
            <View className="mb-6">
              <Text className="text-2xl font-bold text-foreground mb-2">
                {t('results.vanguard_metrics')}
              </Text>
              <Text className="text-sm text-muted mb-4">
                {t('results.vanguard_description')}
              </Text>

              <View className="gap-4">
                {/* OFI Card */}
                <View className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-lg font-bold text-foreground">
                      {t('metrics.ofi.label')}
                    </Text>
                    <View className={`px-3 py-1 rounded-full ${(results.vanguard?.ofi || 0) < 0.05 ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                      }`}>
                      <Text className={
                        (results.vanguard?.ofi || 0) < 0.05 ? 'text-emerald-500' : 'text-amber-500'
                      }>
                        {(results.vanguard?.ofi || 0) < 0.05 ? t('vanguard.optimal') : t('vanguard.caution')}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-3xl font-bold text-primary mb-2">
                    {((results.vanguard?.ofi || 0) * 100).toFixed(1)}%
                  </Text>
                  <Text className="text-sm text-muted">
                    {t('metrics.ofi.description')}
                  </Text>
                  <View className="mt-4 pt-4 border-t border-border">
                    <Text className="text-xs font-semibold text-muted uppercase mb-1">{t('projects_list.recommendation')}</Text>
                    <Text className="text-sm text-foreground">
                      {(results.vanguard?.ofi || 0) > 0.08
                        ? t('vanguard.ofi_high_friction')
                        : t('vanguard.ofi_normal')}
                    </Text>
                  </View>
                </View>

                {/* TFDI Card */}
                <View className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-lg font-bold text-foreground">
                      {t('metrics.tfdi.label')}
                    </Text>
                    <View className={`px-3 py-1 rounded-full ${(results.vanguard?.tfdi || 0) < 0.20 ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                      }`}>
                      <Text className={
                        (results.vanguard?.tfdi || 0) < 0.20 ? 'text-emerald-500' : 'text-rose-500'
                      }>
                        {(results.vanguard?.tfdi || 0) < 0.20 ? t('vanguard.healthy') : t('vanguard.critical')}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-3xl font-bold text-primary mb-2">
                    {((results.vanguard?.tfdi || 0) * 100).toFixed(1)}%
                  </Text>
                  <Text className="text-sm text-muted">
                    {t('metrics.tfdi.description')}
                  </Text>
                  <View className="mt-4 pt-4 border-t border-border">
                    <Text className="text-xs font-semibold text-muted uppercase mb-1">{t('projects_list.recommendation')}</Text>
                    <Text className="text-sm text-foreground">
                      {(results.vanguard?.tfdi || 0) > 0.30
                        ? t('vanguard.tfdi_high_debt')
                        : t('vanguard.tfdi_normal')}
                    </Text>
                  </View>
                </View>

                {/* SER Card */}
                <View className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-lg font-bold text-foreground">
                      {t('metrics.ser.label')}
                    </Text>
                    <View className={`px-3 py-1 rounded-full ${(results.vanguard?.ser || 0) > 1.2 ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                      }`}>
                      <Text className={
                        (results.vanguard?.ser || 0) > 1.2 ? 'text-emerald-500' : 'text-amber-500'
                      }>
                        {(results.vanguard?.ser || 0) > 1.2 ? t('vanguard.superior') : t('vanguard.monitoring')}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-3xl font-bold text-primary mb-2">
                    {(results.vanguard?.ser || 0).toFixed(2)}x
                  </Text>
                  <Text className="text-sm text-muted">
                    {t('metrics.ser.description')}
                  </Text>
                  <View className="mt-4 pt-4 border-t border-border">
                    <Text className="text-xs font-semibold text-muted uppercase mb-1">{t('vanguard.strategic_insight')}</Text>
                    <Text className="text-sm text-foreground">
                      {(results.vanguard?.ser || 0) > 1.5
                        ? t('vanguard.ser_elite')
                        : t('vanguard.ser_normal')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
        {/* Back to Home */}
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.push('/(tabs)/' as any);
          }}
          className="mt-6 bg-surface border border-border rounded-xl py-4 items-center active:opacity-70"
        >
          <Text className="text-foreground font-semibold text-base">
            🏠 {t('common.go_home')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Share Modal */}
      {project && (
        <ShareModal
          visible={showShareModal}
          project={project}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </ScreenContainer>
  );
}
