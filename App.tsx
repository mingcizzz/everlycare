import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { theme } from './src/theme';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { notificationService } from './src/services/notification.service';
import { careLogService } from './src/services/carelog.service';
import { useRecipientStore } from './src/store/recipientStore';
import { useToiletPredictionStore } from './src/store/toiletPredictionStore';
import { useOutdoorModeStore } from './src/store/outdoorModeStore';
import { useSettingsStore } from './src/store/settingsStore';
import './src/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  useEffect(() => {
    // Request permissions + register categories
    notificationService.requestPermissions().catch(() => {});
    notificationService.setupCategories().catch(() => {});

    // Restore outdoor mode state
    useOutdoorModeStore.getState().initOutdoor().catch(() => {});

    // Handle notification action taps (background / foreground)
    const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data as Record<string, unknown>;

      if (data?.type !== 'smart_toilet') return;

      const recipient = useRecipientStore.getState().activeRecipient;
      if (!recipient) return;

      if (actionId === 'LOGGED') {
        // Quick-log a planned urination without opening the app
        try {
          await careLogService.createLog(
            recipient.id,
            'urination',
            { method: 'planned', volume: 'medium', isIncontinence: false },
            new Date().toISOString()
          );
          await useToiletPredictionStore.getState().onToiletVisitLogged(recipient.id, recipient);
        } catch { /* silent */ }
      } else if (actionId === 'SNOOZE_30') {
        // Schedule a one-shot reminder 30 minutes from now
        const lang = useSettingsStore.getState().language;
        const isZh = lang === 'zh-CN';
        try {
          await notificationService.scheduleOnceAfter(
            30 * 60,
            isZh ? '🚽 如厕提醒（已推迟）' : '🚽 Toilet Reminder (Snoozed)',
            isZh
              ? '30 分钟前的如厕提醒，请记得引导老人如厕'
              : 'The toilet reminder from 30 min ago — time to guide them now.',
            { type: 'smart_toilet' }
          );
        } catch { /* silent */ }
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </SafeAreaProvider>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
