// src/services/fiscalYearService.ts
import { BaseService, BaseRequest } from "./BaseService";
import {
  FiscalYear,
  FiscalYearSearchParams,
  FiscalYearCreateRequest,
  FiscalYearUpdateRequest,
  FiscalYearDropdownParams,
  FiscalYearStatusCheck,
  CurrentFiscalYear,
  ApiResponse,
} from "../types/fiscalYearTypes";

/**
 * Service for fiscal year management operations
 */
class FiscalYearService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/fiscalyear");
  }

  /**
   * Create a new fiscal year
   * @param fiscalYearData - The fiscal year data to create
   * @returns Response with status and new fiscal year ID
   */
  async createFiscalYear(fiscalYearData: FiscalYearCreateRequest["fiscalYear"]): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Fiscal Year
      parameters: {
        FYCode: fiscalYearData.FYCode,
        FYDescription: fiscalYearData.FYDescription,
        StartDate: fiscalYearData.StartDate,
        EndDate: fiscalYearData.EndDate,
        IsActive: fiscalYearData.IsActive !== undefined ? fiscalYearData.IsActive : true,
        IsClosed: fiscalYearData.IsClosed !== undefined ? fiscalYearData.IsClosed : false,
        CompanyID: fiscalYearData.CompanyID,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Fiscal Year created successfully");
      return {
        Status: 1,
        Message: response.message || "Fiscal Year created successfully",
        NewFiscalYearID: response.NewFiscalYearID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create fiscal year",
    };
  }

  /**
   * Update an existing fiscal year
   * @param fiscalYearData - The fiscal year data to update
   * @returns Response with status
   */
  async updateFiscalYear(fiscalYearData: FiscalYearUpdateRequest["fiscalYear"]): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Fiscal Year
      parameters: {
        FiscalYearID: fiscalYearData.FiscalYearID,
        FYCode: fiscalYearData.FYCode,
        FYDescription: fiscalYearData.FYDescription,
        StartDate: fiscalYearData.StartDate,
        EndDate: fiscalYearData.EndDate,
        IsActive: fiscalYearData.IsActive,
        IsClosed: fiscalYearData.IsClosed,
        CompanyID: fiscalYearData.CompanyID,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Fiscal Year updated successfully");
      return {
        Status: 1,
        Message: response.message || "Fiscal Year updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update fiscal year",
    };
  }

  /**
   * Get all active fiscal years with optional filters
   * @param filters - Optional filter parameters
   * @returns Array of fiscal years
   */
  async getAllFiscalYears(filters?: FiscalYearSearchParams): Promise<FiscalYear[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Fiscal Years
      parameters: {
        FilterCompanyID: filters?.filterCompanyID,
        FilterIsActive: filters?.filterIsActive,
        FilterIsClosed: filters?.filterIsClosed,
      },
    };

    const response = await this.execute<FiscalYear[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a fiscal year by ID
   * @param fiscalYearId - The ID of the fiscal year to fetch
   * @returns The fiscal year object or null if not found
   */
  async getFiscalYearById(fiscalYearId: number): Promise<FiscalYear | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Fiscal Year by ID
      parameters: {
        FiscalYearID: fiscalYearId,
      },
    };

    const response = await this.execute<FiscalYear[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Delete a fiscal year (soft delete)
   * @param fiscalYearId - The ID of the fiscal year to delete
   * @returns Response with status
   */
  async deleteFiscalYear(fiscalYearId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Fiscal Year
      parameters: {
        FiscalYearID: fiscalYearId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Fiscal Year deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Fiscal Year deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete fiscal year",
    };
  }

  /**
   * Search for fiscal years with filters and search text
   * @param params - Search parameters
   * @returns Array of matching fiscal years
   */
  async searchFiscalYears(params: FiscalYearSearchParams = {}): Promise<FiscalYear[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Fiscal Years
      parameters: {
        SearchText: params.searchText,
        FilterCompanyID: params.filterCompanyID,
        FilterIsActive: params.filterIsActive,
        FilterIsClosed: params.filterIsClosed,
      },
    };

    const response = await this.execute<FiscalYear[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get the current active fiscal year for a company
   * @param companyId - The company ID
   * @returns The current active fiscal year or null if not found
   */
  async getCurrentFiscalYear(companyId: number): Promise<CurrentFiscalYear | null> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Current Active Fiscal Year for a Company
      parameters: {
        CompanyID: companyId,
      },
    };

    const response = await this.execute<CurrentFiscalYear[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Check if a fiscal year is closed
   * @param fiscalYearId - The fiscal year ID to check
   * @returns Fiscal year status information
   */
  async checkFiscalYearStatus(fiscalYearId: number): Promise<FiscalYearStatusCheck | null> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Check if a Fiscal Year is Closed
      parameters: {
        FiscalYearID: fiscalYearId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        FiscalYearID: fiscalYearId,
        IsClosed: response.IsClosedStatus || false,
        StatusMessage: response.message || "Status retrieved successfully",
      };
    }

    return null;
  }

  /**
   * Get fiscal years for dropdown with optional filters
   * @param params - Optional filter parameters
   * @returns Array of fiscal years suitable for dropdown display
   */
  async getFiscalYearsForDropdown(params?: FiscalYearDropdownParams): Promise<FiscalYear[]> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Fiscal Years for Dropdown
      parameters: {
        FilterCompanyID: params?.filterCompanyID,
        FilterIsActive: params?.filterIsActive,
        FilterIsClosed: params?.filterIsClosed,
      },
    };

    const response = await this.execute<FiscalYear[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Toggle fiscal year active status
   * @param fiscalYearId - The ID of the fiscal year
   * @param isActive - The new active status
   * @returns Response with status
   */
  async toggleFiscalYearStatus(fiscalYearId: number, isActive: boolean): Promise<ApiResponse> {
    const fiscalYear = await this.getFiscalYearById(fiscalYearId);

    if (!fiscalYear) {
      return {
        Status: 0,
        Message: "Fiscal Year not found",
      };
    }

    return this.updateFiscalYear({
      FiscalYearID: fiscalYearId,
      IsActive: isActive,
    });
  }

  /**
   * Close or open a fiscal year
   * @param fiscalYearId - The ID of the fiscal year
   * @param isClosed - The new closed status
   * @returns Response with status
   */
  async setFiscalYearClosedStatus(fiscalYearId: number, isClosed: boolean): Promise<ApiResponse> {
    const fiscalYear = await this.getFiscalYearById(fiscalYearId);

    if (!fiscalYear) {
      return {
        Status: 0,
        Message: "Fiscal Year not found",
      };
    }

    const response = await this.updateFiscalYear({
      FiscalYearID: fiscalYearId,
      IsClosed: isClosed,
    });

    if (response.Status === 1) {
      const action = isClosed ? "closed" : "opened";
      this.showSuccess(`Fiscal Year ${action} successfully`);
    }

    return response;
  }

  /**
   * Get fiscal years by company ID
   * @param companyId - The company ID
   * @param activeOnly - Whether to fetch only active fiscal years
   * @returns Array of fiscal years for the specified company
   */
  async getFiscalYearsByCompany(companyId: number, activeOnly: boolean = false): Promise<FiscalYear[]> {
    return this.searchFiscalYears({
      filterCompanyID: companyId,
      filterIsActive: activeOnly ? true : undefined,
    });
  }

  /**
   * Check if fiscal year dates overlap with existing fiscal years
   * This is a client-side validation helper
   * @param companyId - The company ID
   * @param startDate - The proposed start date
   * @param endDate - The proposed end date
   * @param excludeFiscalYearId - Optional fiscal year ID to exclude from overlap check (for updates)
   * @returns Promise<boolean> - true if dates overlap, false otherwise
   */
  async checkDateOverlap(companyId: number, startDate: Date | string, endDate: Date | string, excludeFiscalYearId?: number): Promise<boolean> {
    const existingFiscalYears = await this.getFiscalYearsByCompany(companyId);

    const proposedStart = new Date(startDate);
    const proposedEnd = new Date(endDate);

    for (const fy of existingFiscalYears) {
      if (excludeFiscalYearId && fy.FiscalYearID === excludeFiscalYearId) {
        continue;
      }

      const existingStart = new Date(fy.StartDate);
      const existingEnd = new Date(fy.EndDate);

      // Check for overlap
      if (
        (proposedStart >= existingStart && proposedStart <= existingEnd) ||
        (proposedEnd >= existingStart && proposedEnd <= existingEnd) ||
        (existingStart >= proposedStart && existingStart <= proposedEnd) ||
        (existingEnd >= proposedStart && existingEnd <= proposedEnd)
      ) {
        return true;
      }
    }

    return false;
  }
}

// Export a singleton instance
export const fiscalYearService = new FiscalYearService();
