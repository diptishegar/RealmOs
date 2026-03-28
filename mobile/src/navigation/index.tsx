// Navigation — wires everything together.
//
// FLOW:
//   Every boot → SplashScreen (quotes, 3.2s)
//   No user       → Auth (Welcome → Login | Signup | ForgotPIN)
//   User, !onboarded → Onboarding (4-step health setup)
//   User, onboarded  → App (Drawer → SwipeTabNavigator)
//
// TAB NAVIGATION (Instagram-style):
//   Swipe left/right between tabs OR tap tab icons at the bottom.
//   Powered by react-native-tab-view + react-native-pager-view (native pager).
//   Drawer swipe is disabled to prevent conflict with horizontal tab swipe —
//   open the drawer via the hamburger icon instead.

import React, { useState, useEffect } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { TabView, SceneMap } from 'react-native-tab-view';
import {
  Text, View, StyleSheet, TouchableOpacity, useWindowDimensions,
} from 'react-native';

import { useApp } from '@/store/AppContext';
import { colors, fonts, fontSizes, spacing } from '@/theme';

// Screens
import { SplashScreen } from '@/features/onboarding/screens/SplashScreen';
import { OnboardingScreen } from '@/features/onboarding/screens/OnboardingScreen';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { PeriodTrackerScreen } from '@/features/period/screens/PeriodTrackerScreen';

// Auth screens
import { WelcomeScreen } from '@/features/auth/screens/WelcomeScreen';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { SignupScreen } from '@/features/auth/screens/SignupScreen';
import { ForgotPasswordScreen } from '@/features/auth/screens/ForgotPasswordScreen';

// ─── Stack / Drawer navigators ────────────────────────────────────────────────

const RootStack = createNativeStackNavigator();
const Drawer    = createDrawerNavigator();

// ─── Tab config ───────────────────────────────────────────────────────────────
//
// SceneMap needs stable component references — define placeholder screens once
// here at module level so they don't get recreated on every render.

// Today tab: period calendar in display-only mode (view all months, no editing)
const TodayScreen      = () => <PeriodTrackerScreen readOnly />;
// Track tab: period calendar with full edit capability (current + past months)
const PeriodEditScreen = () => <PeriodTrackerScreen />;

const InsightsPlaceholder = PlaceholderScreen('Insights', 'Patterns and trends ✨');
const MePlaceholder       = PlaceholderScreen('Profile',  'Your settings and goals ⚙️');

const TAB_ROUTES = [
  { key: 'home',     emoji: '🏠', label: 'Home'     },
  { key: 'today',    emoji: '📅', label: 'Today'    },
  { key: 'track',    emoji: '🩸', label: 'Track'    },
  { key: 'insights', emoji: '✨', label: 'Insights' },
  { key: 'me',       emoji: '👤', label: 'Me'       },
];

// SceneMap is created once outside component to avoid re-creation on render
const renderScene = SceneMap({
  home:     HomeScreen,
  today:    TodayScreen,
  track:    PeriodEditScreen,
  insights: InsightsPlaceholder,
  me:       MePlaceholder,
});

// ─── Auth Flow ────────────────────────────────────────────────────────────────

type AuthView = 'welcome' | 'login' | 'signup' | 'forgot';

function AuthFlowScreen() {
  const [view, setView] = useState<AuthView>('welcome');
  const { signInWithGoogle } = useGoogleAuth();

  if (view === 'login') {
    return (
      <LoginScreen
        onBack={() => setView('welcome')}
        onGoogleSignIn={signInWithGoogle}
        onForgotPIN={() => setView('forgot')}
      />
    );
  }

  if (view === 'signup') {
    return (
      <SignupScreen
        onBack={() => setView('welcome')}
        onGoogleSignUp={signInWithGoogle}
      />
    );
  }

  if (view === 'forgot') {
    return (
      <ForgotPasswordScreen
        onBack={() => setView('login')}
        onDone={() => setView('login')}
      />
    );
  }

  return (
    <WelcomeScreen
      onGoogleSignIn={signInWithGoogle}
      onPinSignIn={() => setView('login')}
      onCreateAccount={() => setView('signup')}
    />
  );
}

// ─── Swipe Tab Navigator (Instagram-style) ────────────────────────────────────
//
// TabView renders screens in a native horizontal pager.
// Swipe left/right to switch tabs, or tap the bottom tab bar icons.
// `lazy` keeps unvisited screens unmounted until first visited.

function SwipeTabNavigator() {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  return (
    <TabView
      navigationState={{ index, routes: TAB_ROUTES }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width }}
      tabBarPosition="bottom"
      renderTabBar={(props) => <BottomTabBar {...props} />}
      lazy
    />
  );
}

// ─── Custom Bottom Tab Bar ────────────────────────────────────────────────────

function BottomTabBar({ navigationState, jumpTo }: { navigationState: any; jumpTo: (key: string) => void }) {
  return (
    <View style={styles.tabBar}>
      {TAB_ROUTES.map((route, i) => {
        const isActive = i === navigationState.index;
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => jumpTo(route.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabEmoji, { opacity: isActive ? 1 : 0.45 }]}>
              {route.emoji}
            </Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {route.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Drawer Navigator (Hamburger Menu) ────────────────────────────────────────
//
// gestureEnabled: false — disables swipe-to-open drawer so it doesn't
// conflict with the horizontal tab swipe. Open drawer via hamburger icon.

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown:   false,
        swipeEnabled: false,           // prevents conflict with tab swipe
        drawerStyle:       drawerStyle,
        drawerActiveTintColor:   colors.accentBlue,
        drawerInactiveTintColor: colors.textMuted,
        drawerLabelStyle:        drawerLabelStyle,
      }}
    >
      <Drawer.Screen name="MainTabs"    component={SwipeTabNavigator}                                                            options={{ title: 'Home' }} />
      <Drawer.Screen name="Sleep"       component={PlaceholderScreen('Sleep',   'beauty sleep report 😴')}                       options={{ title: '😴 Sleep' }} />
      <Drawer.Screen name="Diet"        component={PlaceholderScreen('Diet',    'what did we eat babe? 🥗')}                     options={{ title: '🥗 Diet' }} />
      <Drawer.Screen name="Exercise"    component={PlaceholderScreen('Exercise','slay those workouts 💪')}                       options={{ title: '💪 Exercise' }} />
      <Drawer.Screen name="Water"       component={PlaceholderScreen('Water',   'hydration check 💧')}                           options={{ title: '💧 Water / Protein / Carbs' }} />
      <Drawer.Screen name="Steps"       component={PlaceholderScreen('Steps',   '6000 steps a day keeps the doctor away 🏃')}    options={{ title: '🏃 Steps' }} />
      <Drawer.Screen name="Acne"        component={PlaceholderScreen('Acne',    'skin diary 🌸')}                                options={{ title: '🌸 Acne Tracker' }} />
      <Drawer.Screen name="Bloat"       component={PlaceholderScreen('Bloat',   'bloat log 🫧')}                                 options={{ title: '🫧 Bloat Tracker' }} />
      <Drawer.Screen name="Selfie"      component={PlaceholderScreen('Selfie',  'daily glow log 📸')}                            options={{ title: '📸 Selfie Log' }} />
      <Drawer.Screen name="Savings"     component={PlaceholderScreen('Savings', 'saving like a boss 💰')}                        options={{ title: '💰 Savings' }} />
      <Drawer.Screen name="Investments" component={PlaceholderScreen('Investments', 'building that bag 📈')}                     options={{ title: '📈 Investments' }} />
    </Drawer.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

export function RootNavigator() {
  const { state } = useApp();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => { setSplashDone(false); }, []);

  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  if (state.isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!state.user ? (
          <RootStack.Screen name="Auth" component={AuthFlowScreen} />
        ) : !state.user.onboarded ? (
          <RootStack.Screen name="Onboarding" component={OnboardingWrapper} />
        ) : (
          <RootStack.Screen name="App" component={DrawerNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// ─── Wrappers ─────────────────────────────────────────────────────────────────

function OnboardingWrapper({ navigation }: any) {
  const { state } = useApp();
  if (state.user?.onboarded) {
    navigation.replace('App');
    return null;
  }
  return <OnboardingScreen onComplete={() => navigation.replace('App')} />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    flexDirection:  'row',
    backgroundColor: colors.surface,
    borderTopColor:  colors.borderLight,
    borderTopWidth:  1,
    height:          68,
    paddingBottom:   10,
    paddingTop:       6,
    shadowColor:     colors.royalDark,
    shadowOffset:    { width: 0, height: -2 },
    shadowOpacity:   0.04,
    shadowRadius:    8,
    elevation:       4,
  },
  tabItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:             2,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.xs,
    color:      colors.textMuted,
  },
  tabLabelActive: {
    color:      colors.accentBlue,
    fontWeight: '600',
  },
});

const drawerStyle = {
  backgroundColor: colors.background,
  width: 270,
};

const drawerLabelStyle = {
  fontFamily: fonts.sans,
  fontSize:   fontSizes.sm,
  letterSpacing: 0.2,
};

const placeholderStyles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.background,
    alignItems:      'center',
    justifyContent:  'center',
    padding:         32,
  },
  title: {
    fontFamily:   fonts.serif,
    fontSize:     fontSizes.xl,
    color:        colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily:   fonts.cursive,
    fontSize:     fontSizes.base,
    color:        colors.textSecondary,
    textAlign:    'center',
    marginBottom: 16,
  },
  coming: {
    fontFamily: fonts.sans,
    fontSize:   fontSizes.sm,
    color:      colors.textMuted,
  },
});
