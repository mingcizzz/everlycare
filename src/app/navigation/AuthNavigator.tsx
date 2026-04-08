import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthStackParamList } from '../../types/navigation';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';

const WELCOME_SEEN_KEY = 'everlycare.welcome_seen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_SEEN_KEY).then((val) => {
      setShowWelcome(val !== 'true');
    });
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    AsyncStorage.setItem(WELCOME_SEEN_KEY, 'true');
  };

  // Loading state
  if (showWelcome === null) return null;

  if (showWelcome) {
    return <WelcomeScreen onComplete={dismissWelcome} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
