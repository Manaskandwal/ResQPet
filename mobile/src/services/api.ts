import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://resqpet-backend.onrender.com/api';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || API_URL.replace('/api', '');
export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
export const MAP_STYLE_URL = process.env.EXPO_PUBLIC_MAP_STYLE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const TOKEN_KEY = 'vetscue_token';
export const ADMIN_TOKEN_KEY = 'vetscue_admin_token';
export const USER_KEY = 'vetscue_user';

export const api: AxiosInstance = axios.create({ baseURL: API_URL, timeout: 20000 });

export let apiToken: string | null = null;

export const setApiToken = (token: string | null) => {
  apiToken = token;
};

// Register request interceptor globally in the service
api.interceptors.request.use(async (config) => {
  if (apiToken) {
    config.headers.Authorization = `Bearer ${apiToken}`;
  } else {
    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    if (stored) {
      apiToken = stored;
      config.headers.Authorization = `Bearer ${stored}`;
    }
  }
  return config;
});
