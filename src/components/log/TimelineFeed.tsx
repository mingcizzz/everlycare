import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { CareLog } from '../../types/careLog';
import { LogEntryCard } from './LogEntryCard';

interface TimelineFeedProps {
  logs: CareLog[];
  onLogPress?: (log: CareLog) => void;
  onLogLongPress?: (log: CareLog) => void;
  showDates?: boolean;
}

export function TimelineFeed({
  logs,
  onLogPress,
  onLogLongPress,
  showDates,
}: TimelineFeedProps) {
  const { t } = useTranslation();

  if (logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="notebook-outline"
          size={48}
          color="#CBD5E1"
        />
        <Text style={styles.emptyText}>{t('home.noLogsToday')}</Text>
        <Text style={styles.emptySubtext}>{t('home.addFirstLog')}</Text>
      </View>
    );
  }

  return (
    <View>
      {logs.map((log) => (
        <LogEntryCard
          key={log.id}
          log={log}
          onPress={onLogPress ? () => onLogPress(log) : undefined}
          onLongPress={onLogLongPress ? () => onLogLongPress(log) : undefined}
          showDate={showDates}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
  },
});
