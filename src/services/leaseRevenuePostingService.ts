// src/services/leaseRevenuePostingService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  LeaseRevenueTransaction,
  PostedLeaseRevenueTransaction,
  SelectedTransaction,
  LeaseTransactionDetails,
  PostingSummary,
  LeaseRevenueFilters,
  PostingRequest,
  ReversalRequest,
  PostingResponse,
  Account,
  Property,
  Unit,
  Customer,
  Company,
  FiscalYear,
  Currency,
  LeaseRevenueStatistics,
  BulkPostingStatus,
  ValidationResponse,
  LEASE_REVENUE_MODES,
} from "../types/leaseRevenuePostingTypes";

/**
 * Service for lease revenue posting operations
 */
class LeaseRevenuePostingService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/LeaseRevenuePosting");
  }

  /**
   * Get unposted lease revenue transactions
   * @param filters - Filter parameters for the search
   * @returns Array of unposted transactions
   */
  async getUnpostedTransactions(filters: LeaseRevenueFilters = {}): Promise<LeaseRevenueTransaction[]> {
    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.GET_UNPOSTED_TRANSACTIONS,
      parameters: {
        PropertyID: filters.PropertyID,
        UnitID: filters.UnitID,
        CompanyID: filters.CompanyID,
        FiscalYearID: filters.FiscalYearID,
        PeriodFromDate: filters.PeriodFromDate?.toISOString().split("T")[0],
        PeriodToDate: filters.PeriodToDate?.toISOString().split("T")[0],
        CustomerID: filters.CustomerID,
        ContractID: filters.ContractID,
        IncludePMUnits: filters.IncludePMUnits || false,
        ShowUnpostedOnly: true,
      },
    };

    const response = await this.execute<LeaseRevenueTransaction[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get posted lease revenue transactions
   * @param filters - Filter parameters for the search
   * @returns Array of posted transactions
   */
  async getPostedTransactions(filters: LeaseRevenueFilters = {}): Promise<PostedLeaseRevenueTransaction[]> {
    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.GET_POSTED_TRANSACTIONS,
      parameters: {
        PropertyID: filters.PropertyID,
        UnitID: filters.UnitID,
        CompanyID: filters.CompanyID,
        FiscalYearID: filters.FiscalYearID,
        PostingFromDate: filters.PostingFromDate?.toISOString().split("T")[0],
        PostingToDate: filters.PostingToDate?.toISOString().split("T")[0],
        CustomerID: filters.CustomerID,
        ShowPostedOnly: filters.ShowPostedOnly || false,
      },
    };

    const response = await this.execute<PostedLeaseRevenueTransaction[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Post selected lease revenue transactions
   * @param postingData - The posting request with selected transactions
   * @returns Response with posting status and details
   */
  async postSelectedTransactions(postingData: PostingRequest): Promise<PostingResponse> {
    // Validate required parameters
    if (!postingData.PostingDate) {
      return {
        success: false,
        message: "Posting Date is required.",
      };
    }

    if (!postingData.SelectedTransactions || postingData.SelectedTransactions.length === 0) {
      return {
        success: false,
        message: "No transactions selected for posting.",
      };
    }

    if (!postingData.CompanyID || !postingData.FiscalYearID) {
      return {
        success: false,
        message: "Company ID and Fiscal Year ID are required.",
      };
    }

    // Prepare selected transactions JSON
    const selectedTransactionsJSON = JSON.stringify(postingData.SelectedTransactions);

    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.POST_SELECTED_TRANSACTIONS,
      parameters: {
        PostingDate: postingData.PostingDate.toISOString().split("T")[0],
        DebitAccountID: postingData.DebitAccountID,
        CreditAccountID: postingData.CreditAccountID,
        Narration: postingData.Narration,
        ReferenceNo: postingData.ReferenceNo,
        CurrencyID: postingData.CurrencyID,
        ExchangeRate: postingData.ExchangeRate || 1.0,
        CompanyID: postingData.CompanyID,
        FiscalYearID: postingData.FiscalYearID,
        SelectedTransactionsJSON: selectedTransactionsJSON,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(response.message || "Transactions posted successfully");
      return {
        success: true,
        message: response.message || "Transactions posted successfully",
        PostedCount: response.PostedCount,
        FailedCount: response.FailedCount,
        TotalAmount: response.TotalAmount,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to post transactions",
    };
  }

  /**
   * Reverse a posted transaction
   * @param reversalData - The reversal request parameters
   * @returns Response with reversal status
   */
  async reverseTransaction(reversalData: ReversalRequest): Promise<{ success: boolean; message: string }> {
    if (!reversalData.PostingID) {
      return {
        success: false,
        message: "Posting ID is required for reversal.",
      };
    }

    if (!reversalData.ReversalReason || reversalData.ReversalReason.trim().length === 0) {
      return {
        success: false,
        message: "Reversal reason is required.",
      };
    }

    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.REVERSE_TRANSACTION,
      parameters: {
        PostingID: reversalData.PostingID,
        ReversalReason: reversalData.ReversalReason,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Transaction reversed successfully");
      return {
        success: true,
        message: response.message || "Transaction reversed successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to reverse transaction",
    };
  }

  /**
   * Get detailed information for a specific transaction
   * @param transactionType - Type of transaction (Invoice or Receipt)
   * @param transactionId - ID of the transaction
   * @returns Transaction details
   */
  async getTransactionDetails(transactionType: "Invoice" | "Receipt", transactionId: number): Promise<LeaseTransactionDetails | null> {
    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.GET_TRANSACTION_DETAILS,
      parameters: {
        TransactionType: transactionType,
        [transactionType === "Invoice" ? "LeaseInvoiceID" : "LeaseReceiptID"]: transactionId,
      },
    };

    const response = await this.execute<LeaseTransactionDetails>(request);

    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data[0] : response.data;
    }

    return null;
  }

  /**
   * Get posting summary report
   * @param filters - Filter parameters for the report
   * @returns Array of posting summaries
   */
  async getPostingSummary(filters: LeaseRevenueFilters = {}): Promise<PostingSummary[]> {
    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.GET_POSTING_SUMMARY,
      parameters: {
        CompanyID: filters.CompanyID,
        FiscalYearID: filters.FiscalYearID,
        PostingFromDate: filters.PostingFromDate?.toISOString().split("T")[0],
        PostingToDate: filters.PostingToDate?.toISOString().split("T")[0],
      },
    };

    const response = await this.execute<PostingSummary[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Validate transactions before posting
   * @param transactions - Array of selected transactions to validate
   * @param postingDate - The intended posting date
   * @param companyId - Company ID
   * @param fiscalYearId - Fiscal Year ID
   * @returns Validation response with errors and warnings
   */
  async validateTransactions(transactions: SelectedTransaction[], postingDate: Date, companyId: number, fiscalYearId: number): Promise<ValidationResponse> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Client-side validation
    if (!transactions || transactions.length === 0) {
      errors.push("No transactions selected for posting.");
    }

    if (!postingDate) {
      errors.push("Posting date is required.");
    }

    if (!companyId) {
      errors.push("Company is required.");
    }

    if (!fiscalYearId) {
      errors.push("Fiscal year is required.");
    }

    // Validate each transaction
    transactions.forEach((transaction, index) => {
      if (!transaction.TransactionID) {
        errors.push(`Transaction ${index + 1}: Transaction ID is required.`);
      }

      if (!transaction.TransactionType) {
        errors.push(`Transaction ${index + 1}: Transaction type is required.`);
      }

      if (!transaction.PostingAmount || transaction.PostingAmount <= 0) {
        errors.push(`Transaction ${index + 1}: Valid posting amount is required.`);
      }

      if (!transaction.DebitAccountID) {
        errors.push(`Transaction ${index + 1}: Debit account is required.`);
      }

      if (!transaction.CreditAccountID) {
        errors.push(`Transaction ${index + 1}: Credit account is required.`);
      }

      if (transaction.DebitAccountID === transaction.CreditAccountID) {
        errors.push(`Transaction ${index + 1}: Debit and credit accounts cannot be the same.`);
      }
    });

    // Check for weekend posting (warning)
    const dayOfWeek = postingDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      warnings.push("Posting date falls on a weekend.");
    }

    // Check for future date posting (warning)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (postingDate > today) {
      warnings.push("Posting date is in the future.");
    }

    return {
      IsValid: errors.length === 0,
      Errors: errors,
      Warnings: warnings,
    };
  }

  /**
   * Get posting statistics for dashboard
   * @param companyId - Optional company filter
   * @param fiscalYearId - Optional fiscal year filter
   * @returns Statistics object
   */
  async getPostingStatistics(companyId?: number, fiscalYearId?: number): Promise<LeaseRevenueStatistics> {
    // This would ideally be a separate mode in the stored procedure
    // For now, we'll use the existing modes to gather statistics

    const unpostedTransactions = await this.getUnpostedTransactions({
      CompanyID: companyId,
      FiscalYearID: fiscalYearId,
    });

    const postedTransactions = await this.getPostedTransactions({
      CompanyID: companyId,
      FiscalYearID: fiscalYearId,
    });

    // Calculate statistics
    const totalUnpostedAmount = unpostedTransactions.reduce((sum, t) => sum + t.PostingAmount, 0);
    const totalPostedAmount = postedTransactions.reduce((sum, t) => sum + (t.DebitAmount || t.CreditAmount), 0);

    // Group by transaction type
    const unpostedByType = unpostedTransactions.reduce((acc, t) => {
      const existing = acc.find((item) => item.TransactionType === t.TransactionType);
      if (existing) {
        existing.Count++;
        existing.Amount += t.PostingAmount;
      } else {
        acc.push({
          TransactionType: t.TransactionType,
          Count: 1,
          Amount: t.PostingAmount,
        });
      }
      return acc;
    }, [] as { TransactionType: string; Count: number; Amount: number }[]);

    // Group posted transactions by date
    const postedByDate = postedTransactions.reduce((acc, t) => {
      const dateStr = new Date(t.PostingDate).toISOString().split("T")[0];
      const existing = acc.find((item) => item.PostingDate === dateStr);
      if (existing) {
        existing.Count++;
        existing.Amount += t.DebitAmount || t.CreditAmount;
      } else {
        acc.push({
          PostingDate: dateStr,
          Count: 1,
          Amount: t.DebitAmount || t.CreditAmount,
        });
      }
      return acc;
    }, [] as { PostingDate: string; Count: number; Amount: number }[]);

    return {
      TotalUnpostedTransactions: unpostedTransactions.length,
      TotalUnpostedAmount: totalUnpostedAmount,
      TotalPostedTransactions: postedTransactions.length,
      TotalPostedAmount: totalPostedAmount,
      TransactionsByType: unpostedByType,
      PostingsByDate: postedByDate,
    };
  }

  /**
   * Export transactions to CSV format
   * @param transactions - Array of transactions to export
   * @param includeHeaders - Whether to include column headers
   * @returns CSV string
   */
  exportTransactionsToCSV(transactions: LeaseRevenueTransaction[], includeHeaders = true): string {
    if (!transactions || transactions.length === 0) {
      return includeHeaders ? "No data to export" : "";
    }

    const headers = [
      "Transaction Type",
      "Transaction No",
      "Transaction Date",
      "Property",
      "Unit No",
      "Customer Name",
      "Posting Amount",
      "Balance Amount",
      "Start Date",
      "End Date",
      "Lease Days",
      "Contract Value",
      "Rent Per Day",
    ];

    const csvRows: string[] = [];

    if (includeHeaders) {
      csvRows.push(headers.join(","));
    }

    transactions.forEach((transaction) => {
      const row = [
        `"${transaction.TransactionType}"`,
        `"${transaction.TransactionNo}"`,
        `"${new Date(transaction.TransactionDate).toLocaleDateString()}"`,
        `"${transaction.Property}"`,
        `"${transaction.UnitNo}"`,
        `"${transaction.CustomerName}"`,
        transaction.PostingAmount.toFixed(2),
        transaction.BalanceAmount.toFixed(2),
        `"${new Date(transaction.StartDate).toLocaleDateString()}"`,
        `"${new Date(transaction.EndDate).toLocaleDateString()}"`,
        transaction.TotalLeaseDays.toString(),
        transaction.ContractValue.toFixed(2),
        transaction.RentPerDay.toFixed(2),
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }
}

// Export a singleton instance
export const leaseRevenuePostingService = new LeaseRevenuePostingService();
