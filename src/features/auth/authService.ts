
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import { loginStart, loginSuccess, loginFailure, logout } from './authSlice';
import { AppDispatch } from '@/lib/store';

// Types
interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
}

// Mock data for development
const MOCK_USERS = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Manager User',
    email: 'manager@example.com',
    password: 'manager123',
    role: 'manager',
  },
  {
    id: '3',
    name: 'Staff User',
    email: 'staff@example.com',
    password: 'staff123',
    role: 'staff',
  },
];

// For development, we'll use a mock login service
export const login = (credentials: LoginCredentials) => async (dispatch: AppDispatch) => {
  try {
    dispatch(loginStart());

    // In production, this would be an actual API call
    // const response = await apiService.post<LoginResponse>('/auth/login', credentials);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock authentication logic
    const user = MOCK_USERS.find(u => 
      u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Create mock response
    const response: LoginResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: 'mock-jwt-token-' + Date.now(),
    };

    // Save token if remember me is checked
    if (credentials.rememberMe) {
      localStorage.setItem('token', response.token);
    } else {
      sessionStorage.setItem('token', response.token);
    }

    dispatch(loginSuccess(response));
    toast.success('Logged in successfully');
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    dispatch(loginFailure(errorMessage));
    toast.error(errorMessage);
    throw error;
  }
};

export const logoutUser = () => (dispatch: AppDispatch) => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  dispatch(logout());
  toast.info('Logged out successfully');
};

export const checkAuthStatus = () => (dispatch: AppDispatch) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (token) {
    // In production, you would validate the token with the server
    // For now, we'll just consider the presence of a token as authenticated
    // and use the first mock user
    const user = MOCK_USERS[0];
    
    dispatch(loginSuccess({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    }));
  }
};
