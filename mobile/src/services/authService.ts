import api from './api';

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  onboarded: boolean;
};

export type AuthResult = {
  token: string;
  token_expiry: number; // unix timestamp (seconds)
  user: AuthUser;
};

export const authService = {
  // Username + password signup.
  async register(data: {
    username: string;
    name: string;
    password: string;
  }): Promise<AuthResult> {
    const res = await api.post('/auth/register', data);
    return res.data.data;
  },

  // Sign in with username + password (or PIN after onboarding).
  async login(username: string, password: string): Promise<AuthResult> {
    const res = await api.post('/auth/login', { username, password });
    return res.data.data;
  },

  // Request a password reset link (requires email on the account).
  async forgotPassword(email: string): Promise<{ message: string; reset_token?: string }> {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data.data;
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },
};
