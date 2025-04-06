// src/services/taxService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface Tax {
  TaxID: number;
  TaxCode: string;
  TaxName: string;
  TaxDescription?: string;
  TaxCategory?: string;
  TaxRate: number;
  EffectiveFromDate?: Date;
  ExpiryDate?: Date;
  IsExemptOrZero: boolean;
  IsSalesTax: boolean;
  IsServiceTax: boolean;
  CountryID?: number;
  CountryName?: string; // Joined field
  Remark?: string;

  // Audit fields
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

/**
 * Service for tax-related operations
 */
class TaxService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/tax");
  }

  /**
   * Get all taxes
   * @returns Array of taxes
   */
  async getAllTaxes(): Promise<Tax[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Taxes
      parameters: {},
    };

    const response = await this.execute<Tax[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a tax by ID
   * @param taxId - The ID of the tax to fetch
   * @returns The tax object or null if not found
   */
  async getTaxById(taxId: number): Promise<Tax | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Tax by ID
      parameters: {
        TaxID: taxId,
      },
    };

    const response = await this.execute<Tax[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new tax
   * @param tax - The tax data to create
   * @returns true if successful, false otherwise
   */
  async createTax(tax: Partial<Tax>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Tax
      parameters: {
        TaxCode: tax.TaxCode,
        TaxName: tax.TaxName,
        TaxDescription: tax.TaxDescription,
        TaxCategory: tax.TaxCategory,
        TaxRate: tax.TaxRate,
        EffectiveFromDate: tax.EffectiveFromDate,
        ExpiryDate: tax.ExpiryDate,
        IsExemptOrZero: tax.IsExemptOrZero,
        IsSalesTax: tax.IsSalesTax,
        IsServiceTax: tax.IsServiceTax,
        CountryID: tax.CountryID,
        Remark: tax.Remark,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Tax created successfully");
    }

    return response.success;
  }

  /**
   * Update an existing tax
   * @param tax - The tax data to update
   * @returns true if successful, false otherwise
   */
  async updateTax(tax: Partial<Tax>): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Tax
      parameters: {
        TaxID: tax.TaxID,
        TaxCode: tax.TaxCode,
        TaxName: tax.TaxName,
        TaxDescription: tax.TaxDescription,
        TaxCategory: tax.TaxCategory,
        TaxRate: tax.TaxRate,
        EffectiveFromDate: tax.EffectiveFromDate,
        ExpiryDate: tax.ExpiryDate,
        IsExemptOrZero: tax.IsExemptOrZero,
        IsSalesTax: tax.IsSalesTax,
        IsServiceTax: tax.IsServiceTax,
        CountryID: tax.CountryID,
        Remark: tax.Remark,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Tax updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a tax
   * @param taxId - The ID of the tax to delete
   * @returns true if successful, false otherwise
   */
  async deleteTax(taxId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Tax
      parameters: {
        TaxID: taxId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Tax deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for taxes
   * @param searchText - Text to search for in tax fields
   * @param countryId - Optional country ID to filter by
   * @returns Array of matching taxes
   */
  async searchTaxes(searchText: string, countryId?: number): Promise<Tax[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Taxes
      parameters: {
        SearchText: searchText,
        CountryID: countryId,
      },
    };

    const response = await this.execute<Tax[]>(request);
    return response.success ? response.data || [] : [];
  }
}

// Export a singleton instance
export const taxService = new TaxService();
