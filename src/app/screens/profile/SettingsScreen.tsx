import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { Text, Card, Avatar, Switch, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../../store/authStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import type { MainTabScreenProps } from '../../../types/navigation';

export function SettingsScreen({ navigation }: MainTabScreenProps<'Profile'>) {
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();
  const { language, setLanguage } = useSettingsStore();

  const isEnglish = language === 'en';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text
              size={64}
              label={user?.displayName?.charAt(0) || '?'}
              style={{ backgroundColor: colors.primary }}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.displayName || 'User'}
              </Text>
              <Text style={styles.profileEmail}>{t('careTeam.primary')}</Text>
              {user?.id && (
                <TouchableOpacity
                  onPress={() => {
                    Clipboard.setString(user.id);
                    Alert.alert('Copied', 'User ID copied to clipboard');
                  }}
                >
                  <Text style={styles.userId}>
                    ID: {user.id.slice(0, 8)}... (tap to copy)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('common.settings')}</Text>

            {/* Language Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons
                  name="translate"
                  size={24}
                  color={colors.textSecondary}
                />
                <Text style={styles.settingLabel}>English</Text>
              </View>
              <Switch
                value={isEnglish}
                onValueChange={(v) => setLanguage(v ? 'en' : 'zh-CN')}
                color={colors.primary}
              />
            </View>

            <Divider style={styles.divider} />

            {/* Reminders */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('Reminders')}
            >
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={24}
                  color={colors.textSecondary}
                />
                <Text style={styles.settingLabel}>{t('reminders.title')}</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <Divider style={styles.divider} />

            {/* Medications */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('Medications')}
            >
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons
                  name="pill"
                  size={24}
                  color={colors.textSecondary}
                />
                <Text style={styles.settingLabel}>{t('medication.title')}</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <Divider style={styles.divider} />

            {/* Care Team */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('CareTeam')}
            >
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={24}
                  color={colors.textSecondary}
                />
                <Text style={styles.settingLabel}>{t('careTeam.title')}</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <Divider style={styles.divider} />

            {/* Care Recipient */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('CareRecipientProfile', {})}
            >
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons
                  name="account-heart-outline"
                  size={24}
                  color={colors.textSecondary}
                />
                <Text style={styles.settingLabel}>{t('recipient.title')}</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color={colors.error}
          />
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
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
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  userId: {
    ...typography.caption,
    color: colors.textDisabled,
    marginTop: spacing.xs,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  logoutText: {
    ...typography.subtitle,
    color: colors.error,
  },
});
