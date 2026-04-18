import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Text, Avatar, Switch, Divider } from 'react-native-paper';
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
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar.Text
              size={56}
              label={user?.displayName?.charAt(0)?.toUpperCase() || '?'}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
              color={colors.surface}
            />
            <View style={styles.profileInfo}>
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
                    name="content-copy"
                    size={12}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              )}
            </View>
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
                  name="translate"
                  size={18}
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
              <Divider style={styles.divider} />
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
                      size={18}
                      color={item.color}
                    />
                  </View>
                  <Text style={styles.settingLabel}>
                    {settingLabels[item.key]}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Log Out Card */}
        <TouchableOpacity
          style={styles.logoutCard}
          onPress={signOut}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          activeOpacity={0.5}
        >
          <Text style={styles.deleteText}>{t('auth.deleteAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Profile Card
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  avatarLabel: {
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  profileRole: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  userId: {
    ...typography.caption,
    color: colors.textTertiary,
    fontFamily: undefined,
  },

  // Section Label
  sectionLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  // Settings Card
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadows.sm,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  divider: {
    backgroundColor: colors.borderLight,
    marginLeft: 36 + spacing.md,
  },

  // Log Out
  logoutCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  logoutText: {
    ...typography.subtitle,
    color: colors.error,
  },

  // Delete Account
  deleteButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  deleteText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});
