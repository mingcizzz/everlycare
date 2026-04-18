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
import { medicationService } from '../../../services/medication.service';
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
          <Text style={styles.headerTitle}>{t('medication.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name input */}
          <Text style={styles.fieldLabel}>{t('medication.name')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('medication.name')}
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
          </View>

          {/* Dosage input */}
          <Text style={styles.fieldLabel}>{t('medication.dosage')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={dosage}
              onChangeText={setDosage}
              placeholder="e.g. 10mg, 1 tablet"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
          </View>

          {/* Frequency chips */}
          <Text style={styles.fieldLabel}>Frequency</Text>
          <View style={styles.chipRow}>
            {FREQUENCIES.map((f) => {
              const selected = frequency === f;
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFrequency(f)}
                  style={[styles.chip, selected && styles.chipSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {FREQUENCY_LABELS[f]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Scheduled times */}
          <Text style={styles.fieldLabel}>Scheduled Times</Text>
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

          {/* Solid save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !name.trim()}
            activeOpacity={0.8}
            style={[
              styles.button,
              (isLoading || !name.trim()) && styles.buttonDisabled,
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
