// src/services/companyService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";

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

/**
 * Service for company-related operations
 */
class CompanyService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/company");
  }

  /**
   * Get all companies
   * @returns Array of companies
   */
  async getAllCompanies(): Promise<Company[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Companies
      parameters: {},
    };

    const response = await this.execute<Company[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a company by ID
   * @param companyId - The ID of the company to fetch
   * @returns The company object or null if not found
   */
  async getCompanyById(companyId: number): Promise<Company | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Company by ID
      parameters: {
        CompanyID: companyId,
      },
    };

    const response = await this.execute<Company[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new company
   * @param company - The company data to create
   * @returns true if successful, false otherwise
   */
  async createCompany(company: Partial<Company>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Company
      parameters: {
        ...company,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Company created successfully");
    }

    return response.success;
  }

  /**
   * Update an existing company
   * @param company - The company data to update
   * @returns true if successful, false otherwise
   */
  async updateCompany(company: Partial<Company>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Company
      parameters: {
        ...company,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Company updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a company
   * @param companyId - The ID of the company to delete
   * @returns true if successful, false otherwise
   */
  async deleteCompany(companyId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Company
      parameters: {
        CompanyID: companyId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Company deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for companies
   * @param searchText - Text to search for in company fields
   * @returns Array of matching companies
   */
  async searchCompanies(searchText: string): Promise<Company[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Companies
      parameters: {
        SearchText: searchText,
      },
    };

    const response = await this.execute<Company[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get users in a company
   * @param companyId - The company ID
   * @returns Array of users
   */
  async getCompanyUsers(companyId: number): Promise<CompanyUser[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Users by Company
      parameters: {
        CompanyID: companyId,
      },
    };

    const response = await this.execute<CompanyUser[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get company statistics
   * @param companyId - The company ID
   * @returns Company statistics, department and role distribution
   */
  async getCompanyStatistics(companyId?: number): Promise<{
    companyStats?: CompanyStatistics;
    departmentDistribution?: DepartmentDistribution[];
    roleDistribution?: RoleDistribution[];
  }> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Company Statistics
      parameters: {
        CompanyID: companyId,
      },
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        companyStats: response.table1?.[0],
        departmentDistribution: response.table2 || [],
        roleDistribution: response.table3 || [],
      };
    }

    return {};
  }

  /**
   * Toggle company active status
   * @param companyId - The ID of the company
   * @returns true if successful, false otherwise
   */
  async toggleCompanyStatus(companyId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Toggle Active Status
      parameters: {
        CompanyID: companyId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      const isActive = response.IsActive;
      this.showSuccess(isActive ? "Company activated successfully" : "Company deactivated successfully");
    }

    return response.success;
  }

  /**
   * Get companies for dropdown
   * @param activeOnly - Whether to fetch only active companies
   * @returns Array of companies for dropdown
   */
  async getCompaniesForDropdown(activeOnly: boolean = false): Promise<Company[]> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Get Companies for Dropdown
      parameters: {
        IsActive: activeOnly ? 1 : null,
      },
    };

    const response = await this.execute<Company[]>(request, false);
    return response.success ? response.data || [] : [];
  }
}

// Export a singleton instance
export const companyService = new CompanyService();
