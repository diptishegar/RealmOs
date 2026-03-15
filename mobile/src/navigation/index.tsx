// Navigation — wires everything together.
//
// REACT NATIVE LESSON:
//   React Navigation uses a "navigator" tree. We nest them:
//   Root Stack → decides Splash vs Onboarding vs Main App
//   Main App → Drawer (hamburger) wrapping Bottom Tabs
//   Bottom Tabs → Home, Track, Today, Profile
//
// The key principle: navigators are just React components.
// You nest them like you'd nest divs.

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Text, View, StyleSheet } from 'react-native';

import { useApp } from '@/store/AppContext';
import { colors, fonts, fontSizes } from '@/theme';

// Screens
import { SplashScreen } from '@/features/onboarding/screens/SplashScreen';
import { OnboardingScreen } from '@/features/onboarding/screens/OnboardingScreen';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { PeriodTrackerScreen } from '@/features/period/screens/PeriodTrackerScreen';

// ─── Stack / Tab / Drawer navigators ─────────────────────────────────────────

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabBarStyle,
        tabBarActiveTintColor: colors.crystalBlue,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: tabBarLabelStyle,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tab.Screen
        name="Track"
        component={PlaceholderScreen('Track', 'log something today 📊')}
        options={{ tabBarIcon: ({ color }) => <TabIcon emoji="➕" color={color} /> }}
      />
      <Tab.Screen
        name="Today"
        component={PlaceholderScreen('Today', "here's your day so far 📋")}
        options={{ tabBarIcon: ({ color }) => <TabIcon emoji="📅" color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={PlaceholderScreen('Profile', 'your settings & goals ⚙️')}
        options={{ tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }}
      />
    </Tab.Navigator>
  );
}

// ─── Drawer Navigator (Hamburger Menu) ────────────────────────────────────────

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: drawerStyle,
        drawerActiveTintColor: colors.crystalBlue,
        drawerInactiveTintColor: colors.textMuted,
        drawerLabelStyle: drawerLabelStyle,
      }}
    >
      <Drawer.Screen name="MainTabs" component={TabNavigator} options={{ title: 'Home' }} />
      <Drawer.Screen name="PeriodTracker" component={PeriodTrackerScreen} options={{ title: '🩸 Period Tracker' }} />
      <Drawer.Screen name="Sleep" component={PlaceholderScreen('Sleep', 'beauty sleep report 😴')} options={{ title: '😴 Sleep' }} />
      <Drawer.Screen name="Diet" component={PlaceholderScreen('Diet', 'what did we eat babe? 🥗')} options={{ title: '🥗 Diet' }} />
      <Drawer.Screen name="Exercise" component={PlaceholderScreen('Exercise', 'slay those workouts 💪')} options={{ title: '💪 Exercise' }} />
      <Drawer.Screen name="Water" component={PlaceholderScreen('Water', 'hydration check 💧')} options={{ title: '💧 Water / Protein / Carbs' }} />
      <Drawer.Screen name="Steps" component={PlaceholderScreen('Steps', '6000 steps a day keeps the doctor away 🏃')} options={{ title: '🏃 Steps' }} />
      <Drawer.Screen name="Acne" component={PlaceholderScreen('Acne', 'skin diary 🌸')} options={{ title: '🌸 Acne Tracker' }} />
      <Drawer.Screen name="Bloat" component={PlaceholderScreen('Bloat', 'bloat log 🫧')} options={{ title: '🫧 Bloat Tracker' }} />
      <Drawer.Screen name="Selfie" component={PlaceholderScreen('Selfie', 'daily glow log 📸')} options={{ title: '📸 Selfie Log' }} />
      <Drawer.Screen name="Savings" component={PlaceholderScreen('Savings', 'saving like a boss 💰')} options={{ title: '💰 Savings' }} />
      <Drawer.Screen name="Investments" component={PlaceholderScreen('Investments', 'building that bag 📈')} options={{ title: '📈 Investments' }} />
    </Drawer.Navigator>
  );
}

// ─── Root Navigator — decides which flow to show ──────────────────────────────

export function RootNavigator() {
  const { state } = useApp();

  // While checking AsyncStorage, show nothing (or a mini splash)
  if (state.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} />
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!state.user ? (
          // Not logged in → Splash + Onboarding
          <>
            <RootStack.Screen name="Splash" component={SplashWrapper} />
            <RootStack.Screen name="Onboarding" component={OnboardingWrapper} />
          </>
        ) : (
          // Logged in → Main App with Drawer
          <RootStack.Screen name="App" component={DrawerNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// Wrappers to thread navigation props into our screens
function SplashWrapper({ navigation }: any) {
  return (
    <SplashScreen
      onDone={() => navigation.replace('Onboarding')}
    />
  );
}

function OnboardingWrapper({ navigation }: any) {
  const { state } = useApp();
  // If user somehow already exists (re-open), skip to app
  if (state.user) {
    navigation.replace('App');
    return null;
  }
  return (
    <OnboardingScreen
      onComplete={() => navigation.replace('App')}
    />
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Placeholder screens for features not yet built
function PlaceholderScreen(title: string, subtitle: string) {
  return function () {
    return (
      <View style={placeholderStyles.container}>
        <Text style={placeholderStyles.title}>{title}</Text>
        <Text style={placeholderStyles.subtitle}>{subtitle}</Text>
        <Text style={placeholderStyles.coming}>coming soon ✨</Text>
      </View>
    );
  };
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, opacity: color === colors.crystalBlue ? 1 : 0.5 }}>{emoji}</Text>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const tabBarStyle = {
  backgroundColor: colors.surface,
  borderTopColor: colors.border,
  height: 60,
  paddingBottom: 8,
};

const tabBarLabelStyle = {
  fontFamily: fonts.mono,
  fontSize: fontSizes.xs,
};

const drawerStyle = {
  backgroundColor: colors.background,
  width: 260,
};

const drawerLabelStyle = {
  fontFamily: fonts.mono,
  fontSize: fontSizes.sm,
};

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.cursive,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  coming: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
});
