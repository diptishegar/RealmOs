// AppContext is our global state store.
// Think of it like a tiny Redux — but using React's built-in Context + useReducer.

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppUser = {
  id: string;
  name: string;
  username: string;
  onboarded: boolean;
  token?: string;       // JWT — used for Authorization header
  tokenExpiry?: number; // unix timestamp
};

type AppState = {
  user: AppUser | null;
  isLoading: boolean; // true while checking AsyncStorage on startup
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
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'MARK_ONBOARDED':
      return { ...state, user: state.user ? { ...state.user, onboarded: true } : null };
    case 'CLEAR_USER':
      return { ...state, user: null };
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
  });

  // On app start: restore user from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('app_user');
        if (stored) {
          const user: AppUser = JSON.parse(stored);
          dispatch({ type: 'SET_USER', payload: user });
        }
      } catch {
        // Ignore — user goes through auth
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, []);

  const setUser = async (user: AppUser) => {
    await AsyncStorage.setItem('app_user', JSON.stringify(user));
    await AsyncStorage.setItem('user_id', user.id);
    if (user.token) {
      await AsyncStorage.setItem('auth_token', user.token);
    }
    dispatch({ type: 'SET_USER', payload: user });
  };

  const clearUser = async () => {
    await AsyncStorage.multiRemove(['app_user', 'user_id', 'auth_token']);
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
