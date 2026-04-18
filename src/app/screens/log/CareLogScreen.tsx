import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, logBackgrounds } from '../../../theme';
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
  const { activeRecipient } = useRecipientStore();
  const [selectedType, setSelectedType] = useState<LogType | null>(null);

  if (!activeRecipient) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.empty}>
          <View style={s.emptyCircle}>
            <MaterialCommunityIcons name="account-plus" size={48} color="#94A3B8" />
          </View>
          <Text style={s.emptyTitle}>{t('recipient.addNew')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Log Care</Text>
          <Text style={s.subtitle}>{t('home.caringFor', { name: activeRecipient.name })}</Text>
        </View>

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
      </ScrollView>

      {selectedType && (
        <QuickLogSheet
          logType={selectedType}
          recipientId={activeRecipient.id}
          onDismiss={() => setSelectedType(null)}
          onSaved={() => { setSelectedType(null); Alert.alert(t('careLog.logSaved')); }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },
  scroll: { paddingBottom: 40 },

  header: { paddingHorizontal: PAD, paddingTop: spacing.md, paddingBottom: 4 },
  title: { fontSize: 30, fontWeight: '800', color: '#1E293B', letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },

  groupLabel: {
    fontSize: 12, fontWeight: '700', color: '#94A3B8',
    letterSpacing: 2, marginTop: 28, marginBottom: 14, paddingHorizontal: PAD,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: PAD, gap: GAP,
  },
  cardWrap: { width: CARD_W },
  card: {
    height: 140, borderRadius: 24, padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B', letterSpacing: -0.2 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#64748B' },
});
