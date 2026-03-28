// useGoogleAuth — handles Google OAuth sign-in using Expo's auth session.
//
// SETUP REQUIRED before this works:
//   1. Go to https://console.cloud.google.com/apis/credentials
//   2. Create an OAuth 2.0 Client ID (type: "Web application")
//   3. Add authorized redirect URI: https://auth.expo.io/@YOUR_EXPO_USERNAME/realmos
//   4. Paste the Web Client ID below as GOOGLE_WEB_CLIENT_ID
//   5. Run: npx expo install expo-auth-session expo-web-browser expo-constants

import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { authService } from '@/services/authService';
import { useApp } from '@/store/AppContext';

// ─── Fill in your Google Cloud Console Client IDs ─────────────────────────────
// For Expo Go dev, only webClientId is required.
// For a standalone APK, also fill in androidClientId.
const GOOGLE_WEB_CLIENT_ID     = 'REPLACE_WITH_YOUR_GOOGLE_WEB_CLIENT_ID';
const GOOGLE_ANDROID_CLIENT_ID = 'REPLACE_WITH_YOUR_GOOGLE_ANDROID_CLIENT_ID';
// ─────────────────────────────────────────────────────────────────────────────

// Required: completes the auth session when returning from browser
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { setUser } = useApp();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:     GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const accessToken = response.authentication?.accessToken;
    if (!accessToken) {
      Alert.alert('Sign-In Error', 'No access token received from Google. Please try again.');
      return;
    }

    setLoading(true);
    authService
      .googleAuth(accessToken)
      .then(async (result) => {
        await setUser({
          id:          result.user.id,
          name:        result.user.name,
          username:    result.user.username,
          onboarded:   result.user.onboarded,
          token:       result.token,
          tokenExpiry: result.token_expiry,
        });
      })
      .catch((err: any) => {
        Alert.alert('Google Sign-In Failed', err.message || 'Something went wrong. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [response]);

  return {
    signInWithGoogle: () => promptAsync(),
    googleReady: !!request,
    googleLoading: loading,
  };
}
