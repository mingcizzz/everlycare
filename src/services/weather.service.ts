import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'everlycare.weather.cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface WeatherSnapshot {
  tempC: number;
  humidityPct: number;
  fetchedAt: string;
}

// Gracefully handle expo-location not being linked yet
let Location: typeof import('expo-location') | null = null;
try {
  Location = require('expo-location');
} catch {
  // expo-location unavailable — weather adjustments will be skipped
}

export const weatherService = {
  async getCurrentWeather(): Promise<WeatherSnapshot | null> {
    try {
      // Return cached value if still fresh
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: WeatherSnapshot = JSON.parse(raw);
        if (Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS) {
          return cached;
        }
      }

      if (!Location) return null;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: (Location as any).Accuracy?.Balanced ?? 3,
      });
      const { latitude: lat, longitude: lon } = pos.coords;

      // Open-Meteo: free, no API key required
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      let resp: Response;
      try {
        resp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&hourly=temperature_2m,relative_humidity_2m&forecast_days=1&timezone=auto`,
          { signal: controller.signal }
        );
      } finally {
        clearTimeout(timeout);
      }

      if (!resp.ok) return null;

      const json = await resp.json();
      const hourIndex = new Date().getHours();
      const tempC: number = json.hourly?.temperature_2m?.[hourIndex] ?? 22;
      const humidityPct: number = json.hourly?.relative_humidity_2m?.[hourIndex] ?? 60;

      const snap: WeatherSnapshot = { tempC, humidityPct, fetchedAt: new Date().toISOString() };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(snap));
      return snap;
    } catch {
      return null;
    }
  },
};
