
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface User {
  userID: number;
  compID?: number;
  userName: string;
  userFullName: string;
  phoneNo?: string;
  emailID: string;
  departmentID?: number;
  roleID?: number;
  isActive: boolean;
  companyName?: string;
  departmentName?: string;
  roleName?: string;
}

export interface BaseRequest {
  mode: number;
  actionBy?: string;
  parameters?: Record<string, any>;
}

// Create axios instance for API calls
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set up interceptor to include token in requests
api.interceptors.request.use(
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

export const userService = {
  async getAllUsers(): Promise<User[]> {
    try {
      const request: BaseRequest = {
        mode: 3, // Mode 3: Fetch All Active Users
        actionBy: 'WebApp'
      };
      
      const response = await api.post('/Master/UserMaster', request);
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        toast.error(response.data.message || 'Failed to fetch users');
        return [];
      }
    } catch (error) {
      toast.error('Error fetching users');
      console.error('Error fetching users:', error);
      return [];
    }
  },
  
  async getUserById(userId: number): Promise<User | null> {
    try {
      const request: BaseRequest = {
        mode: 4, // Mode 4: Fetch User by ID
        actionBy: 'WebApp',
        parameters: {
          UserID: userId
        }
      };
      
      const response = await api.post('/Master/UserMaster', request);
      
      if (response.data.success && response.data.data?.length > 0) {
        return response.data.data[0];
      } else {
        toast.error(response.data.message || 'User not found');
        return null;
      }
    } catch (error) {
      toast.error('Error fetching user');
      console.error('Error fetching user:', error);
      return null;
    }
  },

  async createUser(user: Partial<User>): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 1, // Mode 1: Insert New User
        actionBy: 'WebApp',
        parameters: {
          ...user
        }
      };
      
      const response = await api.post('/Master/UserMaster', request);
      
      if (response.data.success) {
        toast.success('User created successfully');
        return true;
      } else {
        toast.error(response.data.message || 'Failed to create user');
        return false;
      }
    } catch (error) {
      toast.error('Error creating user');
      console.error('Error creating user:', error);
      return false;
    }
  },

  async updateUser(user: Partial<User>): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 2, // Mode 2: Update Existing User
        actionBy: 'WebApp',
        parameters: {
          ...user
        }
      };
      
      const response = await api.post('/Master/UserMaster', request);
      
      if (response.data.success) {
        toast.success('User updated successfully');
        return true;
      } else {
        toast.error(response.data.message || 'Failed to update user');
        return false;
      }
    } catch (error) {
      toast.error('Error updating user');
      console.error('Error updating user:', error);
      return false;
    }
  },

  async deleteUser(userId: number): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 5, // Mode 5: Soft Delete User
        actionBy: 'WebApp',
        parameters: {
          UserID: userId
        }
      };
      
      const response = await api.post('/Master/UserMaster', request);
      
      if (response.data.success) {
        toast.success('User deleted successfully');
        return true;
      } else {
        toast.error(response.data.message || 'Failed to delete user');
        return false;
      }
    } catch (error) {
      toast.error('Error deleting user');
      console.error('Error deleting user:', error);
      return false;
    }
  },

  async searchUsers(searchText: string): Promise<User[]> {
    try {
      const request: BaseRequest = {
        mode: 6, // Mode 6: Search Users
        actionBy: 'WebApp',
        parameters: {
          SearchText: searchText
        }
      };
      
      const response = await api.post('/Master/UserMaster', request);
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        toast.error(response.data.message || 'Search failed');
        return [];
      }
    } catch (error) {
      toast.error('Error searching users');
      console.error('Error searching users:', error);
      return [];
    }
  }
};
