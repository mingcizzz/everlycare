import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Text, TextInput, Button, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | undefined>();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleCondition = (c: string) => {
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
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
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="account-heart"
              size={64}
              color={colors.primary}
            />
          </View>

          <Text style={styles.title}>{t('recipient.addNew')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.trackDesc')}</Text>

          <View style={styles.form}>
            <TextInput
              label={t('recipient.name')}
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />

            <Text style={styles.fieldLabel}>{t('recipient.gender')}</Text>
            <View style={styles.chipRow}>
              <Chip
                selected={gender === 'male'}
                onPress={() => setGender('male')}
                style={styles.chip}
              >
                {t('recipient.male')}
              </Chip>
              <Chip
                selected={gender === 'female'}
                onPress={() => setGender('female')}
                style={styles.chip}
              >
                {t('recipient.female')}
              </Chip>
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
            />

            <Text style={styles.fieldLabel}>{t('recipient.medicalConditions')}</Text>
            <View style={styles.chipRow}>
              {COMMON_CONDITIONS.map((c) => (
                <Chip
                  key={c}
                  selected={conditions.includes(c)}
                  onPress={() => toggleCondition(c)}
                  style={styles.chip}
                >
                  {c}
                </Chip>
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
            />

            <Button
              mode="contained"
              onPress={handleComplete}
              loading={isLoading}
              disabled={isLoading || !name}
              style={styles.button}
              buttonColor={colors.primary}
              textColor={colors.textOnPrimary}
              contentStyle={styles.buttonContent}
            >
              {t('onboarding.getStarted')}
            </Button>
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
    padding: spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
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
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
  },
  fieldLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    marginBottom: spacing.xs,
  },
  button: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});
