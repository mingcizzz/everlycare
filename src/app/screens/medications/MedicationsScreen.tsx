import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, IconButton, Switch } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { medicationService } from '../../../services/medication.service';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
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
    <SafeAreaView style={styles.container}>
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
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        {medications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="pill"
                size={80}
                color={colors.textDisabled}
              />
              <Text style={styles.emptyText}>{t('common.noData')}</Text>
            </Card.Content>
          </Card>
        ) : (
          medications.map((med) => (
            <Card key={med.id} style={styles.medCard}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('MedicationForm', { medicationId: med.id })
                }
                onLongPress={() => deleteMedication(med)}
                activeOpacity={0.7}
              >
                <Card.Content style={styles.medContent}>
                  <View style={styles.iconBg}>
                    <MaterialCommunityIcons
                      name="pill"
                      size={24}
                      color={colors.logMedication}
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
                    color={colors.primary}
                  />
                </Card.Content>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={() => navigation.navigate('MedicationForm', {})}
        activeOpacity={0.8}
        style={styles.fab}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="plus" size={28} color={colors.textOnPrimary} />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: 120,
  },
  medCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  medContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.logMedication + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medText: {
    flex: 1,
  },
  medName: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  medDosage: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  medSchedule: {
    ...typography.caption,
    color: colors.textDisabled,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    borderRadius: borderRadius.full,
    ...shadows.lg,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
