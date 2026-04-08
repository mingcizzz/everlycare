import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../../store/authStore';
import { useRecipientStore } from '../../../store/recipientStore';
import { useCareLogStore } from '../../../store/careLogStore';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { GradientCard } from '../../../components/ui/GradientCard';
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
        {/* Hero Header */}
        <GradientCard
          gradientColors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.heroCard}
        >
          <Text style={styles.greeting}>{greeting}</Text>
          {activeRecipient && (
            <Text style={styles.caringFor}>
              {t('home.caringFor', { name: activeRecipient.name })}
            </Text>
          )}
        </GradientCard>

        {/* Summary */}
        {dailySummary && <DailySummaryCard summary={dailySummary} />}

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>{t('home.timeline')}</Text>
          <TimelineFeed logs={logs} />
        </View>
      </ScrollView>

      {/* Gradient FAB */}
      <View style={styles.fabContainer}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fab}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          <Text style={styles.fabLabel}>{t('home.quickLog')}</Text>
        </LinearGradient>
        <View
          style={StyleSheet.absoluteFill}
          onTouchEnd={() => navigation.navigate('Log')}
        />
      </View>
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
  heroCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  greeting: {
    ...typography.h2,
    color: '#FFFFFF',
  },
  caringFor: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.85)',
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
  fabContainer: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    ...shadows.lg,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  fabLabel: {
    ...typography.subtitle,
    color: '#FFFFFF',
  },
});
