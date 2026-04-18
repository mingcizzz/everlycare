import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../../store/authStore';
import { useRecipientStore } from '../../../store/recipientStore';
import { useCareLogStore } from '../../../store/careLogStore';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { DailySummaryCard } from '../../../components/log/DailySummaryCard';
import { TimelineFeed } from '../../../components/log/TimelineFeed';
import { QuickLogSheet } from '../log/QuickLogSheet';
import { getToday } from '../../../utils/date';
import type { MainTabScreenProps } from '../../../types/navigation';
import type { LogType } from '../../../types/careLog';

const QUICK_ACTIONS: { type: LogType; icon: string; color: string; bg: string }[] = [
  { type: 'bowel', icon: 'toilet', color: colors.logBowel, bg: '#F5F0EB' },
  { type: 'urination', icon: 'water', color: colors.logUrination, bg: '#EFF6FF' },
  { type: 'meal', icon: 'food-apple', color: colors.logMeal, bg: '#FFFBEB' },
  { type: 'medication', icon: 'pill', color: colors.logMedication, bg: '#F5F3FF' },
];

export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { activeRecipient, loadRecipients } = useRecipientStore();
  const { logs, dailySummary, isLoading, loadLogs, loadDailySummary } = useCareLogStore();

  const [quickLogType, setQuickLogType] = useState<LogType | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const greeting = user?.displayName
    ? t('home.greeting', { name: user.displayName })
    : t('common.appName');

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          {activeRecipient && (
            <View style={styles.recipientBadge}>
              <MaterialCommunityIcons
                name="account-heart"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.recipientName}>{activeRecipient.name}</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.type}
              style={styles.quickAction}
              activeOpacity={0.7}
              onPress={() => setQuickLogType(action.type)}
            >
              <View style={[styles.quickActionCircle, { backgroundColor: action.bg }]}>
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={22}
                  color={action.color}
                />
              </View>
              <Text style={styles.quickActionLabel} numberOfLines={1}>
                {t(`careLog.${action.type}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Summary */}
        {dailySummary && <DailySummaryCard summary={dailySummary} />}

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <Text style={styles.sectionTitle}>{t('home.timeline')}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Log')}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllLink}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <TimelineFeed logs={logs.slice(0, 5)} />
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => navigation.navigate('Log')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Quick Log Bottom Sheet */}
      {quickLogType && activeRecipient && (
        <QuickLogSheet
          logType={quickLogType}
          recipientId={activeRecipient.id}
          onDismiss={() => setQuickLogType(null)}
          onSaved={() => {
            setQuickLogType(null);
            refresh();
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
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  dateText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recipientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
    marginTop: 4,
  },
  recipientName: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },

  /* Quick Actions */
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  quickAction: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickActionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
    maxWidth: 72,
    textAlign: 'center',
  },

  /* Section */
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },

  /* Timeline */
  timelineSection: {
    marginBottom: spacing.lg,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAllLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },

  /* FAB */
  fabContainer: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    ...shadows.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
