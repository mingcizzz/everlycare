import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../../store/authStore';
import { spacing, typography } from '../../../theme';
import type { AuthScreenProps } from '../../../types/navigation';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { t } = useTranslation();
  const { signUp } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await signUp(email, password, displayName);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsLoading(false);
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
                  name="account-plus"
                  size={40}
                  color="#064E3B"
                />
              </View>
              <Text style={styles.heroTitle}>{t('auth.registerTitle')}</Text>
              <Text style={styles.heroSubtitle}>{t('auth.registerSubtitle')}</Text>
            </SafeAreaView>
          </LinearGradient>

          {/* Light form section */}
          <View style={styles.formSection}>
            <View style={styles.card}>
              <TextInput
                label={t('recipient.name')}
                value={displayName}
                onChangeText={setDisplayName}
                mode="outlined"
                style={styles.input}
                outlineColor="#E2E8F0"
                activeOutlineColor="#059669"
                outlineStyle={styles.inputOutline}
                left={<TextInput.Icon icon="account-outline" />}
              />

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

              <TextInput
                label={t('auth.confirmPassword')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                outlineColor="#E2E8F0"
                activeOutlineColor="#059669"
                outlineStyle={styles.inputOutline}
                left={<TextInput.Icon icon="lock-check-outline" />}
              />

              {error ? (
                <Text style={styles.error}>{error}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (isLoading || !email || !password || !displayName) && styles.buttonDisabled,
                ]}
                onPress={handleRegister}
                disabled={isLoading || !email || !password || !displayName}
                activeOpacity={0.8}
              >
                <View style={styles.buttonInner}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t('auth.register')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.textButton}
                activeOpacity={0.7}
              >
                <Text style={styles.textButtonLabel}>
                  {t('auth.login')}
                </Text>
              </TouchableOpacity>
            </View>
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
  heroTitle: {
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
  textButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  textButtonLabel: {
    ...typography.bodySmall,
    color: '#64748B',
  },
});
