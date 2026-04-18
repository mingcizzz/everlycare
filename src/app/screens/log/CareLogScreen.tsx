import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { logBackgrounds } from '../../../theme';
import { LOG_TYPE_CONFIG, type LogType } from '../../../types/careLog';
import { useRecipientStore } from '../../../store/recipientStore';
import type { MainTabScreenProps } from '../../../types/navigation';
import { QuickLogSheet } from './QuickLogSheet';

const SW = Dimensions.get('window').width;
const GAP = 14;
const PAD = 20;
const CARD_W = (SW - PAD * 2 - GAP) / 2;

const ESSENTIALS: LogType[] = ['bowel', 'urination', 'meal', 'medication'];
const WELLNESS: LogType[] = ['mood', 'hygiene', 'activity', 'note'];

function LogCard({ type, onPress }: { type: LogType; onPress: () => void }) {
  const { t } = useTranslation();
  const config = LOG_TYPE_CONFIG[type];
  const bg = logBackgrounds[type] || '#F5F5F5';
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[s.cardWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        style={[s.card, { backgroundColor: bg }]}
      >
        <View style={[s.iconWrap, { backgroundColor: config.color + '20' }]}>
          <MaterialCommunityIcons name={config.icon as any} size={28} color={config.color} />
        </View>
        <Text style={s.cardLabel}>{t(config.labelKey)}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function CareLogScreen({ navigation }: MainTabScreenProps<'Log'>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { activeRecipient } = useRecipientStore();
  const [selectedType, setSelectedType] = useState<LogType | null>(null);

  if (!activeRecipient) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#064E3B', '#065F46', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.hero, { paddingTop: insets.top + 20 }]}
        >
          <Text style={s.heroTitle}>Log Care</Text>
        </LinearGradient>
        <View style={s.emptyWrap}>
          <View style={s.emptyCircle}>
            <MaterialCommunityIcons name="account-plus" size={48} color="#94A3B8" />
          </View>
          <Text style={s.emptyTitle}>{t('recipient.addNew')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Dark Hero Header */}
        <LinearGradient
          colors={['#064E3B', '#065F46', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.hero, { paddingTop: insets.top + 20 }]}
        >
          <View style={s.decoCircle1} />
          <Text style={s.heroTitle}>Log Care</Text>
          <Text style={s.heroSub}>{t('home.caringFor', { name: activeRecipient.name })}</Text>
        </LinearGradient>

        {/* Cards Section */}
        <View style={s.content}>
          <Text style={s.groupLabel}>ESSENTIALS</Text>
          <View style={s.grid}>
            {ESSENTIALS.map(type => (
              <LogCard key={type} type={type} onPress={() => setSelectedType(type)} />
            ))}
          </View>

          <Text style={s.groupLabel}>WELLNESS</Text>
          <View style={s.grid}>
            {WELLNESS.map(type => (
              <LogCard key={type} type={type} onPress={() => setSelectedType(type)} />
            ))}
          </View>
        </View>
      </ScrollView>

      {selectedType && (
        <QuickLogSheet
          logType={selectedType}
          recipientId={activeRecipient.id}
          onDismiss={() => setSelectedType(null)}
          onSaved={() => { setSelectedType(null); Alert.alert(t('careLog.logSaved')); }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },

  /* Hero */
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  decoCircle1: {
    position: 'absolute', top: -40, right: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroTitle: {
    fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -1,
  },
  heroSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 4,
  },

  /* Content */
  content: {
    paddingTop: 4,
  },
  groupLabel: {
    fontSize: 12, fontWeight: '700', color: '#94A3B8',
    letterSpacing: 2, marginTop: 24, marginBottom: 14, paddingHorizontal: PAD,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: PAD, gap: GAP,
  },
  cardWrap: { width: CARD_W },
  card: {
    height: 140, borderRadius: 24, padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B', letterSpacing: -0.2 },

  /* Empty */
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#64748B' },
});
