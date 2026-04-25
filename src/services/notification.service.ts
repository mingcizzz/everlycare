import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { Reminder } from '../types/recipient';

// Configure notification handler (foreground behavior)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      // Simulators don't support push
      return false;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Care Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A90A4',
      });
    }

    return finalStatus === 'granted';
  },

  /**
   * Schedule a reminder as local notifications. Returns the notification IDs so
   * they can be cancelled later when the reminder is disabled/deleted.
   */
  async scheduleReminder(reminder: Reminder, titleText: string, bodyText: string): Promise<string[]> {
    const notificationIds: string[] = [];
    const { schedule } = reminder;

    // Interval-based (e.g. every 120 minutes)
    if (schedule.intervalMinutes && schedule.intervalMinutes > 0) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: titleText,
          body: bodyText,
          sound: 'default',
          data: { reminderId: reminder.id, type: reminder.reminderType },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: schedule.intervalMinutes * 60,
          repeats: true,
          channelId: 'reminders',
        },
      });
      notificationIds.push(id);
      return notificationIds;
    }

    // Specific times of day (e.g. "08:00", "20:00")
    if (schedule.times && schedule.times.length > 0) {
      for (const timeStr of schedule.times) {
        const [hour, minute] = timeStr.split(':').map(Number);
        if (Number.isNaN(hour) || Number.isNaN(minute)) continue;

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: titleText,
            body: bodyText,
            sound: 'default',
            data: { reminderId: reminder.id, type: reminder.reminderType },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: 'reminders',
          },
        });
        notificationIds.push(id);
      }
    }

    return notificationIds;
  },

  async cancelNotifications(notificationIds: string[]): Promise<void> {
    for (const id of notificationIds) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {
        // Ignore errors for already-cancelled ids
      }
    }
  },

  /** Schedule a one-shot notification N seconds from now. Returns the notification ID. */
  async scheduleOnceAfter(
    secondsFromNow: number,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default', data: data ?? {} },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.floor(secondsFromNow)),
        repeats: false,
        channelId: 'reminders',
      },
    });
  },

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async getAllScheduled() {
    return Notifications.getAllScheduledNotificationsAsync();
  },

  /**
   * Register notification action categories. Call once at app startup.
   * - TOILET_REMINDER: "已如厕" logs a visit / "30分钟后" snoozes the reminder
   */
  async setupCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('TOILET_REMINDER', [
      {
        identifier: 'LOGGED',
        buttonTitle: '✓ 已如厕',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'SNOOZE_30',
        buttonTitle: '⏰ 30分钟后',
        options: { opensAppToForeground: false },
      },
    ]);
  },
};
