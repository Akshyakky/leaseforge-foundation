
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface MenuItem {
  menuID: number;
  menuName: string;
  menuPath: string;
  menuIcon: string;
  sequenceNo: number;
  subMenus?: SubMenuItem[];
}

export interface SubMenuItem {
  subMenuID: number;
  menuID: number;
  subMenuName: string;
  subMenuPath: string;
  subMenuIcon: string;
  sequenceNo: number;
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

export const menuService = {
  async getUserMenus(userId: number): Promise<MenuItem[]> {
    try {
      const request: BaseRequest = {
        mode: 13, // Mode 13: Get Authorized Menu with SubMenus for a User
        actionBy: 'WebApp',
        parameters: {
          CurrentUserID: userId
        }
      };
      
      const response = await api.post('/Master/menu', request);
      
      if (response.data.success) {
        const menus: MenuItem[] = response.data.table1 || [];
        const subMenus: SubMenuItem[] = response.data.table2 || [];
        
        // Group submenus under their parent menus
        return menus.map(menu => ({
          ...menu,
          subMenus: subMenus.filter(sub => sub.menuID === menu.menuID)
        }));
      } else {
        console.error('Failed to get menus:', response.data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching menus:', error);
      return [];
    }
  },
  
  async getAllMenus(): Promise<MenuItem[]> {
    try {
      const request: BaseRequest = {
        mode: 12, // Mode 12: Get Menu with SubMenus (for building navigation)
        actionBy: 'WebApp'
      };
      
      const response = await api.post('/Master/menu', request);
      
      if (response.data.success) {
        const menus: MenuItem[] = response.data.table1 || [];
        const subMenus: SubMenuItem[] = response.data.table2 || [];
        
        // Group submenus under their parent menus
        return menus.map(menu => ({
          ...menu,
          subMenus: subMenus.filter(sub => sub.menuID === menu.menuID)
        }));
      } else {
        console.error('Failed to get menus:', response.data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching menus:', error);
      return [];
    }
  }
};
