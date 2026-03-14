import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type ReminderFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'none';

export interface ProjectReminder {
  projectId: string;
  projectName: string;
  frequency: ReminderFrequency;
  notificationId?: string;
  nextReminderDate?: number;
}

const REMINDERS_STORAGE_KEY = '@project_reminders';
const NOTIFICATIONS_ENABLED_KEY = '@notifications_enabled';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('project-reminders', {
        name: 'Project Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0a7ea4',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Check if notifications are enabled globally
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking notifications enabled:', error);
    return false;
  }
}

/**
 * Enable or disable notifications globally
 */
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled.toString());

    if (!enabled) {
      // Cancel all scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
    } else {
      // Re-schedule all reminders
      const reminders = await getAllReminders();
      for (const reminder of reminders) {
        if (reminder.frequency !== 'none') {
          await scheduleProjectReminder(
            reminder.projectId,
            reminder.projectName,
            reminder.frequency
          );
        }
      }
    }
  } catch (error) {
    console.error('Error setting notifications enabled:', error);
  }
}

/**
 * Get frequency in seconds
 */
function getFrequencyInSeconds(frequency: ReminderFrequency): number {
  switch (frequency) {
    case 'weekly':
      return 7 * 24 * 60 * 60; // 7 days
    case 'biweekly':
      return 14 * 24 * 60 * 60; // 14 days
    case 'monthly':
      return 30 * 24 * 60 * 60; // 30 days
    case 'quarterly':
      return 90 * 24 * 60 * 60; // 90 days
    default:
      return 0;
  }
}

/**
 * Schedule a reminder notification for a project
 */
export async function scheduleProjectReminder(
  projectId: string,
  projectName: string,
  frequency: ReminderFrequency
): Promise<void> {
  try {
    if (frequency === 'none') {
      await cancelProjectReminder(projectId);
      return;
    }

    const enabled = await areNotificationsEnabled();
    if (!enabled) {
      console.log('Notifications are disabled globally');
      return;
    }

    // Cancel existing reminder if any
    await cancelProjectReminder(projectId);

    // Schedule new notification
    const trigger: Notifications.TimeIntervalTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: getFrequencyInSeconds(frequency),
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `📊 Revisión de Proyecto: ${projectName}`,
        body: 'Es momento de revisar y actualizar tu análisis financiero',
        data: { projectId, type: 'project_reminder' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });

    // Save reminder configuration
    const reminders = await getAllReminders();
    const existingIndex = reminders.findIndex((r) => r.projectId === projectId);

    const reminder: ProjectReminder = {
      projectId,
      projectName,
      frequency,
      notificationId,
      nextReminderDate: Date.now() + getFrequencyInSeconds(frequency) * 1000,
    };

    if (existingIndex >= 0) {
      reminders[existingIndex] = reminder;
    } else {
      reminders.push(reminder);
    }

    await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch (error) {
    console.error('Error scheduling project reminder:', error);
    throw error;
  }
}

/**
 * Cancel a project reminder
 */
export async function cancelProjectReminder(projectId: string): Promise<void> {
  try {
    const reminders = await getAllReminders();
    const reminder = reminders.find((r) => r.projectId === projectId);

    if (reminder?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
    }

    // Remove from storage
    const updatedReminders = reminders.filter((r) => r.projectId !== projectId);
    await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(updatedReminders));
  } catch (error) {
    console.error('Error canceling project reminder:', error);
  }
}

/**
 * Check if a project has an active reminder
 */
export async function hasActiveReminder(projectId: string): Promise<boolean> {
  try {
    const reminders = await getAllReminders();
    const reminder = reminders.find((r) => r.projectId === projectId);
    return reminder !== undefined && reminder.frequency !== 'none';
  } catch (error) {
    console.error('Error checking active reminder:', error);
    return false;
  }
}

/**
 * Get reminder for a specific project
 */
export async function getProjectReminder(projectId: string): Promise<ProjectReminder | null> {
  try {
    const reminders = await getAllReminders();
    return reminders.find((r) => r.projectId === projectId) || null;
  } catch (error) {
    console.error('Error getting project reminder:', error);
    return null;
  }
}

/**
 * Get all scheduled reminders
 */
export async function getAllReminders(): Promise<ProjectReminder[]> {
  try {
    const remindersJson = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!remindersJson) return [];
    return JSON.parse(remindersJson);
  } catch (error) {
    console.error('Error getting reminders:', error);
    return [];
  }
}

/**
 * Update project name in reminder (when project is renamed)
 */
export async function updateProjectReminderName(
  projectId: string,
  newName: string
): Promise<void> {
  try {
    const reminders = await getAllReminders();
    const reminderIndex = reminders.findIndex((r) => r.projectId === projectId);

    if (reminderIndex >= 0) {
      reminders[reminderIndex].projectName = newName;
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    }
  } catch (error) {
    console.error('Error updating project reminder name:', error);
  }
}

/**
 * Handle notification response (when user taps notification)
 */
export function addNotificationResponseListener(
  callback: (projectId: string) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data.type === 'project_reminder' && data.projectId) {
      callback(data.projectId as string);
    }
  });
}

/**
 * Check all projects and schedule one-time notifications for those
 * that haven't been updated in `staleDays` days.
 * Safe to call on every app launch – it skips projects that already have
 * a pending stale notification stored under STALE_NOTIF_KEY.
 */
const STALE_NOTIF_KEY = '@stale_project_notifications';

export async function checkStaleProjects(
  projects: Array<{ id: string; name: string; updatedAt?: string | null }>,
  staleDays = 30,
): Promise<void> {
  try {
    const enabled = await areNotificationsEnabled();
    if (!enabled) return;

    const nowMs = Date.now();
    const thresholdMs = staleDays * 24 * 60 * 60 * 1000;

    // Load already-scheduled stale notif ids to avoid duplicates
    const storedRaw = await AsyncStorage.getItem(STALE_NOTIF_KEY);
    const scheduledIds: Record<string, number> = storedRaw ? JSON.parse(storedRaw) : {};

    const updatedScheduled = { ...scheduledIds };
    let changed = false;

    for (const project of projects) {
      if (!project.updatedAt) continue;

      const lastUpdatedMs = new Date(project.updatedAt).getTime();
      const ageMs = nowMs - lastUpdatedMs;

      if (ageMs < thresholdMs) continue; // project is recent, skip

      // Check if we already have a pending notification for this project
      const existingNotifId = scheduledIds[project.id];
      if (existingNotifId) {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const stillPending = scheduled.some(
          (n) => (n as any).identifier === String(existingNotifId),
        );
        if (stillPending) continue; // already scheduled
      }

      const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
      const body = `"${project.name}" no ha sido actualizado en ${days} días. ¿Es momento de revisar tus números?`;

      // Schedule for 10 seconds from now (one-shot) so it fires soon but
      // doesn't interrupt the current session immediately.
      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Recordatorio de Proyecto',
          body,
          data: { projectId: project.id, type: 'stale_reminder' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10,
          repeats: false,
        },
      });

      updatedScheduled[project.id] = Date.now();
      changed = true;

      console.log(`[Notifications] Stale reminder scheduled for "${project.name}" (${days}d)`);
    }

    if (changed) {
      await AsyncStorage.setItem(STALE_NOTIF_KEY, JSON.stringify(updatedScheduled));
    }
  } catch (error) {
    console.error('Error checking stale projects:', error);
  }
}

/**
 * Get frequency display name
 */
export function getFrequencyDisplayName(
  frequency: ReminderFrequency,
  language: 'es' | 'en'
): string {
  const names = {
    es: {
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      none: 'Ninguno',
    },
    en: {
      weekly: 'Weekly',
      biweekly: 'Biweekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      none: 'None',
    },
  };

  return names[language][frequency];
}
