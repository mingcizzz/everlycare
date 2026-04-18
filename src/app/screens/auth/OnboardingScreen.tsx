import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { colors, spacing, typography, borderRadius } from '../../../theme';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const COMMON_CONDITIONS = [
  "Alzheimer's",
  'Dementia',
  'Hypertension',
  'Diabetes',
  'Stroke',
  'Parkinson',
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const { addRecipient } = useRecipientStore();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | undefined>();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleCondition = (c: string) => {
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const handleComplete = async () => {
    if (!name) return;
    setIsLoading(true);
    try {
      await addRecipient({
        name,
        gender,
        dateOfBirth: dateOfBirth || undefined,
        medicalConditions: conditions,
        allergies: [],
        notes: notes || undefined,
      });
      onComplete();
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="account-heart"
                size={48}
                color={colors.textOnPrimary}
              />
            </View>
          </View>

          {/* Header */}
          <Text style={styles.title}>{t('recipient.addNew')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.trackDesc')}</Text>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label={t('recipient.name')}
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="account-outline" />}
            />

            {/* Gender chips */}
            <Text style={styles.fieldLabel}>{t('recipient.gender')}</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  gender === 'male' && styles.chipSelected,
                ]}
                onPress={() => setGender('male')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="gender-male"
                  size={18}
                  color={gender === 'male' ? colors.textOnPrimary : colors.textSecondary}
                  style={styles.chipIcon}
                />
                <Text
                  style={[
                    styles.chipText,
                    gender === 'male' && styles.chipTextSelected,
                  ]}
                >
                  {t('recipient.male')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chip,
                  gender === 'female' && styles.chipSelected,
                ]}
                onPress={() => setGender('female')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="gender-female"
                  size={18}
                  color={gender === 'female' ? colors.textOnPrimary : colors.textSecondary}
                  style={styles.chipIcon}
                />
                <Text
                  style={[
                    styles.chipText,
                    gender === 'female' && styles.chipTextSelected,
                  ]}
                >
                  {t('recipient.female')}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              label={`${t('recipient.dateOfBirth')} (YYYY-MM-DD)`}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              mode="outlined"
              placeholder="1945-01-01"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="calendar-outline" />}
            />

            {/* Medical condition chips */}
            <Text style={styles.fieldLabel}>{t('recipient.medicalConditions')}</Text>
            <View style={styles.chipRow}>
              {COMMON_CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.chip,
                    conditions.includes(c) && styles.chipSelected,
                  ]}
                  onPress={() => toggleCondition(c)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      conditions.includes(c) && styles.chipTextSelected,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              label={t('recipient.notes')}
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="note-text-outline" />}
            />

            {/* Submit button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isLoading || !name) && styles.submitButtonDisabled,
              ]}
              onPress={handleComplete}
              disabled={isLoading || !name}
              activeOpacity={0.8}
            >
              <View style={styles.submitButtonInner}>
                {isLoading ? (
                  <ActivityIndicator color={colors.textOnPrimary} size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {t('onboarding.getStarted')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
  },
  inputOutline: {
    borderRadius: borderRadius.md,
  },
  fieldLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipIcon: {
    marginRight: spacing.xs,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    ...typography.subtitle,
    color: colors.textOnPrimary,
  },
});
