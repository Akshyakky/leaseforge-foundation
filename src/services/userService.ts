// src/services/UserService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface User {
  UserID: number;
  UserName: string;
  UserFullName: string;
  PhoneNo?: string;
  EmailID: string;
  DepartmentID?: number;
  RoleID?: number;
  IsActive: boolean;
  // Updated to support new company structure
  DefaultCompanyID?: number;
  DefaultCompanyName?: string;
  DepartmentName?: string;
  RoleName?: string;
}

export interface UserCompany {
  CompanyID: number;
  CompanyName: string;
  IsDefault: boolean;
}

/**
 * Service for user-related operations
 */
class UserService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/user");
  }

  /**
   * Get all active users
   * @returns Array of users
   */
  async getAllUsers(): Promise<User[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Users
      parameters: {},
    };

    const response = await this.execute<User[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a user by ID
   * @param userId - The ID of the user to fetch
   * @returns The user object and their companies or null if not found
   */
  async getUserById(userId: number): Promise<{ user: User | null; companies: UserCompany[] }> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch User by ID
      parameters: {
        UserID: userId,
      },
    };

    const response = await this.execute<any>(request);

    // The first result set contains user data
    const user = response.success && response.table1 && response.table1.length > 0 ? response.table1[0] : null;

    // The second result set contains company data
    const companies = response.table2 && response.table2.length > 0 ? response.table2 : [];

    return { user, companies };
  }

  /**
   * Get companies assigned to a user
   * @param userId - The ID of the user
   * @returns JSON string of companies
   */
  async getUserCompanies(userId: number): Promise<UserCompany[]> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Companies for JSON output
      parameters: {
        UserID: userId,
      },
    };

    const response = await this.execute<{ CompaniesJSON: string }>(request);

    if (response.success && response.data && response.data.CompaniesJSON) {
      return JSON.parse(response.data.CompaniesJSON);
    }

    return [];
  }

  /**
   * Create a new user
   * @param user - The user data to create
   * @param companies - The companies to assign to the user
   * @returns true if successful, false otherwise
   */
  async createUser(user: Partial<User>, companies: UserCompany[]): Promise<boolean> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New User
      parameters: {
        ...user,
        CompaniesJSON: JSON.stringify(companies),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("User created successfully");
    }

    return response.success;
  }

  /**
   * Update an existing user
   * @param user - The user data to update
   * @param companies - The companies to assign to the user, or null to not update companies
   * @returns true if successful, false otherwise
   */
  async updateUser(user: Partial<User>, companies?: UserCompany[]): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing User
      parameters: {
        ...user,
        // Only include CompaniesJSON if companies were provided
        ...(companies ? { CompaniesJSON: JSON.stringify(companies) } : {}),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("User updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a user
   * @param userId - The ID of the user to delete
   * @returns true if successful, false otherwise
   */
  async deleteUser(userId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete User
      parameters: {
        UserID: userId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("User deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for users
   * @param searchText - Text to search for in user fields
   * @returns Array of matching users
   */
  async searchUsers(searchText: string): Promise<User[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Users
      parameters: {
        SearchText: searchText,
      },
    };

    const response = await this.execute<User[]>(request);
    return response.success ? response.data || [] : [];
  }
}

// Export a singleton instance
export const userService = new UserService();
