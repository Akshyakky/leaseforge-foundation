// src/services/accountingPeriodService.ts
import { BaseService, BaseRequest } from "./BaseService";
import {
  AccountingPeriod,
  PeriodSearchParams,
  AccountingPeriodCreateRequest,
  AccountingPeriodUpdateRequest,
  PeriodBulkCreateRequest,
  PeriodCloseRequest,
  PeriodReopenRequest,
  PeriodDropdownParams,
  CurrentPeriod,
  PeriodStatistics,
  PeriodClosureValidation,
  PeriodValidationResult,
  ApiResponse,
} from "../types/accountingPeriodTypes";

/**
 * Service for accounting period management operations
 */
class AccountingPeriodService extends BaseService {
  constructor() {
    super("/Master/accountingPeriod");
  }

  /**
   * Create accounting periods for a fiscal year (generates 12 monthly periods automatically)
   * @param fiscalYearID - The fiscal year ID to create periods for
   * @param companyID - The company ID
   * @returns Response with status and message
   */
  async createPeriodsForFiscalYear(fiscalYearID: number, companyID: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 1,
      parameters: {
        FiscalYearID: fiscalYearID,
        CompanyID: companyID,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Accounting periods created successfully");
      return {
        Status: 1,
        Message: response.message || "Accounting periods created successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create accounting periods",
    };
  }

  /**
   * Close an accounting period
   * @param periodID - The period ID to close
   * @param closingComments - Optional comments for the closure
   * @returns Response with status and message
   */
  async closePeriod(periodID: number, closingComments?: string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 2,
      parameters: {
        PeriodID: periodID,
        ClosingComments: closingComments,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Period closed successfully");
      return {
        Status: 1,
        Message: response.message || "Period closed successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to close period",
    };
  }

  /**
   * Reopen a closed accounting period
   * @param periodID - The period ID to reopen
   * @returns Response with status and message
   */
  async reopenPeriod(periodID: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 3,
      parameters: {
        PeriodID: periodID,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Period reopened successfully");
      return {
        Status: 1,
        Message: response.message || "Period reopened successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reopen period",
    };
  }

  /**
   * Get all periods for a fiscal year
   * @param fiscalYearID - The fiscal year ID
   * @returns Array of accounting periods
   */
  async getPeriodsByFiscalYear(fiscalYearID: number): Promise<AccountingPeriod[]> {
    const request: BaseRequest = {
      mode: 4,
      parameters: {
        FiscalYearID: fiscalYearID,
      },
    };

    const response = await this.execute<AccountingPeriod[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get the current open period for a company based on today's date
   * @param companyID - The company ID
   * @returns Current open period or null if not found
   */
  async getCurrentOpenPeriod(companyID: number): Promise<CurrentPeriod | null> {
    const request: BaseRequest = {
      mode: 5,
      parameters: {
        CompanyID: companyID,
      },
    };

    const response = await this.execute<CurrentPeriod[]>(request, false);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Get all periods with optional filters
   * @param filters - Optional filter parameters
   * @returns Array of accounting periods
   */
  async getAllPeriods(filters?: PeriodSearchParams): Promise<AccountingPeriod[]> {
    const request: BaseRequest = {
      mode: 6,
      parameters: {
        FilterFiscalYearID: filters?.filterFiscalYearID,
        FilterCompanyID: filters?.filterCompanyID,
        FilterIsOpen: filters?.filterIsOpen,
        FilterIsClosed: filters?.filterIsClosed,
        FilterPeriodNumber: filters?.filterPeriodNumber,
      },
    };

    const response = await this.execute<AccountingPeriod[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a period by ID
   * @param periodID - The period ID
   * @returns The accounting period or null if not found
   */
  async getPeriodById(periodID: number): Promise<AccountingPeriod | null> {
    const request: BaseRequest = {
      mode: 7,
      parameters: {
        PeriodID: periodID,
      },
    };

    const response = await this.execute<AccountingPeriod[]>(request, false);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Search periods with filters and search text
   * @param params - Search parameters
   * @returns Array of matching periods
   */
  async searchPeriods(params: PeriodSearchParams = {}): Promise<AccountingPeriod[]> {
    const request: BaseRequest = {
      mode: 8,
      parameters: {
        SearchText: params.searchText,
        FilterFiscalYearID: params.filterFiscalYearID,
        FilterCompanyID: params.filterCompanyID,
        FilterIsOpen: params.filterIsOpen,
        FilterIsClosed: params.filterIsClosed,
      },
    };

    const response = await this.execute<AccountingPeriod[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get periods for dropdown with optional filters
   * @param params - Optional filter parameters
   * @returns Array of periods suitable for dropdown display
   */
  async getPeriodsForDropdown(params?: PeriodDropdownParams): Promise<AccountingPeriod[]> {
    const request: BaseRequest = {
      mode: 9,
      parameters: {
        FilterFiscalYearID: params?.filterFiscalYearID,
        FilterCompanyID: params?.filterCompanyID,
        FilterIsOpen: params?.filterIsOpen,
        OpenPeriodsOnly: params?.openPeriodsOnly,
      },
    };

    const response = await this.execute<AccountingPeriod[]>(request, false);
    return response.success ? response.data || [] : [];
  }

  /**
   * Validate if a date falls within an open period
   * @param postingDate - The date to validate
   * @param companyID - The company ID
   * @returns Validation result with period information
   */
  async validatePostingDate(postingDate: string | Date, companyID: number): Promise<PeriodValidationResult> {
    const request: BaseRequest = {
      mode: 10,
      parameters: {
        PostingDate: postingDate,
        CompanyID: companyID,
      },
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        isValid: response.IsOpen || false,
        message: response.message || (response.IsOpen ? "Posting date is valid" : "Posting date falls in a closed period"),
        periodID: response.PeriodID,
        isOpen: response.IsOpen,
      };
    }

    return {
      isValid: false,
      message: response.message || "Unable to validate posting date",
    };
  }

  /**
   * Get period statistics for a company or fiscal year
   * @param companyID - The company ID
   * @param fiscalYearID - Optional fiscal year ID to filter by
   * @returns Period statistics
   */
  async getPeriodStatistics(companyID: number, fiscalYearID?: number): Promise<PeriodStatistics | null> {
    const periods = await this.getAllPeriods({
      filterCompanyID: companyID,
      filterFiscalYearID: fiscalYearID,
    });

    if (periods.length === 0) {
      return null;
    }

    const openPeriods = periods.filter((p) => p.IsOpen && !p.IsClosed).length;
    const closedPeriods = periods.filter((p) => p.IsClosed).length;

    const currentPeriod = await this.getCurrentOpenPeriod(companyID);

    return {
      totalPeriods: periods.length,
      openPeriods,
      closedPeriods,
      currentPeriod: currentPeriod || undefined,
    };
  }

  /**
   * Validate if a period can be closed
   * @param periodID - The period ID to validate
   * @returns Validation result with details
   */
  async validatePeriodClosure(periodID: number): Promise<PeriodClosureValidation> {
    const period = await this.getPeriodById(periodID);

    if (!period) {
      return {
        canClose: false,
        validationMessages: ["Period not found"],
        previousPeriodsOpen: false,
        hasTransactions: false,
      };
    }

    if (period.IsClosed) {
      return {
        canClose: false,
        validationMessages: ["Period is already closed"],
        previousPeriodsOpen: false,
        hasTransactions: false,
      };
    }

    const allPeriods = await this.getPeriodsByFiscalYear(period.FiscalYearID);
    const previousPeriodsOpen = allPeriods.some((p) => p.PeriodNumber < period.PeriodNumber && !p.IsClosed && p.IsOpen);

    const validationMessages: string[] = [];

    if (previousPeriodsOpen) {
      validationMessages.push("Cannot close this period. Previous periods must be closed first.");
    }

    return {
      canClose: !previousPeriodsOpen,
      validationMessages: validationMessages.length > 0 ? validationMessages : ["Period can be closed"],
      previousPeriodsOpen,
      hasTransactions: true,
    };
  }

  /**
   * Get open periods for a company
   * @param companyID - The company ID
   * @param fiscalYearID - Optional fiscal year ID to filter by
   * @returns Array of open periods
   */
  async getOpenPeriods(companyID: number, fiscalYearID?: number): Promise<AccountingPeriod[]> {
    return this.getAllPeriods({
      filterCompanyID: companyID,
      filterFiscalYearID: fiscalYearID,
      filterIsOpen: true,
      filterIsClosed: false,
    });
  }

  /**
   * Get closed periods for a company
   * @param companyID - The company ID
   * @param fiscalYearID - Optional fiscal year ID to filter by
   * @returns Array of closed periods
   */
  async getClosedPeriods(companyID: number, fiscalYearID?: number): Promise<AccountingPeriod[]> {
    return this.getAllPeriods({
      filterCompanyID: companyID,
      filterFiscalYearID: fiscalYearID,
      filterIsClosed: true,
    });
  }

  /**
   * Check if periods exist for a fiscal year
   * @param fiscalYearID - The fiscal year ID
   * @returns True if periods exist, false otherwise
   */
  async periodsExistForFiscalYear(fiscalYearID: number): Promise<boolean> {
    const periods = await this.getPeriodsByFiscalYear(fiscalYearID);
    return periods.length > 0;
  }

  /**
   * Get the next open period after the current one
   * @param currentPeriodID - The current period ID
   * @returns The next open period or null if none exists
   */
  async getNextOpenPeriod(currentPeriodID: number): Promise<AccountingPeriod | null> {
    const currentPeriod = await this.getPeriodById(currentPeriodID);

    if (!currentPeriod) {
      return null;
    }

    const allPeriods = await this.getPeriodsByFiscalYear(currentPeriod.FiscalYearID);

    const nextPeriods = allPeriods.filter((p) => p.PeriodNumber > currentPeriod.PeriodNumber && p.IsOpen && !p.IsClosed).sort((a, b) => a.PeriodNumber - b.PeriodNumber);

    return nextPeriods.length > 0 ? nextPeriods[0] : null;
  }

  /**
   * Bulk close multiple periods in sequence
   * @param periodIDs - Array of period IDs to close in order
   * @param closingComments - Optional comments for all closures
   * @returns Response with status and results for each period
   */
  async bulkClosePeriods(periodIDs: number[], closingComments?: string): Promise<ApiResponse> {
    const results: { periodID: number; success: boolean; message: string }[] = [];

    for (const periodID of periodIDs) {
      const result = await this.closePeriod(periodID, closingComments);
      results.push({
        periodID,
        success: result.Status === 1,
        message: result.Message,
      });

      if (result.Status === 0) {
        break;
      }
    }

    const allSuccess = results.every((r) => r.success);

    return {
      Status: allSuccess ? 1 : 0,
      Message: allSuccess ? "All periods closed successfully" : "Some periods failed to close",
      data: results,
    };
  }

  /**
   * Get period by date range
   * @param date - The date to find the period for
   * @param companyID - The company ID
   * @returns The period containing the date or null
   */
  async getPeriodByDate(date: string | Date, companyID: number): Promise<AccountingPeriod | null> {
    const validation = await this.validatePostingDate(date, companyID);

    if (validation.periodID) {
      return this.getPeriodById(validation.periodID);
    }

    return null;
  }
}

export const accountingPeriodService = new AccountingPeriodService();

// // Example: Add to your posting service or invoice service
// import { accountingPeriodService } from "./accountingPeriodService";

// /**
//  * Validate transaction date against accounting periods
//  * @param transactionDate - The transaction date to validate
//  * @param companyID - The company ID
//  * @returns True if valid, throws error if invalid
//  */
// async validateTransactionDate(
//   transactionDate: string | Date,
//   companyID: number
// ): Promise<boolean> {
//   const validation = await accountingPeriodService.validatePostingDate(
//     transactionDate,
//     companyID
//   );

//   if (!validation.isValid) {
//     throw new Error(
//       validation.message || "Transaction date falls in a closed period"
//     );
//   }

//   return true;
// }
