import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Avatar, IconButton, Chip, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { useAuthStore } from '../../../store/authStore';
import {
  careTeamService,
  type ActivityFeedItem,
} from '../../../services/careteam.service';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { LOG_TYPE_CONFIG, type LogType } from '../../../types/careLog';
import type { CareTeamMember } from '../../../types/recipient';
import type { RootStackScreenProps } from '../../../types/navigation';

const ROLE_COLORS: Record<string, string> = {
  primary: colors.primary,
  member: colors.secondary,
  viewer: colors.accent2,
};

export function CareTeamScreen({ navigation }: RootStackScreenProps<'CareTeam'>) {
  const { t } = useTranslation();
  const { activeRecipient } = useRecipientStore();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<CareTeamMember[]>([]);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState<'members' | 'activity'>('members');

  const refresh = useCallback(async () => {
    if (!activeRecipient) return;
    setIsLoading(true);
    try {
      const [m, f] = await Promise.all([
        careTeamService.getMembers(activeRecipient.id),
        careTeamService.getActivityFeed(activeRecipient.id),
      ]);
      setMembers(m);
      setFeed(f);
    } finally {
      setIsLoading(false);
    }
  }, [activeRecipient?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRemove = (member: CareTeamMember) => {
    if (member.userId === user?.id) return; // can't remove self
    Alert.alert(t('common.delete'), member.displayName || '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await careTeamService.removeMember(member.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>{t('careTeam.title')}</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'members' && styles.tabActive]}
          onPress={() => setTab('members')}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={20}
            color={tab === 'members' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabLabel,
              tab === 'members' && styles.tabLabelActive,
            ]}
          >
            {t('careTeam.title')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'activity' && styles.tabActive]}
          onPress={() => setTab('activity')}
        >
          <MaterialCommunityIcons
            name="timeline-text"
            size={20}
            color={tab === 'activity' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabLabel,
              tab === 'activity' && styles.tabLabelActive,
            ]}
          >
            {t('careTeam.activityFeed')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        {tab === 'members' ? (
          members.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={48}
                  color={colors.textDisabled}
                />
                <Text style={styles.emptyText}>{t('common.noData')}</Text>
              </Card.Content>
            </Card>
          ) : (
            members.map((member) => (
              <Card key={member.id} style={styles.memberCard}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onLongPress={() => handleRemove(member)}
                >
                  <Card.Content style={styles.memberContent}>
                    <Avatar.Text
                      size={44}
                      label={(member.displayName || '?').charAt(0)}
                      style={{
                        backgroundColor:
                          ROLE_COLORS[member.role] || colors.primary,
                      }}
                    />
                    <View style={styles.memberText}>
                      <Text style={styles.memberName}>
                        {member.displayName || member.userId.slice(0, 8)}
                        {member.userId === user?.id ? ' (You)' : ''}
                      </Text>
                      <Chip
                        compact
                        textStyle={styles.roleChipText}
                        style={[
                          styles.roleChip,
                          {
                            backgroundColor:
                              (ROLE_COLORS[member.role] || colors.primary) + '20',
                          },
                        ]}
                      >
                        {t(`careTeam.${member.role}`)}
                      </Chip>
                    </View>
                    {!member.acceptedAt && (
                      <Chip compact style={styles.pendingChip}>
                        {t('careTeam.pending')}
                      </Chip>
                    )}
                  </Card.Content>
                </TouchableOpacity>
              </Card>
            ))
          )
        ) : /* Activity feed */
        feed.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="timeline-text-outline"
                size={48}
                color={colors.textDisabled}
              />
              <Text style={styles.emptyText}>{t('common.noData')}</Text>
            </Card.Content>
          </Card>
        ) : (
          feed.map((item) => {
            const config = LOG_TYPE_CONFIG[item.logType as LogType];
            const time = new Date(item.occurredAt);
            return (
              <View key={item.id} style={styles.feedItem}>
                <Avatar.Text
                  size={32}
                  label={item.loggedByName.charAt(0)}
                  style={{ backgroundColor: colors.primaryLight }}
                />
                <View style={styles.feedContent}>
                  <View style={styles.feedRow}>
                    <Text style={styles.feedAuthor}>{item.loggedByName}</Text>
                    <Text style={styles.feedTime}>
                      {time.toLocaleDateString()} {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.feedTypeRow}>
                    <MaterialCommunityIcons
                      name={config?.icon || 'note-text'}
                      size={16}
                      color={config?.color || colors.textSecondary}
                    />
                    <Text style={styles.feedType}>
                      {t(config?.labelKey || 'careLog.note')}
                    </Text>
                  </View>
                  {item.notes && (
                    <Text style={styles.feedNotes} numberOfLines={2}>
                      {item.notes}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {tab === 'members' && (
        <TouchableOpacity
          onPress={() => navigation.navigate('InviteMember')}
          activeOpacity={0.8}
          style={styles.fab}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabGradient}
          >
            <MaterialCommunityIcons name="account-plus" size={28} color={colors.textOnPrimary} />
          </LinearGradient>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
    ...shadows.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primary,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: 120,
  },
  memberCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  memberText: {
    flex: 1,
    gap: spacing.xs,
  },
  memberName: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  roleChip: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
  },
  roleChipText: {
    fontSize: 11,
  },
  pendingChip: {
    backgroundColor: colors.accent + '20',
  },
  feedItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  feedContent: {
    flex: 1,
  },
  feedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedAuthor: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  feedTime: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  feedTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  feedType: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  feedNotes: {
    ...typography.caption,
    color: colors.textDisabled,
    marginTop: 2,
    fontStyle: 'italic',
  },
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
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    borderRadius: borderRadius.full,
    ...shadows.lg,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
