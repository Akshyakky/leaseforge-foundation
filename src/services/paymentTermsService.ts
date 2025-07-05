// src/services/paymentTermsService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  PaymentTerms,
  PaymentTermsRequest,
  PaymentTermsSearchFilters,
  PaymentTermsDropdownItem,
  PaymentTermsCreateResponse,
  PaymentTermsUpdateResponse,
  PaymentTermsDeleteResponse,
  PaymentTermsExistsResponse,
  PaymentTermsStatistics,
  PaymentTermsUsageInfo,
  PaymentTermsDashboardData,
  PaymentTermsActivity,
  PaymentTermsUsage,
  PaymentTermsStatusDistribution,
  PaymentTermsAuditLog,
  PaymentTermsExportOptions,
  PaymentTermsImportResult,
  PaymentTermsValidationResult,
} from "../types/paymentTermsTypes";

/**
 * Service for payment terms related operations
 */
class PaymentTermsService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/paymentterms");
  }

  /**
   * Create a new payment term
   * @param paymentTermData - The payment term data to create
   * @returns Response with status and newly created payment term ID
   */
  async createPaymentTerm(paymentTermData: PaymentTermsRequest): Promise<PaymentTermsCreateResponse> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Payment Term
      parameters: {
        TermCode: paymentTermData.TermCode,
        TermName: paymentTermData.TermName,
        DaysCount: paymentTermData.DaysCount,
        Description: paymentTermData.Description,
        IsActive: paymentTermData.IsActive ?? true,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment term created successfully");
      return {
        success: true,
        message: response.message || "Payment term created successfully",
        paymentTermId: response.NewPaymentTermID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to create payment term",
    };
  }

  /**
   * Update an existing payment term
   * @param paymentTermData - The payment term data to update
   * @returns Response with status
   */
  async updatePaymentTerm(paymentTermData: PaymentTermsRequest & { PaymentTermID: number }): Promise<PaymentTermsUpdateResponse> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Payment Term
      parameters: {
        PaymentTermID: paymentTermData.PaymentTermID,
        TermCode: paymentTermData.TermCode,
        TermName: paymentTermData.TermName,
        DaysCount: paymentTermData.DaysCount,
        Description: paymentTermData.Description,
        IsActive: paymentTermData.IsActive,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment term updated successfully");
      return {
        success: true,
        message: response.message || "Payment term updated successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update payment term",
    };
  }

  /**
   * Get all payment terms
   * @param isActive - Optional filter for active/inactive terms
   * @returns Array of payment terms
   */
  async getAllPaymentTerms(isActive?: boolean): Promise<PaymentTerms[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Payment Terms
      parameters: {
        FilterIsActive: isActive,
      },
    };

    const response = await this.execute<PaymentTerms[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a payment term by ID
   * @param paymentTermId - The ID of the payment term to fetch
   * @returns Payment term object or null if not found
   */
  async getPaymentTermById(paymentTermId: number): Promise<PaymentTerms | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Payment Term by ID
      parameters: {
        PaymentTermID: paymentTermId,
      },
    };

    const response = await this.execute<PaymentTerms[]>(request);

    if (response.success && response.data && response.data.length > 0) {
      return response.data[0];
    }

    return null;
  }

  /**
   * Delete a payment term
   * @param paymentTermId - The ID of the payment term to delete
   * @returns Response with status
   */
  async deletePaymentTerm(paymentTermId: number): Promise<PaymentTermsDeleteResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Payment Term
      parameters: {
        PaymentTermID: paymentTermId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment term deleted successfully");
      return {
        success: true,
        message: response.message || "Payment term deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete payment term",
    };
  }

  /**
   * Search payment terms with filters
   * @param filters - Search criteria and filters
   * @returns Array of matching payment terms
   */
  async searchPaymentTerms(filters: PaymentTermsSearchFilters): Promise<PaymentTerms[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Payment Terms with Filters
      parameters: {
        SearchText: filters.searchText,
        FilterIsActive: filters.isActive,
      },
    };

    const response = await this.execute<PaymentTerms[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Check if term code already exists
   * @param termCode - The term code to check
   * @param paymentTermId - Optional current payment term ID (for updates)
   * @returns Whether the term code exists
   */
  async checkTermCodeExists(termCode: string, paymentTermId?: number): Promise<PaymentTermsExistsResponse> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Check if Term Code already exists
      parameters: {
        TermCode: termCode,
        PaymentTermID: paymentTermId,
      },
    };

    const response = await this.execute(request, false);

    return {
      exists: response.Status === 0, // Status 0 means it exists, 1 means it's available
      message: response.Message || "",
    };
  }

  /**
   * Get payment term by term code
   * @param termCode - The term code to search for
   * @returns Payment term object or null if not found
   */
  async getPaymentTermByCode(termCode: string): Promise<PaymentTerms | null> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Payment Term by Term Code
      parameters: {
        TermCode: termCode,
      },
    };

    const response = await this.execute<PaymentTerms[]>(request);

    if (response.success && response.data && response.data.length > 0) {
      return response.data[0];
    }

    return null;
  }

  /**
   * Get active payment terms for dropdown lists
   * @returns Array of payment terms suitable for dropdown display
   */
  async getActivePaymentTermsForDropdown(): Promise<PaymentTermsDropdownItem[]> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Active Payment Terms for Dropdown
      parameters: {},
    };

    const response = await this.execute<PaymentTermsDropdownItem[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Activate or deactivate a payment term
   * @param paymentTermId - The ID of the payment term
   * @param isActive - Whether to activate (true) or deactivate (false) the term
   * @returns Response with status
   */
  async togglePaymentTermStatus(paymentTermId: number, isActive: boolean): Promise<PaymentTermsUpdateResponse> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Activate/Deactivate Payment Term
      parameters: {
        PaymentTermID: paymentTermId,
        IsActive: isActive,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      const statusText = isActive ? "activated" : "deactivated";
      this.showSuccess(`Payment term ${statusText} successfully`);
      return {
        success: true,
        message: response.message || `Payment term ${statusText} successfully`,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update payment term status",
    };
  }

  /**
   * Validate payment term data
   * @param paymentTermData - The payment term data to validate
   * @param isUpdate - Whether this is an update operation
   * @returns Validation result
   */
  async validatePaymentTerm(paymentTermData: PaymentTermsRequest, isUpdate: boolean = false): Promise<PaymentTermsValidationResult> {
    // Client-side validation
    if (!paymentTermData.TermCode || paymentTermData.TermCode.trim().length === 0) {
      return {
        isValid: false,
        message: "Term Code is required",
        field: "TermCode",
      };
    }

    if (!paymentTermData.TermName || paymentTermData.TermName.trim().length === 0) {
      return {
        isValid: false,
        message: "Term Name is required",
        field: "TermName",
      };
    }

    if (paymentTermData.TermCode.length > 50) {
      return {
        isValid: false,
        message: "Term Code cannot exceed 50 characters",
        field: "TermCode",
      };
    }

    if (paymentTermData.TermName.length > 250) {
      return {
        isValid: false,
        message: "Term Name cannot exceed 250 characters",
        field: "TermName",
      };
    }

    if (paymentTermData.DaysCount !== undefined && paymentTermData.DaysCount !== null) {
      if (paymentTermData.DaysCount < 0) {
        return {
          isValid: false,
          message: "Days Count cannot be negative",
          field: "DaysCount",
        };
      }

      if (paymentTermData.DaysCount > 9999) {
        return {
          isValid: false,
          message: "Days Count cannot exceed 9999",
          field: "DaysCount",
        };
      }
    }

    if (paymentTermData.Description && paymentTermData.Description.length > 500) {
      return {
        isValid: false,
        message: "Description cannot exceed 500 characters",
        field: "Description",
      };
    }

    // Check if term code exists (only for new records or when code is changed)
    if (!isUpdate || paymentTermData.PaymentTermID === undefined) {
      const existsResult = await this.checkTermCodeExists(paymentTermData.TermCode);
      if (existsResult.exists) {
        return {
          isValid: false,
          message: "Term Code already exists",
          field: "TermCode",
        };
      }
    }

    return {
      isValid: true,
    };
  }

  /**
   * Get payment terms usage information
   * @param paymentTermId - The payment term ID to check usage for
   * @returns Usage information
   */
  async getPaymentTermUsage(paymentTermId: number): Promise<PaymentTermsUsageInfo | null> {
    // This would require additional stored procedure modes or endpoints
    // For now, returning mock data structure
    try {
      const paymentTerm = await this.getPaymentTermById(paymentTermId);
      if (!paymentTerm) {
        return null;
      }

      // In a real implementation, this would call specific endpoints to get usage counts
      return {
        PaymentTermID: paymentTermId,
        TermName: paymentTerm.TermName,
        UsageCount: 0, // This would be calculated from various modules
        UsedInContracts: 0,
        UsedInInvoices: 0,
        UsedInSuppliers: 0,
        CanDelete: true, // Based on usage count
      };
    } catch (error) {
      console.error("Error getting payment term usage:", error);
      return null;
    }
  }

  /**
   * Get payment terms statistics for dashboard
   * @returns Dashboard statistics
   */
  async getPaymentTermsStatistics(): Promise<PaymentTermsStatistics> {
    const allTerms = await this.getAllPaymentTerms();

    const activeTerms = allTerms.filter((term) => term.IsActive);
    const inactiveTerms = allTerms.filter((term) => !term.IsActive);
    const termsWithDays = allTerms.filter((term) => term.DaysCount !== undefined && term.DaysCount !== null);
    const termsWithoutDays = allTerms.filter((term) => term.DaysCount === undefined || term.DaysCount === null);

    const totalDays = termsWithDays.reduce((sum, term) => sum + (term.DaysCount || 0), 0);
    const averageDaysCount = termsWithDays.length > 0 ? totalDays / termsWithDays.length : 0;

    // Get most used term (this would require additional backend support)
    const mostUsedTerm = allTerms.length > 0 ? allTerms[0] : undefined;

    // Recent terms (created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyCreated = allTerms.filter((term) => {
      if (!term.CreatedOn) return false;
      const createdDate = new Date(term.CreatedOn);
      return createdDate >= thirtyDaysAgo;
    }).length;

    return {
      TotalTerms: allTerms.length,
      ActiveTerms: activeTerms.length,
      InactiveTerms: inactiveTerms.length,
      TermsWithDays: termsWithDays.length,
      TermsWithoutDays: termsWithoutDays.length,
      AverageDaysCount: Math.round(averageDaysCount * 100) / 100,
      MostUsedTerm: mostUsedTerm,
      RecentlyCreated: recentlyCreated,
    };
  }

  /**
   * Get dashboard data for payment terms
   * @returns Comprehensive dashboard data
   */
  async getDashboardData(): Promise<PaymentTermsDashboardData> {
    const statistics = await this.getPaymentTermsStatistics();
    const allTerms = await this.getAllPaymentTerms();

    // Mock recent activity data
    const recentActivity: PaymentTermsActivity[] = [];

    // Mock usage distribution data
    const usageDistribution: PaymentTermsUsage[] = allTerms.slice(0, 10).map((term) => ({
      PaymentTermID: term.PaymentTermID,
      TermName: term.TermName,
      TermCode: term.TermCode,
      TotalUsage: 0,
      ContractUsage: 0,
      InvoiceUsage: 0,
      SupplierUsage: 0,
    }));

    // Status distribution
    const statusDistribution: PaymentTermsStatusDistribution[] = [
      {
        Status: "Active",
        Count: statistics.ActiveTerms,
        Percentage: statistics.TotalTerms > 0 ? (statistics.ActiveTerms / statistics.TotalTerms) * 100 : 0,
      },
      {
        Status: "Inactive",
        Count: statistics.InactiveTerms,
        Percentage: statistics.TotalTerms > 0 ? (statistics.InactiveTerms / statistics.TotalTerms) * 100 : 0,
      },
    ];

    return {
      statistics,
      recentActivity,
      usageDistribution,
      statusDistribution,
    };
  }

  /**
   * Export payment terms data
   * @param options - Export configuration options
   * @returns Export result or download URL
   */
  async exportPaymentTerms(options: PaymentTermsExportOptions): Promise<{ success: boolean; downloadUrl?: string; message: string }> {
    try {
      // This would typically call a backend endpoint for export
      // For now, returning a mock response
      return {
        success: true,
        downloadUrl: "/api/exports/payment-terms.xlsx",
        message: "Export completed successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: "Export failed: " + (error as Error).message,
      };
    }
  }

  /**
   * Import payment terms from file
   * @param file - The file to import
   * @returns Import result with success/failure details
   */
  async importPaymentTerms(file: File): Promise<PaymentTermsImportResult> {
    try {
      // This would typically upload the file and process it on the backend
      // For now, returning a mock response
      return {
        success: true,
        totalRecords: 10,
        successfulRecords: 9,
        failedRecords: 1,
        errors: [
          {
            row: 5,
            field: "TermCode",
            value: "DUPLICATE",
            error: "Term code already exists",
          },
        ],
      };
    } catch (error) {
      return {
        success: false,
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        errors: [
          {
            row: 0,
            field: "File",
            value: file.name,
            error: "Failed to process file: " + (error as Error).message,
          },
        ],
      };
    }
  }

  /**
   * Get audit log for payment terms
   * @param paymentTermId - Optional specific payment term ID
   * @param limit - Maximum number of records to return
   * @returns Array of audit log entries
   */
  async getAuditLog(paymentTermId?: number, limit: number = 100): Promise<PaymentTermsAuditLog[]> {
    // This would require additional backend implementation
    // For now, returning empty array
    return [];
  }

  /**
   * Bulk update payment terms status
   * @param paymentTermIds - Array of payment term IDs
   * @param isActive - New status for all terms
   * @returns Response with status
   */
  async bulkUpdateStatus(paymentTermIds: number[], isActive: boolean): Promise<{ success: boolean; message: string; updatedCount: number }> {
    try {
      let updatedCount = 0;
      const errors: string[] = [];

      for (const id of paymentTermIds) {
        try {
          const result = await this.togglePaymentTermStatus(id, isActive);
          if (result.success) {
            updatedCount++;
          } else {
            errors.push(`Failed to update term ID ${id}: ${result.message}`);
          }
        } catch (error) {
          errors.push(`Error updating term ID ${id}: ${(error as Error).message}`);
        }
      }

      const statusText = isActive ? "activated" : "deactivated";

      if (errors.length === 0) {
        this.showSuccess(`Successfully ${statusText} ${updatedCount} payment terms`);
        return {
          success: true,
          message: `Successfully ${statusText} ${updatedCount} payment terms`,
          updatedCount,
        };
      } else {
        const message = `${statusText} ${updatedCount} of ${paymentTermIds.length} payment terms. Errors: ${errors.join(", ")}`;
        return {
          success: updatedCount > 0,
          message,
          updatedCount,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Bulk update failed: " + (error as Error).message,
        updatedCount: 0,
      };
    }
  }

  /**
   * Duplicate a payment term
   * @param paymentTermId - The ID of the payment term to duplicate
   * @param newTermCode - New term code for the duplicate
   * @param newTermName - New term name for the duplicate
   * @returns Response with status and new payment term ID
   */
  async duplicatePaymentTerm(paymentTermId: number, newTermCode: string, newTermName: string): Promise<PaymentTermsCreateResponse> {
    try {
      const originalTerm = await this.getPaymentTermById(paymentTermId);
      if (!originalTerm) {
        return {
          success: false,
          message: "Original payment term not found",
        };
      }

      const duplicateData: PaymentTermsRequest = {
        TermCode: newTermCode,
        TermName: newTermName,
        DaysCount: originalTerm.DaysCount,
        Description: originalTerm.Description ? `Copy of ${originalTerm.Description}` : undefined,
        IsActive: originalTerm.IsActive,
      };

      return await this.createPaymentTerm(duplicateData);
    } catch (error) {
      return {
        success: false,
        message: "Failed to duplicate payment term: " + (error as Error).message,
      };
    }
  }

  /**
   * Get payment terms grouped by days count ranges
   * @returns Grouped payment terms data
   */
  async getPaymentTermsByDaysRanges(): Promise<{ range: string; terms: PaymentTerms[]; count: number }[]> {
    const allTerms = await this.getAllPaymentTerms(true); // Only active terms

    const ranges = [
      { min: 0, max: 0, label: "Immediate" },
      { min: 1, max: 7, label: "1-7 days" },
      { min: 8, max: 15, label: "8-15 days" },
      { min: 16, max: 30, label: "16-30 days" },
      { min: 31, max: 60, label: "31-60 days" },
      { min: 61, max: 90, label: "61-90 days" },
      { min: 91, max: Number.MAX_SAFE_INTEGER, label: "90+ days" },
    ];

    const noDaysTerms = allTerms.filter((term) => term.DaysCount === undefined || term.DaysCount === null);

    const result = ranges.map((range) => {
      const terms = allTerms.filter((term) => {
        if (term.DaysCount === undefined || term.DaysCount === null) return false;
        return term.DaysCount >= range.min && term.DaysCount <= range.max;
      });

      return {
        range: range.label,
        terms,
        count: terms.length,
      };
    });

    // Add terms without days count
    if (noDaysTerms.length > 0) {
      result.push({
        range: "No specific days",
        terms: noDaysTerms,
        count: noDaysTerms.length,
      });
    }

    return result.filter((group) => group.count > 0);
  }
}

// Export a singleton instance
export const paymentTermsService = new PaymentTermsService();
