import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { NativeModules } from 'react-native';

// Read from .env (Expo SDK 49+ loads EXPO_PUBLIC_* automatically)
const API_PORT     = process.env.EXPO_PUBLIC_API_PORT     ?? '8080';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? `http://localhost:${API_PORT}/api/v1`;

// Auto-detects the dev machine's LAN IP so Expo Go on a physical device can
// reach the local backend.
//
// Priority order:
//   1. NativeModules.SourceCode.scriptURL  — JS bundle URL, most reliable in Expo Go
//   2. Constants.expoConfig.hostUri        — Expo new manifest format (SDK 47+)
//   3. Constants.manifest.debuggerHost     — Expo legacy manifest
//   4. EXPO_PUBLIC_API_BASE_URL fallback   — set in .env for emulator / production
function getApiBaseUrl(): string {
  if (__DEV__) {
    // Method 1: React Native gives us the JS bundle URL in dev mode.
    // e.g. "http://192.168.1.100:8082/index.bundle?platform=android&..."
    const scriptURL: string | undefined = (NativeModules as any).SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([\d.]+)/);
      if (match) {
        console.log('[API] host from scriptURL:', match[1]);
        return `http://${match[1]}:${API_PORT}/api/v1`;
      }
    }
    // Method 2: Expo new manifest (SDK 47+)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      console.log('[API] host from expoConfig.hostUri:', host);
      return `http://${host}:${API_PORT}/api/v1`;
    }
    // Method 3: Expo legacy manifest
    const debuggerHost = (Constants as any).manifest?.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      console.log('[API] host from manifest.debuggerHost:', host);
      return `http://${host}:${API_PORT}/api/v1`;
    }
    console.warn('[API] Could not detect dev host — falling back to EXPO_PUBLIC_API_BASE_URL');
  }
  return API_BASE_URL;
}

const API_BASE_URL = getApiBaseUrl();
console.log('[API] Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT + user ID to every request
api.interceptors.request.use(async (config) => {
  const [userId, token] = await AsyncStorage.multiGet(['user_id', 'auth_token']);
  if (userId[1]) config.headers['X-User-ID'] = userId[1];
  if (token[1]) config.headers['Authorization'] = `Bearer ${token[1]}`;
  return config;
});

// Standardize error messages and log failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API] Request failed:', (error.config?.baseURL ?? '') + (error.config?.url ?? ''), error.message);
    const message =
      error.response?.data?.error ||
      error.message ||
      'Something went wrong. Try again?';
    return Promise.reject(new Error(message));
  }
);

export default api;
