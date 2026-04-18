import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../../store/authStore';
import { authService } from '../../../services/auth.service';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import type { AuthScreenProps } from '../../../types/navigation';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { t } = useTranslation();
  const { signIn } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      await authService.resetPassword(resetEmail);
      Alert.alert(
        t('auth.resetSent'),
        t('auth.resetSentDesc'),
      );
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons
                name="heart-pulse"
                size={48}
                color={colors.textOnPrimary}
              />
            </View>
          </View>

          {/* Header */}
          <Text style={styles.appName}>{t('common.appName')}</Text>
          <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>

          {showForgotPassword ? (
            <View style={styles.form}>
              <Text style={styles.resetTitle}>{t('auth.forgotPassword')}</Text>
              <Text style={styles.resetDesc}>{t('auth.resetDesc')}</Text>

              <TextInput
                label={t('auth.email')}
                value={resetEmail}
                onChangeText={setResetEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                outlineStyle={styles.inputOutline}
                left={<TextInput.Icon icon="email-outline" />}
              />

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (resetLoading || !resetEmail) && styles.primaryButtonDisabled,
                ]}
                onPress={handleResetPassword}
                disabled={resetLoading || !resetEmail}
                activeOpacity={0.8}
              >
                <View style={styles.primaryButtonInner}>
                  {resetLoading ? (
                    <ActivityIndicator color={colors.textOnPrimary} size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="email-outline"
                        size={20}
                        color={colors.textOnPrimary}
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.primaryButtonText}>
                        {t('auth.sendResetLink')}
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowForgotPassword(false)}
                style={styles.textButton}
                activeOpacity={0.7}
              >
                <Text style={styles.textButtonLabel}>{t('common.back')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <TextInput
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                outlineStyle={styles.inputOutline}
                left={<TextInput.Icon icon="email-outline" />}
              />

              <TextInput
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                outlineStyle={styles.inputOutline}
                left={<TextInput.Icon icon="lock-outline" />}
              />

              {error ? (
                <Text style={styles.error}>{error}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (isLoading || !email || !password) && styles.primaryButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading || !email || !password}
                activeOpacity={0.8}
              >
                <View style={styles.primaryButtonInner}>
                  {isLoading ? (
                    <ActivityIndicator color={colors.textOnPrimary} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t('auth.login')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowForgotPassword(true);
                  setResetEmail(email);
                }}
                style={styles.textButton}
                activeOpacity={0.7}
              >
                <Text style={styles.textButtonLabel}>
                  {t('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Sign Up */}
              <TouchableOpacity
                style={styles.outlinedButton}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.8}
              >
                <View style={styles.primaryButtonInner}>
                  <Text style={styles.outlinedButtonText}>
                    {t('auth.register')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
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
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    ...typography.h1,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
  },
  inputOutline: {
    borderRadius: borderRadius.md,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.subtitle,
    color: colors.textOnPrimary,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  outlinedButton: {
    borderRadius: borderRadius.xl,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  outlinedButtonText: {
    ...typography.subtitle,
    color: colors.primary,
  },
  textButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  textButtonLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginHorizontal: spacing.md,
  },
  resetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  resetDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
