// src/services/departmentService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import { toast } from "sonner";

export interface Department {
  DepartmentID: number;
  DepartmentName: string;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

/**
 * Service for department-related operations
 */
class DepartmentService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/department");
  }

  /**
   * Get all departments
   * @returns Array of departments
   */
  async getAllDepartments(): Promise<Department[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Departments
      parameters: {},
    };

    const response = await this.execute<Department[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a department by ID
   * @param departmentId - The ID of the department to fetch
   * @returns The department object or null if not found
   */
  async getDepartmentById(departmentId: number): Promise<Department | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Department by ID
      parameters: {
        DepartmentID: departmentId,
      },
    };

    const response = await this.execute<Department[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new department
   * @param department - The department data to create
   * @returns true if successful, false otherwise
   */
  async createDepartment(department: Partial<Department>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Department
      parameters: {
        DepartmentName: department.DepartmentName,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Department created successfully");
    }

    return response.success;
  }

  /**
   * Update an existing department
   * @param department - The department data to update
   * @returns true if successful, false otherwise
   */
  async updateDepartment(department: Partial<Department>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Department
      parameters: {
        DepartmentID: department.DepartmentID,
        DepartmentName: department.DepartmentName,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Department updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a department
   * @param departmentId - The ID of the department to delete
   * @returns true if successful, false otherwise
   */
  async deleteDepartment(departmentId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Department
      parameters: {
        DepartmentID: departmentId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Department deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for departments
   * @param searchText - Text to search for in department fields
   * @returns Array of matching departments
   */
  async searchDepartments(searchText: string): Promise<Department[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Departments
      parameters: {
        SearchText: searchText,
      },
    };

    const response = await this.execute<Department[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get users in a department
   * @param departmentId - The department ID
   * @returns Array of users
   */
  async getDepartmentUsers(departmentId: number): Promise<any[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Users by Department
      parameters: {
        DepartmentID: departmentId,
      },
    };

    const response = await this.execute<any[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get department statistics
   * @param departmentId - The department ID
   * @returns Department statistics and role distribution
   */
  async getDepartmentStatistics(departmentId?: number): Promise<{
    departmentStats?: any[];
    roleDistribution?: any[];
  }> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Department Statistics
      parameters: {
        DepartmentID: departmentId,
      },
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        departmentStats: response.table1 || [],
        roleDistribution: response.table2 || [],
      };
    }

    return {};
  }
}

// Export a singleton instance
export const departmentService = new DepartmentService();
