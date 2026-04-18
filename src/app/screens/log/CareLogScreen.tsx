import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, shadows, logBackgrounds } from '../../../theme';
import { LOG_TYPE_CONFIG, type LogType } from '../../../types/careLog';
import { useRecipientStore } from '../../../store/recipientStore';
import type { MainTabScreenProps } from '../../../types/navigation';
import { QuickLogSheet } from './QuickLogSheet';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = spacing.sm;
const CARD_PADDING = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

const LOG_TYPES: LogType[] = [
  'bowel',
  'urination',
  'meal',
  'medication',
  'mood',
  'hygiene',
  'activity',
  'note',
];

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
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.quickLog')}</Text>
        <Text style={styles.subtitle}>
          {t('home.caringFor', { name: activeRecipient.name })}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {LOG_TYPES.map((type) => {
          const config = LOG_TYPE_CONFIG[type];
          const bgColor = logBackgrounds[type] || colors.surface;

          return (
            <TouchableOpacity
              key={type}
              activeOpacity={0.85}
              onPress={() => setSelectedLogType(type)}
              style={styles.cardWrapper}
            >
              <View style={styles.logCard}>
                <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
                  <MaterialCommunityIcons
                    name={config.icon as any}
                    size={28}
                    color={config.color}
                  />
                </View>
                <Text style={styles.logLabel} numberOfLines={1}>
                  {t(config.labelKey)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: CARD_PADDING,
    gap: CARD_GAP,
    paddingBottom: spacing.xxl,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
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
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
