// src/services/roleRightsService.ts
import { BaseService, BaseRequest } from "./BaseService";
import { toast } from "sonner";

export interface RoleRight {
  RoleRightID: number;
  CompanyID?: number;
  RoleID?: number;
  MenuID: number;
  SubMenuID?: number;
  CanView: boolean;
  CanAdd: boolean;
  CanEdit: boolean;
  CanDelete: boolean;
  CanExport: boolean;
  CanPrint: boolean;
  MenuName?: string;
  SubMenuName?: string;
  CompanyName?: string;
  RoleName?: string;
}

export interface AccessRights {
  HasAccess: boolean;
  CanView: boolean;
  CanAdd: boolean;
  CanEdit: boolean;
  CanDelete: boolean;
  CanExport: boolean;
  CanPrint: boolean;
}

/**
 * Service for role rights and permissions
 */
class RoleRightsService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/rolerights");
  }

  /**
   * Get all role rights
   * @returns Array of role rights
   */
  async getAllRoleRights(): Promise<RoleRight[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Role Rights
      parameters: {},
    };

    const response = await this.execute<RoleRight[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a role right by ID
   * @param roleRightId - The ID of the role right to fetch
   * @returns The role right object or null if not found
   */
  async getRoleRightById(roleRightId: number): Promise<RoleRight | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Role Right by ID
      parameters: {
        RoleRightID: roleRightId,
      },
    };

    const response = await this.execute<RoleRight[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new role right
   * @param roleRight - The role right data to create
   * @returns true if successful, false otherwise
   */
  async createRoleRight(roleRight: Partial<RoleRight>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Role Right
      parameters: {
        CompanyID: roleRight.CompanyID,
        RoleID: roleRight.RoleID,
        MenuID: roleRight.MenuID,
        SubMenuID: roleRight.SubMenuID,
        CanView: roleRight.CanView,
        CanAdd: roleRight.CanAdd,
        CanEdit: roleRight.CanEdit,
        CanDelete: roleRight.CanDelete,
        CanExport: roleRight.CanExport,
        CanPrint: roleRight.CanPrint,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Role right created successfully");
    }

    return response.success;
  }

  /**
   * Update an existing role right
   * @param roleRight - The role right data to update
   * @returns true if successful, false otherwise
   */
  async updateRoleRight(roleRight: Partial<RoleRight>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Role Right
      parameters: {
        RoleRightID: roleRight.RoleRightID,
        CompanyID: roleRight.CompanyID,
        RoleID: roleRight.RoleID,
        MenuID: roleRight.MenuID,
        SubMenuID: roleRight.SubMenuID,
        CanView: roleRight.CanView,
        CanAdd: roleRight.CanAdd,
        CanEdit: roleRight.CanEdit,
        CanDelete: roleRight.CanDelete,
        CanExport: roleRight.CanExport,
        CanPrint: roleRight.CanPrint,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Role right updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a role right
   * @param roleRightId - The ID of the role right to delete
   * @returns true if successful, false otherwise
   */
  async deleteRoleRight(roleRightId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Role Right
      parameters: {
        RoleRightID: roleRightId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Role right deleted successfully");
    }

    return response.success;
  }

  /**
   * Get rights for a specific role
   * @param roleId - The role ID
   * @returns Array of role rights
   */
  async getRoleRightsByRoleId(roleId: number): Promise<RoleRight[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Get Role Rights by Role ID
      parameters: {
        RoleID: roleId,
      },
    };

    const response = await this.execute<RoleRight[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Update multiple rights for a role
   * @param roleId - The role ID
   * @param companyId - The company ID
   * @param menuId - The menu ID
   * @param permissions - Object containing permission flags
   * @returns true if successful, false otherwise
   */
  async updateMultipleRights(
    roleId: number,
    companyId: number,
    menuId: number,
    permissions: {
      CanView?: boolean;
      CanAdd?: boolean;
      CanEdit?: boolean;
      CanDelete?: boolean;
      CanExport?: boolean;
      CanPrint?: boolean;
    }
  ): Promise<boolean> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Update Multiple Rights for Role
      parameters: {
        RoleID: roleId,
        CompanyID: companyId,
        MenuID: menuId,
        ...permissions,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Role rights updated successfully");
    }

    return response.success;
  }

  /**
   * Clone role rights from one role to another
   * @param sourceRoleId - Source role ID
   * @param targetRoleId - Target role ID
   * @returns true if successful, false otherwise
   */
  async cloneRoleRights(sourceRoleId: number, targetRoleId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Clone Role Rights
      parameters: {
        RoleID: sourceRoleId,
        CompanyID: targetRoleId, // The stored procedure reuses CompanyID for target role ID
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Role rights cloned successfully");
    }

    return response.success;
  }

  /**
   * Check if a user has specific access to a menu/submenu
   * @param userId - The user ID
   * @param menuId - The menu ID
   * @param subMenuId - Optional submenu ID
   * @returns Access rights object
   */
  async checkUserAccess(userId: number, menuId?: number, subMenuId?: number): Promise<AccessRights> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Check User Access to Menu/Submenu
      parameters: {
        UserID: userId,
        MenuID: menuId,
        SubMenuID: subMenuId,
      },
    };

    const response = await this.execute<AccessRights>(request, false);

    if (response.success && response.data) {
      return response.data;
    }

    return {
      HasAccess: false,
      CanView: false,
      CanAdd: false,
      CanEdit: false,
      CanDelete: false,
      CanExport: false,
      CanPrint: false,
    };
  }

  /**
   * Save multiple rights for a role
   * @param roleId - The role ID
   * @param roleRights - Array of role rights to save
   * @returns true if successful, false otherwise
   */
  async saveRoleRights(roleId: number, roleRights: RoleRight[]): Promise<boolean> {
    try {
      let success = true;

      // Process each right individually using updateMultipleRights
      for (const right of roleRights) {
        if (right.MenuID) {
          const result = await this.updateMultipleRights(
            roleId,
            right.CompanyID || 1, // Default company ID if not provided
            right.MenuID,
            {
              CanView: right.CanView,
              CanAdd: right.CanAdd,
              CanEdit: right.CanEdit,
              CanDelete: right.CanDelete,
              CanExport: right.CanExport,
              CanPrint: right.CanPrint,
            }
          );

          if (!result) {
            success = false;
          }
        }
      }

      if (success) {
        toast.success("Role permissions saved successfully");
      }

      return success;
    } catch (error) {
      console.error("Error saving role rights:", error);
      toast.error("Failed to save role permissions");
      return false;
    }
  }
}

// Export a singleton instance
export const roleRightsService = new RoleRightsService();
