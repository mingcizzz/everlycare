import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, shadows, logBackgrounds } from '../../../theme';
import { useCareLogStore } from '../../../store/careLogStore';
import { LOG_TYPE_CONFIG, type LogType, type LogData } from '../../../types/careLog';

interface QuickLogSheetProps {
  logType: LogType;
  recipientId: string;
  onDismiss: () => void;
  onSaved: () => void;
}

interface ChipOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function ChipOption({ label, selected, onPress }: ChipOptionProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          selected ? styles.chipTextSelected : styles.chipTextUnselected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
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

  const config = LOG_TYPE_CONFIG[logType];
  const bgColor = logBackgrounds[logType] || colors.surfaceSecondary;

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

  const renderSectionLabel = (label: string) => (
    <Text style={styles.sectionLabel}>{label}</Text>
  );

  const renderForm = () => {
    switch (logType) {
      case 'bowel':
        return (
          <>
            {renderSectionLabel(t('bowel.type'))}
            <View style={styles.chipRow}>
              {(['normal', 'diarrhea', 'constipation'] as const).map((v) => (
                <ChipOption
                  key={v}
                  label={t(`bowel.${v}`)}
                  selected={bowelType === v}
                  onPress={() => setBowelType(v)}
                />
              ))}
            </View>

            {renderSectionLabel(t('bowel.location'))}
            <View style={styles.chipRow}>
              {(['toilet', 'diaper', 'other'] as const).map((v) => (
                <ChipOption
                  key={v}
                  label={t(`bowel.${v}`)}
                  selected={bowelLocation === v}
                  onPress={() => setBowelLocation(v)}
                />
              ))}
            </View>

            <View style={styles.chipRow}>
              <ChipOption
                label={t('bowel.accident')}
                selected={isAccident}
                onPress={() => setIsAccident(!isAccident)}
              />
            </View>
          </>
        );

      case 'urination':
        return (
          <>
            {renderSectionLabel(t('urination.title'))}
            <View style={styles.chipRow}>
              {(['planned', 'spontaneous', 'accident'] as const).map((v) => (
                <ChipOption
                  key={v}
                  label={t(`urination.${v}`)}
                  selected={urinationMethod === v}
                  onPress={() => setUrinationMethod(v)}
                />
              ))}
            </View>

            {renderSectionLabel(t('urination.volume'))}
            <View style={styles.chipRow}>
              {(['small', 'medium', 'large'] as const).map((v) => (
                <ChipOption
                  key={v}
                  label={t(`urination.${v}`)}
                  selected={volume === v}
                  onPress={() => setVolume(v)}
                />
              ))}
            </View>
          </>
        );

      case 'meal':
        return (
          <>
            {renderSectionLabel(t('meal.title'))}
            <View style={styles.chipRow}>
              {(['breakfast', 'lunch', 'dinner', 'snack', 'fluid'] as const).map((v) => (
                <ChipOption
                  key={v}
                  label={t(`meal.${v}`)}
                  selected={mealType === v}
                  onPress={() => setMealType(v)}
                />
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
                outlineStyle={styles.inputOutline}
              />
            ) : (
              <>
                <TextInput
                  label={t('meal.description')}
                  value={mealDescription}
                  onChangeText={setMealDescription}
                  mode="outlined"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                />
                {renderSectionLabel(t('meal.appetite'))}
                <View style={styles.chipRow}>
                  {(['good', 'fair', 'poor'] as const).map((v) => (
                    <ChipOption
                      key={v}
                      label={t(`meal.${v}`)}
                      selected={appetite === v}
                      onPress={() => setAppetite(v)}
                    />
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
              outlineStyle={styles.inputOutline}
            />
            {renderSectionLabel(t('medication.status', { defaultValue: 'Status' }))}
            <View style={styles.chipRow}>
              {(['taken', 'missed', 'skipped'] as const).map((v) => (
                <ChipOption
                  key={v}
                  label={t(`medication.${v}`)}
                  selected={medStatus === v}
                  onPress={() => setMedStatus(v)}
                />
              ))}
            </View>
          </>
        );

      case 'mood':
        return (
          <>
            {renderSectionLabel(t('mood.title'))}
            <View style={styles.chipRow}>
              {(['calm', 'happy', 'anxious', 'agitated', 'confused', 'sad'] as const).map((v) => (
                <ChipOption
                  key={v}
                  label={t(`mood.${v}`)}
                  selected={mood === v}
                  onPress={() => setMood(v)}
                />
              ))}
            </View>

            {renderSectionLabel(t('mood.sleepQuality'))}
            <View style={styles.chipRow}>
              {(['good', 'fair', 'poor'] as const).map((v) => (
                <ChipOption
                  key={v}
                  label={t(`mood.sleep${v.charAt(0).toUpperCase() + v.slice(1)}` as any)}
                  selected={sleepQuality === v}
                  onPress={() => setSleepQuality(v)}
                />
              ))}
            </View>
          </>
        );

      case 'hygiene':
        return (
          <>
            {renderSectionLabel(t('hygiene.title'))}
            <View style={styles.chipRow}>
              {(['bathing', 'clothingChange', 'skinCheck', 'oralCare'] as const).map((v) => (
                <ChipOption
                  key={v}
                  label={t(`hygiene.${v}`)}
                  selected={hygieneType === v}
                  onPress={() => setHygieneType(v)}
                />
              ))}
            </View>
          </>
        );

      case 'activity':
        return (
          <>
            {renderSectionLabel(t('activity.title'))}
            <View style={styles.chipRow}>
              {(['walking', 'exercise', 'social', 'cognitive', 'rest'] as const).map((v) => (
                <ChipOption
                  key={v}
                  label={t(`activity.${v}`)}
                  selected={activityType === v}
                  onPress={() => setActivityType(v)}
                />
              ))}
            </View>

            <TextInput
              label={`${t('activity.duration')} (${t('activity.minutes')})`}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
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
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            style={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title row with icon */}
            <View style={styles.titleRow}>
              <View style={[styles.titleIconCircle, { backgroundColor: bgColor }]}>
                <MaterialCommunityIcons
                  name={config.icon as any}
                  size={18}
                  color={config.color}
                />
              </View>
              <Text style={styles.sheetTitle}>
                {t(`careLog.${logType}`)}
              </Text>
            </View>

            {renderForm()}

            {/* Notes input */}
            <TextInput
              label={t('careLog.addNote')}
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={[styles.input, { marginTop: spacing.lg }]}
              outlineStyle={styles.inputOutline}
            />

            {/* Save button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={isLoading}
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textOnPrimary} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    marginBottom: spacing.lg,
  },
  titleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionLabel: {
    ...typography.subtitle,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipUnselected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.textOnPrimary,
  },
  chipTextUnselected: {
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
  },
  inputOutline: {
    borderRadius: borderRadius.md,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.subtitle,
    color: colors.textOnPrimary,
    fontSize: 16,
  },
});
