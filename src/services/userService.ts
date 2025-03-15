// src/services/UserService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface User {
  UserID: number;
  CompID?: number;
  UserName: string;
  UserFullName: string;
  PhoneNo?: string;
  EmailID: string;
  DepartmentID?: number;
  RoleID?: number;
  IsActive: boolean;
  CompanyName?: string;
  DepartmentName?: string;
  RoleName?: string;
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
      actionBy: "WebApp",
      parameters: {},
    };

    const response = await this.execute<User[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a user by ID
   * @param userId - The ID of the user to fetch
   * @returns The user object or null if not found
   */
  async getUserById(userId: number): Promise<User | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch User by ID
      actionBy: "WebApp",
      parameters: {
        UserID: userId,
      },
    };

    const response = await this.execute<User[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new user
   * @param user - The user data to create
   * @returns true if successful, false otherwise
   */
  async createUser(user: Partial<User>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New User
      actionBy: "WebApp",
      parameters: {
        ...user,
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
   * @returns true if successful, false otherwise
   */
  async updateUser(user: Partial<User>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing User
      actionBy: "WebApp",
      parameters: {
        ...user,
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
      actionBy: "WebApp",
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
      actionBy: "WebApp",
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
