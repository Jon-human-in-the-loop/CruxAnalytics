import { View, Text, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useTranslation } from '@/lib/i18n-context';
import type { AutoSaveStatus } from '@/hooks/use-auto-save';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved?: Date | null;
}

export function AutoSaveIndicator({ status, lastSaved }: AutoSaveIndicatorProps) {
  const colors = useColors();
  const { t } = useTranslation();

  if (status === 'idle' && !lastSaved) {
    return null;
  }

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return t('common.saving');
      case 'saved':
        return t('form.auto_saved');
      case 'error':
        return t('form.save_error');
      case 'idle':
        if (lastSaved) {
          const minutes = Math.floor((Date.now() - lastSaved.getTime()) / 60000);
          if (minutes < 1) {
            return t('form.auto_saved');
          }
          return `${t('form.auto_saved')} (${minutes}m)`;
        }
        return '';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'saving':
        return colors.muted;
      case 'saved':
        return colors.success;
      case 'error':
        return colors.error;
      default:
        return colors.muted;
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      {status === 'saving' && (
        <ActivityIndicator size="small" color={colors.primary} />
      )}

      {status === 'saved' && (
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: colors.success,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
        </View>
      )}

      {status === 'error' && (
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: colors.error,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>!</Text>
        </View>
      )}

      <Text
        style={{
          fontSize: 12,
          color: getStatusColor(),
          fontWeight: status === 'saving' ? '500' : '400',
        }}
      >
        {getStatusText()}
      </Text>
    </View>
  );
}
