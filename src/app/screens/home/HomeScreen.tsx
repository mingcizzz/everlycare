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
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/authStore';
import { useRecipientStore } from '../../../store/recipientStore';
import { useCareLogStore } from '../../../store/careLogStore';
import { colors, spacing } from '../../../theme';
import { TimelineFeed } from '../../../components/log/TimelineFeed';
import { QuickLogSheet } from '../log/QuickLogSheet';
import { getToday } from '../../../utils/date';
import type { MainTabScreenProps } from '../../../types/navigation';
import type { LogType } from '../../../types/careLog';

const { width: SW } = Dimensions.get('window');

const RING_SIZE = 160;
const RING_STROKE = 10;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;
const TARGET = 8;

function greetingInfo() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', icon: 'weather-sunny' as const };
  if (h < 18) return { text: 'Good afternoon', icon: 'weather-partly-cloudy' as const };
  return { text: 'Good evening', icon: 'weather-night' as const };
}

const STATS_CFG = [
  { key: 'bath', icon: 'toilet', label: 'Bathroom', color: '#F59E0B' },
  { key: 'fluid', icon: 'cup-water', label: 'Fluid', color: '#3B82F6' },
  { key: 'meds', icon: 'pill', label: 'Meds', color: '#8B5CF6' },
  { key: 'meal', icon: 'food-apple', label: 'Meals', color: '#10B981' },
] as const;

const QUICK = [
  { type: 'bowel' as LogType, icon: 'toilet', color: '#8B7355' },
  { type: 'urination' as LogType, icon: 'water', color: '#3B82F6' },
  { type: 'meal' as LogType, icon: 'food-apple', color: '#F59E0B' },
  { type: 'medication' as LogType, icon: 'pill', color: '#8B5CF6' },
  { type: 'mood' as LogType, icon: 'emoticon-outline', color: '#EC4899' },
  { type: 'note' as LogType, icon: 'note-text', color: '#6B7280' },
];

/* ── Mini Stat Chip ── */
function StatChip({ icon, value, label, color }: {
  icon: string; value: string; label: string; color: string;
}) {
  return (
    <View style={s.statChip}>
      <View style={[s.statDot, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon as any} size={16} color="#FFF" />
      </View>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

/* ── Home ── */
export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { activeRecipient, loadRecipients } = useRecipientStore();
  const { logs, dailySummary, isLoading, loadLogs, loadDailySummary } = useCareLogStore();
  const [qlType, setQlType] = useState<LogType | null>(null);

  const today = getToday();
  const g = greetingInfo();

  const refresh = useCallback(async () => {
    await loadRecipients();
    if (activeRecipient) {
      await Promise.all([
        loadLogs(activeRecipient.id, today),
        loadDailySummary(activeRecipient.id, today),
      ]);
    }
  }, [activeRecipient?.id, today]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const total = dailySummary?.totalLogs ?? 0;
  const pct = Math.min(1, total / TARGET);
  const dash = RING_C * (1 - pct);

  const statValues = [
    `${(dailySummary?.bowelCount ?? 0) + (dailySummary?.urinationCount ?? 0)}`,
    `${dailySummary?.fluidTotalMl ?? 0}`,
    `${dailySummary?.medicationsTaken ?? 0}`,
    `${dailySummary?.mealCount ?? 0}`,
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#fff" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ━━ HERO ━━ full-bleed dark teal section */}
        <LinearGradient
          colors={['#0C8C80', '#085C54']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={[s.hero, { paddingTop: insets.top + 16 }]}
        >
          {/* Greeting */}
          <View style={s.greetRow}>
            <MaterialCommunityIcons name={g.icon as any} size={18} color="rgba(255,255,255,0.7)" />
            <Text style={s.greetTxt}>{g.text}</Text>
          </View>
          <Text style={s.heroName}>{user?.displayName || 'EverlyCare'}</Text>
          {activeRecipient && (
            <Text style={s.heroCaring}>
              {t('home.caringFor', { name: activeRecipient.name })}
            </Text>
          )}

          {/* Ring */}
          <View style={s.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_R}
                stroke="rgba(255,255,255,0.12)" strokeWidth={RING_STROKE} fill="none" />
              <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_R}
                stroke="#FFF" strokeWidth={RING_STROKE} strokeLinecap="round"
                fill="none" strokeDasharray={`${RING_C}`} strokeDashoffset={dash}
                rotation={-90} origin={`${RING_SIZE/2},${RING_SIZE/2}`} />
            </Svg>
            <View style={s.ringCenter}>
              <Text style={s.ringNum}>{total}</Text>
              <Text style={s.ringSub}>of {TARGET}</Text>
            </View>
          </View>

          <Text style={s.ringCaption}>care logs today</Text>
        </LinearGradient>

        {/* ━━ STATS ROW ━━ floating chips overlapping hero */}
        <View style={s.statsRow}>
          {STATS_CFG.map((cfg, i) => (
            <StatChip key={cfg.key} icon={cfg.icon} color={cfg.color}
              value={statValues[i]} label={cfg.label} />
          ))}
        </View>

        {/* ━━ QUICK ACTIONS ━━ */}
        <View style={s.section}>
          <Text style={s.secTitle}>{t('home.quickLog')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.quickRow}>
            {QUICK.map(q => (
              <TouchableOpacity key={q.type} activeOpacity={0.75}
                style={s.quickBtn} onPress={() => setQlType(q.type)}>
                <View style={[s.quickIcon, { backgroundColor: q.color + '15' }]}>
                  <MaterialCommunityIcons name={q.icon as any} size={22} color={q.color} />
                </View>
                <Text style={s.quickLbl}>{t(`careLog.${q.type}`)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ━━ TIMELINE ━━ */}
        <View style={s.section}>
          <View style={s.secHeader}>
            <Text style={s.secTitle}>{t('home.timeline')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Log')} activeOpacity={0.7}>
              <Text style={s.seeAll}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          {logs.length > 0 ? (
            <TimelineFeed logs={logs.slice(0, 5)} />
          ) : (
            <View style={s.empty}>
              <MaterialCommunityIcons name="notebook-outline" size={48} color="#CBD5E1" />
              <Text style={s.emptyTxt}>{t('home.noLogsToday')}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[s.fab, { bottom: 20 }]}
        onPress={() => navigation.navigate('Log')} activeOpacity={0.85}>
        <LinearGradient colors={['#0D9488','#085C54']} style={s.fabGrad}
          start={{x:0,y:0}} end={{x:1,y:1}}>
          <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {qlType && activeRecipient && (
        <QuickLogSheet logType={qlType} recipientId={activeRecipient.id}
          onDismiss={() => setQlType(null)}
          onSaved={() => { setQlType(null); refresh(); }} />
      )}
    </View>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },

  /* HERO */
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  greetTxt: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  heroName: { fontSize: 30, fontWeight: '800', color: '#FFF', letterSpacing: -0.8, marginBottom: 4 },
  heroCaring: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },

  ringWrap: { alignSelf: 'center', marginTop: 28, width: RING_SIZE, height: RING_SIZE },
  ringCenter: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  ringNum: { fontSize: 52, fontWeight: '800', color: '#FFF', letterSpacing: -2 },
  ringSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: -4 },
  ringCaption: { textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 10 },

  /* STATS — overlapping hero bottom edge */
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -32,
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16,
    elevation: 4,
  },
  statChip: { flex: 1, alignItems: 'center' },
  statDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statVal: { fontSize: 20, fontWeight: '700', color: '#1E293B', letterSpacing: -0.5 },
  statLbl: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  /* SECTIONS */
  section: { marginTop: 28, paddingHorizontal: 20 },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  secTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', letterSpacing: -0.3 },
  seeAll: { fontSize: 14, fontWeight: '600', color: colors.primary },

  /* QUICK ACTIONS */
  quickRow: { gap: 16, paddingRight: 20 },
  quickBtn: { alignItems: 'center', width: 64 },
  quickIcon: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickLbl: { fontSize: 12, fontWeight: '500', color: '#64748B', textAlign: 'center' },

  /* EMPTY */
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTxt: { fontSize: 14, color: '#94A3B8', marginTop: 12 },

  /* FAB */
  fab: { position: 'absolute', right: 20, shadowColor: '#0D9488', shadowOffset: {width:0,height:6}, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  fabGrad: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});
