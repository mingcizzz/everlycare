import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  Modal,
  Pressable,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/authStore';
import { useRecipientStore } from '../../../store/recipientStore';
import { useCareLogStore } from '../../../store/careLogStore';
import { useToiletPredictionStore } from '../../../store/toiletPredictionStore';
import { useOutdoorModeStore } from '../../../store/outdoorModeStore';
import { ToiletPredictionCard } from '../../../components/toilet/ToiletPredictionCard';
import { colors } from '../../../theme';
import { TimelineFeed } from '../../../components/log/TimelineFeed';
import { QuickLogSheet } from '../log/QuickLogSheet';
import { getToday } from '../../../utils/date';
import type { MainTabScreenProps } from '../../../types/navigation';
import type { LogType } from '../../../types/careLog';

const { width: SW } = Dimensions.get('window');
const RING = 180;
const STR = 12;
const R = (RING - STR) / 2;
const C = 2 * Math.PI * R;
const TARGET = 8;

function greetIcon() {
  const h = new Date().getHours();
  if (h < 12) return 'weather-sunny' as const;
  if (h < 18) return 'weather-partly-cloudy' as const;
  return 'weather-night' as const;
}

function greetKey() {
  const h = new Date().getHours();
  if (h < 12) return 'home.greetMorning';
  if (h < 18) return 'home.greetAfternoon';
  return 'home.greetEvening';
}

const ACTIONS: { type: LogType; icon: string; labelKey: string; bg: string; fg: string }[] = [
  { type: 'bowel',      icon: 'toilet',                 labelKey: 'careLog.bowel',      bg: '#FEF3C7', fg: '#D97706' },
  { type: 'urination',  icon: 'water',                  labelKey: 'careLog.urination',  bg: '#DBEAFE', fg: '#2563EB' },
  { type: 'medication', icon: 'pill',                   labelKey: 'careLog.medication', bg: '#EDE9FE', fg: '#7C3AED' },
  { type: 'meal',       icon: 'food-apple',             labelKey: 'careLog.meal',       bg: '#D1FAE5', fg: '#059669' },
  { type: 'mood',       icon: 'emoticon-happy-outline', labelKey: 'careLog.mood',       bg: '#FCE7F3', fg: '#DB2777' },
  { type: 'note',       icon: 'note-edit-outline',      labelKey: 'careLog.note',       bg: '#F1F5F9', fg: '#475569' },
];

/* ━━ Glass Stat Card ━━ */
function GlassStat({ icon, value, unit, label, accent }: {
  icon: string; value: string; unit?: string; label: string; accent: string;
}) {
  return (
    <View style={st.glassCard}>
      <BlurView intensity={60} tint="light" style={st.glassInner}>
        <View style={st.glassTop}>
          <View style={[st.glassDot, { backgroundColor: accent }]}>
            <MaterialCommunityIcons name={icon as any} size={14} color="#FFF" />
          </View>
          <Text style={st.glassLabel}>{label}</Text>
        </View>
        <View style={st.glassBottom}>
          <Text style={st.glassValue}>{value}</Text>
          {unit && <Text style={st.glassUnit}>{unit}</Text>}
        </View>
      </BlurView>
    </View>
  );
}

/* ━━ HOME ━━ */
export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { t } = useTranslation();
  const ins = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { activeRecipient, loadRecipients } = useRecipientStore();
  const { logs, dailySummary, isLoading, loadLogs, loadDailySummary } = useCareLogStore();
  const { prediction, isLoading: predLoading, refreshPrediction, onToiletVisitLogged } =
    useToiletPredictionStore();
  const {
    isOutdoor, showChecklist, checklist,
    openChecklist, closeChecklist, toggleChecklistItem, confirmOutdoor, deactivateOutdoor,
  } = useOutdoorModeStore();
  const [ql, setQl] = useState<LogType | null>(null);
  const [accidentSaved, setAccidentSaved] = useState(false);
  const { addLog } = useCareLogStore();

  const today = getToday();

  const handleQuickAccident = useCallback(async () => {
    if (!activeRecipient) return;
    try {
      await addLog(
        activeRecipient.id,
        'urination',
        { method: 'accident', volume: 'medium', isIncontinence: true },
        new Date().toISOString()
      );
      setAccidentSaved(true);
      setTimeout(() => setAccidentSaved(false), 2500);
      onToiletVisitLogged(activeRecipient.id, activeRecipient);
      loadDailySummary(activeRecipient.id, today);
    } catch { /* silent */ }
  }, [activeRecipient?.id, today]);
  const refresh = useCallback(async () => {
    await loadRecipients();
    if (activeRecipient) {
      await Promise.all([
        loadLogs(activeRecipient.id, today),
        loadDailySummary(activeRecipient.id, today),
      ]);
    }
  }, [activeRecipient?.id, today]);

  useFocusEffect(useCallback(() => {
    refresh();
    if (activeRecipient) refreshPrediction(activeRecipient.id, activeRecipient);
  }, [refresh, activeRecipient?.id]));

  // Refresh prediction every 5 minutes while foregrounded
  useEffect(() => {
    if (!activeRecipient) return;
    const id = setInterval(
      () => refreshPrediction(activeRecipient.id, activeRecipient),
      5 * 60 * 1000
    );
    return () => clearInterval(id);
  }, [activeRecipient?.id]);

  const total = dailySummary?.totalLogs ?? 0;
  const pct = Math.min(1, total / TARGET);
  const dash = C * (1 - pct);
  const greetText = t(greetKey());
  const greetI = greetIcon();

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#FFF" />}
      >
        {/* ━━ DARK HERO ━━ */}
        <LinearGradient
          colors={['#064E3B', '#065F46', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[st.hero, { paddingTop: ins.top + 20 }]}
        >
          {/* Decorative circles */}
          <View style={st.decoCircle1} />
          <View style={st.decoCircle2} />

          {/* Greeting */}
          <View style={st.greetRow}>
            <MaterialCommunityIcons name={greetI as any} size={16} color="rgba(255,255,255,0.6)" />
            <Text style={st.greetTxt}>{greetText}</Text>
          </View>
          <Text style={st.heroName}>{user?.displayName || 'EverlyCare'}</Text>
          {activeRecipient && (
            <Text style={st.heroCare}>{t('home.caringFor', { name: activeRecipient.name })}</Text>
          )}

          {/* Progress Ring */}
          <View style={st.ringBox}>
            <Svg width={RING} height={RING}>
              <Defs>
                <SvgGrad id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#34D399" />
                  <Stop offset="1" stopColor="#10B981" />
                </SvgGrad>
              </Defs>
              <Circle cx={RING/2} cy={RING/2} r={R}
                stroke="rgba(255,255,255,0.08)" strokeWidth={STR} fill="none" />
              <Circle cx={RING/2} cy={RING/2} r={R}
                stroke="url(#ringGrad)" strokeWidth={STR} strokeLinecap="round"
                fill="none" strokeDasharray={`${C}`} strokeDashoffset={dash}
                rotation={-90} origin={`${RING/2},${RING/2}`} />
            </Svg>
            <View style={st.ringCenter}>
              <Text style={st.ringNum}>{total}</Text>
              <Text style={st.ringSub}>{t('home.ringSubtitle', { target: TARGET })}</Text>
            </View>
          </View>

          {/* Glass Stats */}
          <View style={st.glassRow}>
            <GlassStat icon="toilet" accent="#F59E0B"
              value={`${(dailySummary?.bowelCount ?? 0) + (dailySummary?.urinationCount ?? 0)}`}
              label={t('home.statBath')} />
            <GlassStat icon="cup-water" accent="#3B82F6"
              value={`${dailySummary?.fluidTotalMl ?? 0}`} unit="ml"
              label={t('home.statFluid')} />
            <GlassStat icon="pill" accent="#8B5CF6"
              value={`${dailySummary?.medicationsTaken ?? 0}`}
              label={t('home.statMeds')} />
            <GlassStat icon="food-apple" accent="#10B981"
              value={`${dailySummary?.mealCount ?? 0}`}
              label={t('home.statMeals')} />
          </View>
        </LinearGradient>

        {/* ━━ QUICK ACTIONS ━━ */}
        <View style={st.section}>
          <Text style={st.secTitle}>{t('home.quickLog')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={st.actRow}>
            {ACTIONS.map(a => (
              <TouchableOpacity key={a.type} activeOpacity={0.8}
                style={st.actCard} onPress={() => setQl(a.type)}>
                <View style={[st.actIcon, { backgroundColor: a.bg }]}>
                  <MaterialCommunityIcons name={a.icon as any} size={24} color={a.fg} />
                </View>
                <Text style={st.actLabel}>{t(a.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ━━ QUICK ACCIDENT ━━ */}
        {activeRecipient && (
          <View style={st.section}>
            <TouchableOpacity
              style={[st.accidentBtn, accidentSaved && st.accidentBtnSaved]}
              onPress={handleQuickAccident}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={accidentSaved ? 'check-circle' : 'alert-circle'}
                size={20}
                color="#FFF"
              />
              <Text style={st.accidentBtnText}>
                {accidentSaved ? t('home.accidentBtn.saved') : t('home.accidentBtn.default')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ━━ OUTDOOR MODE ━━ */}
        <View style={st.section}>
          <TouchableOpacity
            style={[st.outdoorBtn, isOutdoor && st.outdoorBtnActive]}
            onPress={isOutdoor ? deactivateOutdoor : openChecklist}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isOutdoor ? 'map-marker-check' : 'walk'}
              size={18}
              color={isOutdoor ? '#FFFFFF' : '#D97706'}
            />
            <Text style={[st.outdoorBtnText, isOutdoor && st.outdoorBtnTextActive]}>
              {isOutdoor ? t('home.outdoor.active') : t('home.outdoor.inactive')}
            </Text>
            {isOutdoor && (
              <View style={st.outdoorLiveDot} />
            )}
          </TouchableOpacity>
        </View>

        {/* ━━ TOILET PREDICTION ━━ */}
        {activeRecipient && (
          <View style={st.section}>
            <Text style={st.secTitle}>{t('home.outdoor.predictionTitle')}</Text>
            <ToiletPredictionCard
              prediction={prediction}
              isLoading={predLoading}
              todayUrinations={logs.filter(l => l.logType === 'urination')}
              onLogToilet={() => setQl('urination')}
            />
          </View>
        )}

        {/* ━━ TIMELINE ━━ */}
        <View style={st.section}>
          <View style={st.secHead}>
            <Text style={st.secTitle}>{t('home.timeline')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Log')} activeOpacity={0.7}>
              <Text style={st.seeAll}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          {logs.length > 0 ? (
            <TimelineFeed logs={logs.slice(0, 5)} />
          ) : (
            <View style={st.empty}>
              <MaterialCommunityIcons name="notebook-outline" size={44} color="#CBD5E1" />
              <Text style={st.emptyTxt}>{t('home.noLogsToday')}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[st.fab, { bottom: 20 }]}
        onPress={() => navigation.navigate('Log')} activeOpacity={0.85}>
        <LinearGradient colors={['#10B981', '#059669']} style={st.fabG}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {ql && activeRecipient && (
        <QuickLogSheet logType={ql} recipientId={activeRecipient.id}
          onDismiss={() => setQl(null)}
          onSaved={() => {
            const loggedType = ql;
            setQl(null);
            refresh();
            if (loggedType === 'urination' && activeRecipient) {
              onToiletVisitLogged(activeRecipient.id, activeRecipient);
            }
          }} />
      )}

      {/* ━━ OUTDOOR CHECKLIST MODAL ━━ */}
      <Modal visible={showChecklist} animationType="slide" transparent onRequestClose={closeChecklist}>
        <View style={st.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeChecklist} />
          <View style={st.modalSheet}>
            <View style={st.modalHandle} />
            <Text style={st.modalTitle}>{t('home.outdoor.checklistTitle')}</Text>
            <Text style={st.modalSubtitle}>{t('home.outdoor.checklistSubtitle')}</Text>
            {checklist.map(item => (
              <TouchableOpacity
                key={item.id}
                style={st.checkRow}
                onPress={() => toggleChecklistItem(item.id)}
                activeOpacity={0.7}
              >
                <View style={[st.checkbox, item.checked && st.checkboxChecked]}>
                  {item.checked && <MaterialCommunityIcons name="check" size={14} color="#FFF" />}
                </View>
                <Text style={[st.checkLabel, item.checked && st.checkLabelDone]}>{t(item.labelKey)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={st.departBtn} onPress={confirmOutdoor} activeOpacity={0.8}>
              <MaterialCommunityIcons name="walk" size={18} color="#FFF" />
              <Text style={st.departBtnText}>{t('home.outdoor.departBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },

  /* HERO */
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  decoCircle1: {
    position: 'absolute', top: -60, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decoCircle2: {
    position: 'absolute', bottom: 20, left: -60,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  greetTxt: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  heroName: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -1 },
  heroCare: { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 2 },

  /* Ring */
  ringBox: { alignSelf: 'center', marginTop: 32, width: RING, height: RING },
  ringCenter: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  ringNum: { fontSize: 56, fontWeight: '800', color: '#FFF', letterSpacing: -2 },
  ringSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: -2 },

  /* Glass Stats */
  glassRow: { flexDirection: 'row', gap: 8, marginTop: 28 },
  glassCard: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  glassInner: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  glassTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  glassDot: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  glassLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  glassBottom: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  glassValue: { fontSize: 22, fontWeight: '700', color: '#FFF', letterSpacing: -0.5 },
  glassUnit: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },

  /* Sections */
  section: { marginTop: 28, paddingHorizontal: 20 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  secTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', letterSpacing: -0.3, marginBottom: 16 },
  seeAll: { fontSize: 14, fontWeight: '600', color: '#059669' },

  /* Actions */
  actRow: { gap: 12, paddingRight: 20 },
  actCard: { alignItems: 'center', width: 68 },
  actIcon: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },

  /* Empty */
  empty: { alignItems: 'center', paddingVertical: 36 },
  emptyTxt: { fontSize: 14, color: '#94A3B8', marginTop: 12 },

  /* Outdoor mode */
  outdoorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    height: 44,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  outdoorBtnActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  outdoorBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  outdoorBtnTextActive: {
    color: '#FFFFFF',
  },
  outdoorLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FDE68A',
  },

  /* Outdoor checklist modal */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkLabel: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  checkLabelDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  departBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
    borderRadius: 20,
    height: 52,
    marginTop: 24,
  },
  departBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Accident button */
  accidentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    borderRadius: 16,
    height: 48,
  },
  accidentBtnSaved: {
    backgroundColor: '#059669',
  },
  accidentBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* FAB */
  fab: { position: 'absolute', right: 20, shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  fabG: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});
