import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your EC2 IP when deploying
// For local dev: use your machine's local IP (not localhost — device can't reach it)
const API_BASE_URL = 'http://YOUR_EC2_IP:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: automatically attach X-User-ID to every request
api.interceptors.request.use(async (config) => {
  const userId = await AsyncStorage.getItem('user_id');
  if (userId) {
    config.headers['X-User-ID'] = userId;
  }
  return config;
});

// Interceptor: standardize error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'Something went wrong. Try again?';
    return Promise.reject(new Error(message));
  }
);

export default api;
