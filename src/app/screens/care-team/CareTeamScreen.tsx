import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, Switch } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { useAuthStore } from '../../../store/authStore';
import {
  careTeamService,
  type ActivityFeedItem,
} from '../../../services/careteam.service';
import { LOG_TYPE_CONFIG, type LogType } from '../../../types/careLog';
import type { CareTeamMember } from '../../../types/recipient';
import type { RootStackScreenProps } from '../../../types/navigation';

const ROLE_COLORS: Record<string, string> = {
  primary: '#064E3B',
  member: '#059669',
  viewer: '#94A3B8',
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
    if (member.userId === user?.id) return;
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Dark compact header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('careTeam.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs inside dark area */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'members' && styles.tabActive]}
          onPress={() => setTab('members')}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={18}
            color={tab === 'members' ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
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
            size={18}
            color={tab === 'activity' ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
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
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        {tab === 'members' ? (
          members.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={48}
                color="#94A3B8"
              />
              <Text style={styles.emptyText}>{t('common.noData')}</Text>
            </View>
          ) : (
            members.map((member) => (
              <TouchableOpacity
                key={member.id}
                activeOpacity={0.7}
                onLongPress={() => handleRemove(member)}
                style={styles.memberCard}
              >
                <View style={[styles.avatarCircle, { backgroundColor: ROLE_COLORS[member.role] || '#064E3B' }]}>
                  <Text style={styles.avatarText}>
                    {(member.displayName || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberText}>
                  <Text style={styles.memberName}>
                    {member.displayName || member.userId.slice(0, 8)}
                    {member.userId === user?.id ? ' (You)' : ''}
                  </Text>
                  <View style={[styles.roleBadge, { backgroundColor: (ROLE_COLORS[member.role] || '#064E3B') + '18' }]}>
                    <Text style={[styles.roleBadgeText, { color: ROLE_COLORS[member.role] || '#064E3B' }]}>
                      {t(`careTeam.${member.role}`)}
                    </Text>
                  </View>
                </View>
                {!member.acceptedAt && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>{t('careTeam.pending')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )
        ) : feed.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="timeline-text-outline"
              size={48}
              color="#94A3B8"
            />
            <Text style={styles.emptyText}>{t('common.noData')}</Text>
          </View>
        ) : (
          <View style={styles.feedCard}>
            {feed.map((item, index) => {
              const config = LOG_TYPE_CONFIG[item.logType as LogType];
              const time = new Date(item.occurredAt);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.feedItem,
                    index < feed.length - 1 && styles.feedItemBorder,
                  ]}
                >
                  <View style={styles.feedAvatar}>
                    <Text style={styles.feedAvatarText}>
                      {item.loggedByName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.feedContent}>
                    <View style={styles.feedRow}>
                      <Text style={styles.feedAuthor}>{item.loggedByName}</Text>
                      <Text style={styles.feedTime}>
                        {time.toLocaleDateString()}{' '}
                        {time.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View style={styles.feedTypeRow}>
                      <MaterialCommunityIcons
                        name={(config?.icon as any) || 'note-text'}
                        size={14}
                        color={config?.color || '#64748B'}
                      />
                      <Text style={styles.feedType}>
                        {t(config?.labelKey || 'careLog.note')}
                      </Text>
                    </View>
                    {item.notes ? (
                      <Text style={styles.feedNotes} numberOfLines={2}>
                        {item.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB for invite */}
      {tab === 'members' && (
        <TouchableOpacity
          onPress={() => navigation.navigate('InviteMember')}
          activeOpacity={0.8}
          style={styles.fab}
        >
          <MaterialCommunityIcons name="account-plus" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#064E3B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#064E3B',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#064E3B',
    paddingBottom: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 120,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memberText: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  feedItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  feedItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  feedAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#064E3B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  feedTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  feedTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  feedType: {
    fontSize: 12,
    color: '#64748B',
  },
  feedNotes: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontStyle: 'italic',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
});
