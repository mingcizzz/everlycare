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
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../../store/authStore';
import { authService } from '../../../services/auth.service';
import { spacing, typography } from '../../../theme';
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
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero gradient section */}
          <LinearGradient
            colors={['#064E3B', '#065F46', '#047857']}
            style={styles.hero}
          >
            <SafeAreaView edges={['top']} style={styles.heroInner}>
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons
                  name="heart-pulse"
                  size={40}
                  color="#064E3B"
                />
              </View>
              <Text style={styles.appName}>{t('common.appName')}</Text>
              <Text style={styles.heroSubtitle}>{t('auth.loginSubtitle')}</Text>
            </SafeAreaView>
          </LinearGradient>

          {/* Light form section */}
          <View style={styles.formSection}>
            {showForgotPassword ? (
              <View style={styles.card}>
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
                  outlineColor="#E2E8F0"
                  activeOutlineColor="#059669"
                  outlineStyle={styles.inputOutline}
                  left={<TextInput.Icon icon="email-outline" />}
                />

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (resetLoading || !resetEmail) && styles.buttonDisabled,
                  ]}
                  onPress={handleResetPassword}
                  disabled={resetLoading || !resetEmail}
                  activeOpacity={0.8}
                >
                  <View style={styles.buttonInner}>
                    {resetLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="email-outline"
                          size={20}
                          color="#FFFFFF"
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
              <View style={styles.card}>
                <TextInput
                  label={t('auth.email')}
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={styles.input}
                  outlineColor="#E2E8F0"
                  activeOutlineColor="#059669"
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
                  outlineColor="#E2E8F0"
                  activeOutlineColor="#059669"
                  outlineStyle={styles.inputOutline}
                  left={<TextInput.Icon icon="lock-outline" />}
                />

                {error ? (
                  <Text style={styles.error}>{error}</Text>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (isLoading || !email || !password) && styles.buttonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading || !email || !password}
                  activeOpacity={0.8}
                >
                  <View style={styles.buttonInner}>
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
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
                  <View style={styles.buttonInner}>
                    <Text style={styles.outlinedButtonText}>
                      {t('auth.register')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    paddingBottom: spacing.xl,
  },
  heroInner: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  inputOutline: {
    borderRadius: 12,
  },
  error: {
    ...typography.bodySmall,
    color: '#E5534B',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#064E3B',
    borderRadius: 24,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.subtitle,
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  outlinedButton: {
    borderRadius: 24,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#064E3B',
    backgroundColor: 'transparent',
  },
  outlinedButtonText: {
    ...typography.subtitle,
    color: '#064E3B',
  },
  textButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  textButtonLabel: {
    ...typography.bodySmall,
    color: '#64748B',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    ...typography.caption,
    color: '#94A3B8',
    marginHorizontal: spacing.md,
  },
  resetTitle: {
    ...typography.h3,
    color: '#1E293B',
    textAlign: 'center',
  },
  resetDesc: {
    ...typography.bodySmall,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
