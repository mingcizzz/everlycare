import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { useReminderStore } from '../../../store/reminderStore';
import { reminderService } from '../../../services/reminder.service';
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Dark compact header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('reminders.addReminder')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type chips */}
          <Text style={styles.fieldLabel}>{t('reminders.title')}</Text>
          <View style={styles.chipRow}>
            {types.map((type) => {
              const selected = reminderType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => selectType(type)}
                  style={[styles.chip, selected && styles.chipSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {t(`reminders.${type}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Title input */}
          <View style={styles.inputContainer}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('reminders.title')}
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
          </View>

          {/* Schedule mode chips */}
          <Text style={styles.fieldLabel}>Schedule</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              onPress={() => setMode('interval')}
              style={[styles.chip, mode === 'interval' && styles.chipSelected]}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, mode === 'interval' && styles.chipTextSelected]}>
                Interval
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('times')}
              style={[styles.chip, mode === 'times' && styles.chipSelected]}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, mode === 'times' && styles.chipTextSelected]}>
                Times
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'interval' ? (
            <View style={styles.chipRow}>
              {INTERVAL_PRESETS.map((minutes) => {
                const hours = minutes / 60;
                const selected = intervalMinutes === minutes;
                return (
                  <TouchableOpacity
                    key={minutes}
                    onPress={() => setIntervalMinutes(minutes)}
                    style={[styles.chip, selected && styles.chipSelected]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {hours === 1 ? '1 hour' : `${hours} hours`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <>
              <View style={styles.chipRow}>
                {times.map((time) => (
                  <View key={time} style={styles.timeChip}>
                    <Text style={styles.timeChipText}>{time}</Text>
                    <TouchableOpacity onPress={() => removeTime(time)}>
                      <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.timeInputRow}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <TextInput
                    value={newTime}
                    onChangeText={setNewTime}
                    placeholder="08:00"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>
                <TouchableOpacity onPress={addTime} style={styles.addTimeBtn} activeOpacity={0.7}>
                  <Text style={styles.addTimeBtnText}>{t('common.add')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Info box with emerald left border */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color="#059669"
            />
            <Text style={styles.infoText}>
              固定间隔提醒可作兜底备用。建议同时使用主屏「如厕预测」——它会根据个人规律、天气和运动自动调整时间，比固定间隔更准确。
            </Text>
          </View>

          {/* Solid save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !title.trim()}
            activeOpacity={0.8}
            style={[
              styles.button,
              (isLoading || !title.trim()) && styles.buttonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t('common.save')}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  textInput: {
    fontSize: 15,
    color: '#1E293B',
    height: 48,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: '#064E3B',
    borderColor: '#064E3B',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addTimeBtn: {
    backgroundColor: '#064E3B',
    borderRadius: 14,
    paddingHorizontal: 20,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTimeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 16,
    gap: 10,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#064E3B',
    borderRadius: 24,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
