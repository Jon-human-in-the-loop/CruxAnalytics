import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "@/lib/i18n-context";

export default function TabLayout() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        lazy: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: t('tabs.projects'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="folder.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
        }}
      />
      
      {/* Calculator routes - hidden from tab bar but accessible via navigation */}
      <Tabs.Screen
        name="calculators/break-even"
        options={{
          href: null, // Hide from tab bar
          title: 'Break-Even',
        }}
      />
      <Tabs.Screen
        name="calculators/cash-flow"
        options={{
          href: null,
          title: 'Cash Flow',
        }}
      />
      <Tabs.Screen
        name="calculators/pricing"
        options={{
          href: null,
          title: 'Pricing',
        }}
      />
      <Tabs.Screen
        name="calculators/loan"
        options={{
          href: null,
          title: 'Loan',
        }}
      />
      <Tabs.Screen
        name="calculators/employee-roi"
        options={{
          href: null,
          title: 'Employee ROI',
        }}
      />
      <Tabs.Screen
        name="calculators/marketing"
        options={{
          href: null,
          title: 'Marketing ROI',
        }}
      />
    </Tabs>
  );
}
