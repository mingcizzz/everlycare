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
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Circle } from 'react-native-svg';
import { useAuthStore } from '../../../store/authStore';
import { useRecipientStore } from '../../../store/recipientStore';
import { useCareLogStore } from '../../../store/careLogStore';
import { colors, spacing, borderRadius, shadows, logBackgrounds } from '../../../theme';
import { TimelineFeed } from '../../../components/log/TimelineFeed';
import { QuickLogSheet } from '../log/QuickLogSheet';
import { getToday } from '../../../utils/date';
import type { MainTabScreenProps } from '../../../types/navigation';
import type { LogType } from '../../../types/careLog';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const GRID_PADDING = 20;
const STAT_CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - CARD_GAP) / 2;

const RING_SIZE = 120;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const TARGET_LOGS = 8;

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', emoji: '\u2600\uFE0F' };
  if (hour < 18) return { text: 'Good afternoon', emoji: '\uD83C\uDF24' };
  return { text: 'Good evening', emoji: '\uD83C\uDF19' };
}

/* ── Quick Action Pill ── */
interface QuickActionProps {
  emoji: string;
  label: string;
  onPress: () => void;
}

function QuickActionPill({ emoji, label, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity
      style={styles.quickPill}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.quickPillEmoji}>{emoji}</Text>
      <Text style={styles.quickPillLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ── Stat Card ── */
interface StatCardProps {
  emoji: string;
  bgColor: string;
  value: string;
  label: string;
}

function StatCard({ emoji, bgColor, value, label }: StatCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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
        style={[styles.statCardInner, { backgroundColor: bgColor }]}
      >
        <Text style={styles.statEmoji}>{emoji}</Text>
        <View style={styles.statBottom}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ── Home Screen ── */
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Hero Section ── */}
        <LinearGradient
          colors={['#0D9488', '#0A7B71']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            {/* Left side — greeting & info */}
            <View style={styles.heroLeft}>
              <Text style={styles.heroGreeting}>
                {greeting.text} {greeting.emoji}
              </Text>
              <Text style={styles.heroName}>
                {user?.displayName || t('common.appName')}
              </Text>
              {activeRecipient && (
                <Text style={styles.heroCaringFor}>
                  Caring for {activeRecipient.name} {'\uD83D\uDC9A'}
                </Text>
              )}
            </View>

            {/* Right side — progress ring */}
            <View style={styles.heroRight}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                {/* Track */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                {/* Progress arc */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke="#FFFFFF"
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
                <Text style={styles.ringLabel}>today</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ── 2. Quick Actions Row ── */}
        <View style={styles.quickActionsRow}>
          <QuickActionPill
            emoji="\uD83D\uDEBD"
            label="Bowel"
            onPress={() => setQuickLogType('bowel')}
          />
          <QuickActionPill
            emoji="\uD83D\uDCA7"
            label="Fluid"
            onPress={() => setQuickLogType('urination')}
          />
          <QuickActionPill
            emoji="\uD83D\uDC8A"
            label="Meds"
            onPress={() => setQuickLogType('medication')}
          />
          <QuickActionPill
            emoji="\uD83C\uDF7D"
            label="Meal"
            onPress={() => setQuickLogType('meal')}
          />
        </View>

        {/* ── 3. Stats Grid (Bento) ── */}
        <View style={styles.statsGrid}>
          {/* Top row */}
          <View style={styles.statsRow}>
            <StatCard
              emoji="\uD83D\uDEBF"
              bgColor="#FEF3C7"
              value={`${(dailySummary?.bowelCount ?? 0) + (dailySummary?.urinationCount ?? 0)}`}
              label={t('insights.bathroomVisits')}
            />
            <StatCard
              emoji="\uD83D\uDCA7"
              bgColor="#DBEAFE"
              value={`${dailySummary?.fluidTotalMl ?? 0}ml`}
              label={t('insights.fluidIntake')}
            />
          </View>
          {/* Bottom row */}
          <View style={styles.statsRow}>
            <StatCard
              emoji="\uD83D\uDC8A"
              bgColor="#F3E8FF"
              value={`${dailySummary?.medicationsTaken ?? 0}`}
              label={t('medication.taken')}
            />
            <StatCard
              emoji="\uD83C\uDF4E"
              bgColor="#DCFCE7"
              value={`${dailySummary?.mealCount ?? 0}`}
              label={t('careLog.meal')}
            />
          </View>
        </View>

        {/* ── 4. Timeline ── */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Log')}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllLink}>See all \u2192</Text>
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

      {/* ── 5. FAB ── */}
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
    paddingBottom: 100,
  },

  /* ── 1. Hero ── */
  hero: {
    marginHorizontal: 16,
    marginTop: spacing.md,
    borderRadius: 28,
    padding: 24,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
    marginRight: 16,
  },
  heroGreeting: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroCaringFor: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  heroRight: {
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
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },

  /* ── 2. Quick Actions ── */
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: GRID_PADDING,
    marginTop: 20,
    gap: 10,
  },
  quickPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickPillEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  quickPillLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },

  /* ── 3. Stats Grid ── */
  statsGrid: {
    marginHorizontal: GRID_PADDING,
    marginTop: 20,
    gap: CARD_GAP,
  },
  statsRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  statCard: {
    flex: 1,
    height: 110,
    borderRadius: 20,
    ...shadows.md,
  },
  statCardInner: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  statEmoji: {
    fontSize: 28,
  },
  statBottom: {
    marginTop: 'auto',
  },
  statValue: {
    fontSize: 32,
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

  /* ── 4. Timeline ── */
  timelineSection: {
    marginTop: 24,
    marginHorizontal: GRID_PADDING,
    marginBottom: spacing.lg,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
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

  /* ── 5. FAB ── */
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
    ...shadows.lg,
  },
});
