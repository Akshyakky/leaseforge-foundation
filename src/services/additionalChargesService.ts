// src/services/additionalChargesService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface Charge {
  ChargesID: number;
  ChargesCategoryID: number;
  ChargesCode: string;
  ChargesName: string;
  Description?: string;
  ChargeAmount: number;
  IsPercentage: boolean;
  PercentageValue?: number;
  ApplicableOn?: string;
  TaxID?: number;
  CurrencyID: number;
  IsActive: boolean;
  IsDeposit: boolean;
  EffectiveFromDate?: Date | string;
  ExpiryDate?: Date | string;

  // Joined fields
  ChargesCategoryName?: string;
  TaxName?: string;
  CurrencyName?: string;

  // Calculated field
  EffectiveAmount?: number;
  TaxRate?: number;

  // Audit fields
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
  DeletedBy?: string;
  DeletedOn?: string;
}

/**
 * Service for additional charges operations
 */
class AdditionalChargesService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/additionalcharges");
  }

  /**
   * Get all charges
   * @returns Array of charges
   */
  async getAllCharges(): Promise<Charge[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Charges
      parameters: {},
    };

    const response = await this.execute<Charge[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a charge by ID
   * @param chargeId - The ID of the charge to fetch
   * @returns The charge object or null if not found
   */
  async getChargeById(chargeId: number): Promise<Charge | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Charge by ID
      parameters: {
        ChargesID: chargeId,
      },
    };

    const response = await this.execute<Charge[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new charge
   * @param charge - The charge data to create
   * @returns The created charge ID if successful, null otherwise
   */
  async createCharge(charge: Partial<Charge>): Promise<number | null> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Charge
      parameters: {
        ChargesCategoryID: charge.ChargesCategoryID,
        ChargesCode: charge.ChargesCode,
        ChargesName: charge.ChargesName,
        Description: charge.Description,
        ChargeAmount: charge.ChargeAmount,
        IsPercentage: charge.IsPercentage,
        PercentageValue: charge.PercentageValue,
        ApplicableOn: charge.ApplicableOn,
        TaxID: charge.TaxID,
        CurrencyID: charge.CurrencyID,
        IsActive: charge.IsActive !== undefined ? charge.IsActive : true,
        IsDeposit: charge.IsDeposit !== undefined ? charge.IsDeposit : false,
        EffectiveFromDate: charge.EffectiveFromDate,
        ExpiryDate: charge.ExpiryDate,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Charge created successfully");
      return response.NewChargeID || null;
    }

    return null;
  }

  /**
   * Update an existing charge
   * @param charge - The charge data to update
   * @returns true if successful, false otherwise
   */
  async updateCharge(charge: Partial<Charge> & { ChargesID: number }): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Charge
      parameters: {
        ChargesID: charge.ChargesID,
        ChargesCategoryID: charge.ChargesCategoryID,
        ChargesCode: charge.ChargesCode,
        ChargesName: charge.ChargesName,
        Description: charge.Description,
        ChargeAmount: charge.ChargeAmount,
        IsPercentage: charge.IsPercentage,
        PercentageValue: charge.PercentageValue,
        ApplicableOn: charge.ApplicableOn,
        TaxID: charge.TaxID,
        CurrencyID: charge.CurrencyID,
        IsActive: charge.IsActive,
        IsDeposit: charge.IsDeposit,
        EffectiveFromDate: charge.EffectiveFromDate,
        ExpiryDate: charge.ExpiryDate,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Charge updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a charge
   * @param chargeId - The ID of the charge to delete
   * @returns true if successful, false otherwise
   */
  async deleteCharge(chargeId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Charge
      parameters: {
        ChargesID: chargeId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Charge deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for charges
   * @param searchText - Text to search for in charge fields
   * @param filters - Optional filters for the search
   * @returns Array of matching charges
   */
  async searchCharges(
    searchText?: string,
    filters?: {
      categoryId?: number;
      isActive?: boolean;
      isDeposit?: boolean;
      effectiveDate?: Date | string;
      expiryDate?: Date | string;
    }
  ): Promise<Charge[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Charges
      parameters: {
        SearchText: searchText,
        FilterCategoryID: filters?.categoryId,
        FilterIsActive: filters?.isActive,
        FilterIsDeposit: filters?.isDeposit,
        FilterEffectiveDate: filters?.effectiveDate,
        FilterExpiryDate: filters?.expiryDate,
      },
    };

    const response = await this.execute<Charge[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get charges by category
   * @param categoryId - The category ID
   * @param isActiveOnly - Whether to fetch only active charges
   * @returns Array of charges in the specified category
   */
  async getChargesByCategory(categoryId: number, isActiveOnly?: boolean): Promise<Charge[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Charges by Category
      parameters: {
        ChargesCategoryID: categoryId,
        FilterIsActive: isActiveOnly,
      },
    };

    const response = await this.execute<Charge[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Toggle active status of a charge
   * @param chargeId - The ID of the charge
   * @returns true if successful, false otherwise, and the new status
   */
  async toggleChargeStatus(chargeId: number): Promise<{ success: boolean; isActive?: boolean }> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Toggle Active Status
      parameters: {
        ChargesID: chargeId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      const isActive = response.IsActive;
      this.showSuccess(isActive ? "Charge activated successfully" : "Charge deactivated successfully");
      return { success: true, isActive };
    }

    return { success: false };
  }
}

// Export a singleton instance
export const additionalChargesService = new AdditionalChargesService();
