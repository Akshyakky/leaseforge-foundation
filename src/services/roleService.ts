// src/services/roleService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface Role {
  RoleID: number;
  RoleName: string;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

/**
 * Service for role-related operations
 */
class RoleService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/userRole");
  }

  /**
   * Get all roles
   * @returns Array of roles
   */
  async getAllRoles(): Promise<Role[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Roles
      parameters: {},
    };

    const response = await this.execute<Role[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a role by ID
   * @param roleId - The ID of the role to fetch
   * @returns The role object or null if not found
   */
  async getRoleById(roleId: number): Promise<Role | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Role by ID
      parameters: {
        RoleID: roleId,
      },
    };

    const response = await this.execute<Role[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new role
   * @param role - The role data to create
   * @returns true if successful, false otherwise
   */
  async createRole(role: Partial<Role>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Role
      parameters: {
        RoleName: role.RoleName,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Role created successfully");
    }

    return response.success;
  }

  /**
   * Update an existing role
   * @param role - The role data to update
   * @returns true if successful, false otherwise
   */
  async updateRole(role: Partial<Role>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Role
      parameters: {
        RoleID: role.RoleID,
        RoleName: role.RoleName,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Role updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a role
   * @param roleId - The ID of the role to delete
   * @returns true if successful, false otherwise
   */
  async deleteRole(roleId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Role
      parameters: {
        RoleID: roleId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Role deleted successfully");
    }

    return response.success;
  }

  /**
   * Search roles
   * @param searchText - Text to search for in role names
   * @returns Array of matching roles
   */
  async searchRoles(searchText: string): Promise<Role[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Roles
      parameters: {
        SearchText: searchText,
      },
    };

    const response = await this.execute<Role[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get users associated with a role
   * @param roleId - The role ID
   * @returns Array of users
   */
  async getUsersByRole(roleId: number): Promise<any[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Users by Role
      parameters: {
        RoleID: roleId,
      },
    };

    const response = await this.execute<any[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Clone a role with a new name
   * @param sourceRoleId - Source role ID
   * @param newRoleName - New role name
   * @returns true if successful, false otherwise
   */
  async cloneRole(sourceRoleId: number, newRoleName: string): Promise<boolean> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Clone Role
      parameters: {
        RoleID: sourceRoleId,
        RoleName: newRoleName,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Role cloned successfully");
    }

    return response.success;
  }

  /**
   * Get role permissions
   * @param roleId - The role ID
   * @returns Array of permissions
   */
  async getRolePermissions(roleId: number): Promise<any[]> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Role Permissions
      parameters: {
        RoleID: roleId,
      },
    };

    const response = await this.execute<any[]>(request);
    return response.success ? response.data || [] : [];
  }
}

// Export a singleton instance
export const roleService = new RoleService();
