import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/authStore';
import { useRecipientStore } from '../../../store/recipientStore';
import { useCareLogStore } from '../../../store/careLogStore';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { DailySummaryCard } from '../../../components/log/DailySummaryCard';
import { TimelineFeed } from '../../../components/log/TimelineFeed';
import { getToday } from '../../../utils/date';
import type { MainTabScreenProps } from '../../../types/navigation';

export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { activeRecipient, loadRecipients } = useRecipientStore();
  const { logs, dailySummary, isLoading, loadLogs, loadDailySummary } = useCareLogStore();

  const today = getToday();

  const refresh = useCallback(async () => {
    await loadRecipients();
    if (activeRecipient) {
      await Promise.all([
        loadLogs(activeRecipient.id, today),
        loadDailySummary(activeRecipient.id, today),
      ]);
    }
  }, [activeRecipient?.id, today]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const greeting = user?.displayName
    ? t('home.greeting', { name: user.displayName })
    : t('common.appName');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
          {activeRecipient && (
            <Text style={styles.caringFor}>
              {t('home.caringFor', { name: activeRecipient.name })}
            </Text>
          )}
        </View>

        {/* Summary */}
        {dailySummary && <DailySummaryCard summary={dailySummary} />}

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>{t('home.timeline')}</Text>
          <TimelineFeed logs={logs} />
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        label={t('home.quickLog')}
        onPress={() => navigation.navigate('Log')}
        style={styles.fab}
        color={colors.textOnPrimary}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  caringFor: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  timelineSection: {
    marginBottom: spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
  },
});
