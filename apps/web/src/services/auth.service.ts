import { apiClient } from "@/lib/api-client";
import { User, Organization } from "@/types/organization.types";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
}

export interface RegisterInput {
  email: string;
  password?: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password?: string;
}

export const authService = {
  register: async (data: RegisterInput) => {
    const response = await apiClient.post<ApiResponse<{ user: User; org: Organization }>>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginInput) => {
    const response = await apiClient.post<ApiResponse<{ user: User; org: Organization }>>('/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  refresh: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  me: async () => {
    const response = await apiClient.get<ApiResponse<{ user: User; org: Organization }>>('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },

  sendVerification: async () => {
    const response = await apiClient.post('/auth/send-verification');
    return response.data;
  },

  googleLogin: () => {
    // Redirection to the backend endpoint that starts the Google OAuth flow
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  },
};
