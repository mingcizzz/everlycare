import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Switch, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { useReminderStore } from '../../../store/reminderStore';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import type { Reminder } from '../../../types/recipient';
import type { RootStackScreenProps } from '../../../types/navigation';

const TYPE_META: Record<Reminder['reminderType'], { icon: string; color: string }> = {
  toilet: { icon: 'toilet', color: colors.logBowel },
  medication: { icon: 'pill', color: colors.logMedication },
  fluid: { icon: 'cup-water', color: colors.logUrination },
  custom: { icon: 'bell', color: colors.warning },
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>{t('reminders.title')}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        {reminders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="bell-off-outline"
                size={80}
                color={colors.textTertiary}
              />
              <Text style={styles.emptyText}>{t('common.noData')}</Text>
              <Text style={styles.emptySubtext}>{t('reminders.addReminder')}</Text>
            </Card.Content>
          </Card>
        ) : (
          reminders.map((reminder) => {
            const meta = TYPE_META[reminder.reminderType];
            return (
              <Card key={reminder.id} style={styles.reminderCard}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ReminderForm', { reminderId: reminder.id })
                  }
                  onLongPress={() => handleDelete(reminder)}
                  activeOpacity={0.7}
                >
                  <Card.Content style={styles.reminderContent}>
                    <View
                      style={[
                        styles.iconBg,
                        { backgroundColor: meta.color + '20' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={meta.icon as any}
                        size={24}
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
                      color={colors.primary}
                    />
                  </Card.Content>
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={() => navigation.navigate('ReminderForm', {})}
        activeOpacity={0.8}
        style={styles.fab}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="plus" size={28} color={colors.textOnPrimary} />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
    ...shadows.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: 120,
  },
  reminderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderText: {
    flex: 1,
  },
  reminderTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  reminderSchedule: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    borderRadius: borderRadius.full,
    ...shadows.lg,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
