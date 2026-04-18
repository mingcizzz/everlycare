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
import { colors, spacing, borderRadius, shadows } from '../../../theme';
import { TimelineFeed } from '../../../components/log/TimelineFeed';
import { QuickLogSheet } from '../log/QuickLogSheet';
import { getToday } from '../../../utils/date';
import type { MainTabScreenProps } from '../../../types/navigation';
import type { LogType } from '../../../types/careLog';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const GRID_PADDING = 20;

const RING_SIZE = 120;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const TARGET_LOGS = 8;

function getGreetingIcon(): { text: string; icon: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: 'weather-sunny' };
  if (hour < 18) return { text: 'Good afternoon', icon: 'weather-partly-cloudy' };
  return { text: 'Good evening', icon: 'weather-night' };
}

/* Quick Action Pill */
interface QuickActionProps {
  icon: string;
  iconColor: string;
  label: string;
  onPress: () => void;
}

function QuickActionPill({ icon, iconColor, label, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity
      style={styles.quickPill}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name={icon as any} size={18} color={iconColor} />
      <Text style={styles.quickPillLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* Stat Card */
interface StatCardProps {
  icon: string;
  iconColor: string;
  bgColor: string;
  value: string;
  label: string;
}

function StatCard({ icon, iconColor, bgColor, value, label }: StatCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => {
          Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
          }).start();
        }}
        style={[styles.statCardInner, { backgroundColor: bgColor }]}
      >
        <View style={[styles.statIconCircle, { backgroundColor: iconColor + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
        </View>
        <View style={styles.statBottom}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* Home Screen */
export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { activeRecipient, loadRecipients } = useRecipientStore();
  const { logs, dailySummary, isLoading, loadLogs, loadDailySummary } = useCareLogStore();

  const [quickLogType, setQuickLogType] = useState<LogType | null>(null);

  const today = getToday();
  const greeting = getGreetingIcon();

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
        {/* 1. Hero */}
        <LinearGradient
          colors={['#0D9488', '#0A7B71']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={styles.greetingRow}>
                <MaterialCommunityIcons name={greeting.icon as any} size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroGreeting}>{greeting.text}</Text>
              </View>
              <Text style={styles.heroName}>
                {user?.displayName || t('common.appName')}
              </Text>
              {activeRecipient && (
                <View style={styles.caringForRow}>
                  <MaterialCommunityIcons name="heart" size={14} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.heroCaringFor}>
                    {t('home.caringFor', { name: activeRecipient.name })}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.heroRight}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
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

        {/* 2. Quick Actions */}
        <View style={styles.quickActionsRow}>
          <QuickActionPill
            icon="toilet"
            iconColor={colors.logBowel}
            label={t('careLog.bowel')}
            onPress={() => setQuickLogType('bowel')}
          />
          <QuickActionPill
            icon="water"
            iconColor={colors.logUrination}
            label={t('meal.fluid')}
            onPress={() => setQuickLogType('urination')}
          />
          <QuickActionPill
            icon="pill"
            iconColor={colors.logMedication}
            label={t('careLog.medication')}
            onPress={() => setQuickLogType('medication')}
          />
          <QuickActionPill
            icon="food-apple"
            iconColor={colors.logMeal}
            label={t('careLog.meal')}
            onPress={() => setQuickLogType('meal')}
          />
        </View>

        {/* 3. Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              icon="toilet"
              iconColor={colors.logBowel}
              bgColor="#FEF3C7"
              value={`${(dailySummary?.bowelCount ?? 0) + (dailySummary?.urinationCount ?? 0)}`}
              label={t('insights.bathroomVisits')}
            />
            <StatCard
              icon="cup-water"
              iconColor={colors.logUrination}
              bgColor="#DBEAFE"
              value={`${dailySummary?.fluidTotalMl ?? 0}ml`}
              label={t('insights.fluidIntake')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="pill"
              iconColor={colors.logMedication}
              bgColor="#F3E8FF"
              value={`${dailySummary?.medicationsTaken ?? 0}`}
              label={t('medication.taken')}
            />
            <StatCard
              icon="food-apple"
              iconColor={colors.logMeal}
              bgColor="#DCFCE7"
              value={`${dailySummary?.mealCount ?? 0}`}
              label={t('careLog.meal')}
            />
          </View>
        </View>

        {/* 4. Timeline */}
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
                  name="notebook-outline"
                  size={40}
                  color={colors.textTertiary}
                />
              </View>
              <Text style={styles.emptyText}>{t('home.noLogsToday')}</Text>
              <Text style={styles.emptySubtext}>{t('home.addFirstLog')}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Log')}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Quick Log Sheet */}
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
    paddingBottom: 100,
  },

  /* Hero */
  hero: {
    marginHorizontal: 16,
    marginTop: spacing.sm,
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  heroGreeting: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
  },
  heroName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  caringForRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroCaringFor: {
    fontSize: 13,
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

  /* Quick Actions */
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: GRID_PADDING,
    marginTop: 20,
    gap: 8,
  },
  quickPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  quickPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  /* Stats Grid */
  statsGrid: {
    marginHorizontal: GRID_PADDING,
    marginTop: 16,
    gap: CARD_GAP,
  },
  statsRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  statCard: {
    flex: 1,
    height: 120,
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
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
  },

  /* Timeline */
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
    width: 72,
    height: 72,
    borderRadius: 36,
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

  /* FAB */
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});
