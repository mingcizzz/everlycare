import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
      {/* Time column */}
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{formatTime(log.occurredAt)}</Text>
        {showDate && (
          <Text style={styles.dateText}>
            {new Date(log.occurredAt).toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* Card */}
      <View style={[styles.card, { borderLeftColor: config.color }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBg, { backgroundColor: config.color + '1F' }]}>
            <MaterialCommunityIcons
              name={config.icon as any}
              size={24}
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
    marginBottom: 10,
  },
  timeColumn: {
    width: 52,
    alignItems: 'flex-end',
    paddingTop: 10,
    marginRight: 10,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  dateText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    paddingLeft: 14,
    borderLeftWidth: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  summary: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    marginLeft: 42,
  },
  notes: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
    marginLeft: 42,
    fontStyle: 'italic',
  },
});
