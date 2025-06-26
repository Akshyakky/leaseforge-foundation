// src/services/bankService.ts
import { BaseService, BaseRequest } from "./BaseService";
import {
  Bank,
  BankCategory,
  BankStatistics,
  BankCategoryStatistics,
  BankSearchParams,
  BankCategorySearchParams,
  BankRequest,
  BankUpdateRequest,
  BankCategoryRequest,
  BankCategoryUpdateRequest,
  ApiResponse,
} from "../types/bankTypes";

/**
 * Service for bank category management operations
 */
class BankCategoryService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/bankCategory");
  }

  /**
   * Mode 1: Create a new bank category
   * @param data - The bank category data to create
   * @returns Response with status and new category ID
   */
  async createBankCategory(data: BankCategoryRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Create New Bank Category
      parameters: {
        CategoryName: data.category.CategoryName,
        Description: data.category.Description,
        IsActive: data.category.IsActive,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Bank category created successfully");
      return {
        Status: 1,
        Message: response.message || "Bank category created successfully",
        CategoryID: response.CategoryID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create bank category",
    };
  }

  /**
   * Mode 2: Update an existing bank category
   * @param data - The bank category data to update
   * @returns Response with status
   */
  async updateBankCategory(data: BankCategoryUpdateRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Bank Category
      parameters: {
        CategoryID: data.category.CategoryID,
        CategoryName: data.category.CategoryName,
        Description: data.category.Description,
        IsActive: data.category.IsActive,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Bank category updated successfully");
      return {
        Status: 1,
        Message: response.message || "Bank category updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update bank category",
    };
  }

  /**
   * Mode 3: Get all bank categories with optional search
   * @param params - Search parameters
   * @returns Array of bank categories
   */
  async getAllBankCategories(params: BankCategorySearchParams = {}): Promise<BankCategory[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Get All Bank Categories
      parameters: {
        SearchText: params.searchText,
      },
    };

    const response = await this.execute<BankCategory[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Mode 4: Get bank category by ID
   * @param categoryId - The ID of the bank category to fetch
   * @returns The bank category or null if not found
   */
  async getBankCategoryById(categoryId: number): Promise<BankCategory | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Get Bank Category by ID
      parameters: {
        CategoryID: categoryId,
      },
    };

    const response = await this.execute(request);

    if (response.success && response.table1 && response.table1.length > 0) {
      return response.table1[0];
    }

    return null;
  }

  /**
   * Mode 5: Delete a bank category (soft delete)
   * @param categoryId - The ID of the bank category to delete
   * @returns Response with status
   */
  async deleteBankCategory(categoryId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Delete Bank Category
      parameters: {
        CategoryID: categoryId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Bank category deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Bank category deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete bank category",
    };
  }

  /**
   * Search for bank categories
   * @param searchText - Text to search for
   * @returns Array of matching bank categories
   */
  async searchBankCategories(searchText: string): Promise<BankCategory[]> {
    return this.getAllBankCategories({ searchText });
  }

  /**
   * Get active bank categories only
   * @returns Array of active bank categories
   */
  async getActiveBankCategories(): Promise<BankCategory[]> {
    const categories = await this.getAllBankCategories();
    return categories.filter((category) => category.IsActive);
  }

  /**
   * Validate bank category data before creation/update
   * @param category - The bank category to validate
   * @returns Validation result with any errors
   */
  validateBankCategory(category: Partial<BankCategory>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validations
    if (!category.CategoryName || category.CategoryName.trim() === "") {
      errors.push("Category name is required");
    }

    if (category.IsActive === undefined || category.IsActive === null) {
      errors.push("Active status is required");
    }

    return { isValid: errors.length === 0, errors };
  }
}

/**
 * Service for bank management operations
 */
class BankService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/bank");
  }

  /**
   * Mode 1: Create a new bank
   * @param data - The bank data to create
   * @returns Response with status and new bank ID
   */
  async createBank(data: BankRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Create New Bank
      parameters: {
        BankCode: data.bank.BankCode,
        BankName: data.bank.BankName,
        SwiftCode: data.bank.SwiftCode,
        CountryID: data.bank.CountryID,
        IsActive: data.bank.IsActive,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Bank created successfully");
      return {
        Status: 1,
        Message: response.message || "Bank created successfully",
        BankID: response.BankID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create bank",
    };
  }

  /**
   * Mode 2: Update an existing bank
   * @param data - The bank data to update
   * @returns Response with status
   */
  async updateBank(data: BankUpdateRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Bank
      parameters: {
        BankID: data.bank.BankID,
        BankCode: data.bank.BankCode,
        BankName: data.bank.BankName,
        SwiftCode: data.bank.SwiftCode,
        CountryID: data.bank.CountryID,
        IsActive: data.bank.IsActive,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Bank updated successfully");
      return {
        Status: 1,
        Message: response.message || "Bank updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update bank",
    };
  }

  /**
   * Mode 3: Get all banks with optional search and filters
   * @param params - Search parameters
   * @returns Array of banks
   */
  async getAllBanks(params: BankSearchParams = {}): Promise<Bank[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Get All Banks
      parameters: {
        SearchText: params.searchText,
        FilterCountryID: params.filterCountryID,
        FilterIsActive: params.filterIsActive,
      },
    };

    const response = await this.execute<Bank[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Mode 4: Get bank by ID
   * @param bankId - The ID of the bank to fetch
   * @returns The bank or null if not found
   */
  async getBankById(bankId: number): Promise<Bank | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Get Bank by ID
      parameters: {
        BankID: bankId,
      },
    };

    const response = await this.execute(request);

    if (response.success && response.table1 && response.table1.length > 0) {
      return response.table1[0];
    }

    return null;
  }

  /**
   * Mode 5: Delete a bank (soft delete)
   * @param bankId - The ID of the bank to delete
   * @returns Response with status
   */
  async deleteBank(bankId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Delete Bank
      parameters: {
        BankID: bankId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Bank deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Bank deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete bank",
    };
  }

  /**
   * Search for banks
   * @param searchText - Text to search for
   * @returns Array of matching banks
   */
  async searchBanks(searchText: string): Promise<Bank[]> {
    return this.getAllBanks({ searchText });
  }

  /**
   * Get active banks only
   * @returns Array of active banks
   */
  async getActiveBanks(): Promise<Bank[]> {
    return this.getAllBanks({ filterIsActive: true });
  }

  /**
   * Get banks by country
   * @param countryId - The country ID to filter by
   * @returns Array of banks in the specified country
   */
  async getBanksByCountry(countryId: number): Promise<Bank[]> {
    return this.getAllBanks({ filterCountryID: countryId });
  }

  /**
   * Get banks with SWIFT code
   * @returns Array of banks that have SWIFT codes
   */
  async getBanksWithSwiftCode(): Promise<Bank[]> {
    const banks = await this.getAllBanks();
    return banks.filter((bank) => bank.SwiftCode && bank.SwiftCode.trim() !== "");
  }

  /**
   * Validate bank data before creation/update
   * @param bank - The bank to validate
   * @returns Validation result with any errors
   */
  validateBank(bank: Partial<Bank>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validations
    if (!bank.BankCode || bank.BankCode.trim() === "") {
      errors.push("Bank code is required");
    }

    if (!bank.BankName || bank.BankName.trim() === "") {
      errors.push("Bank name is required");
    }

    if (bank.IsActive === undefined || bank.IsActive === null) {
      errors.push("Active status is required");
    }

    // SWIFT code format validation (if provided)
    if (bank.SwiftCode && bank.SwiftCode.trim() !== "") {
      const swiftCodeRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
      if (!swiftCodeRegex.test(bank.SwiftCode.trim())) {
        errors.push("Invalid SWIFT code format");
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Export singleton instances
export const bankCategoryService = new BankCategoryService();
export const bankService = new BankService();
