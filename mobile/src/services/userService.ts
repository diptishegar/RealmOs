import api from './api';

export type CreateUserPayload = {
  name: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
};

export type UpdateGoalsPayload = {
  daily_water_ml?: number;
  daily_protein_g?: number;
  daily_steps?: number;
  sleep_hours?: number;
  workout_days_week?: number;
  monthly_savings_inr?: number;
  priority_areas?: string[];
};

export const userService = {
  create: async (payload: CreateUserPayload) => {
    const res = await api.post('/users', payload);
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/users/${id}`);
    return res.data.data;
  },

  updateGoals: async (id: string, payload: UpdateGoalsPayload) => {
    const res = await api.put(`/users/${id}/goals`, payload);
    return res.data.data;
  },

  getGoals: async (id: string) => {
    const res = await api.get(`/users/${id}/goals`);
    return res.data.data;
  },
};
