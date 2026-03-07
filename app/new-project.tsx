import { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ScreenContainer } from '@/components/screen-container';
import { TemplateSelector } from '@/components/template-selector';
import { MultiStepForm, type WizardStep } from '@/components/wizard/multi-step-form';
import { WizardInput, type QuickSuggestion } from '@/components/wizard/wizard-input';
import { useTranslation } from '@/lib/i18n-context';
import { saveProject, saveDraft, loadDraft, clearDraft, hasDraft } from '@/lib/project-storage';
import { CalculationService } from '@/lib/application/services/CalculationService';
import { eventEmitter, Events } from '@/lib/event-emitter';
import {
  scheduleProjectReminder,
  type ReminderFrequency,
  getFrequencyDisplayName,
  areNotificationsEnabled,
} from '@/lib/notification-manager';
import type { ProjectData } from '@/types/project';
import type { ProjectTemplate } from '@/lib/project-templates';
import { useAutoSave } from '@/hooks/use-auto-save';
import { AutoSaveIndicator } from '@/components/auto-save-indicator';

export default function NewProjectScreen() {
  const { t, language } = useTranslation();
  const [name, setName] = useState('');
  const [initialInvestment, setInitialInvestment] = useState('');
  const [discountRate, setDiscountRate] = useState('10');
  const [projectDuration, setProjectDuration] = useState('24');
  const [yearlyRevenue, setYearlyRevenue] = useState('');
  const [revenueGrowth, setRevenueGrowth] = useState('5');
  const [operatingCosts, setOperatingCosts] = useState('');
  const [maintenanceCosts, setMaintenanceCosts] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);

  // Vanguard Business Metrics
  const [manualHours, setManualHours] = useState('15');
  const [hourlyCost, setHourlyCost] = useState('45');
  const [maintHours, setMaintHours] = useState('20');
  const [totalSprintHours, setTotalSprintHours] = useState('80');
  const [devTeamCost, setDevTeamCost] = useState('120000');
  const [incidentCost, setIncidentCost] = useState('1000');
  const [prevRevenue, setPrevRevenue] = useState('');
  const [prevBurnRate, setPrevBurnRate] = useState('');
  const [useWizard] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>('monthly');
  const [notificationsAvailable, setNotificationsAvailable] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if notifications are available
  useEffect(() => {
    checkNotifications();
  }, []);

  const checkNotifications = async () => {
    const enabled = await areNotificationsEnabled();
    setNotificationsAvailable(enabled);

    if (enabled) {
      const savedFrequency = await AsyncStorage.getItem('@default_reminder_frequency');
      if (savedFrequency) {
        setReminderFrequency(savedFrequency as ReminderFrequency);
      }
    }
  };

  // Load draft on mount
  useEffect(() => {
    const loadDraftData = async () => {
      const hasDraftData = await hasDraft('new');
      if (hasDraftData) {
        setShowTemplateSelector(false);
        Alert.alert(
          t('form.draft_found'),
          t('form.draft_found_message'),
          [
            {
              text: t('form.discard_draft'),
              style: 'destructive',
              onPress: async () => {
                await clearDraft('new');
              },
            },
            {
              text: t('form.load_draft'),
              onPress: async () => {
                const draft = await loadDraft('new');
                if (draft) {
                  setName(draft.name || '');
                  setInitialInvestment(draft.initialInvestment?.toString() || '');
                  setDiscountRate(draft.discountRate?.toString() || '10');
                  setProjectDuration(draft.projectDuration?.toString() || '24');
                  setYearlyRevenue(draft.yearlyRevenue?.toString() || '');
                  setRevenueGrowth(draft.revenueGrowth?.toString() || '5');
                  setOperatingCosts(draft.operatingCosts?.toString() || '');
                  setMaintenanceCosts(draft.maintenanceCosts?.toString() || '');
                }
              },
            },
          ]
        );
      } else {
        setShowTemplateSelector(true);
      }
    };
    loadDraftData();
  }, [t]);

  // Wizard validation functions
  const validateStep1 = () => {
    if (!name.trim()) {
      setErrors({ name: t('validations.project_name_required') });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    const investment = parseFloat(initialInvestment);
    if (isNaN(investment) || investment <= 0) {
      setErrors({ investment: t('validations.invalid_investment') });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep3 = () => {
    const revenue = parseFloat(yearlyRevenue);
    if (isNaN(revenue) || revenue <= 0) {
      setErrors({ revenue: t('validations.invalid_revenue') });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep4 = () => {
    const costs = parseFloat(operatingCosts);
    if (isNaN(costs) || costs < 0) {
      setErrors({ costs: t('validations.invalid_costs') || 'Please enter a valid value' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep5 = () => {
    const duration = parseInt(projectDuration);
    if (isNaN(duration) || duration <= 0) {
      setErrors({ duration: t('validations.invalid_duration') || 'Please enter a valid duration' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep6 = () => {
    const growth = parseFloat(revenueGrowth);
    if (isNaN(growth)) {
      setErrors({ growth: t('validations.invalid_growth') || 'Please enter a valid value' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep7 = () => {
    const discount = parseFloat(discountRate);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      setErrors({ discount: t('validations.invalid_discount_rate') || 'Please enter a valid rate (0-100)' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep8 = () => {
    const hours = parseFloat(manualHours);
    const cost = parseFloat(hourlyCost);
    if (isNaN(hours) || hours < 0 || isNaN(cost) || cost < 0) {
      setErrors({ manual: t('validations.invalid_operational_numbers') });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep9 = () => {
    const mHours = parseFloat(maintHours);
    const sHours = parseFloat(totalSprintHours);
    if (isNaN(mHours) || isNaN(sHours) || mHours > sHours) {
      setErrors({ tech: t('validations.maint_exceeds_sprint') });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep10 = () => {
    const rev = parseFloat(prevRevenue);
    const burn = parseFloat(prevBurnRate);
    if ((prevRevenue !== '' && isNaN(rev)) || (prevBurnRate !== '' && isNaN(burn))) {
      setErrors({ trajectory: t('validations.invalid_trajectory') });
      return false;
    }
    setErrors({});
    return true;
  };


  // Quick suggestion values
  const investmentSuggestions: QuickSuggestion[] = [
    { label: '$50,000', value: '50000' },
    { label: '$100,000', value: '100000' },
    { label: '$250,000', value: '250000' },
    { label: '$500,000', value: '500000' },
  ];

  const revenueSuggestions: QuickSuggestion[] = [
    { label: '$25,000', value: '25000' },
    { label: '$100,000', value: '100000' },
    { label: '$500,000', value: '500000' },
  ];

  const costsSuggestions: QuickSuggestion[] = [
    { label: '$10,000', value: '10000' },
    { label: '$50,000', value: '50000' },
    { label: '$200,000', value: '200000' },
  ];

  const durationSuggestions: QuickSuggestion[] = [
    { label: `12 ${t('wizard.months')}`, value: '12' },
    { label: `24 ${t('wizard.months')}`, value: '24' },
    { label: `36 ${t('wizard.months')}`, value: '36' },
  ];

  const growthSuggestions: QuickSuggestion[] = [
    { label: '0%', value: '0' },
    { label: '5%', value: '5' },
    { label: '10%', value: '10' },
    { label: '20%', value: '20' },
  ];

  const discountSuggestions: QuickSuggestion[] = [
    { label: '5%', value: '5' },
    { label: '10%', value: '10' },
    { label: '15%', value: '15' },
  ];

  // Wizard steps
  const wizardSteps: WizardStep[] = [
    {
      id: 'name',
      title: t('wizard.step1.question'),
      subtitle: t('wizard.step1.subtitle'),
      validation: validateStep1,
      component: (
        <WizardInput
          question={t('wizard.step1.question')}
          helper={t('wizard.step1.helper')}
          helpText={t('wizard.step1.help')}
          value={name}
          onChangeText={setName}
          placeholder={t('wizard.step1.placeholder')}
          error={errors.name}
        />
      ),
    },
    {
      id: 'investment',
      title: t('wizard.step2.question'),
      subtitle: t('wizard.step2.subtitle'),
      validation: validateStep2,
      component: (
        <WizardInput
          question={t('wizard.step2.question')}
          helper={t('wizard.step2.helper')}
          helpText={t('wizard.step2.help')}
          value={initialInvestment}
          onChangeText={setInitialInvestment}
          placeholder={t('wizard.step2.placeholder')}
          keyboardType="numeric"
          suggestions={investmentSuggestions}
          error={errors.investment}
        />
      ),
    },
    {
      id: 'revenue',
      title: t('wizard.step3.question'),
      subtitle: t('wizard.step3.subtitle'),
      validation: validateStep3,
      component: (
        <WizardInput
          question={t('wizard.step3.question')}
          helper={t('wizard.step3.helper')}
          helpText={t('wizard.step3.help')}
          value={yearlyRevenue}
          onChangeText={setYearlyRevenue}
          placeholder={t('wizard.step3.placeholder')}
          keyboardType="numeric"
          suggestions={revenueSuggestions}
          error={errors.revenue}
        />
      ),
    },
    {
      id: 'costs',
      title: t('wizard.step4.question'),
      subtitle: t('wizard.step4.subtitle'),
      validation: validateStep4,
      component: (
        <WizardInput
          question={t('wizard.step4.question')}
          helper={t('wizard.step4.helper')}
          helpText={t('wizard.step4.help')}
          value={operatingCosts}
          onChangeText={setOperatingCosts}
          placeholder={t('wizard.step4.placeholder')}
          keyboardType="numeric"
          suggestions={costsSuggestions}
          error={errors.costs}
        />
      ),
    },
    {
      id: 'duration',
      title: t('wizard.step5.question'),
      subtitle: t('wizard.step5.subtitle'),
      validation: validateStep5,
      component: (
        <WizardInput
          question={t('wizard.step5.question')}
          helper={t('wizard.step5.helper')}
          helpText={t('wizard.step5.help')}
          value={projectDuration}
          onChangeText={setProjectDuration}
          placeholder={t('wizard.step5.placeholder')}
          keyboardType="numeric"
          suggestions={durationSuggestions}
          error={errors.duration}
        />
      ),
    },
    {
      id: 'growth',
      title: t('wizard.step6.question'),
      subtitle: t('wizard.step6.subtitle'),
      validation: validateStep6,
      component: (
        <WizardInput
          question={t('wizard.step6.question')}
          helper={t('wizard.step6.helper')}
          helpText={t('wizard.step6.help')}
          value={revenueGrowth}
          onChangeText={setRevenueGrowth}
          placeholder={t('wizard.step6.placeholder')}
          keyboardType="numeric"
          suggestions={growthSuggestions}
          error={errors.growth}
        />
      ),
    },
    {
      id: 'discount',
      title: t('wizard.step7.question'),
      subtitle: t('wizard.step7.subtitle'),
      validation: validateStep7,
      component: (
        <WizardInput
          question={t('wizard.step7.question')}
          helper={t('wizard.step7.helper')}
          helpText={t('wizard.step7.help')}
          value={discountRate}
          onChangeText={setDiscountRate}
          placeholder={t('wizard.step7.placeholder')}
          keyboardType="numeric"
          suggestions={discountSuggestions}
          error={errors.discount}
        />
      ),
    },
    {
      id: 'vanguard_ofi',
      title: t('wizard.step8.question'),
      subtitle: t('wizard.step8.subtitle'),
      validation: validateStep8,
      component: (
        <View className="gap-4">
          <WizardInput
            question={t('wizard.step8.manual_hours')}
            helper={t('wizard.step8.helper')}
            value={manualHours}
            onChangeText={setManualHours}
            placeholder="15"
            keyboardType="numeric"
          />
          <WizardInput
            question={t('wizard.step8.cost_per_hour')}
            helper={t('wizard.step8.labor_cost_helper')}
            value={hourlyCost}
            onChangeText={setHourlyCost}
            placeholder="45"
            keyboardType="numeric"
            error={errors.manual}
          />
        </View>
      ),
    },
    {
      id: 'vanguard_tfdi',
      title: t('wizard.step9.question'),
      subtitle: t('wizard.step9.subtitle'),
      validation: validateStep9,
      component: (
        <View className="gap-4">
          <WizardInput
            question={t('wizard.step9.maint_hours')}
            helper={t('wizard.step9.helper')}
            value={maintHours}
            onChangeText={setMaintHours}
            placeholder="20"
            keyboardType="numeric"
          />
          <WizardInput
            question={t('wizard.step9.team_hours')}
            helper={t('wizard.step9.capacity_helper')}
            value={totalSprintHours}
            onChangeText={setTotalSprintHours}
            placeholder="80"
            keyboardType="numeric"
            error={errors.tech}
          />
        </View>
      ),
    },
    {
      id: 'vanguard_ser',
      title: t('wizard.step10.question'),
      subtitle: t('wizard.step10.subtitle'),
      validation: validateStep10,
      component: (
        <View className="gap-4">
          <WizardInput
            question={t('wizard.step10.prev_revenue')}
            helper={t('wizard.step10.helper')}
            value={prevRevenue}
            onChangeText={setPrevRevenue}
            placeholder="50000"
            keyboardType="numeric"
          />
          <WizardInput
            question={t('wizard.step10.prev_expenses')}
            helper={t('wizard.step10.burn_rate_helper')}
            value={prevBurnRate}
            onChangeText={setPrevBurnRate}
            placeholder="40000"
            keyboardType="numeric"
            error={errors.trajectory}
          />
        </View>
      ),
    },

  ];

  const handleSelectTemplate = (template: ProjectTemplate) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Apply template data to form
    if (template.id !== 'blank') {
      setInitialInvestment(template.data.initialInvestment.toString());
      setYearlyRevenue(template.data.yearlyRevenue.toString());
      setOperatingCosts((template.data.monthlyCosts * 12).toString());
      setProjectDuration(template.data.projectDuration.toString());
      setDiscountRate(template.data.discountRate.toString());
    }

    setShowTemplateSelector(false);
  };

  // Auto-save draft
  const formData = {
    name,
    initialInvestment: parseFloat(initialInvestment) || 0,
    discountRate: parseFloat(discountRate) || 10,
    projectDuration: parseFloat(projectDuration) || 24,
    yearlyRevenue: parseFloat(yearlyRevenue) || 0,
    revenueGrowth: parseFloat(revenueGrowth) || 5,
    operatingCosts: parseFloat(operatingCosts) || 0,
    maintenanceCosts: parseFloat(maintenanceCosts) || 0,
  };

  const { status, lastSaved } = useAutoSave({
    data: formData,
    onSave: async (data) => {
      await saveDraft('new', data);
    },
    enabled: name.trim().length > 0, // Only auto-save if name is not empty
  });

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert(t('validations.error'), t('validations.project_name_required'));
      return;
    }

    const investment = parseFloat(initialInvestment);
    const revenue = parseFloat(yearlyRevenue);
    const opCosts = parseFloat(operatingCosts);
    const maintCosts = parseFloat(maintenanceCosts);

    if (isNaN(investment) || investment <= 0) {
      Alert.alert(t('validations.error'), t('validations.invalid_investment'));
      return;
    }

    if (isNaN(revenue) || revenue <= 0) {
      Alert.alert(t('validations.error'), t('validations.invalid_revenue'));
      return;
    }

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    try {
      const calculationService = new CalculationService();

      const baseParams = {
        initialInvestment: investment,
        discountRate: parseFloat(discountRate),
        projectDuration: parseInt(projectDuration),
        yearlyRevenue: revenue,
        revenueGrowth: parseFloat(revenueGrowth),
        operatingCosts: opCosts || 0,
        maintenanceCosts: maintCosts || 0,
      };

      // Calculate Expected, Best and Worst cases using modern service
      const expectedResults = await calculationService.calculateStandard(baseParams);
      const bestResults = await calculationService.calculateStandard({ ...baseParams, multiplier: 1.2 });
      const worstResults = await calculationService.calculateStandard({ ...baseParams, multiplier: 0.8 });

      // Build Vanguard input with real user data
      const vanguardInput = {
        manualProcessHoursPerWeek: parseFloat(manualHours) || 0,
        averageHourlyCost: parseFloat(hourlyCost) || 0,
        automationPotential: 60,      // Keep reasonable baseline for now
        maintenanceHoursPerSprint: parseFloat(maintHours) || 0,
        totalDevHoursPerSprint: parseFloat(totalSprintHours) || 1,
        devTeamAnnualCost: parseFloat(devTeamCost) || 1,
        incidentCostPerMonth: parseFloat(incidentCost) || 0,
        currentRevenue: revenue,
        previousRevenue: parseFloat(prevRevenue) || revenue * 0.8,
        currentBurnRate: opCosts,
        previousBurnRate: parseFloat(prevBurnRate) || opCosts * 0.9,
      };


      const vanguardResults = await calculationService.calculateVanguard(vanguardInput);

      const results = {
        ...expectedResults,
        roiBest: bestResults.roi,
        npvBest: bestResults.npv,
        paybackBest: bestResults.paybackPeriod,
        irrBest: bestResults.irr,
        roiWorst: worstResults.roi,
        npvWorst: worstResults.npv,
        paybackWorst: worstResults.paybackPeriod,
        irrWorst: worstResults.irr,
        // Include Vanguard results in the results object
        vanguard: vanguardResults,
      };

      // Create project
      const project: ProjectData = {
        id: Date.now().toString(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        initialInvestment: investment,
        discountRate: parseFloat(discountRate),
        projectDuration: parseInt(projectDuration),
        yearlyRevenue: revenue,
        revenueGrowth: parseFloat(revenueGrowth),
        operatingCosts: opCosts || 0,
        maintenanceCosts: maintCosts || 0,
        bestCaseMultiplier: 1.2,
        worstCaseMultiplier: 0.8,
        results,
        vanguardInput, // Save the input too
      };

      console.log('Sending project to API...', project);
      const savedId = await saveProject(project);
      console.log('Project saved successfully! ID:', savedId);

      // Emit event to refresh other screens
      eventEmitter.emit(Events.PROJECT_CREATED, savedId);

      // Schedule reminder if notifications are enabled
      if (notificationsAvailable && reminderFrequency !== 'none') {
        try {
          await scheduleProjectReminder(savedId, project.name, reminderFrequency);
        } catch (error) {
          console.error('Error scheduling reminder:', error);
        }
      }

      // Clear draft after successful save
      await clearDraft('new');

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      console.log('Navigating to project details:', `/project/${savedId}`);

      // Force navigation with a small delay to ensure UI updates finish
      // and try push if replace fails (though replace is preferred)
      setTimeout(() => {
        try {
          if (router.canDismiss()) {
            router.dismissAll();
          }
          router.replace(`/project/${savedId}`);
        } catch (e) {
          console.error("Navigation failed, trying push...", e);
          router.push(`/project/${savedId}`);
        }
      }, 100);
    } catch (error) {
      console.error('Error in handleSave:', error);
      // Detailed error alert
      Alert.alert(
        t('validations.error'),
        `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      {showTemplateSelector ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          <TemplateSelector onSelectTemplate={handleSelectTemplate} />
        </ScrollView>
      ) : useWizard ? (
        <MultiStepForm
          steps={wizardSteps}
          onComplete={handleSave}
          onCancel={() => router.back()}
          showProgress={true}
          loading={loading}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          {showTemplateSelector ? (
            <TemplateSelector onSelectTemplate={handleSelectTemplate} />
          ) : (
            <>
              {/* Header */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-3xl font-bold text-foreground">
                    {t('form.new_project')}
                  </Text>
                  <AutoSaveIndicator status={status} lastSaved={lastSaved} />
                </View>
                <Text className="text-sm text-muted">
                  {t('form.fill_details')}
                </Text>
              </View>

              {/* Form Fields */}
              <View className="gap-4">
                {/* Project Name */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    {t('form.project_name')} *
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t('form.project_name_placeholder')}
                    placeholderTextColor="#9CA3AF"
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  />
                </View>

                {/* Initial Investment */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    {t('form.initial_investment')} * ($)
                  </Text>
                  <TextInput
                    value={initialInvestment}
                    onChangeText={setInitialInvestment}
                    placeholder="100000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  />
                </View>

                {/* Project Duration */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    {t('form.project_duration')} ({t('common.months')})
                  </Text>
                  <TextInput
                    value={projectDuration}
                    onChangeText={setProjectDuration}
                    placeholder="24"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  />
                </View>

                {/* Yearly Revenue */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    {t('form.yearly_revenue')} * ($)
                  </Text>
                  <TextInput
                    value={yearlyRevenue}
                    onChangeText={setYearlyRevenue}
                    placeholder="50000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  />
                </View>

                {/* Revenue Growth */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    {t('form.revenue_growth')} (%)
                  </Text>
                  <TextInput
                    value={revenueGrowth}
                    onChangeText={setRevenueGrowth}
                    placeholder="5"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  />
                </View>

                {/* Operating Costs */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    {t('form.operating_costs')} ($)
                  </Text>
                  <TextInput
                    value={operatingCosts}
                    onChangeText={setOperatingCosts}
                    placeholder="20000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  />
                </View>

                {/* Maintenance Costs */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    {t('form.maintenance_costs')} ($)
                  </Text>
                  <TextInput
                    value={maintenanceCosts}
                    onChangeText={setMaintenanceCosts}
                    placeholder="5000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  />
                </View>

                {/* Discount Rate */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    {t('form.discount_rate')} (%)
                  </Text>
                  <TextInput
                    value={discountRate}
                    onChangeText={setDiscountRate}
                    placeholder="10"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  />
                </View>
              </View>

              {/* Reminder Frequency (if notifications enabled) */}
              {notificationsAvailable && (
                <View className="mt-6">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    🔔 {t('notifications.reminder_frequency')}
                  </Text>
                  <View className="bg-surface border border-border rounded-xl overflow-hidden">
                    {(['none', 'weekly', 'biweekly', 'monthly', 'quarterly'] as ReminderFrequency[]).map(
                      (freq) => (
                        <TouchableOpacity
                          key={freq}
                          onPress={() => {
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            setReminderFrequency(freq);
                          }}
                          className="flex-row items-center justify-between p-4 border-b border-border/50"
                        >
                          <Text
                            className={`text-base ${reminderFrequency === freq
                              ? 'text-primary font-semibold'
                              : 'text-foreground'
                              }`}
                          >
                            {getFrequencyDisplayName(freq, language)}
                          </Text>
                          {reminderFrequency === freq && (
                            <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                              <Text className="text-background text-xs font-bold">✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                  <Text className="text-xs text-muted mt-2">
                    {t('notifications.reminder_frequency_desc')}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View className="gap-3 mt-8">
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={loading}
                  className={`bg-primary rounded-xl py-4 items-center ${loading ? 'opacity-50' : ''
                    }`}
                >
                  <Text className="text-background font-semibold text-base">
                    {loading ? t('common.saving') : t('common.calculate_save')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.back()}
                  disabled={loading}
                  className="bg-surface border border-border rounded-xl py-4 items-center"
                >
                  <Text className="text-foreground font-semibold text-base">
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
