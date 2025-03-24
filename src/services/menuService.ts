// src/services/MenuService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface MenuItem {
  MenuID: number;
  MenuName: string;
  MenuPath: string;
  MenuIcon: string;
  SequenceNo: number;
  subMenus?: SubMenuItem[];
}

export interface SubMenuItem {
  SubMenuID: number;
  MenuID: number;
  SubMenuName: string;
  SubMenuPath: string;
  SubMenuIcon: string;
  SequenceNo: number;
}

/**
 * Service for menu-related operations
 */
class MenuService extends BaseService {
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
    const request: BaseRequest = {
      mode: 13, // Mode 13: Get Authorized Menu with SubMenus for a User
      parameters: {
        CurrentUserID: userId,
      },
    };

    const response = await this.execute(request, false);

    if (response.success) {
      const menus: MenuItem[] = response.table1 || [];
      const subMenus: SubMenuItem[] = response.table2 || [];

      // Group submenus under their parent menus
      return this.groupSubMenus(menus, subMenus);
    }

    return [];
  }

  /**
   * Get all menus and submenus (for system administration purposes)
   * @returns Array of menu items with their submenus
   */
  async getAllMenus(): Promise<MenuItem[]> {
    const request: BaseRequest = {
      mode: 12, // Mode 12: Get Menu with SubMenus
      parameters: {},
    };

    const response = await this.execute(request, false);

    if (response.success) {
      const menus: MenuItem[] = response.table1 || [];
      const subMenus: SubMenuItem[] = response.table2 || [];

      // Group submenus under their parent menus
      return this.groupSubMenus(menus, subMenus);
    }

    return [];
  }

  /**
   * Helper method to group submenus under their parent menus
   * @param menus - Array of menus
   * @param subMenus - Array of submenus
   * @returns Menus with nested submenus
   */
  private groupSubMenus(menus: MenuItem[], subMenus: SubMenuItem[]): MenuItem[] {
    return menus.map((menu) => ({
      ...menu,
      subMenus: subMenus.filter((sub) => sub.MenuID === menu.MenuID),
    }));
  }
}

// Export a singleton instance
export const menuService = new MenuService();
