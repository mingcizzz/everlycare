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
import { useRecipientStore } from '../../../store/recipientStore';
import { medicationService } from '../../../services/medication.service';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { GradientButton } from '../../../components/ui/GradientCard';
import type { Medication } from '../../../types/recipient';
import type { RootStackScreenProps } from '../../../types/navigation';

type Frequency = Medication['frequency'];

const FREQUENCIES: Frequency[] = [
  'daily',
  'twice_daily',
  'three_daily',
  'weekly',
  'as_needed',
];

const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Once daily',
  twice_daily: 'Twice daily',
  three_daily: 'Three times daily',
  weekly: 'Weekly',
  as_needed: 'As needed',
};

export function MedicationFormScreen({
  route,
  navigation,
}: RootStackScreenProps<'MedicationForm'>) {
  const { t } = useTranslation();
  const { activeRecipient } = useRecipientStore();
  const editingId = route.params?.medicationId;

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [newTime, setNewTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingId && activeRecipient) {
      medicationService.getAll(activeRecipient.id).then((list) => {
        const med = list.find((m) => m.id === editingId);
        if (med) {
          setName(med.name);
          setDosage(med.dosage || '');
          setFrequency(med.frequency);
          setTimes(med.scheduleTimes);
        }
      });
    }
  }, [editingId, activeRecipient?.id]);

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
    if (!activeRecipient || !name.trim()) return;
    setIsLoading(true);
    try {
      if (editingId) {
        await medicationService.update(editingId, {
          name: name.trim(),
          dosage: dosage.trim() || undefined,
          frequency,
          scheduleTimes: times,
        });
      } else {
        await medicationService.create(
          activeRecipient.id,
          name.trim(),
          dosage.trim() || undefined,
          frequency,
          times
        );
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>{t('medication.title')}</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            label={t('medication.name')}
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />

          <TextInput
            label={t('medication.dosage')}
            value={dosage}
            onChangeText={setDosage}
            mode="outlined"
            placeholder="e.g. 10mg, 1 tablet"
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />

          <Text style={styles.fieldLabel}>Frequency</Text>
          <View style={styles.chipRow}>
            {FREQUENCIES.map((f) => (
              <Chip
                key={f}
                selected={frequency === f}
                onPress={() => setFrequency(f)}
                style={styles.chip}
              >
                {FREQUENCY_LABELS[f]}
              </Chip>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Scheduled Times</Text>
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

          <GradientButton
            label={t('common.save')}
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading || !name.trim()}
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
  gradientButton: {
    marginTop: spacing.lg,
  },
});
