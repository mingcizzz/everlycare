import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { useReminderStore } from '../../../store/reminderStore';
import type { Reminder } from '../../../types/recipient';
import type { RootStackScreenProps } from '../../../types/navigation';

const TYPE_META: Record<Reminder['reminderType'], { icon: string; color: string }> = {
  toilet: { icon: 'toilet', color: '#8B5CF6' },
  medication: { icon: 'pill', color: '#059669' },
  fluid: { icon: 'cup-water', color: '#3B82F6' },
  custom: { icon: 'bell', color: '#F59E0B' },
};

export function RemindersScreen({ navigation }: RootStackScreenProps<'Reminders'>) {
  const { t } = useTranslation();
  const { activeRecipient } = useRecipientStore();
  const { reminders, isLoading, loadReminders, toggleReminder, deleteReminder } =
    useReminderStore();

  const refresh = useCallback(async () => {
    if (activeRecipient) {
      await loadReminders(activeRecipient.id);
    }
  }, [activeRecipient?.id, loadReminders]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleToggle = async (reminder: Reminder, value: boolean) => {
    await toggleReminder(reminder, value, {
      title: reminder.title,
      body: t(`reminders.${reminder.reminderType}`),
    });
  };

  const handleDelete = (reminder: Reminder) => {
    Alert.alert(
      t('common.delete'),
      reminder.title,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteReminder(reminder),
        },
      ]
    );
  };

  const formatSchedule = (reminder: Reminder): string => {
    const s = reminder.schedule;
    if (s.intervalMinutes) {
      const hours = Math.floor(s.intervalMinutes / 60);
      const mins = s.intervalMinutes % 60;
      if (hours > 0 && mins === 0) return `${t('common.add')} ${hours}h`;
      return `${s.intervalMinutes}min`;
    }
    if (s.times && s.times.length > 0) {
      return s.times.join(', ');
    }
    return '';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Dark compact header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('reminders.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        {reminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="bell-off-outline"
              size={48}
              color="#94A3B8"
            />
            <Text style={styles.emptyText}>{t('common.noData')}</Text>
            <Text style={styles.emptySubtext}>{t('reminders.addReminder')}</Text>
          </View>
        ) : (
          reminders.map((reminder) => {
            const meta = TYPE_META[reminder.reminderType];
            return (
              <TouchableOpacity
                key={reminder.id}
                onPress={() =>
                  navigation.navigate('ReminderForm', { reminderId: reminder.id })
                }
                onLongPress={() => handleDelete(reminder)}
                activeOpacity={0.7}
                style={styles.reminderCard}
              >
                <View
                  style={[
                    styles.iconBg,
                    { backgroundColor: meta.color + '18' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={meta.icon as any}
                    size={22}
                    color={meta.color}
                  />
                </View>
                <View style={styles.reminderText}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <Text style={styles.reminderSchedule}>
                    {formatSchedule(reminder)}
                  </Text>
                </View>
                <Switch
                  value={reminder.isActive}
                  onValueChange={(v) => handleToggle(reminder, v)}
                  trackColor={{ false: '#E2E8F0', true: '#059669' }}
                  thumbColor="#FFFFFF"
                />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate('ReminderForm', {})}
        activeOpacity={0.8}
        style={styles.fab}
      >
        <MaterialCommunityIcons name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#064E3B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#064E3B',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 120,
  },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderText: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  reminderSchedule: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
});
