import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Polyline, Rect, Path, Circle } from 'react-native-svg';

import { ScreenContainer } from '@/components/screen-container';
import { LanguageSelector } from '@/components/language-selector';
import { useTranslation } from '@/lib/i18n-context';
import { getAllProjects } from '@/lib/project-storage';
import { hasSeenTutorial, markTutorialAsSeen } from '@/lib/tutorial-storage';
import { eventEmitter, Events } from '@/lib/event-emitter';
import type { ProjectData } from '@/types/project';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useProjectFilters } from '@/hooks/use-project-filters';
import { OnboardingTutorial } from '@/components/onboarding-tutorial';

// ============================================
// HEALTH SCORE HELPERS
// ============================================
function calculateHealthScore(projects: ProjectData[]): number | null {
  if (projects.length < 3) return null;

  const viableCount = projects.filter(p => p.results && p.results.roi > 0).length;
  const score = Math.round((viableCount / projects.length) * 100);
  return Math.min(100, Math.max(0, score));
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#86EFAC'; // Mint (success)
  if (score >= 50) return '#FB923C'; // Coral (warning)
  return '#FB923C'; // Coral (error)
}

function getScoreLabel(score: number, t: (key: string) => string): string {
  if (score >= 75) return t('dashboard.excellent');
  if (score >= 50) return t('dashboard.good');
  return t('dashboard.needs_attention');
}

// ============================================
// HEALTH SCORE GAUGE COMPONENT
// ============================================
function HealthScoreGauge({ score, colors, t }: { score: number | null; colors: any; t: (key: string) => string }) {
  return (
    <View className="bg-surface border border-border rounded-3xl p-8">
      <Text className="text-muted text-sm mb-4 uppercase tracking-wider font-body-medium">{t('dashboard.health_score')}</Text>
      {score !== null ? (
        <>
          <View
            className="w-36 h-36 rounded-full border-8 items-center justify-center mb-4"
            style={{ borderColor: `${getScoreColor(score)}30` }}
          >
            <Text className="text-5xl font-mono text-foreground" style={{ letterSpacing: -0.01 * 16 }}>
              {score}
            </Text>
          </View>
          <Text className="text-success font-body-medium">{getScoreLabel(score, t)}</Text>
        </>
      ) : (
        <>
          <View className="w-36 h-36 rounded-full border-8 border-border items-center justify-center mb-4">
            <IconSymbol size={48} name="chart.line.uptrend.xyaxis" color={colors.muted} />
          </View>
          <Text className="text-muted font-body text-center text-sm">
            {t('dashboard.complete_3')}
          </Text>
        </>
      )}
    </View>
  );
}

// ============================================
// MINI CHART COMPONENTS
// ============================================
function BreakEvenChart({ color }: { color: string }) {
  return (
    <Svg width="100%" height="52" viewBox="0 0 120 52">
      <Line x1="0" y1="34" x2="120" y2="34" stroke="#4b5563" strokeWidth="1.5" strokeDasharray="4 3" />
      <Polyline points="0,50 60,22 120,2" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Circle cx="60" cy="22" r="4" fill={color} />
      <Circle cx="60" cy="34" r="3" fill="#4b5563" opacity="0.6" />
    </Svg>
  );
}

function CashFlowChart({ color }: { color: string }) {
  const bars = [18, 28, 12, 36, 22, 42, 34];
  return (
    <Svg width="100%" height="52" viewBox="0 0 120 52">
      {bars.map((h, i) => (
        <Rect key={i} x={i * 17 + 2} y={52 - h} width="13" height={h} fill={color} opacity={0.4 + i * 0.09} rx="3" />
      ))}
      <Line x1="0" y1="51" x2="120" y2="51" stroke={color} strokeWidth="1" opacity="0.3" />
    </Svg>
  );
}

function PricingChart({ color }: { color: string }) {
  return (
    <Svg width="100%" height="52" viewBox="0 0 120 52">
      <Rect x="8" y="36" width="24" height="16" fill={color} opacity="0.4" rx="3" />
      <Rect x="48" y="22" width="24" height="30" fill={color} opacity="0.7" rx="3" />
      <Rect x="88" y="6" width="24" height="46" fill={color} opacity="1" rx="3" />
      <Line x1="0" y1="51" x2="120" y2="51" stroke={color} strokeWidth="1" opacity="0.3" />
    </Svg>
  );
}

function LoanChart({ color }: { color: string }) {
  return (
    <Svg width="100%" height="52" viewBox="0 0 120 52">
      <Path d="M0,4 C30,6 60,18 90,36 C100,42 110,47 120,50" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M0,4 C30,6 60,18 90,36 C100,42 110,47 120,50 L120,52 L0,52 Z" fill={color} opacity="0.12" />
    </Svg>
  );
}

function EmployeeROIChart({ color }: { color: string }) {
  return (
    <Svg width="100%" height="52" viewBox="0 0 120 52">
      <Rect x="15" y="26" width="30" height="26" fill="#6b7280" opacity="0.45" rx="3" />
      <Rect x="75" y="8" width="30" height="44" fill={color} opacity="0.9" rx="3" />
      <Line x1="60" y1="2" x2="60" y2="52" stroke="#374151" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
      <Line x1="0" y1="51" x2="120" y2="51" stroke={color} strokeWidth="1" opacity="0.3" />
    </Svg>
  );
}

function MarketingROIChart({ color }: { color: string }) {
  const widths = [110, 82, 60, 40, 24];
  return (
    <Svg width="100%" height="52" viewBox="0 0 120 52">
      {widths.map((w, i) => (
        <Rect key={i} x={(120 - w) / 2} y={i * 10 + 1} width={w} height="8" fill={color} opacity={1 - i * 0.16} rx="3" />
      ))}
    </Svg>
  );
}

const CHART_COMPONENTS: Record<string, React.ComponentType<{ color: string }>> = {
  'break-even': BreakEvenChart,
  'cash-flow': CashFlowChart,
  'pricing': PricingChart,
  'loan': LoanChart,
  'employee-roi': EmployeeROIChart,
  'marketing': MarketingROIChart,
};

// ============================================
// TOOL CARDS DATA & COMPONENT
// ============================================
function getToolCards(t: (key: string) => string) {
  return [
    {
      icon: 'chart.line.uptrend.xyaxis',
      chartType: 'break-even',
      title: t('calculators.break_even.title'),
      description: t('calculators.break_even.description'),
      href: '/(tabs)/calculators/break-even' as const,
      color: 'primary' as const
    },
    {
      icon: 'dollarsign.circle',
      chartType: 'cash-flow',
      title: t('calculators.cash_flow.title'),
      description: t('calculators.cash_flow.description'),
      href: '/(tabs)/calculators/cash-flow' as const,
      color: 'success' as const
    },
    {
      icon: 'tag',
      chartType: 'pricing',
      title: t('calculators.pricing.title'),
      description: t('calculators.pricing.description'),
      href: '/(tabs)/calculators/pricing' as const,
      color: 'warning' as const
    },
    {
      icon: 'creditcard',
      chartType: 'loan',
      title: t('calculators.loan.title'),
      description: t('calculators.loan.description'),
      href: '/(tabs)/calculators/loan' as const,
      color: 'primary' as const
    },
    {
      icon: 'person.2',
      chartType: 'employee-roi',
      title: t('calculators.employee_roi.title'),
      description: t('calculators.employee_roi.description'),
      href: '/(tabs)/calculators/employee-roi' as const,
      color: 'success' as const
    },
    {
      icon: 'megaphone',
      chartType: 'marketing',
      title: t('calculators.marketing_roi.title'),
      description: t('calculators.marketing_roi.description'),
      href: '/(tabs)/calculators/marketing' as const,
      color: 'warning' as const
    },
  ];
}

function ToolCard({ icon, chartType, title, description, href, color, colors }: any) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(href);
  };

  const colorValue = colors[color];
  const ChartComponent = CHART_COMPONENTS[chartType];

  return (
    <Pressable onPress={handlePress} className="w-full mb-4">
      <View className="bg-surface border border-border rounded-2xl overflow-hidden">
        {/* Mini chart header */}
        <View className="h-16 px-4 pt-2 justify-end" style={{ backgroundColor: `${colorValue}15` }}>
          {ChartComponent && <ChartComponent color={colorValue} />}
          {/* Small icon badge */}
          <View
            className="absolute top-2 right-3 w-8 h-8 rounded-lg items-center justify-center"
            style={{ backgroundColor: `${colorValue}30` }}
          >
            <IconSymbol size={16} name={icon} color={colorValue} />
          </View>
        </View>
        {/* Text content */}
        <View className="px-4 pt-3 pb-4">
          <Text className="text-base font-heading-medium text-foreground mb-1" numberOfLines={1}>{title}</Text>
          <Text className="text-xs font-body text-muted" numberOfLines={2}>{description}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    loadProjects();
    checkTutorialStatus();
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

  const checkTutorialStatus = async () => {
    const seen = await hasSeenTutorial();
    if (!seen) {
      // Show tutorial after a short delay for better UX
      setTimeout(() => {
        setShowTutorial(true);
      }, 500);
    }
  };

  const handleTutorialComplete = async () => {
    await markTutorialAsSeen();
    setShowTutorial(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleTutorialSkip = async () => {
    await markTutorialAsSeen();
    setShowTutorial(false);
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const allProjects = await getAllProjects();
      setProjects(allProjects);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }, []);

  const handleNewProject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/new-project');
  };

  return (
    <ScreenContainer className="relative">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-6 gap-6">
          {/* Header with Language Selector */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 gap-3">
              <Text className="text-5xl font-heading text-foreground" style={{ letterSpacing: -0.02 * 16 }}>
                {t('home.welcome')}
              </Text>
            </View>
            <LanguageSelector />
          </View>

          {/* Privacy Badge */}
          <View className="bg-success/10 border border-success/30 rounded-full px-3 py-1.5 flex-row items-center gap-2 self-start">
            <View className="w-1.5 h-1.5 rounded-full bg-success" />
            <Text className="text-xs font-mono text-success tracking-wider">
              LOCAL-ONLY | ENCRYPTED
            </Text>
          </View>

          {/* Health Score + Quick Stats Row */}
          {projects.length > 0 && (
            <View className="flex-row gap-6">
              <HealthScoreGauge score={calculateHealthScore(projects)} colors={colors} t={t} />
              <View className="flex-1 bg-surface border border-border rounded-3xl p-8">
                <Text className="text-xl font-heading-medium text-foreground mb-6">
                  {t('dashboard.quick_stats')}
                </Text>
                <View className="flex-col gap-4">
                  <View className="bg-primary/5 rounded-2xl p-4">
                    <View className="flex-row items-center gap-2 mb-2">
                      <IconSymbol size={20} name="chart.bar.fill" color={colors.primary} />
                      <Text className="text-3xl font-heading text-primary">
                        {projects.length}
                      </Text>
                    </View>
                    <Text className="text-sm font-body text-muted">{t('dashboard.total_projects')}</Text>
                  </View>
                  <View className="bg-success/5 rounded-2xl p-4">
                    <View className="flex-row items-center gap-2 mb-2">
                      <IconSymbol size={20} name="checkmark.circle.fill" color={colors.success} />
                      <Text className="text-3xl font-heading text-success">
                        {projects.filter(p => p.results && p.results.roi > 0).length}
                      </Text>
                    </View>
                    <Text className="text-sm font-body text-muted">{t('status.viable')}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Tool Cards Grid */}
          <View>
            <Text className="text-2xl font-heading-medium text-foreground mb-4">
              {t('dashboard.tools_title')}
            </Text>
            <View className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getToolCards(t).map(tool => (
                <ToolCard key={tool.href} {...tool} colors={colors} />
              ))}
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={handleNewProject}
          className="bg-primary rounded-full w-16 h-16 items-center justify-center shadow-2xl"
          style={{
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <IconSymbol size={28} name="plus" color={colors.background} />
        </TouchableOpacity>
      </View>

      {/* Onboarding Tutorial */}
      <OnboardingTutorial
        visible={showTutorial}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
    </ScreenContainer>
  );
}
