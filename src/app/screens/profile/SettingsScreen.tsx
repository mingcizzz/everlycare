import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Text, Switch } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../../store/authStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import type { MainTabScreenProps } from '../../../types/navigation';

const SETTINGS_ITEMS = [
  { icon: 'bell-outline', color: colors.primary, key: 'reminders' },
  { icon: 'pill', color: '#8B5CF6', key: 'medication' },
  { icon: 'account-group-outline', color: colors.secondary, key: 'careTeam' },
  { icon: 'account-heart-outline', color: '#E74C3C', key: 'careRecipient' },
] as const;

export function SettingsScreen({ navigation }: MainTabScreenProps<'Profile'>) {
  const { t } = useTranslation();
  const { user, signOut, deleteAccount } = useAuthStore();
  const { language, setLanguage } = useSettingsStore();

  const isEnglish = language === 'en';

  const getDaysActive = () => {
    if (!user?.createdAt) return 0;
    const created = new Date(user.createdAt);
    const now = new Date();
    const diff = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(diff, 1);
  };

  const handleCopyId = async () => {
    if (user?.id) {
      await Clipboard.setStringAsync(user.id);
      Alert.alert(t('common.success'), 'User ID copied to clipboard');
    }
  };

  const handleNavigate = (key: string) => {
    switch (key) {
      case 'reminders':
        navigation.navigate('Reminders');
        break;
      case 'medication':
        navigation.navigate('Medications');
        break;
      case 'careTeam':
        navigation.navigate('CareTeam');
        break;
      case 'careRecipient':
        navigation.navigate('CareRecipientProfile', {});
        break;
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('auth.deleteAccount'),
      t('auth.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.deleteAccount'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('auth.deleteAccountFinal'),
              t('auth.deleteAccountFinalDesc'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('common.confirm'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                    } catch (err: any) {
                      Alert.alert(t('common.error'), err.message);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const settingLabels: Record<string, string> = {
    reminders: t('reminders.title'),
    medication: t('medication.title'),
    careTeam: t('careTeam.title'),
    careRecipient: t('recipient.title'),
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section - Centered, no card */}
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {user?.displayName || 'User'}
          </Text>
          <Text style={styles.profileRole}>{t('careTeam.primary')}</Text>
          {user?.id && (
            <TouchableOpacity
              onPress={handleCopyId}
              activeOpacity={0.6}
              style={styles.userIdRow}
            >
              <Text style={styles.userId}>
                ID: {user.id.slice(0, 8)}...
              </Text>
              <MaterialCommunityIcons
                name={'content-copy' as any}
                size={11}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getDaysActive()}</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Total Logs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Team</Text>
          </View>
        </View>

        {/* Section Label */}
        <Text style={styles.sectionLabel}>{t('common.settings')}</Text>

        {/* Settings Card */}
        <View style={styles.settingsCard}>
          {/* Language Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.tertiary + '18' },
                ]}
              >
                <MaterialCommunityIcons
                  name={'translate' as any}
                  size={20}
                  color={colors.tertiary}
                />
              </View>
              <Text style={styles.settingLabel}>English</Text>
            </View>
            <Switch
              value={isEnglish}
              onValueChange={(v) => setLanguage(v ? 'en' : 'zh-CN')}
              color={colors.primary}
            />
          </View>

          {SETTINGS_ITEMS.map((item, index) => (
            <React.Fragment key={item.key}>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => handleNavigate(item.key)}
                activeOpacity={0.6}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: item.color + '18' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={20}
                      color={item.color}
                    />
                  </View>
                  <Text style={styles.settingLabel}>
                    {settingLabels[item.key]}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={'chevron-right' as any}
                  size={22}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Log Out & Delete Account */}
        <View style={styles.accountActions}>
          <TouchableOpacity
            style={styles.logoutCard}
            onPress={signOut}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
            <Text style={styles.logoutText}>{t('auth.logout')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.5}
          >
            <MaterialCommunityIcons name="account-remove-outline" size={16} color={colors.textTertiary} />
            <Text style={styles.deleteText}>{t('auth.deleteAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  // Profile Section - Centered, no card
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  profileRole: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  userIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  userId: {
    fontSize: 12,
    color: colors.textTertiary,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // Section Label
  sectionLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  // Settings Card
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginLeft: 44 + spacing.md,
  },

  // Account Actions
  accountActions: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  logoutCard: {
    flexDirection: 'row',
    backgroundColor: colors.errorLight,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  deleteText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
});
