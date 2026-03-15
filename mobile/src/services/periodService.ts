import api from './api';

export type PeriodDayPayload = {
  log_date: string;           // "YYYY-MM-DD"
  flow_level?: 'light' | 'medium' | 'heavy' | 'spotting';
  symptoms?: string[];
  mood?: string;
  notes?: string;
};

export type PeriodProfilePayload = {
  avg_cycle_length?: number;
  avg_period_duration?: number;
  last_period_start?: string;
  relationship_with_period?: 'yes' | 'no' | 'frenemy' | 'neutral';
};

export const periodService = {
  logDay: async (payload: PeriodDayPayload) => {
    const res = await api.post('/period/log', payload);
    return res.data.data;
  },

  deleteDay: async (date: string) => {
    const res = await api.delete(`/period/log/${date}`);
    return res.data;
  },

  getLogs: async (from: string, to: string) => {
    const res = await api.get('/period/logs', { params: { from, to } });
    return res.data.data as PeriodDayPayload[];
  },

  upsertProfile: async (payload: PeriodProfilePayload) => {
    const res = await api.post('/period/profile', payload);
    return res.data.data;
  },

  getProfile: async () => {
    const res = await api.get('/period/profile');
    return res.data.data;
  },
};
