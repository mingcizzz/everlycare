import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, TextInput, Button, Chip, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { useReminderStore } from '../../../store/reminderStore';
import { reminderService } from '../../../services/reminder.service';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { GradientButton } from '../../../components/ui/GradientCard';
import type { Reminder, ReminderSchedule } from '../../../types/recipient';
import type { RootStackScreenProps } from '../../../types/navigation';

type ReminderType = Reminder['reminderType'];
type ScheduleMode = 'interval' | 'times';

const INTERVAL_PRESETS = [60, 120, 180, 240]; // minutes

const TYPE_PRESETS: Record<
  ReminderType,
  { titleKey: string; schedule: ReminderSchedule }
> = {
  toilet: {
    titleKey: 'reminders.toilet',
    schedule: { intervalMinutes: 120 },
  },
  medication: {
    titleKey: 'reminders.medication',
    schedule: { times: ['08:00', '20:00'] },
  },
  fluid: {
    titleKey: 'reminders.fluid',
    schedule: { intervalMinutes: 120 },
  },
  custom: {
    titleKey: 'reminders.custom',
    schedule: { intervalMinutes: 60 },
  },
};

export function ReminderFormScreen({
  route,
  navigation,
}: RootStackScreenProps<'ReminderForm'>) {
  const { t } = useTranslation();
  const { activeRecipient } = useRecipientStore();
  const { createReminder, loadReminders } = useReminderStore();

  const editingId = route.params?.reminderId;
  const [isLoading, setIsLoading] = useState(false);
  const [reminderType, setReminderType] = useState<ReminderType>('toilet');
  const [title, setTitle] = useState(t('reminders.toilet'));
  const [mode, setMode] = useState<ScheduleMode>('interval');
  const [intervalMinutes, setIntervalMinutes] = useState(120);
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    if (editingId) {
      reminderService
        .getAll(activeRecipient?.id || '')
        .then((list) => list.find((r) => r.id === editingId))
        .then((r) => {
          if (!r) return;
          setReminderType(r.reminderType);
          setTitle(r.title);
          if (r.schedule.intervalMinutes) {
            setMode('interval');
            setIntervalMinutes(r.schedule.intervalMinutes);
          } else if (r.schedule.times) {
            setMode('times');
            setTimes(r.schedule.times);
          }
        });
    }
  }, [editingId, activeRecipient?.id]);

  const selectType = (type: ReminderType) => {
    setReminderType(type);
    setTitle(t(TYPE_PRESETS[type].titleKey));
    const preset = TYPE_PRESETS[type].schedule;
    if (preset.intervalMinutes) {
      setMode('interval');
      setIntervalMinutes(preset.intervalMinutes);
    } else if (preset.times) {
      setMode('times');
      setTimes(preset.times);
    }
  };

  const addTime = () => {
    if (!/^\d{2}:\d{2}$/.test(newTime)) {
      Alert.alert(t('common.error'), 'Format: HH:MM');
      return;
    }
    if (!times.includes(newTime)) {
      setTimes([...times, newTime].sort());
    }
    setNewTime('');
  };

  const removeTime = (time: string) => {
    setTimes(times.filter((t) => t !== time));
  };

  const handleSave = async () => {
    if (!activeRecipient || !title.trim()) return;
    setIsLoading(true);
    try {
      const schedule: ReminderSchedule =
        mode === 'interval' ? { intervalMinutes } : { times };

      await createReminder(
        activeRecipient.id,
        title.trim(),
        reminderType,
        schedule,
        { title: title.trim(), body: t(`reminders.${reminderType}`) }
      );
      await loadReminders(activeRecipient.id);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const types: ReminderType[] = ['toilet', 'medication', 'fluid', 'custom'];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>{t('reminders.addReminder')}</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.fieldLabel}>{t('reminders.title')}</Text>
          <View style={styles.chipRow}>
            {types.map((type) => (
              <Chip
                key={type}
                selected={reminderType === type}
                onPress={() => selectType(type)}
                style={styles.chip}
              >
                {t(`reminders.${type}`)}
              </Chip>
            ))}
          </View>

          <TextInput
            label={t('reminders.title')}
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />

          <Text style={styles.fieldLabel}>Schedule</Text>
          <View style={styles.chipRow}>
            <Chip
              selected={mode === 'interval'}
              onPress={() => setMode('interval')}
              style={styles.chip}
            >
              Interval
            </Chip>
            <Chip
              selected={mode === 'times'}
              onPress={() => setMode('times')}
              style={styles.chip}
            >
              Times
            </Chip>
          </View>

          {mode === 'interval' ? (
            <View style={styles.chipRow}>
              {INTERVAL_PRESETS.map((minutes) => {
                const hours = minutes / 60;
                return (
                  <Chip
                    key={minutes}
                    selected={intervalMinutes === minutes}
                    onPress={() => setIntervalMinutes(minutes)}
                    style={styles.chip}
                  >
                    {hours === 1 ? '1 hour' : `${hours} hours`}
                  </Chip>
                );
              })}
            </View>
          ) : (
            <>
              <View style={styles.chipRow}>
                {times.map((time) => (
                  <Chip
                    key={time}
                    onClose={() => removeTime(time)}
                    style={styles.chip}
                  >
                    {time}
                  </Chip>
                ))}
              </View>
              <View style={styles.timeInputRow}>
                <TextInput
                  label="HH:MM"
                  value={newTime}
                  onChangeText={setNewTime}
                  mode="outlined"
                  placeholder="08:00"
                  style={[styles.input, { flex: 1 }]}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                />
                <Button
                  mode="contained-tonal"
                  onPress={addTime}
                  style={styles.addTimeButton}
                >
                  {t('common.add')}
                </Button>
              </View>
            </>
          )}

          <View style={styles.infoBox}>
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={colors.info}
            />
            <Text style={styles.infoText}>
              Based on real caregiving experience: toilet reminders every 2 hours
              help prevent incontinence.
            </Text>
          </View>

          <GradientButton
            label={t('common.save')}
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading || !title.trim()}
            style={styles.gradientButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
    padding: spacing.lg,
    gap: spacing.md,
  },
  fieldLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.surface,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    marginBottom: spacing.xs,
    borderRadius: borderRadius.full,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addTimeButton: {
    borderRadius: borderRadius.md,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.info + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoText: {
    ...typography.caption,
    color: colors.info,
    flex: 1,
  },
  gradientButton: {
    marginTop: spacing.lg,
  },
});
