import { apiClient } from './api';

export type AuthRole = 'hr' | 'employee';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyId?: string;
  company?: string;
  role: AuthRole;
  employeeId?: string;
}

export interface AuthResponse {
  success?: boolean;
  token: string;
  user: AuthUser;
}

export interface SignupPayload {
  name: string;
  email: string;
  phone?: string;
  company: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const saveSession = (response: AuthResponse) => {
  localStorage.setItem('intellihr_token', response.token);
  localStorage.setItem('intellihr_user', JSON.stringify(response.user));
};

export const clearSession = () => {
  localStorage.removeItem('intellihr_token');
  localStorage.removeItem('intellihr_user');
};

export const getCurrentUser = (): AuthUser | null => {
  const userString = localStorage.getItem('intellihr_user');
  if (!userString) return null;

  try {
    return JSON.parse(userString) as AuthUser;
  } catch {
    clearSession();
    return null;
  }
};

export const authService = {
  login: async (payload: LoginPayload) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },
  signup: async (payload: SignupPayload) => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', payload);
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (payload: { email: string; token: string; password: string }) => {
    const response = await apiClient.post<AuthResponse>('/auth/reset-password', payload);
    return response.data;
  },
  registerEmployee: async (payload: { token: string; password: string; acceptTerms: boolean }) => {
    const response = await apiClient.post('/employees/register', payload);
    return response.data;
  }
};
