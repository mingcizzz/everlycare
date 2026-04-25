import { Platform } from 'react-native';

interface WidgetSyncNative {
  syncWidgetData(jsonPayload: string): Promise<void>;
}

const noop: WidgetSyncNative = {
  syncWidgetData: async () => {},
};

let impl: WidgetSyncNative = noop;

if (Platform.OS === 'ios') {
  try {
    const { requireNativeModule } = require('expo-modules-core');
    impl = requireNativeModule('WidgetSync') as WidgetSyncNative;
  } catch {
    // native module not available (e.g. Expo Go) — use noop
  }
}

export default impl;
