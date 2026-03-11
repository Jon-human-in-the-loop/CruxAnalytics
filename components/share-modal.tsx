import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  Platform,
  Share as RNShare,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { useTranslation } from '@/lib/i18n-context';
import { useColors } from '@/hooks/use-colors';
import { generateShareableLink, getShareMessage } from '@/lib/share-links';
import type { ProjectData } from '@/types/project';

interface ShareModalProps {
  visible: boolean;
  project: ProjectData;
  onClose: () => void;
}

export function ShareModal({ visible, project, onClose }: ShareModalProps) {
  const { t, language } = useTranslation();
  const colors = useColors();
  const [shareLink, setShareLink] = useState<string>('');
  const [linkGenerated, setLinkGenerated] = useState(false);

  React.useEffect(() => {
    if (visible && !linkGenerated) {
      generateLink();
    }
  }, [visible]);

  const generateLink = () => {
    try {
      const link = generateShareableLink(project);
      setShareLink(link);
      setLinkGenerated(true);
    } catch (error) {
      console.error('Error generating link:', error);
      Alert.alert(t('validations.error'), t('share.generate_error'));
    }
  };

  const handleCopyLink = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await Clipboard.setStringAsync(shareLink);
      Alert.alert(t('share.link_copied_title'), t('share.link_copied_message'));
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert(t('validations.error'), t('share.copy_error'));
    }
  };

  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const message = getShareMessage(project, shareLink, language);

      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        // Web Share API (mobile browsers: Chrome Android, Safari iOS, etc.)
        await navigator.share({
          title: project.name,
          text: message,
          url: shareLink,
        });
      } else if (Platform.OS !== 'web') {
        // React Native native share
        await RNShare.share({
          message,
          title: project.name,
        });
      } else {
        // Fallback: copy to clipboard
        await Clipboard.setStringAsync(message);
        Alert.alert(t('share.copied_title'), t('share.copied_message'));
      }
    } catch (error: any) {
      // User cancelled share — not an error
      if (error?.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <View className="bg-background rounded-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <View className="p-6 border-b border-border">
            <Text className="text-2xl font-bold text-foreground mb-2">
              {t('share.share_project')}
            </Text>
            <Text className="text-sm text-muted">
              {t('share.share_description')}
            </Text>
          </View>

          {/* Content */}
          <View className="p-6 gap-4">
            {/* Link Preview */}
            <View className="bg-surface rounded-xl p-4">
              <Text className="text-xs text-muted mb-2">{t('share.shareable_link')}</Text>
              <Text className="text-sm text-foreground" numberOfLines={2}>
                {shareLink || t('common.loading')}
              </Text>
            </View>

            {/* Copy Link Button */}
            <TouchableOpacity
              onPress={handleCopyLink}
              disabled={!linkGenerated}
              className="bg-surface border border-border rounded-xl py-4 items-center active:opacity-70"
            >
              <Text className="text-foreground font-semibold text-base">
                {t('share.copy_link')}
              </Text>
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              onPress={handleShare}
              disabled={!linkGenerated}
              className="bg-primary rounded-xl py-4 items-center active:opacity-80"
            >
              <Text className="text-background font-semibold text-base">
                📤 {t('share.share_via')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="p-4 border-t border-border">
            <TouchableOpacity
              onPress={handleClose}
              className="py-2 items-center"
            >
              <Text className="text-muted font-medium">
                {t('common.close')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
