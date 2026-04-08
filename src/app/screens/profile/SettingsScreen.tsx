import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { Text, Card, Avatar, Switch, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../../store/authStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { colors, spacing, typography, borderRadius, shadows } from '../../../theme';
import { GradientCard } from '../../../components/ui/GradientCard';
import type { MainTabScreenProps } from '../../../types/navigation';

const ICON_COLORS: Record<string, string> = {
  translate: colors.accent2,
  'bell-outline': colors.primary,
  pill: '#AB47BC',
  'account-group-outline': colors.secondary,
  'account-heart-outline': '#E74C3C',
};

export function SettingsScreen({ navigation }: MainTabScreenProps<'Profile'>) {
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();
  const { language, setLanguage } = useSettingsStore();

  const isEnglish = language === 'en';

  const renderSettingRow = (
    iconName: string,
    label: string,
    onPress?: () => void,
    trailing?: React.ReactNode
  ) => {
    const iconColor = ICON_COLORS[iconName] || colors.textSecondary;
    const row = (
      <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
          <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
            <MaterialCommunityIcons
              name={iconName}
              size={20}
              color={iconColor}
            />
          </View>
          <Text style={styles.settingLabel}>{label}</Text>
        </View>
        {trailing || (
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.textSecondary}
          />
        )}
      </View>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress}>
          {row}
        </TouchableOpacity>
      );
    }
    return row;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <GradientCard style={styles.profileCard}>
          <View style={styles.profileContent}>
            <Avatar.Text
              size={64}
              label={user?.displayName?.charAt(0) || '?'}
              style={{ backgroundColor: '#FFFFFF' }}
              color={colors.primary}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.displayName || 'User'}
              </Text>
              <Text style={styles.profileRole}>{t('careTeam.primary')}</Text>
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
          </View>
        </GradientCard>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('common.settings')}</Text>

            {/* Language Toggle */}
            {renderSettingRow('translate', 'English', undefined, (
              <Switch
                value={isEnglish}
                onValueChange={(v) => setLanguage(v ? 'en' : 'zh-CN')}
                color={colors.primary}
              />
            ))}

            <Divider style={styles.divider} />

            {/* Reminders */}
            {renderSettingRow('bell-outline', t('reminders.title'), () =>
              navigation.navigate('Reminders')
            )}

            <Divider style={styles.divider} />

            {/* Medications */}
            {renderSettingRow('pill', t('medication.title'), () =>
              navigation.navigate('Medications')
            )}

            <Divider style={styles.divider} />

            {/* Care Team */}
            {renderSettingRow('account-group-outline', t('careTeam.title'), () =>
              navigation.navigate('CareTeam')
            )}

            <Divider style={styles.divider} />

            {/* Care Recipient */}
            {renderSettingRow('account-heart-outline', t('recipient.title'), () =>
              navigation.navigate('CareRecipientProfile', {})
            )}
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
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
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
    color: '#FFFFFF',
  },
  profileRole: {
    ...typography.bodySmall,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  userId: {
    ...typography.caption,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
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
    marginVertical: spacing.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.error + '26',
    borderRadius: borderRadius.lg,
  },
  logoutText: {
    ...typography.subtitle,
    color: colors.error,
  },
});
