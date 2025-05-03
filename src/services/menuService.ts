// src/services/MenuService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface MenuItem {
  MenuID: number;
  MenuName: string;
  MenuPath: string | null;
  MenuIcon: string | null;
  SequenceNo: number;
  // Permission properties from Mode 14
  CanView?: boolean;
  CanAdd?: boolean;
  CanEdit?: boolean;
  CanDelete?: boolean;
  CanExport?: boolean;
  CanPrint?: boolean;
  subMenus?: SubMenuItem[];
}

export interface SubMenuItem {
  SubMenuID: number;
  MenuID: number;
  SubMenuName: string;
  SubMenuPath: string | null;
  SubMenuIcon: string | null;
  SequenceNo: number;
  // Permission properties from Mode 14
  CanView?: boolean;
  CanAdd?: boolean;
  CanEdit?: boolean;
  CanDelete?: boolean;
  CanExport?: boolean;
  CanPrint?: boolean;
}

/**
 * Service for menu-related operations
 */
class MenuService extends BaseService {
  // Cache for menu items to improve performance
  private menuCache: Map<string, { data: MenuItem[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor() {
    // Pass the endpoint to the base service
    super("/Master/menu");
  }

  /**
   * Get menus and submenus authorized for a specific user
   * @param userId - The user ID
   * @returns Array of menu items with their submenus
   */
  async getUserMenus(userId: number): Promise<MenuItem[]> {
    const cacheKey = `user-${userId}`;

    // Check cache first
    const cachedData = this.menuCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_DURATION) {
      return cachedData.data;
    }

    const request: BaseRequest = {
      mode: 13, // Mode 13: Get Authorized Menu with SubMenus for a User
      parameters: {
        CurrentUserID: userId,
      },
    };

    try {
      const response = await this.execute(request, false);

      if (response.success && response.table1) {
        const menus: MenuItem[] = response.table1 || [];
        const subMenus: SubMenuItem[] = response.table2 || [];

        // Group submenus under their parent menus
        const result = this.groupSubMenus(menus, subMenus);

        // Update cache
        this.menuCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      return [];
    } catch (error) {
      console.error("Error fetching user menus:", error);
      return [];
    }
  }

  /**
   * Get all menus and submenus (for system administration purposes)
   * @returns Array of menu items with their submenus
   */
  async getAllMenus(): Promise<MenuItem[]> {
    const cacheKey = "all-menus";

    // Check cache first
    const cachedData = this.menuCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_DURATION) {
      return cachedData.data;
    }

    const request: BaseRequest = {
      mode: 12, // Mode 12: Get Menu with SubMenus
      parameters: {},
    };

    try {
      const response = await this.execute(request, false);

      if (response.success && response.table1) {
        const menus: MenuItem[] = response.table1 || [];
        const subMenus: SubMenuItem[] = response.table2 || [];

        // Group submenus under their parent menus
        const result = this.groupSubMenus(menus, subMenus);

        // Update cache
        this.menuCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      return [];
    } catch (error) {
      console.error("Error fetching all menus:", error);
      return [];
    }
  }

  /**
   * Get all menus and submenus with permission details for a role
   * Useful for permission management screens
   * @param roleId - The role ID
   * @returns Array of menu items with permissions and their submenus
   */
  async getMenusWithPermissions(roleId: number): Promise<MenuItem[]> {
    const cacheKey = `permissions-${roleId}`;

    // Check cache first
    const cachedData = this.menuCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_DURATION) {
      return cachedData.data;
    }

    const request: BaseRequest = {
      mode: 14, // Mode 14: Get Menu/SubMenu Structure with Role Permissions
      parameters: {
        CurrentUserID: roleId, // In this case, CurrentUserID param is used for roleId
      },
    };

    try {
      const response = await this.execute(request, false);

      if (response.success && response.table1) {
        const menus: MenuItem[] = response.table1 || [];
        const subMenus: SubMenuItem[] = response.table2 || [];

        // Group submenus under their parent menus
        const result = this.groupSubMenus(menus, subMenus);

        // Update cache
        this.menuCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      return [];
    } catch (error) {
      console.error("Error fetching menus with permissions:", error);
      return [];
    }
  }

  /**
   * Clear the menu cache, useful when menu structure changes
   */
  clearCache(): void {
    this.menuCache.clear();
  }

  /**
   * Helper method to group submenus under their parent menus
   * @param menus - Array of menus
   * @param subMenus - Array of submenus
   * @returns Menus with nested submenus
   */
  private groupSubMenus(menus: MenuItem[], subMenus: SubMenuItem[]): MenuItem[] {
    return menus
      .map((menu) => ({
        ...menu,
        subMenus: subMenus.filter((sub) => sub.MenuID === menu.MenuID).sort((a, b) => a.SequenceNo - b.SequenceNo), // Sort by sequence number
      }))
      .sort((a, b) => a.SequenceNo - b.SequenceNo); // Sort menus by sequence number
  }
}

// Export a singleton instance
export const menuService = new MenuService();
