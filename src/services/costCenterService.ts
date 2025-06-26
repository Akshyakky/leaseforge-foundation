// src/services/costCenterService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import { ApiResponse, CostCenter1, CostCenter2, CostCenter3, CostCenter4, CostCenterHierarchy, CostCenterRequest } from "../types/costCenterTypes";

/**
 * Service for cost center-related operations
 */
class CostCenterService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/costCenter");
  }

  /**
   * Create a new cost center
   * @param data - The cost center data
   * @returns API response with status and message
   */
  async createCostCenter(data: CostCenterRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Cost Center
      parameters: {
        CostCenter1ID: data.CostCenter1ID,
        CostCenter2ID: data.CostCenter2ID,
        CostCenter3ID: data.CostCenter3ID,
        CostCenter4ID: data.CostCenter4ID,
        Description: data.Description,
        Level: data.Level,
        CurrentUserID: data.CurrentUserID,
        CurrentUserName: data.CurrentUserName,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(response.message || "Cost center created successfully");
      return {
        Status: 1,
        Message: response.message || "Cost center created successfully",
        NewCostCenterID: response.NewCostCenterID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create cost center",
    };
  }

  /**
   * Update an existing cost center
   * @param data - The cost center data with ID
   * @returns API response with status and message
   */
  async updateCostCenter(data: CostCenterRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Cost Center
      parameters: {
        CostCenter1ID: data.CostCenter1ID,
        CostCenter2ID: data.CostCenter2ID,
        CostCenter3ID: data.CostCenter3ID,
        CostCenter4ID: data.CostCenter4ID,
        Description: data.Description,
        Level: data.Level,
        CurrentUserID: data.CurrentUserID,
        CurrentUserName: data.CurrentUserName,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(response.message || "Cost center updated successfully");
      return {
        Status: 1,
        Message: response.message || "Cost center updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update cost center",
    };
  }

  /**
   * Get all cost centers by level
   * @param level - The cost center level (1-4)
   * @param parentId - Optional parent ID for filtering (for levels 2-4)
   * @returns Array of cost centers for the specified level
   */
  async getCostCentersByLevel(
    level: number,
    parentId?: {
      CostCenter1ID?: number;
      CostCenter2ID?: number;
      CostCenter3ID?: number;
    }
  ): Promise<CostCenter1[] | CostCenter2[] | CostCenter3[] | CostCenter4[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Cost Centers by Level
      parameters: {
        Level: level,
        ...parentId,
      },
    };

    const response = await this.execute(request);
    return response.success && response.data ? response.data : [];
  }

  /**
   * Get a specific cost center by ID and level
   * @param level - The cost center level (1-4)
   * @param id - The cost center ID
   * @returns Cost center object or null if not found
   */
  async getCostCenterById(level: number, id: number): Promise<CostCenter1 | CostCenter2 | CostCenter3 | CostCenter4 | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Cost Center by ID
      parameters: {
        Level: level,
        [`CostCenter${level}ID`]: id,
      },
    };

    const response = await this.execute(request);

    if (response.success && response.data && response.data.length > 0) {
      return response.data[0];
    }

    return null;
  }

  /**
   * Delete a cost center by ID and level
   * @param level - The cost center level (1-4)
   * @param id - The cost center ID
   * @param currentUserName - Name of the user performing the action
   * @returns API response with status and message
   */
  async deleteCostCenter(level: number, id: number, currentUserName: string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Cost Center
      parameters: {
        Level: level,
        [`CostCenter${level}ID`]: id,
        CurrentUserName: currentUserName,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(response.message || "Cost center deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Cost center deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete cost center",
    };
  }

  /**
   * Search for cost centers
   * @param level - The cost center level (1-4)
   * @param searchText - Text to search for
   * @param parentId - Optional parent ID for filtering (for levels 2-4)
   * @returns Array of matching cost centers
   */
  async searchCostCenters(
    level: number,
    searchText: string,
    parentId?: {
      CostCenter1ID?: number;
      CostCenter2ID?: number;
      CostCenter3ID?: number;
    }
  ): Promise<CostCenter1[] | CostCenter2[] | CostCenter3[] | CostCenter4[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Cost Centers
      parameters: {
        Level: level,
        SearchText: searchText,
        ...parentId,
      },
    };

    const response = await this.execute(request);
    return response.success && response.data ? response.data : [];
  }

  /**
   * Get child cost centers for a specific parent
   * @param level - The child cost center level (2-4)
   * @param parentId - Parent ID information
   * @returns Array of child cost centers
   */
  async getChildCostCenters(
    level: number,
    parentId: {
      CostCenter1ID?: number;
      CostCenter2ID?: number;
      CostCenter3ID?: number;
    }
  ): Promise<CostCenter2[] | CostCenter3[] | CostCenter4[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Child Cost Centers
      parameters: {
        Level: level,
        ...parentId,
      },
    };

    const response = await this.execute(request);
    return response.success && response.data ? response.data : [];
  }

  /**
   * Get the complete cost center hierarchy
   * @returns Array of cost center hierarchy items
   */
  async getCostCenterHierarchy(): Promise<CostCenterHierarchy[]> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Cost Center Hierarchy
      parameters: {},
    };

    const response = await this.execute(request);
    return response.success && response.data ? response.data : [];
  }
}

// Export a singleton instance
export const costCenterService = new CostCenterService();
