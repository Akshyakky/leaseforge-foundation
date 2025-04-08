// src/services/deductionService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface Deduction {
  DeductionID: number;
  DeductionCode: string;
  DeductionName: string;
  DeductionType?: string;
  DeductionValue: number;
  DeductionDescription?: string;
  IsActive: boolean;
  EffectiveFromDate?: Date | string;
  ExpiryDate?: Date | string;
  ApplicableOn?: string;
  Remark?: string;
  
  // Audit fields
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
  DeletedBy?: string;
  DeletedOn?: string;
}

/**
 * Service for deduction-related operations
 */
class DeductionService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/deduction");
  }

  /**
   * Get all deductions
   * @returns Array of deductions
   */
  async getAllDeductions(): Promise<Deduction[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Deductions
      parameters: {},
    };

    const response = await this.execute<Deduction[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a deduction by ID
   * @param deductionId - The ID of the deduction to fetch
   * @returns The deduction object or null if not found
   */
  async getDeductionById(deductionId: number): Promise<Deduction | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Deduction by ID
      parameters: {
        DeductionID: deductionId,
      },
    };

    const response = await this.execute<Deduction[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new deduction
   * @param deduction - The deduction data to create
   * @returns The created deduction ID if successful, null otherwise
   */
  async createDeduction(deduction: Partial<Deduction>): Promise<number | null> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Deduction
      parameters: {
        DeductionCode: deduction.DeductionCode,
        DeductionName: deduction.DeductionName,
        DeductionType: deduction.DeductionType,
        DeductionValue: deduction.DeductionValue,
        DeductionDescription: deduction.DeductionDescription,
        IsActive: deduction.IsActive !== undefined ? deduction.IsActive : true,
        EffectiveFromDate: deduction.EffectiveFromDate,
        ExpiryDate: deduction.ExpiryDate,
        ApplicableOn: deduction.ApplicableOn,
        Remark: deduction.Remark,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Deduction created successfully");
      return response.NewDeductionID || null;
    }

    return null;
  }

  /**
   * Update an existing deduction
   * @param deduction - The deduction data to update
   * @returns true if successful, false otherwise
   */
  async updateDeduction(deduction: Partial<Deduction> & { DeductionID: number }): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Deduction
      parameters: {
        DeductionID: deduction.DeductionID,
        DeductionCode: deduction.DeductionCode,
        DeductionName: deduction.DeductionName,
        DeductionType: deduction.DeductionType,
        DeductionValue: deduction.DeductionValue,
        DeductionDescription: deduction.DeductionDescription,
        IsActive: deduction.IsActive,
        EffectiveFromDate: deduction.EffectiveFromDate,
        ExpiryDate: deduction.ExpiryDate,
        ApplicableOn: deduction.ApplicableOn,
        Remark: deduction.Remark,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Deduction updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a deduction
   * @param deductionId - The ID of the deduction to delete
   * @returns true if successful, false otherwise
   */
  async deleteDeduction(deductionId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Deduction
      parameters: {
        DeductionID: deductionId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Deduction deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for deductions
   * @param searchText - Text to search for in deduction fields
   * @param filters - Optional filters for the search
   * @returns Array of matching deductions
   */
  async searchDeductions(
    searchText?: string,
    filters?: {
      isActive?: boolean;
      fromDate?: Date | string;
      toDate?: Date | string;
      deductionType?: string;
    }
  ): Promise<Deduction[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Deductions
      parameters: {
        SearchText: searchText,
        FilterIsActive: filters?.isActive,
        FilterFromDate: filters?.fromDate,
        FilterToDate: filters?.toDate,
        FilterDeductionType: filters?.deductionType,
      },
    };

    const response = await this.execute<Deduction[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Toggle active status of a deduction
   * @param deductionId - The ID of the deduction
   * @returns true if successful, false otherwise, and the new status
   */
  async toggleDeductionStatus(deductionId: number): Promise<{ success: boolean; isActive?: boolean }> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Toggle Active Status
      parameters: {
        DeductionID: deductionId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      const isActive = response.IsActive;
      this.showSuccess(isActive ? "Deduction activated successfully" : "Deduction deactivated successfully");
      return { success: true, isActive };
    }

    return { success: false };
  }

  /**
   * Get deduction types for dropdown
   * @returns Array of distinct deduction types
   */
  async getDeductionTypes(): Promise<string[]> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Deduction Types (for dropdown)
      parameters: {},
    };

    const response = await this.execute<string[]>(request, false);
    return response.success ? response.data || [] : [];
  }
}

// Export a singleton instance
export const deductionService = new DeductionService();