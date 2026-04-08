import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { LOG_TYPE_CONFIG, type CareLog } from '../../types/careLog';
import { formatTime } from '../../utils/date';

interface LogEntryCardProps {
  log: CareLog;
  onPress?: () => void;
  onLongPress?: () => void;
  showDate?: boolean;
}

export function LogEntryCard({ log, onPress, onLongPress, showDate }: LogEntryCardProps) {
  const { t } = useTranslation();
  const config = LOG_TYPE_CONFIG[log.logType];

  const summary = buildLogSummary(log, t);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.container}
    >
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{formatTime(log.occurredAt)}</Text>
        {showDate && (
          <Text style={styles.dateText}>
            {new Date(log.occurredAt).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={[styles.dot, { backgroundColor: config.color }]} />

      <View style={[styles.content, { borderLeftColor: config.color }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBg, { backgroundColor: config.color + '20' }]}>
            <MaterialCommunityIcons
              name={config.icon}
              size={18}
              color={config.color}
            />
          </View>
          <Text style={styles.label}>{t(config.labelKey)}</Text>
        </View>
        {summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {summary}
          </Text>
        ) : null}
        {log.notes ? (
          <Text style={styles.notes} numberOfLines={2}>
            {log.notes}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function buildLogSummary(log: CareLog, t: (key: string) => string): string | null {
  const data = log.data as any;
  switch (log.logType) {
    case 'bowel':
      return `${t(`bowel.${data.type}`)} · ${t(`bowel.${data.location}`)}${
        data.isAccident ? ' · ' + t('bowel.accident') : ''
      }`;
    case 'urination':
      return `${t(`urination.${data.method}`)} · ${t(`urination.${data.volume}`)}`;
    case 'meal':
      if (data.mealType === 'fluid') {
        return `${t('meal.fluid')} · ${data.fluidAmountMl || 0}ml`;
      }
      return `${t(`meal.${data.mealType}`)}${
        data.description ? ' · ' + data.description : ''
      }`;
    case 'medication':
      return `${data.medicationName} · ${t(`medication.${data.status}`)}`;
    case 'mood':
      return `${t(`mood.${data.mood}`)}`;
    case 'hygiene':
      return `${t(`hygiene.${data.type}`)}`;
    case 'activity':
      return `${t(`activity.${data.activityType}`)}${
        data.durationMinutes ? ' · ' + data.durationMinutes + ' ' + t('activity.minutes') : ''
      }`;
    case 'note':
      return data.content || null;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  timeColumn: {
    width: 56,
    alignItems: 'flex-end',
    paddingTop: spacing.xs,
  },
  timeText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dateText: {
    ...typography.caption,
    color: colors.textDisabled,
    fontSize: 10,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 6,
    marginHorizontal: spacing.sm,
  },
  content: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBg: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  summary: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginLeft: 36,
  },
  notes: {
    ...typography.caption,
    color: colors.textDisabled,
    marginTop: 2,
    marginLeft: 36,
    fontStyle: 'italic',
  },
});
