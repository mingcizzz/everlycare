import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { MainTabParamList } from '../../types/navigation';
import { colors, shadows } from '../../theme';
import { HomeScreen } from '../screens/home/HomeScreen';
import { CareLogScreen } from '../screens/log/CareLogScreen';
import { InsightsScreen } from '../screens/insights/InsightsScreen';
import { KnowledgeBaseScreen } from '../screens/knowledge/KnowledgeBaseScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { focused: string; unfocused: string }
> = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Log: { focused: 'plus-circle', unfocused: 'plus-circle-outline' },
  Insights: { focused: 'chart-bar', unfocused: 'chart-line' },
  Knowledge: { focused: 'lightbulb', unfocused: 'lightbulb-outline' },
  Profile: { focused: 'account-circle', unfocused: 'account-circle-outline' },
};

export function MainTabNavigator() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Ensure proper bottom spacing for devices with/without home indicator
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons
            name={
              (focused
                ? TAB_ICONS[route.name].focused
                : TAB_ICONS[route.name].unfocused) as any
            }
            size={22}
            color={color}
          />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 52 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: -2,
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabs.home'),
          tabBarLabelStyle: { fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Log"
        component={CareLogScreen}
        options={{
          tabBarLabel: t('tabs.log'),
          tabBarLabelStyle: { fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarLabel: t('tabs.insights'),
          tabBarLabelStyle: { fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Knowledge"
        component={KnowledgeBaseScreen}
        options={{
          tabBarLabel: t('tabs.knowledge'),
          tabBarLabelStyle: { fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('tabs.profile'),
          tabBarLabelStyle: { fontSize: 10 },
        }}
      />
    </Tab.Navigator>
  );
}
