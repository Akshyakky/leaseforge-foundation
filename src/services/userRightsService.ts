
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface UserRight {
  userRightID: number;
  companyID?: number;
  userID?: number;
  roleID?: number;
  menuID: number;
  subMenuID?: number;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canPrint: boolean;
  menuName?: string;
  subMenuName?: string;
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

export const userRightsService = {
  async getUserRights(userId: number): Promise<UserRight[]> {
    try {
      const request: BaseRequest = {
        mode: 1, // Mode 1: Get User Rights
        actionBy: 'WebApp',
        parameters: {
          UserID: userId
        }
      };
      
      const response = await api.post('/Master/userrights', request);
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        toast.error(response.data.message || 'Failed to fetch user rights');
        return [];
      }
    } catch (error) {
      toast.error('Error fetching user rights');
      console.error('Error fetching user rights:', error);
      return [];
    }
  },
  
  async getRoleRights(roleId: number): Promise<UserRight[]> {
    try {
      const request: BaseRequest = {
        mode: 2, // Mode 2: Get Role Rights
        actionBy: 'WebApp',
        parameters: {
          RoleID: roleId
        }
      };
      
      const response = await api.post('/Master/userrights', request);
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        toast.error(response.data.message || 'Failed to fetch role rights');
        return [];
      }
    } catch (error) {
      toast.error('Error fetching role rights');
      console.error('Error fetching role rights:', error);
      return [];
    }
  },

  async saveUserRights(userRights: UserRight[]): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 3, // Mode 3: Save User Rights
        actionBy: 'WebApp',
        parameters: {
          UserRights: userRights
        }
      };
      
      const response = await api.post('/Master/userrights', request);
      
      if (response.data.success) {
        toast.success('User rights saved successfully');
        return true;
      } else {
        toast.error(response.data.message || 'Failed to save user rights');
        return false;
      }
    } catch (error) {
      toast.error('Error saving user rights');
      console.error('Error saving user rights:', error);
      return false;
    }
  },
  
  async saveRoleRights(roleId: number, userRights: UserRight[]): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 4, // Mode 4: Save Role Rights
        actionBy: 'WebApp',
        parameters: {
          RoleID: roleId,
          UserRights: userRights
        }
      };
      
      const response = await api.post('/Master/userrights', request);
      
      if (response.data.success) {
        toast.success('Role rights saved successfully');
        return true;
      } else {
        toast.error(response.data.message || 'Failed to save role rights');
        return false;
      }
    } catch (error) {
      toast.error('Error saving role rights');
      console.error('Error saving role rights:', error);
      return false;
    }
  },

  async checkAccess(userId: number, menuId: number, subMenuId?: number): Promise<{
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
    canPrint: boolean;
  }> {
    try {
      const request: BaseRequest = {
        mode: 5, // Mode 5: Check Access
        actionBy: 'WebApp',
        parameters: {
          UserID: userId,
          MenuID: menuId,
          SubMenuID: subMenuId
        }
      };
      
      const response = await api.post('/Master/userrights', request);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        return {
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false,
          canExport: false,
          canPrint: false
        };
      }
    } catch (error) {
      console.error('Error checking access:', error);
      return {
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canExport: false,
        canPrint: false
      };
    }
  }
};
