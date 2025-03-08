
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:5000/api';

export interface LoginRequest {
  username: string;
  password: string;
  mode?: number;
  action?: string;
  parameters?: Record<string, any>;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    userID: number;
    userName: string;
    userFullName: string;
    emailID: string;
    role: string;
    phoneNo?: string;
    departmentName?: string;
    roleName?: string;
    companyName?: string;
  };
  token?: string;
  refreshToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  userID: number;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  username: string;
  email: string;
}

// Create axios instance for auth
const authApi = axios.create({
  baseURL: `${API_URL}/Auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set up interceptor to include token in requests
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth service functions
export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Format request body based on Mode 7 format if mode is specified
      const requestBody = credentials.mode === 7 
        ? {
            mode: 7,
            action: credentials.action || "akshay",
            parameters: credentials.parameters || {},
            username: credentials.username,
            password: credentials.password
          }
        : credentials;
          
      const response = await authApi.post<LoginResponse>('/login', requestBody);
      
      if (response.data.success && response.data.token) {
        // Store token and user info
        sessionStorage.setItem('token', response.data.token);
        
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const message = error.response.data?.message || 'Login failed';
        toast.error(message);
        throw new Error(message);
      }
      toast.error('Network error. Please try again later.');
      throw error;
    }
  },

  async refreshToken(request: RefreshTokenRequest): Promise<LoginResponse> {
    try {
      const response = await authApi.post<LoginResponse>('/refresh-token', request);
      
      if (response.data.success && response.data.token) {
        sessionStorage.setItem('token', response.data.token);
        
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Token refresh failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Token refresh failed');
      }
      throw error;
    }
  },

  async changePassword(request: ChangePasswordRequest): Promise<boolean> {
    try {
      const response = await authApi.post('/change-password', request);
      toast.success('Password changed successfully');
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to change password');
      } else {
        toast.error('An error occurred while changing password');
      }
      return false;
    }
  },

  async resetPassword(request: ResetPasswordRequest): Promise<boolean> {
    try {
      const response = await authApi.post('/reset-password', request);
      toast.success('If an account exists with those details, a password reset email has been sent.');
      return true;
    } catch (error) {
      toast.error('An error occurred while processing your request');
      return false;
    }
  },

  logout(): void {
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
  }
};
