// App.tsx — root component.
// Sets up all providers and hands off to the navigator.
//
// REACT NATIVE LESSON:
//   GestureHandlerRootView — required wrapper for react-native-gesture-handler
//   (used by drawer navigation and swipe gestures).
//   SafeAreaProvider — gives child components access to phone notch/status bar info.

import 'react-native-gesture-handler'; // Must be first import!
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { AppProvider } from '@/store/AppContext';
import { RootNavigator } from '@/navigation';

export default function App() {
  return (
    // GestureHandlerRootView must wrap everything for drawer + swipe gestures
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/* AppProvider gives every component access to global state */}
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
