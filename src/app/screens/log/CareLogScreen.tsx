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
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, shadows, logGradients } from '../../../theme';
import { LOG_TYPE_CONFIG, type LogType } from '../../../types/careLog';
import { useRecipientStore } from '../../../store/recipientStore';
import type { MainTabScreenProps } from '../../../types/navigation';
import { QuickLogSheet } from './QuickLogSheet';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = spacing.sm;
const CARD_PADDING = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

export function CareLogScreen({ navigation }: MainTabScreenProps<'Log'>) {
  const { t } = useTranslation();
  const { activeRecipient } = useRecipientStore();
  const [selectedLogType, setSelectedLogType] = useState<LogType | null>(null);

  const logTypes: LogType[] = [
    'bowel',
    'urination',
    'meal',
    'medication',
    'mood',
    'hygiene',
    'activity',
    'note',
  ];

  if (!activeRecipient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="account-plus"
            size={80}
            color={colors.textDisabled}
          />
          <Text style={styles.emptyText}>{t('recipient.addNew')}</Text>
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

      <ScrollView contentContainerStyle={styles.grid}>
        {logTypes.map((type) => {
          const config = LOG_TYPE_CONFIG[type];
          const gradient = logGradients[type] || [config.color, config.color];
          return (
            <TouchableOpacity
              key={type}
              activeOpacity={0.8}
              onPress={() => setSelectedLogType(type)}
              style={styles.cardWrapper}
            >
              <LinearGradient
                colors={gradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logCard}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name={config.icon as any}
                    size={32}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.logLabel}>{t(config.labelKey)}</Text>
              </LinearGradient>
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
    padding: spacing.md,
    paddingBottom: spacing.sm,
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
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    ...shadows.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logLabel: {
    ...typography.subtitle,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
