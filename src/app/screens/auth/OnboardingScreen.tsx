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
import { spacing, typography } from '../../../theme';

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
                color="#FFFFFF"
              />
            </View>
          </View>

          {/* Header */}
          <Text style={styles.title}>{t('recipient.addNew')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.trackDesc')}</Text>

          {/* Form card */}
          <View style={styles.card}>
            <TextInput
              label={t('recipient.name')}
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              outlineColor="#E2E8F0"
              activeOutlineColor="#059669"
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
                  color={gender === 'male' ? '#FFFFFF' : '#64748B'}
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
                  color={gender === 'female' ? '#FFFFFF' : '#64748B'}
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
              outlineColor="#E2E8F0"
              activeOutlineColor="#059669"
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
              outlineColor="#E2E8F0"
              activeOutlineColor="#059669"
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
                  <ActivityIndicator color="#FFFFFF" size="small" />
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
    backgroundColor: '#F1F5F9',
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
    backgroundColor: '#064E3B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: '#64748B',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  inputOutline: {
    borderRadius: 12,
  },
  fieldLabel: {
    ...typography.subtitle,
    color: '#1E293B',
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
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: '#064E3B',
    borderColor: '#064E3B',
  },
  chipIcon: {
    marginRight: spacing.xs,
  },
  chipText: {
    ...typography.bodySmall,
    color: '#64748B',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#064E3B',
    borderRadius: 24,
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
    color: '#FFFFFF',
  },
});
