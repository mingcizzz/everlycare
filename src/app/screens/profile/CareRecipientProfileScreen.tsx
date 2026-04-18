import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { recipientService } from '../../../services/recipient.service';
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Dark emerald header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('recipient.title')}</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar card */}
          <View style={styles.avatarCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {name.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.avatarName}>{name || '?'}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label={t('recipient.name')}
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              outlineColor="#CBD5E1"
              activeOutlineColor="#064E3B"
              theme={{ colors: { primary: '#064E3B' } }}
            />

            <Text style={styles.fieldLabel}>{t('recipient.gender')}</Text>
            <View style={styles.chipRow}>
              <Chip
                selected={gender === 'male'}
                onPress={() => setGender('male')}
                style={[
                  styles.chip,
                  gender === 'male' && styles.chipSelected,
                ]}
                textStyle={[
                  styles.chipText,
                  gender === 'male' && styles.chipTextSelected,
                ]}
                showSelectedOverlay={false}
              >
                {t('recipient.male')}
              </Chip>
              <Chip
                selected={gender === 'female'}
                onPress={() => setGender('female')}
                style={[
                  styles.chip,
                  gender === 'female' && styles.chipSelected,
                ]}
                textStyle={[
                  styles.chipText,
                  gender === 'female' && styles.chipTextSelected,
                ]}
                showSelectedOverlay={false}
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
              outlineColor="#CBD5E1"
              activeOutlineColor="#064E3B"
              theme={{ colors: { primary: '#064E3B' } }}
            />

            <Text style={styles.fieldLabel}>
              {t('recipient.medicalConditions')}
            </Text>
            <View style={styles.chipRow}>
              {COMMON_CONDITIONS.map((c) => {
                const isSelected = conditions.includes(c);
                return (
                  <Chip
                    key={c}
                    selected={isSelected}
                    onPress={() => toggleCondition(c)}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}
                    textStyle={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}
                    showSelectedOverlay={false}
                  >
                    {c}
                  </Chip>
                );
              })}
            </View>

            <TextInput
              label={t('recipient.allergies')}
              value={allergies}
              onChangeText={setAllergies}
              mode="outlined"
              placeholder="Peanuts, Penicillin..."
              style={styles.input}
              outlineColor="#CBD5E1"
              activeOutlineColor="#064E3B"
              theme={{ colors: { primary: '#064E3B' } }}
            />

            <TextInput
              label={t('recipient.notes')}
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              outlineColor="#CBD5E1"
              activeOutlineColor="#064E3B"
              theme={{ colors: { primary: '#064E3B' } }}
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                (isLoading || !name) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isLoading || !name}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              )}
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
    backgroundColor: '#064E3B',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#064E3B',
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#064E3B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 4,
  },
  chipSelected: {
    backgroundColor: '#064E3B',
    borderColor: '#064E3B',
  },
  chipText: {
    color: '#64748B',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#064E3B',
    borderRadius: 24,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
