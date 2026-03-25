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
  // Username + PIN signup with email (optional) and goals.
  async register(data: {
    username: string;
    name: string;
    pin: string;
    confirm_pin: string;
    email?: string;
    goals: string[];
  }): Promise<AuthResult> {
    const res = await api.post('/auth/register', data);
    return res.data.data;
  },

  // Sign in with username + PIN (4–6 digits).
  async login(username: string, pin: string): Promise<AuthResult> {
    const res = await api.post('/auth/login', { username, pin });
    return res.data.data;
  },

  // Request an OTP for PIN reset. In dev mode, OTP is returned in response.
  async forgotPIN(username: string): Promise<{ message: string; otp?: string }> {
    const res = await api.post('/auth/forgot-pin', { username });
    return res.data.data;
  },

  // Optional pre-check: verify OTP is valid before submitting new PIN.
  async verifyOTP(username: string, otp: string): Promise<{ verified: boolean; message: string }> {
    const res = await api.post('/auth/verify-otp', { username, otp });
    return res.data.data;
  },

  // Reset PIN using verified OTP.
  async resetPIN(username: string, otp: string, newPin: string): Promise<void> {
    await api.post('/auth/reset-pin', { username, otp, new_pin: newPin });
  },
};
