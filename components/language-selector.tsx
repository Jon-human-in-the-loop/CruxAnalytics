import { View, Text, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '@/lib/i18n-context';
import { useColors } from '@/hooks/use-colors';

export function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const colors = useColors();

  const handleLanguageChange = async (lang: 'es' | 'en') => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setLanguage(lang);
  };

  return (
    <View
      style={{ backgroundColor: colors.surface, borderRadius: 999, padding: 4 }}
      className="flex-row gap-2"
    >
      <Pressable
        onPress={() => handleLanguageChange('es')}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          backgroundColor: language === 'es' ? colors.primary : 'transparent',
          borderRadius: 999,
          paddingHorizontal: 16,
          paddingVertical: 8,
        })}
      >
        <Text style={{ color: language === 'es' ? colors.background : colors.foreground, fontWeight: '600' }}>
          ES
        </Text>
      </Pressable>

      <Pressable
        onPress={() => handleLanguageChange('en')}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          backgroundColor: language === 'en' ? colors.primary : 'transparent',
          borderRadius: 999,
          paddingHorizontal: 16,
          paddingVertical: 8,
        })}
      >
        <Text style={{ color: language === 'en' ? colors.background : colors.foreground, fontWeight: '600' }}>
          EN
        </Text>
      </Pressable>
    </View>
  );
}
