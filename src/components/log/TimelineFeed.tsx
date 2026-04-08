import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography, borderRadius } from '../../theme';
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
      <Card style={styles.emptyCard}>
        <Card.Content style={styles.emptyContent}>
          <MaterialCommunityIcons
            name="notebook-outline"
            size={80}
            color={colors.textDisabled}
          />
          <Text style={styles.emptyText}>{t('home.noLogsToday')}</Text>
          <Text style={styles.emptySubtext}>{t('home.addFirstLog')}</Text>
        </Card.Content>
      </Card>
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
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textDisabled,
    marginTop: spacing.xs,
  },
});
