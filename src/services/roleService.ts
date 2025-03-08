
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Role {
  roleID: number;
  roleName: string;
  createdBy?: string;
  createdOn?: string;
  updatedBy?: string;
  updatedOn?: string;
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

export const roleService = {
  async getAllRoles(): Promise<Role[]> {
    try {
      const request: BaseRequest = {
        mode: 3, // Mode 3: Fetch All Active Roles
        actionBy: 'WebApp'
      };
      
      const response = await api.post('/Master/userrole', request);
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        toast.error(response.data.message || 'Failed to fetch roles');
        return [];
      }
    } catch (error) {
      toast.error('Error fetching roles');
      console.error('Error fetching roles:', error);
      return [];
    }
  },
  
  async getRoleById(roleId: number): Promise<Role | null> {
    try {
      const request: BaseRequest = {
        mode: 4, // Mode 4: Fetch Role by ID
        actionBy: 'WebApp',
        parameters: {
          RoleID: roleId
        }
      };
      
      const response = await api.post('/Master/userrole', request);
      
      if (response.data.success && response.data.data?.length > 0) {
        return response.data.data[0];
      } else {
        toast.error(response.data.message || 'Role not found');
        return null;
      }
    } catch (error) {
      toast.error('Error fetching role');
      console.error('Error fetching role:', error);
      return null;
    }
  },

  async createRole(role: Partial<Role>): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 1, // Mode 1: Insert New Role
        actionBy: 'WebApp',
        parameters: {
          RoleName: role.roleName
        }
      };
      
      const response = await api.post('/Master/userrole', request);
      
      if (response.data.success) {
        toast.success('Role created successfully');
        return true;
      } else {
        toast.error(response.data.message || 'Failed to create role');
        return false;
      }
    } catch (error) {
      toast.error('Error creating role');
      console.error('Error creating role:', error);
      return false;
    }
  },

  async updateRole(role: Partial<Role>): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 2, // Mode 2: Update Existing Role
        actionBy: 'WebApp',
        parameters: {
          RoleID: role.roleID,
          RoleName: role.roleName
        }
      };
      
      const response = await api.post('/Master/userrole', request);
      
      if (response.data.success) {
        toast.success('Role updated successfully');
        return true;
      } else {
        toast.error(response.data.message || 'Failed to update role');
        return false;
      }
    } catch (error) {
      toast.error('Error updating role');
      console.error('Error updating role:', error);
      return false;
    }
  },

  async deleteRole(roleId: number): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 5, // Mode 5: Soft Delete Role
        actionBy: 'WebApp',
        parameters: {
          RoleID: roleId
        }
      };
      
      const response = await api.post('/Master/userrole', request);
      
      if (response.data.success) {
        toast.success('Role deleted successfully');
        return true;
      } else {
        toast.error(response.data.message || 'Failed to delete role');
        return false;
      }
    } catch (error) {
      toast.error('Error deleting role');
      console.error('Error deleting role:', error);
      return false;
    }
  },

  async getUsersByRole(roleId: number): Promise<any[]> {
    try {
      const request: BaseRequest = {
        mode: 7, // Mode 7: Get Users by Role
        actionBy: 'WebApp',
        parameters: {
          RoleID: roleId
        }
      };
      
      const response = await api.post('/Master/userrole', request);
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        toast.error(response.data.message || 'Failed to fetch users by role');
        return [];
      }
    } catch (error) {
      toast.error('Error fetching users by role');
      console.error('Error fetching users by role:', error);
      return [];
    }
  },

  async getRolePermissions(roleId: number): Promise<any[]> {
    try {
      const request: BaseRequest = {
        mode: 9, // Mode 9: Get Role Permissions
        actionBy: 'WebApp',
        parameters: {
          RoleID: roleId
        }
      };
      
      const response = await api.post('/Master/userrole', request);
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        toast.error(response.data.message || 'Failed to fetch role permissions');
        return [];
      }
    } catch (error) {
      toast.error('Error fetching role permissions');
      console.error('Error fetching role permissions:', error);
      return [];
    }
  }
};
