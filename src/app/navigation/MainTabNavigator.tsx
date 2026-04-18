import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
  Profile: { focused: 'account', unfocused: 'account-outline' },
};

export function MainTabNavigator() {
  const { t } = useTranslation();

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
            size={24}
            color={color}
          />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 6,
          ...shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '400',
        },
        tabBarActiveLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t('tabs.home') }}
      />
      <Tab.Screen
        name="Log"
        component={CareLogScreen}
        options={{ tabBarLabel: t('tabs.log') }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ tabBarLabel: t('tabs.insights') }}
      />
      <Tab.Screen
        name="Knowledge"
        component={KnowledgeBaseScreen}
        options={{ tabBarLabel: t('tabs.knowledge') }}
      />
      <Tab.Screen
        name="Profile"
        component={SettingsScreen}
        options={{ tabBarLabel: t('tabs.profile') }}
      />
    </Tab.Navigator>
  );
}
