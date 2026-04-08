import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../../store/authStore';
import { authService } from '../../../services/auth.service';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { GradientButton } from '../../../components/ui/GradientCard';
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
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons
                name="heart-pulse"
                size={48}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.appName}>{t('common.appName')}</Text>
            <Text style={styles.title}>{t('auth.loginTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
          </View>

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
              />

              <GradientButton
                label={t('auth.sendResetLink')}
                onPress={handleResetPassword}
                loading={resetLoading}
                disabled={resetLoading || !resetEmail}
                icon="email-outline"
              />

              <Button
                mode="text"
                onPress={() => setShowForgotPassword(false)}
                textColor={colors.textSecondary}
                style={styles.linkButton}
              >
                {t('common.back')}
              </Button>
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
                left={<TextInput.Icon icon="lock-outline" />}
              />

              {error ? (
                <Text style={styles.error}>{error}</Text>
              ) : null}

              <GradientButton
                label={t('auth.login')}
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading || !email || !password}
                icon="login"
              />

              <Button
                mode="text"
                onPress={() => {
                  setShowForgotPassword(true);
                  setResetEmail(email);
                }}
                textColor={colors.textSecondary}
                style={styles.linkButton}
              >
                {t('auth.forgotPassword')}
              </Button>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Register')}
                textColor={colors.primary}
                style={styles.registerButton}
                contentStyle={styles.registerButtonContent}
                icon="account-plus"
              >
                {t('auth.register')}
              </Button>
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
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  appName: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  linkButton: {
    marginTop: spacing.xs,
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
    color: colors.textDisabled,
    marginHorizontal: spacing.md,
  },
  registerButton: {
    borderRadius: borderRadius.xl,
    borderColor: colors.primary,
  },
  registerButtonContent: {
    paddingVertical: spacing.sm,
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
