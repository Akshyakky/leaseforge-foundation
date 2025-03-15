import axios from "axios";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface Department {
  DepartmentID: number;
  DepartmentName: string;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
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
    "Content-Type": "application/json",
  },
});

// Set up interceptor to include token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const departmentService = {
  async getAllDepartments(): Promise<Department[]> {
    try {
      const request: BaseRequest = {
        mode: 3, // Mode 3: Fetch All Active Departments
        actionBy: "WebApp",
        parameters: {},
      };

      const response = await api.post("/Master/department", request);

      if (response.data.success) {
        return response.data.data || [];
      } else {
        toast.error(response.data.message || "Failed to fetch departments");
        return [];
      }
    } catch (error) {
      toast.error("Error fetching departments");
      console.error("Error fetching departments:", error);
      return [];
    }
  },

  async getDepartmentById(departmentId: number): Promise<Department | null> {
    try {
      const request: BaseRequest = {
        mode: 4, // Mode 4: Fetch Department by ID
        actionBy: "WebApp",
        parameters: {
          DepartmentID: departmentId,
        },
      };

      const response = await api.post("/Master/department", request);

      if (response.data.success && response.data.data?.length > 0) {
        return response.data.data[0];
      } else {
        toast.error(response.data.message || "Department not found");
        return null;
      }
    } catch (error) {
      toast.error("Error fetching department");
      console.error("Error fetching department:", error);
      return null;
    }
  },

  async createDepartment(department: Partial<Department>): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 1, // Mode 1: Insert New Department
        actionBy: "WebApp",
        parameters: {
          DepartmentName: department.DepartmentName,
        },
      };

      const response = await api.post("/Master/department", request);

      if (response.data.success) {
        toast.success("Department created successfully");
        return true;
      } else {
        toast.error(response.data.message || "Failed to create department");
        return false;
      }
    } catch (error) {
      toast.error("Error creating department");
      console.error("Error creating department:", error);
      return false;
    }
  },

  async updateDepartment(department: Partial<Department>): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 2, // Mode 2: Update Existing Department
        actionBy: "WebApp",
        parameters: {
          DepartmentID: department.DepartmentID,
          DepartmentName: department.DepartmentName,
        },
      };

      const response = await api.post("/Master/department", request);

      if (response.data.success) {
        toast.success("Department updated successfully");
        return true;
      } else {
        toast.error(response.data.message || "Failed to update department");
        return false;
      }
    } catch (error) {
      toast.error("Error updating department");
      console.error("Error updating department:", error);
      return false;
    }
  },

  async deleteDepartment(departmentId: number): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 5, // Mode 5: Soft Delete Department
        actionBy: "WebApp",
        parameters: {
          DepartmentID: departmentId,
        },
      };

      const response = await api.post("/Master/department", request);

      if (response.data.success) {
        toast.success("Department deleted successfully");
        return true;
      } else {
        toast.error(response.data.message || "Failed to delete department");
        return false;
      }
    } catch (error) {
      toast.error("Error deleting department");
      console.error("Error deleting department:", error);
      return false;
    }
  },

  async searchDepartments(searchText: string): Promise<Department[]> {
    try {
      const request: BaseRequest = {
        mode: 6, // Mode 6: Search Departments
        actionBy: "WebApp",
        parameters: {
          SearchText: searchText,
        },
      };

      const response = await api.post("/Master/department", request);

      if (response.data.success) {
        return response.data.data || [];
      } else {
        toast.error(response.data.message || "Search failed");
        return [];
      }
    } catch (error) {
      toast.error("Error searching departments");
      console.error("Error searching departments:", error);
      return [];
    }
  },

  async getDepartmentStatistics(departmentId?: number): Promise<any> {
    try {
      const request: BaseRequest = {
        mode: 8, // Mode 8: Get Department Statistics
        actionBy: "WebApp",
        parameters: {
          DepartmentID: departmentId,
        },
      };

      const response = await api.post("/Master/department", request);

      if (response.data.success) {
        return {
          departmentStats: response.data.table1 || [],
          roleDistribution: response.data.table2 || [],
        };
      } else {
        toast.error(response.data.message || "Failed to fetch department statistics");
        return {};
      }
    } catch (error) {
      toast.error("Error fetching department statistics");
      console.error("Error fetching department statistics:", error);
      return {};
    }
  },

  async getDepartmentUsers(departmentId: number): Promise<any[]> {
    try {
      const request: BaseRequest = {
        mode: 7, // Mode 7: Get Users by Department
        actionBy: "WebApp",
        parameters: {
          DepartmentID: departmentId,
        },
      };

      const response = await api.post("/Master/department", request);

      if (response.data.success) {
        return response.data.data || [];
      } else {
        toast.error(response.data.message || "Failed to fetch department users");
        return [];
      }
    } catch (error) {
      toast.error("Error fetching department users");
      console.error("Error fetching department users:", error);
      return [];
    }
  },
};
