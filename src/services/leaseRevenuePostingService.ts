// src/services/leaseRevenuePostingService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  LeaseRevenueTransaction,
  PostedLeaseRevenueTransaction,
  SelectedTransaction,
  LeaseTransactionDetails,
  PostingSummary,
  PendingApprovalItem,
  LeaseRevenueFilters,
  PostingRequest,
  ReversalRequest,
  ApprovalRequest,
  PostingResponse,
  ApprovalResponse,
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
  LeaseRevenuePostingError,
  ApprovalAction,
  ApprovalStatus,
  PostingStatus,
  LEASE_REVENUE_MODES,
} from "../types/leaseRevenuePostingTypes";

/**
 * Service for lease revenue posting operations
 */
class LeaseRevenuePostingService extends BaseService {
  constructor() {
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
        ShowUnpostedOnly: filters.ShowUnpostedOnly ?? true,
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
        FilterApprovalStatus: filters.FilterApprovalStatus,
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
    const validation = this.validatePostingRequest(postingData);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.join("; "),
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
        ApprovalStatus: postingData.ApprovalStatus,
        RequiresApproval: postingData.RequiresApproval,
        ApprovalComments: postingData.ApprovalComments,
        SelectedTransactionsJSON: selectedTransactionsJSON,
        CurrentUserID: postingData.CurrentUserID || this.getCurrentUserId(),
        CurrentUserName: postingData.CurrentUserName || this.getCurrentUser(),
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
  async reverseTransaction(reversalData: ReversalRequest): Promise<ApprovalResponse> {
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
        CurrentUserID: reversalData.CurrentUserID || this.getCurrentUserId(),
        CurrentUserName: reversalData.CurrentUserName || this.getCurrentUser(),
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
        FilterApprovalStatus: filters.FilterApprovalStatus,
      },
    };

    const response = await this.execute<PostingSummary[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Approve or reject a lease revenue posting
   * @param approvalData - The approval request parameters
   * @returns Response with approval status
   */
  async approveOrRejectPosting(approvalData: ApprovalRequest): Promise<ApprovalResponse> {
    if (!approvalData.PostingID) {
      return {
        success: false,
        message: "Posting ID is required for approval.",
      };
    }

    if (!approvalData.ApprovalAction || !Object.values(ApprovalAction).includes(approvalData.ApprovalAction)) {
      return {
        success: false,
        message: "Valid approval action is required.",
      };
    }

    if (approvalData.ApprovalAction === ApprovalAction.REJECT && (!approvalData.RejectionReason || approvalData.RejectionReason.trim().length === 0)) {
      return {
        success: false,
        message: "Rejection reason is required when rejecting a posting.",
      };
    }

    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.APPROVE_REJECT_POSTING,
      parameters: {
        PostingID: approvalData.PostingID,
        ApprovalAction: approvalData.ApprovalAction,
        ApprovalComments: approvalData.ApprovalComments,
        RejectionReason: approvalData.RejectionReason,
        CurrentUserID: approvalData.CurrentUserID || this.getCurrentUserId(),
        CurrentUserName: approvalData.CurrentUserName || this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`Posting ${approvalData.ApprovalAction.toLowerCase()}d successfully`);
      return {
        success: true,
        message: response.message || `Posting ${approvalData.ApprovalAction.toLowerCase()}d successfully`,
      };
    }

    return {
      success: false,
      message: response.message || `Failed to ${approvalData.ApprovalAction.toLowerCase()} posting`,
    };
  }

  /**
   * Get postings pending approval
   * @param filters - Optional filtering criteria
   * @returns Array of postings pending approval
   */
  async getPendingApprovals(filters?: { companyId?: number; fiscalYearId?: number }): Promise<PendingApprovalItem[]> {
    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.GET_PENDING_APPROVALS,
      parameters: {
        CompanyID: filters?.companyId,
        FiscalYearID: filters?.fiscalYearId,
      },
    };

    const response = await this.execute<PendingApprovalItem[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Reset approval status for a posting
   * @param postingId - The posting ID
   * @param currentUserId - Optional current user ID
   * @param currentUserName - Optional current user name
   * @returns Response with reset status
   */
  async resetApprovalStatus(postingId: number, currentUserId?: number, currentUserName?: string): Promise<ApprovalResponse> {
    if (!postingId) {
      return {
        success: false,
        message: "Posting ID is required.",
      };
    }

    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.RESET_APPROVAL_STATUS,
      parameters: {
        PostingID: postingId,
        CurrentUserID: currentUserId || this.getCurrentUserId(),
        CurrentUserName: currentUserName || this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Posting approval status reset successfully");
      return {
        success: true,
        message: response.message || "Posting approval status reset successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to reset posting approval status",
    };
  }

  /**
   * Validate posting request parameters
   * @param postingData - The posting request to validate
   * @returns Validation result
   */
  private validatePostingRequest(postingData: PostingRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!postingData.PostingDate) {
      errors.push("Posting Date is required.");
    }

    if (!postingData.SelectedTransactions || postingData.SelectedTransactions.length === 0) {
      errors.push("No transactions selected for posting.");
    }

    if (!postingData.CompanyID) {
      errors.push("Company ID is required.");
    }

    if (!postingData.FiscalYearID) {
      errors.push("Fiscal Year ID is required.");
    }

    // Validate each selected transaction
    if (postingData.SelectedTransactions) {
      postingData.SelectedTransactions.forEach((transaction, index) => {
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
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
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

    // Check for past period posting (warning)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (postingDate < thirtyDaysAgo) {
      warnings.push("Posting date is more than 30 days in the past.");
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
    const unpostedTransactions = await this.getUnpostedTransactions({
      CompanyID: companyId,
      FiscalYearID: fiscalYearId,
    });

    const postedTransactions = await this.getPostedTransactions({
      CompanyID: companyId,
      FiscalYearID: fiscalYearId,
    });

    const pendingApprovals = await this.getPendingApprovals({
      companyId: companyId,
      fiscalYearId: fiscalYearId,
    });

    // Calculate statistics
    const totalUnpostedAmount = unpostedTransactions.reduce((sum, t) => sum + t.PostingAmount, 0);
    const totalPostedAmount = postedTransactions.reduce((sum, t) => sum + (t.DebitAmount || t.CreditAmount), 0);
    const pendingApprovalAmount = pendingApprovals.reduce((sum, t) => sum + (t.TotalDebitAmount || t.TotalCreditAmount), 0);

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

    // Group by approval status
    const approvalsByStatus = postedTransactions.reduce((acc, t) => {
      const status = t.ApprovalStatus || ApprovalStatus.PENDING;
      const existing = acc.find((item) => item.ApprovalStatus === status);
      if (existing) {
        existing.Count++;
        existing.Amount += t.DebitAmount || t.CreditAmount;
      } else {
        acc.push({
          ApprovalStatus: status,
          Count: 1,
          Amount: t.DebitAmount || t.CreditAmount,
        });
      }
      return acc;
    }, [] as { ApprovalStatus: string; Count: number; Amount: number }[]);

    return {
      TotalUnpostedTransactions: unpostedTransactions.length,
      TotalUnpostedAmount: totalUnpostedAmount,
      TotalPostedTransactions: postedTransactions.length,
      TotalPostedAmount: totalPostedAmount,
      PendingApprovalTransactions: pendingApprovals.length,
      PendingApprovalAmount: pendingApprovalAmount,
      TransactionsByType: unpostedByType,
      PostingsByDate: postedByDate,
      ApprovalsByStatus: approvalsByStatus,
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
      "Is Posted",
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
        transaction.IsPosted ? "Yes" : "No",
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }

  /**
   * Export posted transactions to CSV format
   * @param transactions - Array of posted transactions to export
   * @param includeHeaders - Whether to include column headers
   * @returns CSV string
   */
  exportPostedTransactionsToCSV(transactions: PostedLeaseRevenueTransaction[], includeHeaders = true): string {
    if (!transactions || transactions.length === 0) {
      return includeHeaders ? "No data to export" : "";
    }

    const headers = [
      "Voucher No",
      "Posting Date",
      "Transaction Type",
      "Transaction No",
      "Customer Name",
      "Property",
      "Unit No",
      "Debit Amount",
      "Credit Amount",
      "Debit Account",
      "Credit Account",
      "Approval Status",
      "Is Reversed",
      "Reversal Reason",
    ];

    const csvRows: string[] = [];

    if (includeHeaders) {
      csvRows.push(headers.join(","));
    }

    transactions.forEach((transaction) => {
      const row = [
        `"${transaction.VoucherNo}"`,
        `"${new Date(transaction.PostingDate).toLocaleDateString()}"`,
        `"${transaction.TransactionType}"`,
        `"${transaction.TransactionNo}"`,
        `"${transaction.CustomerName}"`,
        `"${transaction.Property}"`,
        `"${transaction.UnitNo}"`,
        transaction.DebitAmount.toFixed(2),
        transaction.CreditAmount.toFixed(2),
        `"${transaction.DebitAccountName}"`,
        `"${transaction.CreditAccountName}"`,
        `"${transaction.ApprovalStatus || ""}"`,
        transaction.IsReversed ? "Yes" : "No",
        `"${transaction.ReversalReason || ""}"`,
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }

  /**
   * Format amount for display
   * @param amount - The amount to format
   * @param currencyCode - Optional currency code
   * @returns Formatted amount string
   */
  formatAmount(amount: number, currencyCode?: string): string {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  }

  /**
   * Check if posting can be approved
   * @param posting - The posting to check
   * @returns Whether posting can be approved
   */
  canApprovePosting(posting: PostedLeaseRevenueTransaction): boolean {
    return posting.ApprovalStatus === ApprovalStatus.PENDING && posting.RequiresApproval === true && posting.IsReversed !== true;
  }

  /**
   * Check if posting can be reversed
   * @param posting - The posting to check
   * @returns Whether posting can be reversed
   */
  canReversePosting(posting: PostedLeaseRevenueTransaction): boolean {
    return posting.PostingStatus === PostingStatus.POSTED && posting.ApprovalStatus === ApprovalStatus.APPROVED && posting.IsReversed !== true;
  }

  /**
   * Get posting status description
   * @param status - The posting status
   * @returns Human readable description
   */
  getPostingStatusDescription(status: PostingStatus): string {
    const descriptions = {
      [PostingStatus.DRAFT]: "Transaction is in draft status and requires approval",
      [PostingStatus.POSTED]: "Transaction has been posted and approved",
      [PostingStatus.REVERSED]: "Transaction has been reversed",
      [PostingStatus.ERROR]: "Transaction posting encountered an error",
    };
    return descriptions[status] || "Unknown status";
  }

  /**
   * Get approval status description
   * @param status - The approval status
   * @returns Human readable description
   */
  getApprovalStatusDescription(status: ApprovalStatus): string {
    const descriptions = {
      [ApprovalStatus.PENDING]: "Awaiting approval",
      [ApprovalStatus.APPROVED]: "Approved and posted",
      [ApprovalStatus.REJECTED]: "Rejected and returned to draft",
    };
    return descriptions[status] || "Unknown status";
  }
}

// Export a singleton instance
export const leaseRevenuePostingService = new LeaseRevenuePostingService();
