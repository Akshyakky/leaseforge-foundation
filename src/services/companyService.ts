import axios from "axios";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface Company {
  CompanyID: number;
  CompanyNo?: string;
  CompanyName: string;
  CompanyAddress?: string;
  CountryID?: number;
  CountryName?: string;
  CityID?: number;
  CityName?: string;
  ContactNo?: string;
  CompanyEmail?: string;
  CompanyWeb?: string;
  CompanyLogo?: any;
  CompanyRemarks?: string;
  IsActive: boolean;
  TaxNo?: string;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

export interface CompanyStatistics {
  CompanyID: number;
  CompanyName: string;
  UserCount: number;
  ActiveUserCount: number;
  DepartmentCount: number;
  RoleCount?: number;
}

export interface DepartmentDistribution {
  DepartmentID: number;
  DepartmentName: string;
  UserCount: number;
}

export interface RoleDistribution {
  RoleID: number;
  RoleName: string;
  UserCount: number;
}

export interface CompanyUser {
  UserID: number;
  UserName: string;
  UserFullName: string;
  EmailID: string;
  PhoneNo?: string;
  DepartmentID?: number;
  DepartmentName?: string;
  RoleID?: number;
  RoleName?: string;
  IsActive: boolean;
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

export const companyService = {
  async getAllCompanies(): Promise<Company[]> {
    try {
      const request: BaseRequest = {
        mode: 3, // Mode 3: Fetch All Active Companies
        actionBy: "WebApp",
        parameters: {},
      };

      const response = await api.post("/Master/company", request);

      if (response.data.success) {
        return response.data.data || [];
      } else {
        toast.error(response.data.message || "Failed to fetch companies");
        return [];
      }
    } catch (error) {
      toast.error("Error fetching companies");
      console.error("Error fetching companies:", error);
      return [];
    }
  },

  async getCompanyById(companyId: number): Promise<Company | null> {
    try {
      const request: BaseRequest = {
        mode: 4, // Mode 4: Fetch Company by ID
        actionBy: "WebApp",
        parameters: {
          CompanyID: companyId,
        },
      };

      const response = await api.post("/Master/company", request);

      if (response.data.success && response.data.data?.length > 0) {
        return response.data.data[0];
      } else {
        toast.error(response.data.message || "Company not found");
        return null;
      }
    } catch (error) {
      toast.error("Error fetching company");
      console.error("Error fetching company:", error);
      return null;
    }
  },

  async createCompany(company: Partial<Company>): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 1, // Mode 1: Insert New Company
        actionBy: "WebApp",
        parameters: {
          ...company,
        },
      };

      const response = await api.post("/Master/company", request);

      if (response.data.success) {
        toast.success("Company created successfully");
        return true;
      } else {
        toast.error(response.data.message || "Failed to create company");
        return false;
      }
    } catch (error) {
      toast.error("Error creating company");
      console.error("Error creating company:", error);
      return false;
    }
  },

  async updateCompany(company: Partial<Company>): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 2, // Mode 2: Update Existing Company
        actionBy: "WebApp",
        parameters: {
          ...company,
        },
      };

      const response = await api.post("/Master/company", request);

      if (response.data.success) {
        toast.success("Company updated successfully");
        return true;
      } else {
        toast.error(response.data.message || "Failed to update company");
        return false;
      }
    } catch (error) {
      toast.error("Error updating company");
      console.error("Error updating company:", error);
      return false;
    }
  },

  async deleteCompany(companyId: number): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 5, // Mode 5: Soft Delete Company
        actionBy: "WebApp",
        parameters: {
          CompanyID: companyId,
        },
      };

      const response = await api.post("/Master/company", request);

      if (response.data.success) {
        toast.success("Company deleted successfully");
        return true;
      } else {
        toast.error(response.data.message || "Failed to delete company");
        return false;
      }
    } catch (error) {
      toast.error("Error deleting company");
      console.error("Error deleting company:", error);
      return false;
    }
  },

  async searchCompanies(searchText: string): Promise<Company[]> {
    try {
      const request: BaseRequest = {
        mode: 6, // Mode 6: Search Companies
        actionBy: "WebApp",
        parameters: {
          SearchText: searchText,
        },
      };

      const response = await api.post("/Master/company", request);

      if (response.data.success) {
        return response.data.data || [];
      } else {
        toast.error(response.data.message || "Search failed");
        return [];
      }
    } catch (error) {
      toast.error("Error searching companies");
      console.error("Error searching companies:", error);
      return [];
    }
  },

  async getCompanyUsers(companyId: number): Promise<CompanyUser[]> {
    try {
      const request: BaseRequest = {
        mode: 7, // Mode 7: Get Users by Company
        actionBy: "WebApp",
        parameters: {
          CompanyID: companyId,
        },
      };

      const response = await api.post("/Master/company", request);

      if (response.data.success) {
        return response.data.data || [];
      } else {
        toast.error(response.data.message || "Failed to fetch company users");
        return [];
      }
    } catch (error) {
      toast.error("Error fetching company users");
      console.error("Error fetching company users:", error);
      return [];
    }
  },

  async getCompanyStatistics(companyId?: number): Promise<{
    companyStats?: CompanyStatistics;
    departmentDistribution?: DepartmentDistribution[];
    roleDistribution?: RoleDistribution[];
  }> {
    try {
      const request: BaseRequest = {
        mode: 8, // Mode 8: Get Company Statistics
        actionBy: "WebApp",
        parameters: {
          CompanyID: companyId,
        },
      };

      const response = await api.post("/Master/company", request);

      if (response.data.success) {
        return {
          companyStats: response.data.table1?.[0],
          departmentDistribution: response.data.table2 || [],
          roleDistribution: response.data.table3 || [],
        };
      } else {
        toast.error(response.data.message || "Failed to fetch company statistics");
        return {};
      }
    } catch (error) {
      toast.error("Error fetching company statistics");
      console.error("Error fetching company statistics:", error);
      return {};
    }
  },

  async toggleCompanyStatus(companyId: number): Promise<boolean> {
    try {
      const request: BaseRequest = {
        mode: 9, // Mode 9: Toggle Active Status
        actionBy: "WebApp",
        parameters: {
          CompanyID: companyId,
        },
      };

      const response = await api.post("/Master/company", request);

      if (response.data.success) {
        const isActive = response.data.IsActive;
        toast.success(isActive ? "Company activated successfully" : "Company deactivated successfully");
        return true;
      } else {
        toast.error(response.data.message || "Failed to toggle company status");
        return false;
      }
    } catch (error) {
      toast.error("Error toggling company status");
      console.error("Error toggling company status:", error);
      return false;
    }
  },

  async getCompaniesForDropdown(activeOnly: boolean = false): Promise<Company[]> {
    try {
      const request: BaseRequest = {
        mode: 10, // Mode 10: Get Companies for Dropdown
        actionBy: "WebApp",
        parameters: {
          IsActive: activeOnly ? 1 : null,
        },
      };

      const response = await api.post("/Master/company", request);

      if (response.data.success) {
        return response.data.data || [];
      } else {
        console.error("Failed to fetch companies for dropdown:", response.data.message);
        return [];
      }
    } catch (error) {
      console.error("Error fetching companies for dropdown:", error);
      return [];
    }
  },
};
