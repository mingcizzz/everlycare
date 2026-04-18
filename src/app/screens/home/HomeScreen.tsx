import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Circle } from 'react-native-svg';
import { useAuthStore } from '../../../store/authStore';
import { useRecipientStore } from '../../../store/recipientStore';
import { useCareLogStore } from '../../../store/careLogStore';
import { colors, spacing, typography, borderRadius, shadows, logBackgrounds } from '../../../theme';
import { TimelineFeed } from '../../../components/log/TimelineFeed';
import { QuickLogSheet } from '../log/QuickLogSheet';
import { getToday } from '../../../utils/date';
import { FLUID_DAILY_TARGET_ML } from '../../../utils/constants';
import type { MainTabScreenProps } from '../../../types/navigation';
import type { LogType } from '../../../types/careLog';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STAT_CARD_WIDTH = SCREEN_WIDTH * 0.42;
const STAT_CARD_HEIGHT = 130;
const STAT_CARD_GAP = 12;

const RING_SIZE = 140;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const TARGET_LOGS = 8;

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', emoji: '\u2600\uFE0F' };
  if (hour < 18) return { text: 'Good afternoon', emoji: '\uD83C\uDF24' };
  return { text: 'Good evening', emoji: '\uD83C\uDF19' };
}

interface StatCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
}

function StatCard({ icon, iconColor, iconBg, value, label }: StatCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.statCardInner}
      >
        <View style={[styles.statIconCircle, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons
            name={icon as any}
            size={22}
            color={iconColor}
          />
        </View>
        <View style={styles.statBottom}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { activeRecipient, loadRecipients } = useRecipientStore();
  const { logs, dailySummary, isLoading, loadLogs, loadDailySummary } = useCareLogStore();

  const [quickLogType, setQuickLogType] = useState<LogType | null>(null);

  const today = getToday();
  const greeting = getGreeting();

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

  // Care completion ring progress
  const totalLogs = dailySummary?.totalLogs ?? 0;
  const progress = Math.min(1, totalLogs / Math.max(1, TARGET_LOGS));
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  // Stat cards data
  const statCards: StatCardProps[] = [
    {
      icon: 'toilet',
      iconColor: colors.logBowel,
      iconBg: logBackgrounds.bowel,
      value: `${(dailySummary?.bowelCount ?? 0) + (dailySummary?.urinationCount ?? 0)}`,
      label: t('insights.bathroomVisits'),
    },
    {
      icon: 'cup-water',
      iconColor: colors.logUrination,
      iconBg: logBackgrounds.urination,
      value: `${dailySummary?.fluidTotalMl ?? 0}ml`,
      label: t('insights.fluidIntake'),
    },
    {
      icon: 'pill',
      iconColor: colors.logMedication,
      iconBg: logBackgrounds.medication,
      value: `${dailySummary?.medicationsTaken ?? 0}`,
      label: t('medication.taken'),
    },
    {
      icon: 'food-apple',
      iconColor: colors.logMeal,
      iconBg: logBackgrounds.meal,
      value: `${dailySummary?.mealCount ?? 0}`,
      label: t('careLog.meal'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTime}>
            {greeting.text} {greeting.emoji}
          </Text>
          <Text style={styles.greetingName}>
            {user?.displayName || t('common.appName')}
          </Text>
          {activeRecipient && (
            <Text style={styles.caringFor}>
              {t('home.caringFor', { name: activeRecipient.name })}
            </Text>
          )}
        </View>

        {/* 2. Care Completion Ring */}
        {dailySummary && (
          <View style={styles.ringCard}>
            <View style={styles.ringContainer}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                {/* Track */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={colors.surfaceSecondary}
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                {/* Progress */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={colors.primary}
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${RING_CIRCUMFERENCE}`}
                  strokeDashoffset={strokeDashoffset}
                  rotation={-90}
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
              </Svg>
              <View style={styles.ringTextContainer}>
                <Text style={styles.ringCount}>{totalLogs}</Text>
                <Text style={styles.ringLabel}>logs today</Text>
              </View>
            </View>
          </View>
        )}

        {/* 3. Quick Stats — Horizontal ScrollView */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={STAT_CARD_WIDTH + STAT_CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={styles.statsRow}
          style={styles.statsScroll}
        >
          {statCards.map((card) => (
            <StatCard key={card.icon} {...card} />
          ))}
        </ScrollView>

        {/* 4. Timeline Section */}
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
          {logs.length > 0 ? (
            <TimelineFeed logs={logs.slice(0, 5)} />
          ) : (
            <View style={styles.emptyTimeline}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons
                  name="clipboard-text-clock-outline"
                  size={48}
                  color={colors.textTertiary}
                />
              </View>
              <Text style={styles.emptyText}>
                {t('home.noLogsYet', { defaultValue: 'No logs yet today' })}
              </Text>
              <Text style={styles.emptySubtext}>
                {t('home.tapToStart', { defaultValue: 'Tap + to start logging care' })}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 5. FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Log')}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
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
    backgroundColor: '#F8FAFB',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },

  /* 1. Greeting */
  greetingSection: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  greetingTime: {
    fontSize: 15,
    fontWeight: '400',
    color: '#64748B',
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  caringFor: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 4,
  },

  /* 2. Completion Ring Card */
  ringCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -1.0,
  },
  ringLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
  },

  /* 3. Quick Stats */
  statsScroll: {
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.md,
  },
  statsRow: {
    paddingHorizontal: spacing.md,
    gap: STAT_CARD_GAP,
  },
  statCard: {
    width: STAT_CARD_WIDTH,
    height: STAT_CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  statCardInner: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBottom: {
    marginTop: 'auto',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
  },

  /* 4. Timeline */
  timelineSection: {
    marginBottom: spacing.lg,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94A3B8',
  },

  /* 5. FAB */
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    shadowOpacity: 0.08,
    elevation: 4,
  },
});
