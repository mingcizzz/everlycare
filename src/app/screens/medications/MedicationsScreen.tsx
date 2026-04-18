import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { medicationService } from '../../../services/medication.service';
import type { Medication } from '../../../types/recipient';
import type { RootStackScreenProps } from '../../../types/navigation';

export function MedicationsScreen({ navigation }: RootStackScreenProps<'Medications'>) {
  const { t } = useTranslation();
  const { activeRecipient } = useRecipientStore();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!activeRecipient) return;
    setIsLoading(true);
    try {
      const list = await medicationService.getAll(activeRecipient.id);
      setMedications(list);
    } finally {
      setIsLoading(false);
    }
  }, [activeRecipient?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleActive = async (med: Medication) => {
    const updated = await medicationService.update(med.id, {
      isActive: !med.isActive,
    });
    setMedications((prev) =>
      prev.map((m) => (m.id === med.id ? updated : m))
    );
  };

  const deleteMedication = (med: Medication) => {
    Alert.alert(
      t('common.delete'),
      med.name,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await medicationService.delete(med.id);
            setMedications((prev) => prev.filter((m) => m.id !== med.id));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        {medications.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="pill"
              size={48}
              color="#94A3B8"
            />
            <Text style={styles.emptyText}>{t('common.noData')}</Text>
          </View>
        ) : (
          medications.map((med) => (
            <TouchableOpacity
              key={med.id}
              onPress={() =>
                navigation.navigate('MedicationForm', { medicationId: med.id })
              }
              onLongPress={() => deleteMedication(med)}
              activeOpacity={0.7}
              style={styles.medCard}
            >
              <View style={styles.iconBg}>
                <MaterialCommunityIcons
                  name="pill"
                  size={22}
                  color="#059669"
                />
              </View>
              <View style={styles.medText}>
                <Text style={styles.medName}>{med.name}</Text>
                {med.dosage ? (
                  <Text style={styles.medDosage}>{med.dosage}</Text>
                ) : null}
                {med.scheduleTimes.length > 0 ? (
                  <Text style={styles.medSchedule}>
                    {med.scheduleTimes.join(', ')}
                  </Text>
                ) : null}
              </View>
              <Switch
                value={med.isActive}
                onValueChange={() => toggleActive(med)}
                trackColor={{ false: '#E2E8F0', true: '#059669' }}
                thumbColor="#FFFFFF"
              />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate('MedicationForm', {})}
        activeOpacity={0.8}
        style={styles.fab}
      >
        <MaterialCommunityIcons name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>
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
    padding: 16,
    gap: 12,
    paddingBottom: 120,
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medText: {
    flex: 1,
  },
  medName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  medDosage: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  medSchedule: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
});
