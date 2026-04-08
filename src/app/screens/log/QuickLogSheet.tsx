import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { useCareLogStore } from '../../../store/careLogStore';
import type { LogType, LogData } from '../../../types/careLog';

interface QuickLogSheetProps {
  logType: LogType;
  recipientId: string;
  onDismiss: () => void;
  onSaved: () => void;
}

export function QuickLogSheet({
  logType,
  recipientId,
  onDismiss,
  onSaved,
}: QuickLogSheetProps) {
  const { t } = useTranslation();
  const { addLog } = useCareLogStore();
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form state varies by log type
  const [bowelType, setBowelType] = useState<'normal' | 'diarrhea' | 'constipation'>('normal');
  const [isAccident, setIsAccident] = useState(false);
  const [bowelLocation, setBowelLocation] = useState<'toilet' | 'diaper' | 'other'>('toilet');

  const [urinationMethod, setUrinationMethod] = useState<'planned' | 'spontaneous' | 'accident'>('planned');
  const [volume, setVolume] = useState<'small' | 'medium' | 'large'>('medium');

  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'fluid'>('breakfast');
  const [fluidAmount, setFluidAmount] = useState('');
  const [appetite, setAppetite] = useState<'good' | 'fair' | 'poor'>('good');
  const [mealDescription, setMealDescription] = useState('');

  const [medName, setMedName] = useState('');
  const [medStatus, setMedStatus] = useState<'taken' | 'missed' | 'skipped'>('taken');

  const [mood, setMood] = useState<'calm' | 'happy' | 'anxious' | 'agitated' | 'confused' | 'sad'>('calm');
  const [sleepQuality, setSleepQuality] = useState<'good' | 'fair' | 'poor'>('good');

  const [hygieneType, setHygieneType] = useState<'bathing' | 'clothingChange' | 'skinCheck' | 'oralCare'>('bathing');

  const [activityType, setActivityType] = useState<'walking' | 'exercise' | 'social' | 'cognitive' | 'rest'>('walking');
  const [duration, setDuration] = useState('');

  const buildLogData = (): LogData => {
    switch (logType) {
      case 'bowel':
        return { type: bowelType, isAccident, location: bowelLocation };
      case 'urination':
        return { method: urinationMethod, volume, isIncontinence: urinationMethod === 'accident' };
      case 'meal':
        return {
          mealType,
          description: mealDescription || undefined,
          fluidAmountMl: mealType === 'fluid' ? parseInt(fluidAmount) || 0 : undefined,
          appetite,
        };
      case 'medication':
        return { medicationName: medName, status: medStatus };
      case 'mood':
        return { mood, sleepQuality };
      case 'hygiene':
        return { type: hygieneType };
      case 'activity':
        return { activityType, durationMinutes: parseInt(duration) || undefined };
      case 'note':
        return { content: notes };
      default:
        return { content: notes } as any;
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const data = buildLogData();
      await addLog(recipientId, logType, data, new Date().toISOString(), notes || undefined);
      onSaved();
    } catch {
      // Save failed — modal stays open for retry
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    switch (logType) {
      case 'bowel':
        return (
          <>
            <Text style={styles.fieldLabel}>{t('bowel.type')}</Text>
            <View style={styles.chipRow}>
              {(['normal', 'diarrhea', 'constipation'] as const).map((v) => (
                <Chip
                  key={v}
                  selected={bowelType === v}
                  onPress={() => setBowelType(v)}
                  style={styles.chip}
                >
                  {t(`bowel.${v}`)}
                </Chip>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t('bowel.location')}</Text>
            <View style={styles.chipRow}>
              {(['toilet', 'diaper', 'other'] as const).map((v) => (
                <Chip
                  key={v}
                  selected={bowelLocation === v}
                  onPress={() => setBowelLocation(v)}
                  style={styles.chip}
                >
                  {t(`bowel.${v}`)}
                </Chip>
              ))}
            </View>

            <Chip
              selected={isAccident}
              onPress={() => setIsAccident(!isAccident)}
              style={styles.chip}
              icon={isAccident ? 'alert' : undefined}
            >
              {t('bowel.accident')}
            </Chip>
          </>
        );

      case 'urination':
        return (
          <>
            <Text style={styles.fieldLabel}>{t('urination.title')}</Text>
            <View style={styles.chipRow}>
              {(['planned', 'spontaneous', 'accident'] as const).map((v) => (
                <Chip
                  key={v}
                  selected={urinationMethod === v}
                  onPress={() => setUrinationMethod(v)}
                  style={styles.chip}
                >
                  {t(`urination.${v}`)}
                </Chip>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t('urination.volume')}</Text>
            <View style={styles.chipRow}>
              {(['small', 'medium', 'large'] as const).map((v) => (
                <Chip
                  key={v}
                  selected={volume === v}
                  onPress={() => setVolume(v)}
                  style={styles.chip}
                >
                  {t(`urination.${v}`)}
                </Chip>
              ))}
            </View>
          </>
        );

      case 'meal':
        return (
          <>
            <Text style={styles.fieldLabel}>{t('meal.title')}</Text>
            <View style={styles.chipRow}>
              {(['breakfast', 'lunch', 'dinner', 'snack', 'fluid'] as const).map((v) => (
                <Chip
                  key={v}
                  selected={mealType === v}
                  onPress={() => setMealType(v)}
                  style={styles.chip}
                >
                  {t(`meal.${v}`)}
                </Chip>
              ))}
            </View>

            {mealType === 'fluid' ? (
              <TextInput
                label={t('meal.fluidAmount')}
                value={fluidAmount}
                onChangeText={setFluidAmount}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />
            ) : (
              <>
                <TextInput
                  label={t('meal.description')}
                  value={mealDescription}
                  onChangeText={setMealDescription}
                  mode="outlined"
                  style={styles.input}
                />
                <Text style={styles.fieldLabel}>{t('meal.appetite')}</Text>
                <View style={styles.chipRow}>
                  {(['good', 'fair', 'poor'] as const).map((v) => (
                    <Chip
                      key={v}
                      selected={appetite === v}
                      onPress={() => setAppetite(v)}
                      style={styles.chip}
                    >
                      {t(`meal.${v}`)}
                    </Chip>
                  ))}
                </View>
              </>
            )}
          </>
        );

      case 'medication':
        return (
          <>
            <TextInput
              label={t('medication.name')}
              value={medName}
              onChangeText={setMedName}
              mode="outlined"
              style={styles.input}
            />
            <View style={styles.chipRow}>
              {(['taken', 'missed', 'skipped'] as const).map((v) => (
                <Chip
                  key={v}
                  selected={medStatus === v}
                  onPress={() => setMedStatus(v)}
                  style={styles.chip}
                >
                  {t(`medication.${v}`)}
                </Chip>
              ))}
            </View>
          </>
        );

      case 'mood':
        return (
          <>
            <Text style={styles.fieldLabel}>{t('mood.title')}</Text>
            <View style={styles.chipRow}>
              {(['calm', 'happy', 'anxious', 'agitated', 'confused', 'sad'] as const).map((v) => (
                <Chip
                  key={v}
                  selected={mood === v}
                  onPress={() => setMood(v)}
                  style={styles.chip}
                >
                  {t(`mood.${v}`)}
                </Chip>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t('mood.sleepQuality')}</Text>
            <View style={styles.chipRow}>
              {(['good', 'fair', 'poor'] as const).map((v) => (
                <Chip
                  key={v}
                  selected={sleepQuality === v}
                  onPress={() => setSleepQuality(v)}
                  style={styles.chip}
                >
                  {t(`mood.sleep${v.charAt(0).toUpperCase() + v.slice(1)}` as any)}
                </Chip>
              ))}
            </View>
          </>
        );

      case 'hygiene':
        return (
          <>
            <Text style={styles.fieldLabel}>{t('hygiene.title')}</Text>
            <View style={styles.chipRow}>
              {(['bathing', 'clothingChange', 'skinCheck', 'oralCare'] as const).map((v) => (
                <Chip
                  key={v}
                  selected={hygieneType === v}
                  onPress={() => setHygieneType(v)}
                  style={styles.chip}
                >
                  {t(`hygiene.${v}`)}
                </Chip>
              ))}
            </View>
          </>
        );

      case 'activity':
        return (
          <>
            <Text style={styles.fieldLabel}>{t('activity.title')}</Text>
            <View style={styles.chipRow}>
              {(['walking', 'exercise', 'social', 'cognitive', 'rest'] as const).map((v) => (
                <Chip
                  key={v}
                  selected={activityType === v}
                  onPress={() => setActivityType(v)}
                  style={styles.chip}
                >
                  {t(`activity.${v}`)}
                </Chip>
              ))}
            </View>

            <TextInput
              label={`${t('activity.duration')} (${t('activity.minutes')})`}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
          </>
        );

      case 'note':
      default:
        return null;
    }
  };

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onDismiss} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView style={styles.sheetContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>
              {t(`careLog.${logType}`)}
            </Text>

            {renderForm()}

            <TextInput
              label={t('careLog.addNote')}
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={[styles.input, { marginTop: spacing.md }]}
            />

            <Button
              mode="contained"
              onPress={handleSave}
              loading={isLoading}
              disabled={isLoading}
              style={styles.saveButton}
              buttonColor={colors.primary}
              textColor={colors.textOnPrimary}
              contentStyle={styles.saveButtonContent}
            >
              {t('common.save')}
            </Button>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
  },
  saveButton: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
  },
  saveButtonContent: {
    paddingVertical: spacing.sm,
  },
});
