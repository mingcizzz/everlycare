import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, logGradients } from '../../../theme';
import { LOG_TYPE_CONFIG, type LogType } from '../../../types/careLog';
import { useRecipientStore } from '../../../store/recipientStore';
import type { MainTabScreenProps } from '../../../types/navigation';
import { GradientCard } from '../../../components/ui/GradientCard';
import { QuickLogSheet } from './QuickLogSheet';

export function CareLogScreen({ navigation }: MainTabScreenProps<'Log'>) {
  const { t } = useTranslation();
  const { activeRecipient } = useRecipientStore();
  const [selectedLogType, setSelectedLogType] = useState<LogType | null>(null);

  const logTypes: LogType[] = [
    'bowel',
    'urination',
    'meal',
    'medication',
    'mood',
    'hygiene',
    'activity',
    'note',
  ];

  if (!activeRecipient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="account-plus"
            size={64}
            color={colors.textDisabled}
          />
          <Text style={styles.emptyText}>{t('recipient.addNew')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.quickLog')}</Text>
        <Text style={styles.subtitle}>
          {t('home.caringFor', { name: activeRecipient.name })}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {logTypes.map((type) => {
          const config = LOG_TYPE_CONFIG[type];
          const gradient = logGradients[type] || [config.color, config.color];
          return (
            <GradientCard
              key={type}
              gradientColors={gradient}
              style={styles.logCard}
              onPress={() => setSelectedLogType(type)}
            >
              <MaterialCommunityIcons
                name={config.icon}
                size={40}
                color="#FFFFFF"
              />
              <Text style={styles.logLabel}>{t(config.labelKey)}</Text>
            </GradientCard>
          );
        })}
      </ScrollView>

      {selectedLogType && (
        <QuickLogSheet
          logType={selectedLogType}
          recipientId={activeRecipient.id}
          onDismiss={() => setSelectedLogType(null)}
          onSaved={() => {
            setSelectedLogType(null);
            Alert.alert(t('careLog.logSaved'));
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  logCard: {
    width: '47%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  logLabel: {
    ...typography.subtitle,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
