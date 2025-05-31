// src/services/receiptService.ts - Updated to match stored procedure
import { BaseService, BaseRequest } from "./BaseService";
import {
  LeaseReceipt,
  ReceiptStatistics,
  UnpostedReceipt,
  ReceiptPosting,
  ReceiptReversal,
  ReceiptSearchParams,
  ReceiptRequest,
  ReceiptUpdateRequest,
  ReceiptPostingRequest,
  ReceiptReversalRequest,
  ReceiptStatisticsParams,
  PaymentType,
  PaymentStatus,
  ApiResponse,
} from "../types/receiptTypes";

// Re-export types for convenience
export type {
  LeaseReceipt,
  ReceiptStatistics,
  UnpostedReceipt,
  ReceiptPosting,
  ReceiptReversal,
  ReceiptSearchParams,
  ReceiptRequest,
  ReceiptUpdateRequest,
  ReceiptPostingRequest,
  ReceiptReversalRequest,
  ReceiptStatisticsParams,
};

// Re-export enums
export { PaymentType, PaymentStatus };

/**
 * Service for lease receipt management operations
 */
class ReceiptService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/receipt");
  }

  /**
   * Create a new lease receipt (Mode 1)
   * @param data - The receipt data to create
   * @returns Response with status and newly created receipt ID
   */
  async createReceipt(data: ReceiptRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Receipt
      parameters: {
        // Receipt master data
        ReceiptNo: data.receipt.ReceiptNo,
        ReceiptDate: this.formatDate(data.receipt.ReceiptDate),
        LeaseInvoiceID: data.receipt.LeaseInvoiceID,
        CustomerID: data.receipt.CustomerID,
        CompanyID: data.receipt.CompanyID,
        FiscalYearID: data.receipt.FiscalYearID,
        PaymentType: data.receipt.PaymentType || PaymentType.CASH,
        PaymentStatus: data.receipt.PaymentStatus || PaymentStatus.RECEIVED,
        ReceivedAmount: data.receipt.ReceivedAmount,
        CurrencyID: data.receipt.CurrencyID,
        ExchangeRate: data.receipt.ExchangeRate || 1.0,
        BankID: data.receipt.BankID,
        BankAccountNo: data.receipt.BankAccountNo,
        ChequeNo: data.receipt.ChequeNo,
        ChequeDate: data.receipt.ChequeDate ? this.formatDate(data.receipt.ChequeDate) : null,
        TransactionReference: data.receipt.TransactionReference,
        DepositedBankID: data.receipt.DepositedBankID,
        DepositDate: data.receipt.DepositDate ? this.formatDate(data.receipt.DepositDate) : null,
        ClearanceDate: data.receipt.ClearanceDate ? this.formatDate(data.receipt.ClearanceDate) : null,
        IsAdvancePayment: data.receipt.IsAdvancePayment || false,
        SecurityDepositAmount: data.receipt.SecurityDepositAmount || 0,
        PenaltyAmount: data.receipt.PenaltyAmount || 0,
        DiscountAmount: data.receipt.DiscountAmount || 0,
        ReceivedByUserID: data.receipt.ReceivedByUserID,
        AccountID: data.receipt.AccountID, // Cash/Bank account for the receipt
        IsPosted: data.receipt.IsPosted || false,
        PostingID: data.receipt.PostingID,
        Notes: data.receipt.Notes,

        // Audit parameters
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt created successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt created successfully",
        NewReceiptID: response.data?.NewReceiptID || response.NewReceiptID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create receipt",
    };
  }

  /**
   * Update an existing lease receipt (Mode 2)
   * @param data - The receipt data to update
   * @returns Response with status
   */
  async updateReceipt(data: ReceiptUpdateRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Receipt
      parameters: {
        LeaseReceiptID: data.receipt.LeaseReceiptID,
        ReceiptNo: data.receipt.ReceiptNo,
        ReceiptDate: data.receipt.ReceiptDate ? this.formatDate(data.receipt.ReceiptDate) : undefined,
        LeaseInvoiceID: data.receipt.LeaseInvoiceID,
        CustomerID: data.receipt.CustomerID,
        PaymentType: data.receipt.PaymentType,
        PaymentStatus: data.receipt.PaymentStatus,
        ReceivedAmount: data.receipt.ReceivedAmount,
        CurrencyID: data.receipt.CurrencyID,
        ExchangeRate: data.receipt.ExchangeRate,
        BankID: data.receipt.BankID,
        BankAccountNo: data.receipt.BankAccountNo,
        ChequeNo: data.receipt.ChequeNo,
        ChequeDate: data.receipt.ChequeDate ? this.formatDate(data.receipt.ChequeDate) : undefined,
        TransactionReference: data.receipt.TransactionReference,
        DepositedBankID: data.receipt.DepositedBankID,
        DepositDate: data.receipt.DepositDate ? this.formatDate(data.receipt.DepositDate) : undefined,
        ClearanceDate: data.receipt.ClearanceDate ? this.formatDate(data.receipt.ClearanceDate) : undefined,
        IsAdvancePayment: data.receipt.IsAdvancePayment,
        SecurityDepositAmount: data.receipt.SecurityDepositAmount,
        PenaltyAmount: data.receipt.PenaltyAmount,
        DiscountAmount: data.receipt.DiscountAmount,
        ReceivedByUserID: data.receipt.ReceivedByUserID,
        AccountID: data.receipt.AccountID, // Cash/Bank account
        Notes: data.receipt.Notes,
        IsPosted: data.receipt.IsPosted,

        // Audit parameters
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt updated successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update receipt",
    };
  }

  /**
   * Get all active receipts (Mode 3)
   * @param companyId - Optional company ID filter
   * @returns Array of receipts
   */
  async getAllReceipts(companyId?: number): Promise<LeaseReceipt[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Receipts
      parameters: {
        CompanyID: companyId,
      },
    };

    const response = await this.execute<LeaseReceipt[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a receipt by ID (Mode 4)
   * @param receiptId - The ID of the receipt to fetch
   * @returns The receipt object or null if not found
   */
  async getReceiptById(receiptId: number): Promise<LeaseReceipt | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Receipt by ID
      parameters: {
        LeaseReceiptID: receiptId,
      },
    };

    const response = await this.execute<LeaseReceipt[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Delete a receipt (Mode 5)
   * @param receiptId - The ID of the receipt to delete
   * @returns Response with status
   */
  async deleteReceipt(receiptId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Receipt
      parameters: {
        LeaseReceiptID: receiptId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete receipt",
    };
  }

  /**
   * Search for receipts with filters (Mode 6)
   * @param params - Search parameters
   * @returns Array of matching receipts
   */
  async searchReceipts(params: ReceiptSearchParams = {}): Promise<LeaseReceipt[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Receipts with Filters
      parameters: {
        SearchText: params.searchText,
        FilterCustomerID: params.filterCustomerID,
        FilterInvoiceID: params.filterInvoiceID,
        FilterPaymentType: params.filterPaymentType,
        FilterPaymentStatus: params.filterPaymentStatus,
        FilterFromDate: params.filterFromDate ? this.formatDate(params.filterFromDate) : undefined,
        FilterToDate: params.filterToDate ? this.formatDate(params.filterToDate) : undefined,
        FilterCompanyID: params.filterCompanyID,
        FilterFiscalYearID: params.filterFiscalYearID,
        FilterIsPosted: params.filterIsPosted,
      },
    };

    const response = await this.execute<LeaseReceipt[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get receipt statistics (Mode 7)
   * @param params - Statistics parameters
   * @returns Receipt statistics
   */
  async getReceiptStatistics(params: ReceiptStatisticsParams = {}): Promise<ReceiptStatistics> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Receipt Statistics
      parameters: {
        FilterCompanyID: params.filterCompanyID,
        FilterFiscalYearID: params.filterFiscalYearID,
        FilterFromDate: params.filterFromDate ? this.formatDate(params.filterFromDate) : undefined,
        FilterToDate: params.filterToDate ? this.formatDate(params.filterToDate) : undefined,
      },
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        paymentTypeCounts: response.data?.table1 || response.table1 || [],
        postingStatusSummary: response.data?.table2 || response.table2 || [],
      };
    }

    return {
      paymentTypeCounts: [],
      postingStatusSummary: [],
    };
  }

  /**
   * Get unposted receipts (Mode 8)
   * @param companyId - Optional company ID filter
   * @param fiscalYearId - Optional fiscal year ID filter
   * @returns Array of unposted receipts
   */
  async getUnpostedReceipts(companyId?: number, fiscalYearId?: number): Promise<UnpostedReceipt[]> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Unposted Receipts
      parameters: {
        FilterCompanyID: companyId,
        FilterFiscalYearID: fiscalYearId,
      },
    };

    const response = await this.execute<UnpostedReceipt[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Post receipt to General Ledger (Mode 9)
   * @param data - Receipt posting data
   * @returns Response with posting details
   */
  async postReceiptToGL(data: ReceiptPostingRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Post Receipt to GL
      parameters: {
        LeaseReceiptID: data.LeaseReceiptID,
        ReversePosting: data.ReversePosting || false,
        ReversalReason: data.ReversalReason,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt posted to GL successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt posted to GL successfully",
        MainPostingID: response.data?.MainPostingID || response.MainPostingID,
        GLVoucherNo: response.data?.GLVoucherNo || response.GLVoucherNo,
        PostingID: response.data?.MainPostingID || response.MainPostingID, // For backward compatibility
        VoucherNo: response.data?.GLVoucherNo || response.GLVoucherNo, // For backward compatibility
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to post receipt to GL",
    };
  }

  /**
   * Reverse receipt GL posting (Mode 10)
   * @param data - Receipt reversal data
   * @returns Response with reversal details
   */
  async reverseReceiptGLPosting(data: ReceiptReversalRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Reverse Receipt GL Posting
      parameters: {
        LeaseReceiptID: data.LeaseReceiptID,
        ReversalReason: data.ReversalReason,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt GL posting reversed successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt GL posting reversed successfully",
        ReversalGLVoucherNo: response.data?.ReversalGLVoucherNo || response.ReversalGLVoucherNo,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reverse receipt GL posting",
    };
  }

  /**
   * Get receipts by customer
   * @param customerId - The customer ID
   * @returns Array of receipts for the customer
   */
  async getReceiptsByCustomer(customerId: number): Promise<LeaseReceipt[]> {
    return this.searchReceipts({ filterCustomerID: customerId });
  }

  /**
   * Get receipts by invoice
   * @param invoiceId - The invoice ID
   * @returns Array of receipts for the invoice
   */
  async getReceiptsByInvoice(invoiceId: number): Promise<LeaseReceipt[]> {
    return this.searchReceipts({ filterInvoiceID: invoiceId });
  }

  /**
   * Get receipts by payment type
   * @param paymentType - The payment type
   * @returns Array of receipts with the specified payment type
   */
  async getReceiptsByPaymentType(paymentType: string): Promise<LeaseReceipt[]> {
    return this.searchReceipts({ filterPaymentType: paymentType });
  }

  /**
   * Get receipts by payment status
   * @param paymentStatus - The payment status
   * @returns Array of receipts with the specified payment status
   */
  async getReceiptsByPaymentStatus(paymentStatus: string): Promise<LeaseReceipt[]> {
    return this.searchReceipts({ filterPaymentStatus: paymentStatus });
  }

  /**
   * Get receipts for a date range
   * @param fromDate - Start date
   * @param toDate - End date
   * @returns Array of receipts in the date range
   */
  async getReceiptsByDateRange(fromDate: string | Date, toDate: string | Date): Promise<LeaseReceipt[]> {
    return this.searchReceipts({ filterFromDate: fromDate, filterToDate: toDate });
  }

  /**
   * Get posted receipts
   * @returns Array of posted receipts
   */
  async getPostedReceipts(): Promise<LeaseReceipt[]> {
    return this.searchReceipts({ filterIsPosted: true });
  }

  /**
   * Get advance payment receipts
   * @returns Array of advance payment receipts
   */
  async getAdvancePaymentReceipts(): Promise<LeaseReceipt[]> {
    const allReceipts = await this.getAllReceipts();
    return allReceipts.filter((receipt) => receipt.IsAdvancePayment);
  }

  /**
   * Get cash receipts
   * @returns Array of cash receipts
   */
  async getCashReceipts(): Promise<LeaseReceipt[]> {
    return this.getReceiptsByPaymentType(PaymentType.CASH);
  }

  /**
   * Get cheque receipts
   * @returns Array of cheque receipts
   */
  async getChequeReceipts(): Promise<LeaseReceipt[]> {
    return this.getReceiptsByPaymentType(PaymentType.CHEQUE);
  }

  /**
   * Get bank transfer receipts
   * @returns Array of bank transfer receipts
   */
  async getBankTransferReceipts(): Promise<LeaseReceipt[]> {
    return this.getReceiptsByPaymentType(PaymentType.BANK_TRANSFER);
  }

  /**
   * Get receipts that are pending clearance
   * @returns Array of receipts pending clearance
   */
  async getReceiptsPendingClearance(): Promise<LeaseReceipt[]> {
    const allReceipts = await this.getAllReceipts();
    return allReceipts.filter(
      (receipt) =>
        receipt.PaymentType === PaymentType.CHEQUE && !receipt.ClearanceDate && receipt.PaymentStatus !== PaymentStatus.BOUNCED && receipt.PaymentStatus !== PaymentStatus.CANCELLED
    );
  }

  /**
   * Get bounced receipts
   * @returns Array of bounced receipts
   */
  async getBouncedReceipts(): Promise<LeaseReceipt[]> {
    return this.getReceiptsByPaymentStatus(PaymentStatus.BOUNCED);
  }

  /**
   * Update receipt clearance status
   * @param receiptId - The receipt ID
   * @param clearanceDate - The clearance date
   * @param status - The new payment status
   * @returns Response with status
   */
  async updateReceiptClearance(receiptId: number, clearanceDate: string | Date, status: PaymentStatus): Promise<ApiResponse> {
    return this.updateReceipt({
      receipt: {
        LeaseReceiptID: receiptId,
        ClearanceDate: clearanceDate,
        PaymentStatus: status,
      },
    });
  }

  /**
   * Mark receipt as bounced
   * @param receiptId - The receipt ID
   * @param reason - The bounce reason
   * @returns Response with status
   */
  async markReceiptAsBounced(receiptId: number, reason?: string): Promise<ApiResponse> {
    return this.updateReceipt({
      receipt: {
        LeaseReceiptID: receiptId,
        PaymentStatus: PaymentStatus.BOUNCED,
        Notes: reason ? `Bounced: ${reason}` : "Bounced",
      },
    });
  }

  /**
   * Get receipts requiring deposit
   * @returns Array of receipts that need to be deposited
   */
  async getReceiptsRequiringDeposit(): Promise<LeaseReceipt[]> {
    const allReceipts = await this.getAllReceipts();
    return allReceipts.filter((receipt) => receipt.PaymentType === PaymentType.CHEQUE && !receipt.DepositDate && receipt.PaymentStatus === PaymentStatus.RECEIVED);
  }

  /**
   * Update receipt deposit information
   * @param receiptId - The receipt ID
   * @param depositedBankId - The deposited bank ID
   * @param depositDate - The deposit date
   * @returns Response with status
   */
  async updateReceiptDeposit(receiptId: number, depositedBankId: number, depositDate: string | Date): Promise<ApiResponse> {
    return this.updateReceipt({
      receipt: {
        LeaseReceiptID: receiptId,
        DepositedBankID: depositedBankId,
        DepositDate: depositDate,
        PaymentStatus: PaymentStatus.DEPOSITED,
      },
    });
  }

  /**
   * Get receipts that can be reversed
   * @returns Array of receipts that can have their GL posting reversed
   */
  async getReceiptsEligibleForReversal(): Promise<LeaseReceipt[]> {
    const allReceipts = await this.getAllReceipts();
    return allReceipts.filter((receipt) => receipt.IsPosted && receipt.PaymentStatus !== PaymentStatus.REVERSED && receipt.PaymentStatus !== PaymentStatus.CANCELLED);
  }

  /**
   * Validate receipt data before posting
   * @param receiptId - The receipt ID to validate
   * @returns Validation result with any errors
   */
  async validateReceiptForPosting(receiptId: number): Promise<{ isValid: boolean; errors: string[] }> {
    const receipt = await this.getReceiptById(receiptId);
    const errors: string[] = [];

    if (!receipt) {
      errors.push("Receipt not found");
      return { isValid: false, errors };
    }

    if (receipt.IsPosted) {
      errors.push("Receipt is already posted to GL");
    }

    if (receipt.ReceivedAmount <= 0) {
      errors.push("Received amount must be greater than zero");
    }

    if (!receipt.CustomerID) {
      errors.push("Customer is required");
    }

    if (!receipt.CompanyID) {
      errors.push("Company is required");
    }

    if (!receipt.AccountID) {
      errors.push("Cash/Bank account is required for GL posting");
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Helper method to format dates for SQL Server
   * @param date - Date to format
   * @returns Formatted date string
   */
  private formatDate(date: string | Date): string {
    if (!date) return "";

    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    // Format as YYYY-MM-DD for SQL Server DATE type
    return d.toISOString().split("T")[0];
  }
}

// Export a singleton instance
export const receiptService = new ReceiptService();
