import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { useReminderStore } from '../../../store/reminderStore';
import { careLogService } from '../../../services/carelog.service';
import type { Reminder } from '../../../types/recipient';
import type { RootStackScreenProps } from '../../../types/navigation';

const TYPE_META: Record<Reminder['reminderType'], { icon: string; color: string }> = {
  toilet: { icon: 'toilet', color: '#8B5CF6' },
  medication: { icon: 'pill', color: '#059669' },
  fluid: { icon: 'cup-water', color: '#3B82F6' },
  custom: { icon: 'bell', color: '#F59E0B' },
};

// ── Smart suggestion types ────────────────────────────────────────────────────

interface HourSuggestion {
  hour: number;
  timeLabel: string;   // "08:00"
  totalCount: number;
  accidentCount: number;
  reason: 'accident' | 'meal' | 'frequent';
  isCovered: boolean;
}

// Post-meal high-risk windows (from caregiver experience)
const POST_MEAL_HOURS = new Set([8, 9, 12, 13, 18, 19]);

function computeSuggestions(
  logs: { occurredAt: string; logType: string; data: any }[],
  reminders: Reminder[]
): HourSuggestion[] {
  // Build per-hour stats
  const hourly = Array.from({ length: 24 }, () => ({ total: 0, accidents: 0 }));
  for (const log of logs) {
    if (log.logType !== 'urination' && log.logType !== 'bowel') continue;
    const h = new Date(log.occurredAt).getHours();
    hourly[h].total++;
    const isAccident =
      log.data?.isIncontinence === true ||
      log.data?.method === 'accident' ||
      log.data?.isAccident === true;
    if (isAccident) hourly[h].accidents++;
  }

  // Collect times already covered by existing toilet reminders (±30 min window)
  const coveredMinutes = new Set<number>();
  for (const r of reminders) {
    if (r.reminderType !== 'toilet' && r.reminderType !== 'custom') continue;
    if (!r.isActive) continue;
    if (r.schedule.times) {
      for (const t of r.schedule.times) {
        const [hh, mm] = t.split(':').map(Number);
        const abs = hh * 60 + mm;
        for (let d = -30; d <= 30; d++) coveredMinutes.add((abs + d + 1440) % 1440);
      }
    }
  }

  // Score and rank hours (skip overnight 0–5h — low clinical value for suggestions)
  const candidates = hourly
    .map((stat, h) => ({ h, ...stat }))
    .filter(({ h }) => h >= 6)
    .map(({ h, total, accidents }) => ({
      hour: h,
      timeLabel: `${String(h).padStart(2, '0')}:00`,
      totalCount: total,
      accidentCount: accidents,
      score: accidents * 3 + total + (POST_MEAL_HOURS.has(h) ? 2 : 0),
      reason: (
        accidents > 0 ? 'accident' :
        POST_MEAL_HOURS.has(h) ? 'meal' :
        'frequent'
      ) as HourSuggestion['reason'],
      isCovered: coveredMinutes.has(h * 60),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // If fewer than 3 data-driven suggestions, pad with post-meal defaults
  if (candidates.length < 3) {
    const defaults = [8, 12, 18].filter(
      h => !candidates.some(c => c.hour === h)
    );
    for (const h of defaults) {
      if (candidates.length >= 3) break;
      candidates.push({
        hour: h,
        timeLabel: `${String(h).padStart(2, '0')}:00`,
        totalCount: 0,
        accidentCount: 0,
        score: 0,
        reason: 'meal',
        isCovered: coveredMinutes.has(h * 60),
      });
    }
  }

  return candidates;
}

// ── Smart Suggestions Card ────────────────────────────────────────────────────

interface SmartSuggestionsCardProps {
  suggestions: HourSuggestion[];
  isLoading: boolean;
  onAdd: (hour: number, timeLabel: string) => void;
}

function SmartSuggestionsCard({ suggestions, isLoading, onAdd }: SmartSuggestionsCardProps) {
  const { t } = useTranslation();

  const REASON_COLOR: Record<HourSuggestion['reason'], string> = {
    accident: '#EF4444',
    meal:     '#D97706',
    frequent: '#0D9488',
  };
  const REASON_KEY: Record<HourSuggestion['reason'], string> = {
    accident: 'reminders.smart.reasonAccident',
    meal:     'reminders.smart.reasonMeal',
    frequent: 'reminders.smart.reasonFrequent',
  };

  return (
    <View style={styles.suggCard}>
      {/* Header */}
      <View style={styles.suggHeader}>
        <View style={styles.suggHeaderLeft}>
          <View style={styles.suggIconBox}>
            <MaterialCommunityIcons name="brain" size={14} color="#FFF" />
          </View>
          <Text style={styles.suggTitle}>{t('reminders.smart.title')}</Text>
        </View>
        <Text style={styles.suggSubtitle}>{t('reminders.smart.subtitle')}</Text>
      </View>
      <Text style={styles.suggDesc}>{t('reminders.smart.desc')}</Text>

      {isLoading ? (
        <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 12 }} />
      ) : (
        suggestions.map((s) => (
          <View key={s.hour} style={styles.suggRow}>
            {/* Time + stats */}
            <View style={styles.suggInfo}>
              <Text style={styles.suggTime}>{s.timeLabel}</Text>
              <View style={[styles.reasonBadge, { backgroundColor: `${REASON_COLOR[s.reason]}15` }]}>
                <Text style={[styles.reasonText, { color: REASON_COLOR[s.reason] }]}>
                  {t(REASON_KEY[s.reason])}
                </Text>
              </View>
              {s.totalCount > 0 && (
                <Text style={styles.suggCount}>
                  {t('reminders.smart.suggCount', { count: s.totalCount })}
                  {s.accidentCount > 0 && (
                    <Text style={styles.suggAccident}>{t('reminders.smart.suggAccident', { count: s.accidentCount })}</Text>
                  )}
                </Text>
              )}
            </View>

            {/* Action */}
            {s.isCovered ? (
              <View style={styles.coveredBadge}>
                <MaterialCommunityIcons name="check" size={12} color="#059669" />
                <Text style={styles.coveredText}>{t('reminders.smart.covered')}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => onAdd(s.hour, s.timeLabel)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="plus" size={14} color="#FFF" />
                <Text style={styles.addBtnText}>{t('reminders.smart.add')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </View>
  );
}

export function RemindersScreen({ navigation }: RootStackScreenProps<'Reminders'>) {
  const { t } = useTranslation();
  const { activeRecipient } = useRecipientStore();
  const { reminders, isLoading, loadReminders, toggleReminder, deleteReminder, createReminder } =
    useReminderStore();
  const [suggestions, setSuggestions] = useState<HourSuggestion[]>([]);
  const [suggLoading, setSuggLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (activeRecipient) {
      await loadReminders(activeRecipient.id);
    }
  }, [activeRecipient?.id, loadReminders]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Load suggestion data — last 30 days of toilet logs
  useEffect(() => {
    if (!activeRecipient) return;
    let cancelled = false;
    setSuggLoading(true);
    (async () => {
      try {
        const now = new Date();
        const allLogs: any[] = [];
        for (let i = 0; i < 30; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const day = await careLogService.getLogs(activeRecipient.id, { date: dateStr });
          allLogs.push(...day);
        }
        if (!cancelled) {
          setSuggestions(computeSuggestions(allLogs, reminders));
        }
      } finally {
        if (!cancelled) setSuggLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeRecipient?.id, reminders]);

  const handleAddSuggestion = useCallback(async (hour: number, timeLabel: string) => {
    if (!activeRecipient) return;
    const title = t('reminders.smart.notifTitle', { time: timeLabel });
    try {
      await createReminder(
        activeRecipient.id,
        title,
        'toilet',
        { times: [timeLabel] },
        { title, body: t('reminders.smart.notifBody') }
      );
    } catch { /* silent — reminder store handles errors */ }
  }, [activeRecipient?.id, createReminder, reminders]);

  const handleToggle = async (reminder: Reminder, value: boolean) => {
    await toggleReminder(reminder, value, {
      title: reminder.title,
      body: t(`reminders.${reminder.reminderType}`),
    });
  };

  const handleDelete = (reminder: Reminder) => {
    Alert.alert(
      t('common.delete'),
      reminder.title,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteReminder(reminder),
        },
      ]
    );
  };

  const formatSchedule = (reminder: Reminder): string => {
    const s = reminder.schedule;
    if (s.intervalMinutes) {
      const hours = Math.floor(s.intervalMinutes / 60);
      const mins = s.intervalMinutes % 60;
      if (hours > 0 && mins === 0) return `${t('common.add')} ${hours}h`;
      return `${s.intervalMinutes}min`;
    }
    if (s.times && s.times.length > 0) {
      return s.times.join(', ');
    }
    return '';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Dark compact header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('reminders.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        {/* Smart Suggestions */}
        <SmartSuggestionsCard
          suggestions={suggestions}
          isLoading={suggLoading}
          onAdd={handleAddSuggestion}
        />

        {reminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="bell-off-outline"
              size={48}
              color="#94A3B8"
            />
            <Text style={styles.emptyText}>{t('common.noData')}</Text>
            <Text style={styles.emptySubtext}>{t('reminders.addReminder')}</Text>
          </View>
        ) : (
          reminders.map((reminder) => {
            const meta = TYPE_META[reminder.reminderType];
            return (
              <TouchableOpacity
                key={reminder.id}
                onPress={() =>
                  navigation.navigate('ReminderForm', { reminderId: reminder.id })
                }
                onLongPress={() => handleDelete(reminder)}
                activeOpacity={0.7}
                style={styles.reminderCard}
              >
                <View
                  style={[
                    styles.iconBg,
                    { backgroundColor: meta.color + '18' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={meta.icon as any}
                    size={22}
                    color={meta.color}
                  />
                </View>
                <View style={styles.reminderText}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <Text style={styles.reminderSchedule}>
                    {formatSchedule(reminder)}
                  </Text>
                </View>
                <Switch
                  value={reminder.isActive}
                  onValueChange={(v) => handleToggle(reminder, v)}
                  trackColor={{ false: '#E2E8F0', true: '#059669' }}
                  thumbColor="#FFFFFF"
                />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate('ReminderForm', {})}
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
  reminderCard: {
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderText: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  reminderSchedule: {
    fontSize: 12,
    color: '#64748B',
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
  emptySubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
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

  /* Smart Suggestions Card */
  suggCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  suggHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  suggHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  suggSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  suggDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    marginLeft: 32,
  },
  suggRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  suggInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  suggTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    width: 52,
  },
  reasonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  reasonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  suggCount: {
    fontSize: 11,
    color: '#64748B',
  },
  suggAccident: {
    color: '#EF4444',
    fontWeight: '600',
  },
  coveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
  },
  coveredText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#059669',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
