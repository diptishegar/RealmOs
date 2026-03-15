// AppContext is our global state store.
// Think of it like a tiny Redux — but using React's built-in Context + useReducer.
// We keep it simple: just user info and whether onboarding is done.

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppUser = {
  id: string;
  name: string;
  onboarded: boolean;
};

type AppState = {
  user: AppUser | null;
  isLoading: boolean;        // true while we're checking AsyncStorage on startup
  isOnboarded: boolean;
};

type AppAction =
  | { type: 'SET_USER'; payload: AppUser }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'MARK_ONBOARDED' }
  | { type: 'CLEAR_USER' };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isOnboarded: action.payload.onboarded };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'MARK_ONBOARDED':
      return { ...state, isOnboarded: true, user: state.user ? { ...state.user, onboarded: true } : null };
    case 'CLEAR_USER':
      return { ...state, user: null, isOnboarded: false };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setUser: (user: AppUser) => Promise<void>;
  clearUser: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    user: null,
    isLoading: true,
    isOnboarded: false,
  });

  // On app start: try to restore the user from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('app_user');
        if (stored) {
          const user: AppUser = JSON.parse(stored);
          dispatch({ type: 'SET_USER', payload: user });
        }
      } catch {
        // Ignore — user will go through onboarding
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, []);

  const setUser = async (user: AppUser) => {
    await AsyncStorage.setItem('app_user', JSON.stringify(user));
    await AsyncStorage.setItem('user_id', user.id);
    dispatch({ type: 'SET_USER', payload: user });
  };

  const clearUser = async () => {
    await AsyncStorage.removeItem('app_user');
    await AsyncStorage.removeItem('user_id');
    dispatch({ type: 'CLEAR_USER' });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, setUser, clearUser }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
