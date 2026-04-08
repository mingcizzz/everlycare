import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, TextInput, Button, Chip, Avatar, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { recipientService } from '../../../services/recipient.service';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import type { RootStackScreenProps } from '../../../types/navigation';

const COMMON_CONDITIONS = [
  "Alzheimer's",
  'Dementia',
  'Hypertension',
  'Diabetes',
  'Stroke',
  'Parkinson',
  'Arthritis',
  'Heart Disease',
];

export function CareRecipientProfileScreen({
  route,
  navigation,
}: RootStackScreenProps<'CareRecipientProfile'>) {
  const { t } = useTranslation();
  const { activeRecipient, loadRecipients } = useRecipientStore();
  const recipientId = route.params?.recipientId || activeRecipient?.id;

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | undefined>();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (recipientId) {
      recipientService.getById(recipientId).then((r) => {
        if (r) {
          setName(r.name);
          setGender(r.gender);
          setDateOfBirth(r.dateOfBirth || '');
          setConditions(r.medicalConditions);
          setAllergies(r.allergies.join(', '));
          setNotes(r.notes || '');
        }
      });
    }
  }, [recipientId]);

  const toggleCondition = (c: string) => {
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleSave = async () => {
    if (!name || !recipientId) return;
    setIsLoading(true);
    try {
      await recipientService.update(recipientId, {
        name,
        gender,
        dateOfBirth: dateOfBirth || undefined,
        medicalConditions: conditions,
        allergies: allergies
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        notes: notes || undefined,
      });
      await loadRecipients();
      Alert.alert(t('common.done'));
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
          <Text style={styles.headerTitle}>{t('recipient.title')}</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={80}
              label={name.charAt(0) || '?'}
              style={{ backgroundColor: colors.primary }}
            />
          </View>

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

            <Text style={styles.fieldLabel}>
              {t('recipient.medicalConditions')}
            </Text>
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
              label={t('recipient.allergies')}
              value={allergies}
              onChangeText={setAllergies}
              mode="outlined"
              placeholder="Peanuts, Penicillin..."
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />

            <TextInput
              label={t('recipient.notes')}
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />

            <Button
              mode="contained"
              onPress={handleSave}
              loading={isLoading}
              disabled={isLoading || !name}
              style={styles.button}
              buttonColor={colors.primary}
              textColor={colors.textOnPrimary}
              contentStyle={styles.buttonContent}
            >
              {t('common.save')}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
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
