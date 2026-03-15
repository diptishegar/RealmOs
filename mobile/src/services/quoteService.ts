import api from './api';

export type Quote = {
  id: string;
  text: string;
  author?: string;
  category: string;
};

export const quoteService = {
  getRandom: async (): Promise<Quote> => {
    const res = await api.get('/quotes/random');
    return res.data.data;
  },
};
