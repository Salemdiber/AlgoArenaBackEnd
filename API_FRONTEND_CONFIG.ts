/**
 * Configuration API - Frontend (React)
 * 
 * À placer dans: src/config/api.config.ts ou src/services/api.ts
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ✅ Port CORRECT du backend: 3001
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

console.log('🔗 API Base URL:', API_BASE_URL);

// Créer une instance axios avec les bonnes config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // ✅ Important pour les cookies/credentials
});

// Intercepteur pour les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Non authentifié
      console.error('❌ Unauthorized - Redirecting to login');
      localStorage.removeItem('access_token');
      // window.location.href = '/login';
    }
    
    if (error.code === 'ERR_NETWORK') {
      console.error('❌ Network Error - Backend not reachable at', API_BASE_URL);
      console.error('   Make sure backend is running on port 3001');
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// ============================================================

/**
 * USAGE DANS LES COMPOSANTS
 */

// Exemple: Forgot Password
export const forgotPassword = async (email: string, captchaToken: string) => {
  try {
    const response = await apiClient.post('/auth/forgot-password', {
      email,
      captchaToken,
    });
    return response.data;
  } catch (error: any) {
    console.error('Forgot Password Error:', error);
    throw error;
  }
};

// Exemple: Login
export const login = async (username: string, password: string, captchaToken: string) => {
  try {
    const response = await apiClient.post('/auth/login', {
      username,
      password,
      captchaToken,
    });
    localStorage.setItem('access_token', response.data.access_token);
    return response.data;
  } catch (error: any) {
    console.error('Login Error:', error);
    throw error;
  }
};

// Exemple: Register
export const register = async (
  username: string,
  email: string,
  password: string,
  captchaToken: string
) => {
  try {
    const response = await apiClient.post('/auth/register', {
      username,
      email,
      password,
      captchaToken,
    });
    return response.data;
  } catch (error: any) {
    console.error('Register Error:', error);
    throw error;
  }
};

// Exemple: Reset Password
export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    throw error;
  }
};
