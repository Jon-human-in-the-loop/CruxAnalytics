import React, { useEffect } from 'react';
import { View, Text, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

export function Toast({ visible, message, type = 'success', duration = 3000, onHide }: ToastProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      if (Platform.OS !== 'web') {
        if (type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }

      // Show animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) {
        onHide();
      }
    });
  };

  if (!visible) {
    return null;
  }

  const config: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; bgColor: string }> = {
    success: {
      icon: 'checkmark-circle',
      bgColor: colors.success,
    },
    error: {
      icon: 'close-circle',
      bgColor: colors.error,
    },
    info: {
      icon: 'information-circle',
      bgColor: colors.primary,
    },
    warning: {
      icon: 'warning',
      bgColor: colors.warning,
    },
  };

  const { icon, bgColor } = config[type];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: insets.bottom + 20,
        left: 16,
        right: 16,
        opacity,
        transform: [{ translateY }],
        zIndex: 9999,
      }}
    >
      <View
        style={{
          backgroundColor: bgColor,
          borderRadius: 12,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View style={{ marginRight: 12 }}>
          <Ionicons name={icon} size={22} color="#FFFFFF" />
        </View>
        <Text
          style={{
            flex: 1,
            color: '#FFFFFF',
            fontSize: 15,
            fontWeight: '600',
            lineHeight: 20,
          }}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

// Hook for easy toast usage
export function useToast() {
  const [toast, setToast] = React.useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  return {
    toast,
    showToast,
    hideToast,
  };
}
