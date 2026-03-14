import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@device_id';

/**
 * Hook to get unique device identifier for usage tracking
 * 
 * Uses platform-specific identifiers:
 * - iOS: identifierForVendor (IDFV)
 * - Android: androidId
 * - Web: Generated UUID stored in AsyncStorage
 */
export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeviceId();
  }, []);

  const getDeviceId = async () => {
    try {
      let id: string | null = null;

      if (Platform.OS === 'ios') {
        // iOS: Use identifierForVendor (IDFV)
        // This ID is unique per app vendor and persists across app reinstalls
        // unless all apps from the same vendor are uninstalled
        id = await Application.getIosIdForVendorAsync();

        if (!id) {
          console.warn('[DeviceId] iOS IDFV not available, generating fallback');
          id = await getFallbackDeviceId();
        }
      } else if (Platform.OS === 'android') {
        // Android: Use androidId
        // This ID is unique per device and app signing key
        id = Application.getAndroidId();

        if (!id) {
          console.warn('[DeviceId] Android ID not available, generating fallback');
          id = await getFallbackDeviceId();
        }
      } else {
        // Web: Generate and persist UUID
        id = await getFallbackDeviceId();
      }

      console.log('[DeviceId] Device ID obtained:', id?.substring(0, 8) + '...');
      setDeviceId(id);
      setLoading(false);
    } catch (error) {
      console.error('[DeviceId] Error getting device ID:', error);

      // Fallback to generated ID
      const fallbackId = await getFallbackDeviceId();
      setDeviceId(fallbackId);
      setLoading(false);
    }
  };

  /**
   * Generate and persist a fallback device ID
   * Used when platform-specific IDs are unavailable
   */
  const getFallbackDeviceId = async (): Promise<string> => {
    try {
      // Check if we already have a stored ID
      const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (stored) {
        return stored;
      }

      // Generate new UUID
      const uuid = generateUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, uuid);

      console.log('[DeviceId] Generated fallback ID:', uuid.substring(0, 8) + '...');
      return uuid;
    } catch (error) {
      console.error('[DeviceId] Error with fallback ID:', error);
      // Last resort: generate UUID without persistence
      return generateUUID();
    }
  };

  /**
   * Simple UUID v4 generator
   */
  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  return { deviceId, loading };
}
