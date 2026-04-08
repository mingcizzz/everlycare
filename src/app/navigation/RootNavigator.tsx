import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useRecipientStore } from '../../store/recipientStore';
import { colors } from '../../theme';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const { recipients, loadRecipients } = useRecipientStore();
  const [recipientsLoaded, setRecipientsLoaded] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRecipients().finally(() => setRecipientsLoaded(true));
    } else {
      setRecipientsLoaded(false);
    }
  }, [isAuthenticated, loadRecipients]);

  if (isLoading || (isAuthenticated && !recipientsLoaded)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const needsOnboarding = isAuthenticated && recipients.length === 0;

  if (needsOnboarding) {
    return (
      <OnboardingScreen onComplete={() => loadRecipients()} />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="MainApp" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
