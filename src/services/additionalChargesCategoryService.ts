// src/services/additionalChargesCategoryService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface ChargesCategory {
  ChargesCategoryID: number;
  ChargesCategoryCode: string;
  ChargesCategoryName: string;
  Description?: string;
  IsActive: boolean;
  ChargesCount?: number; // For Mode 7
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
  DeletedBy?: string;
  DeletedOn?: string;
}

/**
 * Service for additional charges category operations
 */
class AdditionalChargesCategoryService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/additionalchargescategory");
  }

  /**
   * Get all charges categories
   * @returns Array of charges categories
   */
  async getAllCategories(): Promise<ChargesCategory[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Charges Categories
      parameters: {},
    };

    const response = await this.execute<ChargesCategory[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a charges category by ID
   * @param categoryId - The ID of the charges category to fetch
   * @returns The charges category object or null if not found
   */
  async getCategoryById(categoryId: number): Promise<ChargesCategory | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Charges Category by ID
      parameters: {
        ChargesCategoryID: categoryId,
      },
    };

    const response = await this.execute<ChargesCategory[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new charges category
   * @param category - The charges category data to create
   * @returns The created charges category ID if successful, null otherwise
   */
  async createCategory(category: Partial<ChargesCategory>): Promise<number | null> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Charges Category
      parameters: {
        ChargesCategoryCode: category.ChargesCategoryCode,
        ChargesCategoryName: category.ChargesCategoryName,
        Description: category.Description,
        IsActive: category.IsActive !== undefined ? category.IsActive : true,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Charges category created successfully");
      return response.NewCategoryID || null;
    }

    return null;
  }

  /**
   * Update an existing charges category
   * @param category - The charges category data to update
   * @returns true if successful, false otherwise
   */
  async updateCategory(category: Partial<ChargesCategory> & { ChargesCategoryID: number }): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Charges Category
      parameters: {
        ChargesCategoryID: category.ChargesCategoryID,
        ChargesCategoryCode: category.ChargesCategoryCode,
        ChargesCategoryName: category.ChargesCategoryName,
        Description: category.Description,
        IsActive: category.IsActive,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Charges category updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a charges category
   * @param categoryId - The ID of the charges category to delete
   * @returns true if successful, false otherwise
   */
  async deleteCategory(categoryId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Charges Category
      parameters: {
        ChargesCategoryID: categoryId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Charges category deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for charges categories
   * @param searchText - Text to search for in charges category fields
   * @returns Array of matching charges categories
   */
  async searchCategories(searchText: string): Promise<ChargesCategory[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Charges Categories
      parameters: {
        SearchText: searchText,
      },
    };

    const response = await this.execute<ChargesCategory[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get charges categories with charge counts
   * @returns Array of charges categories with charge counts
   */
  async getCategoriesWithCounts(): Promise<ChargesCategory[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Category Details with Charge Count
      parameters: {},
    };

    const response = await this.execute<ChargesCategory[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Toggle active status of a charges category
   * @param categoryId - The ID of the charges category
   * @returns true if successful, false otherwise, and the new status
   */
  async toggleCategoryStatus(categoryId: number): Promise<{ success: boolean; isActive?: boolean }> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Toggle Active Status
      parameters: {
        ChargesCategoryID: categoryId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      const isActive = response.IsActive;
      this.showSuccess(isActive ? "Charges category activated successfully" : "Charges category deactivated successfully");
      return { success: true, isActive };
    }

    return { success: false };
  }
}

// Export a singleton instance
export const additionalChargesCategoryService = new AdditionalChargesCategoryService();
