import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Reminder, ReminderSchedule } from '../types/recipient';
import { reminderService } from '../services/reminder.service';
import { notificationService } from '../services/notification.service';

// We persist a map of reminderId -> scheduled notification ids so we can cancel them
const NOTIF_MAP_KEY = 'everlycare.reminder.notifications';

async function loadNotifMap(): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveNotifMap(map: Record<string, string[]>): Promise<void> {
  await AsyncStorage.setItem(NOTIF_MAP_KEY, JSON.stringify(map));
}

interface ReminderStore {
  reminders: Reminder[];
  isLoading: boolean;
  loadReminders: (recipientId: string) => Promise<void>;
  createReminder: (
    recipientId: string,
    title: string,
    reminderType: Reminder['reminderType'],
    schedule: ReminderSchedule,
    notificationContent: { title: string; body: string }
  ) => Promise<void>;
  toggleReminder: (
    reminder: Reminder,
    enabled: boolean,
    notificationContent: { title: string; body: string }
  ) => Promise<void>;
  deleteReminder: (reminder: Reminder) => Promise<void>;
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: [],
  isLoading: false,

  loadReminders: async (recipientId) => {
    set({ isLoading: true });
    try {
      const reminders = await reminderService.getAll(recipientId);
      set({ reminders, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createReminder: async (recipientId, title, reminderType, schedule, notificationContent) => {
    const reminder = await reminderService.create(
      recipientId,
      title,
      reminderType,
      schedule
    );

    // Schedule local notifications
    const granted = await notificationService.requestPermissions();
    if (granted) {
      const ids = await notificationService.scheduleReminder(
        reminder,
        notificationContent.title,
        notificationContent.body
      );
      const map = await loadNotifMap();
      map[reminder.id] = ids;
      await saveNotifMap(map);
    }

    set((state) => ({ reminders: [reminder, ...state.reminders] }));
  },

  toggleReminder: async (reminder, enabled, notificationContent) => {
    const updated = await reminderService.update(reminder.id, { isActive: enabled });

    const map = await loadNotifMap();
    if (enabled) {
      // Schedule
      const granted = await notificationService.requestPermissions();
      if (granted) {
        const ids = await notificationService.scheduleReminder(
          updated,
          notificationContent.title,
          notificationContent.body
        );
        map[reminder.id] = ids;
        await saveNotifMap(map);
      }
    } else {
      // Cancel
      const ids = map[reminder.id] || [];
      await notificationService.cancelNotifications(ids);
      delete map[reminder.id];
      await saveNotifMap(map);
    }

    set((state) => ({
      reminders: state.reminders.map((r) => (r.id === reminder.id ? updated : r)),
    }));
  },

  deleteReminder: async (reminder) => {
    // Cancel any scheduled notifications first
    const map = await loadNotifMap();
    const ids = map[reminder.id] || [];
    await notificationService.cancelNotifications(ids);
    delete map[reminder.id];
    await saveNotifMap(map);

    await reminderService.delete(reminder.id);

    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== reminder.id),
    }));
  },
}));
