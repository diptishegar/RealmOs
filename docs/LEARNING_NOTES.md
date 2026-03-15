# RealmOs – Learning Notes (React Native for React Devs)

> You know ReactJS. React Native uses the same mental model — components, hooks,
> props, state — but renders to native mobile UI instead of HTML.

---

## Key Differences: ReactJS vs React Native

| Concept        | ReactJS                  | React Native                        |
|----------------|--------------------------|-------------------------------------|
| Rendering      | HTML DOM                 | Native iOS/Android views            |
| Div            | `<div>`                  | `<View>`                            |
| Paragraph      | `<p>`                    | `<Text>`                            |
| Images         | `<img>`                  | `<Image>`                           |
| Input          | `<input>`                | `<TextInput>`                       |
| Button         | `<button>`               | `<TouchableOpacity>` or `<Pressable>`|
| Scrolling      | CSS overflow             | `<ScrollView>` or `<FlatList>`      |
| Styling        | CSS classes / modules    | `StyleSheet.create({})` objects     |
| Routing        | react-router             | React Navigation (stack/tab/drawer) |
| Storage        | localStorage             | AsyncStorage                        |
| Flex           | CSS flexbox              | Same, but `flexDirection: 'column'` is default |

---

## Styling in React Native

No CSS files. Styles are JavaScript objects:

```tsx
import { StyleSheet, View, Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#36213E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#B8F3FF',
    fontSize: 24,
    fontFamily: 'monospace',
  },
});

export function MyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello RealmOs</Text>
    </View>
  );
}
```

---

## Navigation Concepts

We use **React Navigation** — the standard navigation library.

### Navigator Types

| Type            | Use case                              |
|-----------------|---------------------------------------|
| Stack Navigator | Screen-to-screen navigation (push/pop)|
| Tab Navigator   | Bottom tabs (Home, Track, Today, Profile) |
| Drawer Navigator| Side hamburger menu                   |

### How They Nest (RealmOs)

```
Root Stack
  ├── Splash Screen
  ├── Onboarding Stack
  └── Main App
        ├── Drawer (hamburger menu)
        │     └── Tab Navigator (bottom tabs)
        │           ├── Home Tab
        │           ├── Track Tab
        │           ├── Today Tab
        │           └── Profile Tab
        └── Period Detail Screen (pushed on stack)
```

---

## Expo vs Bare React Native

We use **Expo** — it gives you:
- Easy setup (no Xcode/Android Studio needed to start)
- Built-in APIs (camera, storage, notifications)
- `expo build` → generates `.apk` for Android

Commands you'll use:
```bash
npx expo start           # Start dev server
npx expo start --tunnel  # If on same WiFi doesn't work
npx eas build --platform android --profile preview  # Build APK
```

---

## Hooks You'll Use

```tsx
import { useState }    from 'react';     // local component state
import { useEffect }   from 'react';     // side effects (API calls)
import { useContext }  from 'react';     // access global state
import { useRef }      from 'react';     // mutable refs (animations, inputs)
import { useCallback } from 'react';     // memoized callbacks
```

These work identically to ReactJS — no difference here.

---

## AsyncStorage (Like localStorage)

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save
await AsyncStorage.setItem('user_id', userId);

// Read
const userId = await AsyncStorage.getItem('user_id');

// Remove
await AsyncStorage.removeItem('user_id');
```

---

## FlatList (For Long Lists)

Instead of `.map()` use `FlatList` — it's virtualized (only renders visible items):

```tsx
import { FlatList, Text, View } from 'react-native';

<FlatList
  data={periodDays}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View>
      <Text>{item.log_date}</Text>
    </View>
  )}
/>
```

---

## Animations (Reanimated)

We'll use `react-native-reanimated` for smooth animations (hamburger menu, etc.):

```tsx
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';

const opacity = useSharedValue(0);
opacity.value = withTiming(1, { duration: 500 });
```

---

## TypeScript in React Native

Same as React + TypeScript. We type our props:

```tsx
type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
};

export function Button({ label, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{label}</Text>
    </TouchableOpacity>
  );
}
```

---

## SafeAreaView

Always wrap screens in SafeAreaView to avoid content going behind phone notches:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* content */}
    </SafeAreaView>
  );
}
```

---

## What's Coming Next

- Phase 1: Splash → Onboarding → Home → Period Tracker
- Expo Router for file-based navigation (similar to Next.js pages)
- Custom theme hook for our color palette
- Animated hamburger drawer
