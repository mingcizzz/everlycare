import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { careTeamService } from '../../../services/careteam.service';
import type { CareTeamMember } from '../../../types/recipient';
import type { RootStackScreenProps } from '../../../types/navigation';

type Role = CareTeamMember['role'];

export function InviteMemberScreen({ navigation }: RootStackScreenProps<'InviteMember'>) {
  const { t } = useTranslation();
  const { activeRecipient } = useRecipientStore();

  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    if (!activeRecipient || !userId.trim()) return;
    setIsLoading(true);
    try {
      await careTeamService.inviteMemberById(
        activeRecipient.id,
        userId.trim(),
        role
      );
      Alert.alert(t('common.done'));
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { key: Role; icon: string }[] = [
    { key: 'member', icon: 'account' },
    { key: 'viewer', icon: 'eye' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Dark compact header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('careTeam.inviteMember')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info card with emerald left border */}
          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color="#059669"
            />
            <Text style={styles.infoText}>
              Ask your family member to create an EverlyCare account first, then
              share their User ID from their profile screen.
            </Text>
          </View>

          {/* User ID input */}
          <Text style={styles.fieldLabel}>User ID</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={userId}
              onChangeText={setUserId}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
              autoCapitalize="none"
            />
          </View>

          {/* Role chips */}
          <Text style={styles.fieldLabel}>Role</Text>
          <View style={styles.chipRow}>
            {roles.map(({ key, icon }) => {
              const selected = role === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setRole(key)}
                  style={[styles.chip, selected && styles.chipSelected]}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={16}
                    color={selected ? '#FFFFFF' : '#64748B'}
                  />
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {t(`careTeam.${key}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Role description */}
          <View style={styles.roleDescription}>
            <MaterialCommunityIcons
              name={role === 'member' ? 'pencil' : 'eye'}
              size={18}
              color="#64748B"
            />
            <Text style={styles.roleDescriptionText}>
              {role === 'member'
                ? 'Members can add and edit care logs, medications, and reminders.'
                : 'Viewers can see care logs and insights, but cannot add or edit.'}
            </Text>
          </View>

          {/* Solid invite button */}
          <TouchableOpacity
            onPress={handleInvite}
            disabled={isLoading || !userId.trim()}
            activeOpacity={0.8}
            style={[
              styles.button,
              (isLoading || !userId.trim()) && styles.buttonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="account-plus" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t('careTeam.inviteMember')}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  textInput: {
    fontSize: 15,
    color: '#1E293B',
    height: 48,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: '#064E3B',
    borderColor: '#064E3B',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  roleDescription: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  roleDescriptionText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#064E3B',
    borderRadius: 24,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
