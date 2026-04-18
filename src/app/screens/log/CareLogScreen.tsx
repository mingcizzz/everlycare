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

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const CARD_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

const ESSENTIAL_TYPES: LogType[] = ['bowel', 'urination', 'meal', 'medication'];
const WELLNESS_TYPES: LogType[] = ['mood', 'hygiene', 'activity', 'note'];

interface LogCardProps {
  type: LogType;
  onPress: () => void;
}

function LogCard({ type, onPress }: LogCardProps) {
  const { t } = useTranslation();
  const config = LOG_TYPE_CONFIG[type];
  const bgColor = logBackgrounds[type] || colors.surface;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.logCard, { backgroundColor: bgColor }]}
      >
        <MaterialCommunityIcons
          name={config.icon as any}
          size={36}
          color={config.color}
        />
        <Text style={styles.logLabel} numberOfLines={1}>
          {t(config.labelKey)}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function CareLogScreen({ navigation }: MainTabScreenProps<'Log'>) {
  const { t } = useTranslation();
  const { activeRecipient } = useRecipientStore();
  const [selectedLogType, setSelectedLogType] = useState<LogType | null>(null);

  if (!activeRecipient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <MaterialCommunityIcons
              name="account-plus-outline"
              size={48}
              color={colors.textTertiary}
            />
          </View>
          <Text style={styles.emptyTitle}>{t('recipient.addNew')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('recipient.addNewDescription', { defaultValue: 'Add a care recipient to start logging' })}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Log Care</Text>
        <Text style={styles.subtitle}>
          {t('home.caringFor', { name: activeRecipient.name })}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Essentials Section */}
        <Text style={styles.sectionLabel}>ESSENTIALS</Text>
        <View style={styles.grid}>
          {ESSENTIAL_TYPES.map((type) => (
            <LogCard
              key={type}
              type={type}
              onPress={() => setSelectedLogType(type)}
            />
          ))}
        </View>

        {/* Wellness Section */}
        <Text style={styles.sectionLabel}>WELLNESS</Text>
        <View style={styles.grid}>
          {WELLNESS_TYPES.map((type) => (
            <LogCard
              key={type}
              type={type}
              onPress={() => setSelectedLogType(type)}
            />
          ))}
        </View>
      </ScrollView>

      {selectedLogType && (
        <QuickLogSheet
          logType={selectedLogType}
          recipientId={activeRecipient.id}
          onDismiss={() => setSelectedLogType(null)}
          onSaved={() => {
            setSelectedLogType(null);
            Alert.alert(t('careLog.logSaved'));
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
  header: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: spacing.xxl,
  },

  /* Section Labels */
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 24,
    paddingHorizontal: 4,
  },

  /* Grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  logCard: {
    borderRadius: 24,
    height: 140,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.06,
    elevation: 2,
  },
  logLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 12,
  },

  /* Empty State */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
