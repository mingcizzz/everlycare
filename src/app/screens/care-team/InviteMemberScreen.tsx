import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, Button, Chip, IconButton, Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRecipientStore } from '../../../store/recipientStore';
import { careTeamService } from '../../../services/careteam.service';
import { colors, spacing, typography, borderRadius } from '../../../theme';
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>{t('careTeam.inviteMember')}</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.infoCard}>
            <Card.Content style={styles.infoContent}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={colors.info}
              />
              <Text style={styles.infoText}>
                Ask your family member to create an EverlyCare account first, then
                share their User ID from their profile screen.
              </Text>
            </Card.Content>
          </Card>

          <TextInput
            label="User ID"
            value={userId}
            onChangeText={setUserId}
            mode="outlined"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>Role</Text>
          <View style={styles.chipRow}>
            {roles.map(({ key, icon }) => (
              <Chip
                key={key}
                selected={role === key}
                onPress={() => setRole(key)}
                style={styles.chip}
                icon={icon}
              >
                {t(`careTeam.${key}`)}
              </Chip>
            ))}
          </View>

          <View style={styles.roleDescription}>
            <MaterialCommunityIcons
              name={role === 'member' ? 'pencil' : 'eye'}
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.roleDescriptionText}>
              {role === 'member'
                ? 'Members can add and edit care logs, medications, and reminders.'
                : 'Viewers can see care logs and insights, but cannot add or edit.'}
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={handleInvite}
            loading={isLoading}
            disabled={isLoading || !userId.trim()}
            style={styles.button}
            buttonColor={colors.primary}
            textColor={colors.textOnPrimary}
            contentStyle={styles.buttonContent}
            icon="account-plus"
          >
            {t('careTeam.inviteMember')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  infoContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  input: {
    backgroundColor: colors.surface,
  },
  fieldLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    marginBottom: spacing.xs,
  },
  roleDescription: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
  },
  roleDescriptionText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  button: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});
