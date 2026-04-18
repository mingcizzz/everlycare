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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../../store/authStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { colors } from '../../../theme';
import type { MainTabScreenProps } from '../../../types/navigation';

const SETTINGS_ITEMS = [
  { icon: 'bell-outline', color: '#0D9488', key: 'reminders' },
  { icon: 'pill', color: '#8B5CF6', key: 'medication' },
  { icon: 'account-group-outline', color: '#FF7B6F', key: 'careTeam' },
  { icon: 'account-heart-outline', color: '#E74C3C', key: 'careRecipient' },
] as const;

export function SettingsScreen({ navigation }: MainTabScreenProps<'Profile'>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
    <View style={styles.container}>
      {/* Dark Hero Header */}
      <LinearGradient
        colors={['#064E3B', '#065F46', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroHeader, { paddingTop: insets.top + 20 }]}
      >
        {/* Avatar */}
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>

        {/* Name */}
        <Text style={styles.profileName}>
          {user?.displayName || 'User'}
        </Text>

        {/* Role */}
        <Text style={styles.profileRole}>{t('careTeam.primary')}</Text>

        {/* User ID */}
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
              color="rgba(255,255,255,0.3)"
            />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Light Section */}
      <ScrollView
        style={styles.lightSection}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
                  styles.iconDot,
                  { backgroundColor: '#7B68EE' + '1A' },
                ]}
              >
                <MaterialCommunityIcons
                  name={'translate' as any}
                  size={20}
                  color="#7B68EE"
                />
              </View>
              <Text style={styles.settingLabel}>English</Text>
            </View>
            <Switch
              value={isEnglish}
              onValueChange={(v) => setLanguage(v ? 'en' : 'zh-CN')}
              color="#0D9488"
            />
          </View>

          {SETTINGS_ITEMS.map((item) => (
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
                      styles.iconDot,
                      { backgroundColor: item.color + '1A' },
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
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutCard}
          onPress={signOut}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="logout"
            size={18}
            color={colors.error}
          />
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
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  // Hero Header
  heroHeader: {
    alignItems: 'center',
    paddingBottom: 28,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#047857',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  profileRole: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    textAlign: 'center',
  },
  userIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  userId: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },

  // Light Section
  lightSection: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Section Label
  sectionLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Settings Card
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconDot: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1E293B',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F3F4F6',
    marginLeft: 36 + 14,
  },

  // Logout
  logoutCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E5534B',
  },

  // Delete Account
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteText: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
