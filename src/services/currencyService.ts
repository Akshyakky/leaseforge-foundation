// src/services/currencyService.ts
import { BaseService, BaseRequest } from "./BaseService";

export interface Currency {
  CurrencyID: number;
  CurrencyCode: string;
  CurrencyName: string;
  ConversionRate: number;
  IsDefault: boolean;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

/**
 * Service for currency-related operations
 */
class CurrencyService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/currency");
  }

  /**
   * Get all currencies
   * @returns Array of currencies
   */
  async getAllCurrencies(): Promise<Currency[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Currencies
      parameters: {},
    };

    const response = await this.execute<Currency[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a currency by ID
   * @param currencyId - The ID of the currency to fetch
   * @returns The currency object or null if not found
   */
  async getCurrencyById(currencyId: number): Promise<Currency | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Currency by ID
      parameters: {
        CurrencyID: currencyId,
      },
    };

    const response = await this.execute<Currency[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Create a new currency
   * @param currency - The currency data to create
   * @returns The created currency ID if successful, null otherwise
   */
  async createCurrency(currency: Partial<Currency>): Promise<number | null> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Currency
      parameters: {
        CurrencyCode: currency.CurrencyCode,
        CurrencyName: currency.CurrencyName,
        ConversionRate: currency.ConversionRate,
        IsDefault: currency.IsDefault,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Currency created successfully");
      return response.NewCurrencyID || null;
    }

    return null;
  }

  /**
   * Update an existing currency
   * @param currency - The currency data to update
   * @returns true if successful, false otherwise
   */
  async updateCurrency(currency: Partial<Currency> & { CurrencyID: number }): Promise<boolean> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Currency
      parameters: {
        CurrencyID: currency.CurrencyID,
        CurrencyCode: currency.CurrencyCode,
        CurrencyName: currency.CurrencyName,
        ConversionRate: currency.ConversionRate,
        IsDefault: currency.IsDefault,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Currency updated successfully");
    }

    return response.success;
  }

  /**
   * Delete a currency
   * @param currencyId - The ID of the currency to delete
   * @returns true if successful, false otherwise
   */
  async deleteCurrency(currencyId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Currency
      parameters: {
        CurrencyID: currencyId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Currency deleted successfully");
    }

    return response.success;
  }

  /**
   * Search for currencies
   * @param searchText - Text to search for in currency fields
   * @returns Array of matching currencies
   */
  async searchCurrencies(searchText: string): Promise<Currency[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Currencies
      parameters: {
        SearchText: searchText,
      },
    };

    const response = await this.execute<Currency[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Set a currency as the default currency
   * @param currencyId - The ID of the currency to set as default
   * @returns true if successful, false otherwise
   */
  async setDefaultCurrency(currencyId: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Set Currency as Default
      parameters: {
        CurrencyID: currencyId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Default currency set successfully");
    }

    return response.success;
  }

  /**
   * Get the default currency
   * @returns The default currency or null if not found
   */
  async getDefaultCurrency(): Promise<Currency | null> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Default Currency
      parameters: {},
    };

    const response = await this.execute<Currency[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Get currencies for dropdown
   * @returns Array of currencies for dropdown
   */
  async getCurrenciesForDropdown(): Promise<Currency[]> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Currencies for Dropdown
      parameters: {},
    };

    const response = await this.execute<Currency[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Update a currency's conversion rate
   * @param currencyId - The ID of the currency
   * @param conversionRate - The new conversion rate
   * @returns true if successful, false otherwise
   */
  async updateConversionRate(currencyId: number, conversionRate: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Update Currency Conversion Rate
      parameters: {
        CurrencyID: currencyId,
        ConversionRate: conversionRate,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Currency conversion rate updated successfully");
    }

    return response.success;
  }
}

// Export a singleton instance
export const currencyService = new CurrencyService();
