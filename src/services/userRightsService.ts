// src/services/UserRightsService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface UserRight {
  UserRightID: number;
  CompanyID?: number;
  UserID?: number;
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
}

export interface AccessRights {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canPrint: boolean;
}

/**
 * Service for user rights and permissions
 */
class UserRightsService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/userrights");
  }

  /**
   * Get rights for a specific user
   * @param userId - The user ID
   * @returns Array of user rights
   */
  async getUserRights(userId: number): Promise<UserRight[]> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Get User Rights
      actionBy: "WebApp",
      parameters: {
        UserID: userId,
      },
    };

    const response = await this.execute<UserRight[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get rights for a specific role
   * @param roleId - The role ID
   * @returns Array of user rights
   */
  async getRoleRights(roleId: number): Promise<UserRight[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get User Rights by Role ID
      actionBy: "WebApp",
      parameters: {
        RoleID: roleId,
      },
    };

    const response = await this.execute<UserRight[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Save user-specific rights
   * @param userRights - Array of user rights to save
   * @returns true if successful, false otherwise
   */
  async saveUserRights(userRights: UserRight[]): Promise<boolean> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Save User Rights
      actionBy: "WebApp",
      parameters: {
        UserRights: userRights,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("User rights saved successfully");
    }

    return response.success;
  }

  /**
   * Save role-specific rights
   * @param roleId - The role ID
   * @param userRights - Array of rights to save for the role
   * @returns true if successful, false otherwise
   */
  async saveRoleRights(roleId: number, userRights: UserRight[]): Promise<boolean> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Save Role Rights
      actionBy: "WebApp",
      parameters: {
        RoleID: roleId,
        UserRights: userRights,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Role rights saved successfully");
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
  async checkAccess(userId: number, menuId: number, subMenuId?: number): Promise<AccessRights> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Check Access
      actionBy: "WebApp",
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
      canView: false,
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canExport: false,
      canPrint: false,
    };
  }
}

// Export a singleton instance
export const userRightsService = new UserRightsService();
