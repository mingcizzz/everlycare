import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { MainTabNavigator } from './MainTabNavigator';
import { CareRecipientProfileScreen } from '../screens/profile/CareRecipientProfileScreen';
import { ArticleDetailScreen } from '../screens/knowledge/ArticleDetailScreen';
import { AddArticleScreen } from '../screens/knowledge/AddArticleScreen';
import { RemindersScreen } from '../screens/reminders/RemindersScreen';
import { ReminderFormScreen } from '../screens/reminders/ReminderFormScreen';
import { MedicationsScreen } from '../screens/medications/MedicationsScreen';
import { MedicationFormScreen } from '../screens/medications/MedicationFormScreen';
import { CareTeamScreen } from '../screens/care-team/CareTeamScreen';
import { InviteMemberScreen } from '../screens/care-team/InviteMemberScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen
        name="CareRecipientProfile"
        component={CareRecipientProfileScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen
        name="AddArticle"
        component={AddArticleScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen
        name="ReminderForm"
        component={ReminderFormScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="Medications" component={MedicationsScreen} />
      <Stack.Screen
        name="MedicationForm"
        component={MedicationFormScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="CareTeam" component={CareTeamScreen} />
      <Stack.Screen
        name="InviteMember"
        component={InviteMemberScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
