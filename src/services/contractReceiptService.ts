// src/services/contractReceiptService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  ContractReceipt,
  ReceiptPosting,
  ReceiptCreateRequest,
  ReceiptUpdateRequest,
  ReceiptAllocationRequest,
  ReceiptPostingRequest,
  BulkReceiptPostingRequest,
  PostingReversalRequest,
  ReceiptSearchParams,
  BulkOperationRequest,
  ReceiptReportParams,
  ReceiptStatistics,
  ReceiptDashboardData,
  UnpostedReceipt,
  ReceiptValidationResponse,
  PostingValidationResponse,
  AllocationValidationResponse,
  ApiResponse,
  ReceiptCreateResponse,
  PostingResponse,
  BulkOperationResponse,
  SelectedReceiptForPosting,
  InvoiceAllocation,
  BulkReceiptOperation,
  ReceiptExportOptions,
  ReceiptSummary,
  BankDepositSummary,
  OutstandingDepositItem,
  CONTRACT_RECEIPT_MODES,
  PAYMENT_TYPE,
  PAYMENT_STATUS,
  ALLOCATION_MODE,
  BULK_OPERATION_TYPE,
  REPORT_TYPE,
} from "../types/contractReceiptTypes";

// Re-export types for convenience
export type {
  ContractReceipt,
  ReceiptCreateRequest,
  ReceiptUpdateRequest,
  ReceiptSearchParams,
  ReceiptPostingRequest,
  BulkReceiptPostingRequest,
  PostingReversalRequest,
  ReceiptStatistics,
  ReceiptDashboardData,
  SelectedReceiptForPosting,
};

/**
 * Service for contract receipt management operations
 */
class ContractReceiptService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/ContractReceiptManagement");
  }

  // ========== Receipt CRUD Methods ==========

  /**
   * Create a new receipt
   * @param data - The receipt creation request data
   * @returns Response with status and newly created receipt details
   */
  async createReceipt(data: ReceiptCreateRequest): Promise<ReceiptCreateResponse> {
    // Validate required parameters
    if (!data.CustomerID || !data.CompanyID || !data.FiscalYearID) {
      return {
        Status: 0,
        Message: "Customer ID, Company ID, and Fiscal Year ID are required.",
      };
    }

    if (!data.ReceivedAmount || data.ReceivedAmount <= 0) {
      return {
        Status: 0,
        Message: "Valid Received Amount is required.",
      };
    }

    // Prepare invoice allocations JSON if provided
    const invoiceAllocationsJSON = data.InvoiceAllocations && data.InvoiceAllocations.length > 0 ? JSON.stringify(data.InvoiceAllocations) : null;

    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.CREATE_RECEIPT,
      parameters: {
        CustomerID: data.CustomerID,
        CompanyID: data.CompanyID,
        FiscalYearID: data.FiscalYearID,
        ReceivedAmount: data.ReceivedAmount,
        ReceiptDate: data.ReceiptDate ? new Date(data.ReceiptDate).toISOString().split("T")[0] : undefined,
        ReceiptNo: data.ReceiptNo,
        LeaseInvoiceID: data.LeaseInvoiceID,
        PaymentType: data.PaymentType || PAYMENT_TYPE.CASH,
        PaymentStatus: data.PaymentStatus || PAYMENT_STATUS.RECEIVED,
        CurrencyID: data.CurrencyID,
        ExchangeRate: data.ExchangeRate,
        BankID: data.BankID,
        BankAccountNo: data.BankAccountNo,
        ChequeNo: data.ChequeNo,
        ChequeDate: data.ChequeDate ? new Date(data.ChequeDate).toISOString().split("T")[0] : undefined,
        TransactionReference: data.TransactionReference,
        DepositedBankID: data.DepositedBankID,
        DepositDate: data.DepositDate ? new Date(data.DepositDate).toISOString().split("T")[0] : undefined,
        ClearanceDate: data.ClearanceDate ? new Date(data.ClearanceDate).toISOString().split("T")[0] : undefined,
        IsAdvancePayment: data.IsAdvancePayment || false,
        SecurityDepositAmount: data.SecurityDepositAmount,
        PenaltyAmount: data.PenaltyAmount,
        DiscountAmount: data.DiscountAmount,
        ReceivedByUserID: data.ReceivedByUserID,
        AccountID: data.AccountID,
        Notes: data.Notes,

        // Auto-posting parameters
        AutoPost: data.AutoPost || false,
        PostingDate: data.PostingDate ? new Date(data.PostingDate).toISOString().split("T")[0] : undefined,
        DebitAccountID: data.DebitAccountID,
        CreditAccountID: data.CreditAccountID,
        PostingNarration: data.PostingNarration,
        PostingReference: data.PostingReference,

        // Multiple invoice allocation
        AllocationMode: data.AllocationMode,
        InvoiceAllocationsJSON: invoiceAllocationsJSON,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt created successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt created successfully",
        NewReceiptID: response.NewReceiptID,
        ReceiptNo: response.ReceiptNo,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create receipt",
    };
  }

  /**
   * Update an existing receipt
   * @param data - The receipt update request data
   * @returns Response with status
   */
  async updateReceipt(data: ReceiptUpdateRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.UPDATE_RECEIPT,
      parameters: {
        LeaseReceiptID: data.LeaseReceiptID,
        ReceiptNo: data.ReceiptNo,
        ReceiptDate: data.ReceiptDate ? new Date(data.ReceiptDate).toISOString().split("T")[0] : undefined,
        LeaseInvoiceID: data.LeaseInvoiceID,
        PaymentType: data.PaymentType,
        PaymentStatus: data.PaymentStatus,
        ReceivedAmount: data.ReceivedAmount,
        CurrencyID: data.CurrencyID,
        ExchangeRate: data.ExchangeRate,
        BankID: data.BankID,
        BankAccountNo: data.BankAccountNo,
        ChequeNo: data.ChequeNo,
        ChequeDate: data.ChequeDate ? new Date(data.ChequeDate).toISOString().split("T")[0] : undefined,
        TransactionReference: data.TransactionReference,
        DepositedBankID: data.DepositedBankID,
        DepositDate: data.DepositDate ? new Date(data.DepositDate).toISOString().split("T")[0] : undefined,
        ClearanceDate: data.ClearanceDate ? new Date(data.ClearanceDate).toISOString().split("T")[0] : undefined,
        IsAdvancePayment: data.IsAdvancePayment,
        SecurityDepositAmount: data.SecurityDepositAmount,
        PenaltyAmount: data.PenaltyAmount,
        DiscountAmount: data.DiscountAmount,
        ReceivedByUserID: data.ReceivedByUserID,
        AccountID: data.AccountID,
        Notes: data.Notes,
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
   * Get all active receipts
   * @returns Array of receipts
   */
  async getAllReceipts(): Promise<ContractReceipt[]> {
    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.GET_ALL_RECEIPTS,
      parameters: {},
    };

    const response = await this.execute<ContractReceipt[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a receipt by ID with related data
   * @param receiptId - The ID of the receipt to fetch
   * @returns Receipt details with postings
   */
  async getReceiptById(receiptId: number): Promise<{
    receipt: ContractReceipt | null;
    postings: ReceiptPosting[];
  }> {
    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.GET_RECEIPT_BY_ID,
      parameters: {
        LeaseReceiptID: receiptId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        receipt: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        postings: response.table2 || [],
      };
    }

    return { receipt: null, postings: [] };
  }

  /**
   * Delete a receipt
   * @param receiptId - The ID of the receipt to delete
   * @returns Response with status
   */
  async deleteReceipt(receiptId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.DELETE_RECEIPT,
      parameters: {
        LeaseReceiptID: receiptId,
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

  // ========== Search and Filter Methods ==========

  /**
   * Search for receipts with filters
   * @param params - Search parameters
   * @returns Array of matching receipts
   */
  async searchReceipts(params: ReceiptSearchParams = {}): Promise<ContractReceipt[]> {
    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.SEARCH_RECEIPTS,
      parameters: {
        SearchText: params.searchText,
        FilterPaymentStatus: params.FilterPaymentStatus,
        FilterPaymentType: params.FilterPaymentType,
        FilterPropertyID: params.FilterPropertyID,
        FilterUnitID: params.FilterUnitID,
        FilterCustomerID: params.FilterCustomerID,
        FilterContractID: params.FilterContractID,
        FilterFromDate: params.FilterFromDate ? new Date(params.FilterFromDate).toISOString().split("T")[0] : undefined,
        FilterToDate: params.FilterToDate ? new Date(params.FilterToDate).toISOString().split("T")[0] : undefined,
        FilterDepositFromDate: params.FilterDepositFromDate ? new Date(params.FilterDepositFromDate).toISOString().split("T")[0] : undefined,
        FilterDepositToDate: params.FilterDepositToDate ? new Date(params.FilterDepositToDate).toISOString().split("T")[0] : undefined,
        FilterPostedOnly: params.FilterPostedOnly,
        FilterUnpostedOnly: params.FilterUnpostedOnly,
        FilterAdvanceOnly: params.FilterAdvanceOnly,
        FilterBankID: params.FilterBankID,
        FilterReceivedByUserID: params.FilterReceivedByUserID,
        FilterAmountFrom: params.FilterAmountFrom,
        FilterAmountTo: params.FilterAmountTo,
        CompanyID: params.CompanyID,
        FiscalYearID: params.FiscalYearID,
      },
    };

    const response = await this.execute<ContractReceipt[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Change receipt payment status
   * @param receiptId - The ID of the receipt
   * @param status - The new payment status
   * @param clearanceDate - Optional clearance date for cleared status
   * @returns Response with status
   */
  async changeReceiptStatus(receiptId: number, status: string, clearanceDate?: Date): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.CHANGE_RECEIPT_STATUS,
      parameters: {
        LeaseReceiptID: receiptId,
        PaymentStatus: status,
        ClearanceDate: clearanceDate ? clearanceDate.toISOString().split("T")[0] : undefined,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`Receipt status changed to ${status} successfully`);
      return {
        Status: 1,
        Message: response.message || `Receipt status changed to ${status} successfully`,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to change receipt status",
    };
  }

  // ========== Statistics and Reporting Methods ==========

  /**
   * Get receipt statistics and dashboard data
   * @param companyId - Optional company filter
   * @param fiscalYearId - Optional fiscal year filter
   * @returns Receipt statistics
   */
  async getReceiptStatistics(companyId?: number, fiscalYearId?: number): Promise<ReceiptStatistics> {
    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.GET_RECEIPT_STATISTICS,
      parameters: {
        CompanyID: companyId,
        FiscalYearID: fiscalYearId,
      },
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        statusCounts: response.table1 || [],
        paymentTypeCounts: response.table2 || [],
        monthlyTrends: response.table3 || [],
        pendingDeposits: Array.isArray(response.table4)
          ? response.table4[0] || { PendingDepositCount: 0, PendingDepositAmount: 0, AvgDaysWaiting: 0 }
          : response.table4 || { PendingDepositCount: 0, PendingDepositAmount: 0, AvgDaysWaiting: 0 },
      };
    }

    return {
      statusCounts: [],
      paymentTypeCounts: [],
      monthlyTrends: [],
      pendingDeposits: { PendingDepositCount: 0, PendingDepositAmount: 0, AvgDaysWaiting: 0 },
    };
  }

  /**
   * Get dashboard data for receipt management
   * @param companyId - Optional company filter
   * @param fiscalYearId - Optional fiscal year filter
   * @returns Dashboard data
   */
  async getDashboardData(companyId?: number, fiscalYearId?: number): Promise<ReceiptDashboardData> {
    const statistics = await this.getReceiptStatistics(companyId, fiscalYearId);
    const recentReceipts = await this.searchReceipts({
      CompanyID: companyId,
      FiscalYearID: fiscalYearId,
    });

    // Calculate dashboard metrics
    const totalAmounts = statistics.statusCounts.reduce(
      (acc, curr) => ({
        total: acc.total + curr.TotalAmount,
        advance: acc.advance + curr.AdvanceAmount,
        securityDeposit: acc.securityDeposit + curr.SecurityDepositTotal,
      }),
      { total: 0, advance: 0, securityDeposit: 0 }
    );

    const postedAmount = recentReceipts.filter((receipt) => receipt.IsPosted).reduce((sum, receipt) => sum + receipt.ReceivedAmount, 0);

    const unpostedAmount = recentReceipts.filter((receipt) => !receipt.IsPosted).reduce((sum, receipt) => sum + receipt.ReceivedAmount, 0);

    const pendingDeposits = recentReceipts.filter((receipt) => receipt.RequiresDeposit && !receipt.DepositDate).length;

    const overdueDeposits = recentReceipts.filter((receipt) => receipt.RequiresDeposit && !receipt.DepositDate && (receipt.DaysToDeposit || 0) > 7).length;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const currentMonthData = statistics.monthlyTrends.find((trend) => trend.ReceiptMonth === currentMonth && trend.ReceiptYear === currentYear);

    return {
      totalReceipts: statistics.statusCounts.reduce((sum, status) => sum + status.ReceiptCount, 0),
      totalAmount: totalAmounts.total,
      postedAmount: postedAmount,
      unpostedAmount: unpostedAmount,
      advancePayments: totalAmounts.advance,
      securityDeposits: totalAmounts.securityDeposit,
      pendingDeposits: pendingDeposits,
      overdueDeposits: overdueDeposits,
      currentMonthReceived: currentMonthData?.TotalAmount || 0,
      recentReceipts: recentReceipts.slice(0, 10),
      pendingDepositList: recentReceipts.filter((receipt) => receipt.RequiresDeposit && !receipt.DepositDate).slice(0, 10),
      receiptTrends: statistics.monthlyTrends.map((trend) => ({
        month: `${trend.ReceiptYear}-${String(trend.ReceiptMonth).padStart(2, "0")}`,
        received: trend.TotalAmount,
        posted: trend.PostedAmount,
      })),
    };
  }

  // ========== Allocation Methods ==========

  /**
   * Allocate receipt to a specific invoice
   * @param allocationData - The allocation request data
   * @returns Response with allocation status
   */
  async allocateReceiptToInvoice(allocationData: ReceiptAllocationRequest): Promise<ApiResponse> {
    if (!allocationData.LeaseReceiptID || !allocationData.LeaseInvoiceID) {
      return {
        Status: 0,
        Message: "Receipt ID and Invoice ID are required.",
      };
    }

    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.ALLOCATE_TO_INVOICE,
      parameters: {
        LeaseReceiptID: allocationData.LeaseReceiptID,
        LeaseInvoiceID: allocationData.LeaseInvoiceID,
        ReceivedAmount: allocationData.ReceivedAmount,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt allocated to invoice successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt allocated to invoice successfully",
        AllocatedAmount: response.AllocatedAmount,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to allocate receipt to invoice",
    };
  }

  /**
   * Allocate receipt to multiple invoices
   * @param allocationData - The multiple allocation request data
   * @returns Response with allocation status
   */
  async allocateReceiptToMultipleInvoices(allocationData: ReceiptAllocationRequest): Promise<ApiResponse> {
    if (!allocationData.LeaseReceiptID || !allocationData.InvoiceAllocations || allocationData.InvoiceAllocations.length === 0) {
      return {
        Status: 0,
        Message: "Receipt ID and invoice allocations are required.",
      };
    }

    // Prepare invoice allocations JSON
    const invoiceAllocationsJSON = JSON.stringify(allocationData.InvoiceAllocations);

    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.ALLOCATE_TO_MULTIPLE_INVOICES,
      parameters: {
        LeaseReceiptID: allocationData.LeaseReceiptID,
        InvoiceAllocationsJSON: invoiceAllocationsJSON,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt allocated to multiple invoices successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt allocated to multiple invoices successfully",
        TotalAllocated: response.TotalAllocated,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to allocate receipt to multiple invoices",
    };
  }

  // ========== Posting Methods ==========

  /**
   * Get unposted receipts for posting
   * @param filters - Filter parameters
   * @returns Array of unposted receipts
   */
  async getUnpostedReceipts(filters: ReceiptSearchParams = {}): Promise<UnpostedReceipt[]> {
    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.GET_UNPOSTED_RECEIPTS,
      parameters: {
        CompanyID: filters.CompanyID,
        FiscalYearID: filters.FiscalYearID,
        FilterCustomerID: filters.FilterCustomerID,
        FilterFromDate: filters.FilterFromDate ? new Date(filters.FilterFromDate).toISOString().split("T")[0] : undefined,
        FilterToDate: filters.FilterToDate ? new Date(filters.FilterToDate).toISOString().split("T")[0] : undefined,
        FilterBankID: filters.FilterBankID,
      },
    };

    const response = await this.execute<UnpostedReceipt[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Post a single receipt
   * @param postingData - The posting request data
   * @returns Response with posting status
   */
  async postSingleReceipt(postingData: ReceiptPostingRequest): Promise<PostingResponse> {
    // Validate required parameters
    if (!postingData.LeaseReceiptID || !postingData.PostingDate || !postingData.DebitAccountID || !postingData.CreditAccountID) {
      return {
        Status: 0,
        Message: "Receipt ID, Posting Date, Debit Account, and Credit Account are required.",
      };
    }

    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.POST_RECEIPT,
      parameters: {
        LeaseReceiptID: postingData.LeaseReceiptID,
        PostingDate: new Date(postingData.PostingDate).toISOString().split("T")[0],
        DebitAccountID: postingData.DebitAccountID,
        CreditAccountID: postingData.CreditAccountID,
        PostingNarration: postingData.PostingNarration,
        PostingReference: postingData.PostingReference,
        ExchangeRate: postingData.ExchangeRate,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt posted successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt posted successfully",
        VoucherNo: response.VoucherNo,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to post receipt",
    };
  }

  /**
   * Reverse a receipt posting
   * @param reversalData - The reversal request data
   * @returns Response with reversal status
   */
  async reverseReceiptPosting(reversalData: PostingReversalRequest): Promise<ApiResponse> {
    if (!reversalData.PostingID && !reversalData.LeaseReceiptID) {
      return {
        Status: 0,
        Message: "Either Posting ID or Receipt ID is required for reversal.",
      };
    }

    if (!reversalData.ReversalReason || reversalData.ReversalReason.trim().length === 0) {
      return {
        Status: 0,
        Message: "Reversal reason is required.",
      };
    }

    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.REVERSE_POSTING,
      parameters: {
        PostingID: reversalData.PostingID,
        LeaseReceiptID: reversalData.LeaseReceiptID,
        ReversalReason: reversalData.ReversalReason,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt posting reversed successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt posting reversed successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reverse receipt posting",
    };
  }

  // ========== Customer and Invoice Methods ==========

  /**
   * Get receipts by customer
   * @param customerId - The customer ID
   * @param filters - Optional additional filters
   * @returns Array of receipts for the customer
   */
  async getReceiptsByCustomer(customerId: number, filters: ReceiptSearchParams = {}): Promise<ContractReceipt[]> {
    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.GET_RECEIPTS_BY_CUSTOMER,
      parameters: {
        CustomerID: customerId,
        FilterFromDate: filters.FilterFromDate ? new Date(filters.FilterFromDate).toISOString().split("T")[0] : undefined,
        FilterToDate: filters.FilterToDate ? new Date(filters.FilterToDate).toISOString().split("T")[0] : undefined,
      },
    };

    const response = await this.execute<ContractReceipt[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get receipts by invoice
   * @param invoiceId - The invoice ID
   * @returns Array of receipts for the invoice
   */
  async getReceiptsByInvoice(invoiceId: number): Promise<ContractReceipt[]> {
    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.GET_RECEIPTS_BY_INVOICE,
      parameters: {
        LeaseInvoiceID: invoiceId,
      },
    };

    const response = await this.execute<ContractReceipt[]>(request);
    return response.success ? response.data || [] : [];
  }

  // ========== Bulk Operations Methods ==========

  /**
   * Perform bulk operations on receipts
   * @param operationData - The bulk operation request data
   * @returns Response with operation status and counts
   */
  async performBulkOperation(operationData: BulkOperationRequest): Promise<BulkOperationResponse> {
    if (!operationData.SelectedReceipts || operationData.SelectedReceipts.length === 0) {
      return {
        Status: 0,
        Message: "No receipts selected for bulk operation.",
        UpdatedCount: 0,
        FailedCount: 0,
      };
    }

    // Prepare selected receipts JSON
    const selectedReceiptsJSON = JSON.stringify(operationData.SelectedReceipts);

    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.BULK_UPDATE_RECEIPTS,
      parameters: {
        BulkOperation: operationData.BulkOperation,
        SelectedReceiptsJSON: selectedReceiptsJSON,
        BulkPaymentStatus: operationData.BulkPaymentStatus,
        BulkDepositDate: operationData.BulkDepositDate ? new Date(operationData.BulkDepositDate).toISOString().split("T")[0] : undefined,
        BulkDepositBankID: operationData.BulkDepositBankID,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`Bulk operation completed. Updated: ${response.UpdatedCount}, Failed: ${response.FailedCount}`);
      return {
        Status: 1,
        Message: response.message || "Bulk operation completed",
        UpdatedCount: response.UpdatedCount || 0,
        FailedCount: response.FailedCount || 0,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to perform bulk operation",
      UpdatedCount: 0,
      FailedCount: 0,
    };
  }

  // ========== Reporting Methods ==========

  /**
   * Get receipt reports
   * @param reportParams - Report parameters
   * @returns Report data based on report type
   */
  async getReceiptReports(reportParams: ReceiptReportParams): Promise<{
    summaryData?: ReceiptSummary[];
    bankDepositData?: BankDepositSummary[];
    outstandingData?: OutstandingDepositItem[];
  }> {
    const request: BaseRequest = {
      mode: CONTRACT_RECEIPT_MODES.GET_RECEIPT_REPORTS,
      parameters: {
        ReportType: reportParams.ReportType,
        GroupBy: reportParams.GroupBy,
        FilterFromDate: reportParams.FilterFromDate ? new Date(reportParams.FilterFromDate).toISOString().split("T")[0] : undefined,
        FilterToDate: reportParams.FilterToDate ? new Date(reportParams.FilterToDate).toISOString().split("T")[0] : undefined,
        FilterCustomerID: reportParams.FilterCustomerID,
        FilterPropertyID: reportParams.FilterPropertyID,
        FilterBankID: reportParams.FilterBankID,
        CompanyID: reportParams.CompanyID,
      },
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        summaryData: reportParams.ReportType === REPORT_TYPE.SUMMARY ? response.data || [] : undefined,
        bankDepositData: reportParams.ReportType === REPORT_TYPE.BANK_DEPOSIT ? response.data || [] : undefined,
        outstandingData: reportParams.ReportType === REPORT_TYPE.OUTSTANDING ? response.data || [] : undefined,
      };
    }

    return {};
  }

  // ========== Validation Methods ==========

  /**
   * Validate receipt data before creation or update
   * @param receiptData - The receipt data to validate
   * @returns Validation response with errors and warnings
   */
  validateReceiptData(receiptData: Partial<ReceiptCreateRequest | ReceiptUpdateRequest>): ReceiptValidationResponse {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation for creation
    if ("CustomerID" in receiptData) {
      if (!receiptData.CustomerID) {
        errors.push("Customer is required.");
      }

      if (!receiptData.CompanyID) {
        errors.push("Company is required.");
      }

      if (!receiptData.FiscalYearID) {
        errors.push("Fiscal Year is required.");
      }
    }

    // Amount validation
    if (receiptData.ReceivedAmount !== undefined && receiptData.ReceivedAmount <= 0) {
      errors.push("Received amount must be greater than zero.");
    }

    // Date validation
    if (receiptData.ReceiptDate) {
      const receiptDate = new Date(receiptData.ReceiptDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (receiptDate > today) {
        warnings.push("Receipt date is in the future.");
      }
    }

    // Cheque validation
    if (receiptData.PaymentType === PAYMENT_TYPE.CHEQUE) {
      if (!receiptData.ChequeNo) {
        errors.push("Cheque number is required for cheque payments.");
      }

      if (!receiptData.ChequeDate) {
        warnings.push("Cheque date should be provided for cheque payments.");
      }

      if (!receiptData.BankID) {
        warnings.push("Bank should be specified for cheque payments.");
      }
    }

    // Bank transfer validation
    if (receiptData.PaymentType === PAYMENT_TYPE.BANK_TRANSFER) {
      if (!receiptData.TransactionReference) {
        warnings.push("Transaction reference should be provided for bank transfers.");
      }

      if (!receiptData.BankID) {
        warnings.push("Bank should be specified for bank transfers.");
      }
    }

    // Deposit validation
    if (receiptData.DepositDate && receiptData.ReceiptDate) {
      const depositDate = new Date(receiptData.DepositDate);
      const receiptDate = new Date(receiptData.ReceiptDate);

      if (depositDate < receiptDate) {
        errors.push("Deposit date cannot be before receipt date.");
      }
    }

    return {
      IsValid: errors.length === 0,
      Errors: errors,
      Warnings: warnings,
    };
  }

  /**
   * Validate posting data before posting receipts
   * @param postingData - The posting data to validate
   * @returns Posting validation response
   */
  validatePostingData(postingData: ReceiptPostingRequest | BulkReceiptPostingRequest): PostingValidationResponse {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validatedTransactions: SelectedReceiptForPosting[] = [];

    // Common validation
    if (!postingData.PostingDate) {
      errors.push("Posting date is required.");
    }

    // Validate posting date
    if (postingData.PostingDate) {
      const postingDate = new Date(postingData.PostingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (postingDate > today) {
        warnings.push("Posting date is in the future.");
      }

      // Check for weekend posting
      const dayOfWeek = postingDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        warnings.push("Posting date falls on a weekend.");
      }
    }

    // Specific validation for different posting types
    if ("LeaseReceiptID" in postingData) {
      // Single receipt posting validation
      if (!postingData.DebitAccountID) {
        errors.push("Debit account is required.");
      }

      if (!postingData.CreditAccountID) {
        errors.push("Credit account is required.");
      }

      if (postingData.DebitAccountID === postingData.CreditAccountID) {
        errors.push("Debit and credit accounts cannot be the same.");
      }
    } else {
      // Bulk posting validation
      if (!postingData.SelectedReceipts || postingData.SelectedReceipts.length === 0) {
        errors.push("No receipts selected for posting.");
      } else {
        postingData.SelectedReceipts.forEach((receipt, index) => {
          if (!receipt.LeaseReceiptID) {
            errors.push(`Receipt ${index + 1}: Receipt ID is required.`);
          }

          if (!receipt.PostingAmount || receipt.PostingAmount <= 0) {
            errors.push(`Receipt ${index + 1}: Valid posting amount is required.`);
          }

          if (!receipt.DebitAccountID) {
            errors.push(`Receipt ${index + 1}: Debit account is required.`);
          }

          if (!receipt.CreditAccountID) {
            errors.push(`Receipt ${index + 1}: Credit account is required.`);
          }

          if (receipt.DebitAccountID === receipt.CreditAccountID) {
            errors.push(`Receipt ${index + 1}: Debit and credit accounts cannot be the same.`);
          }
        });

        validatedTransactions = postingData.SelectedReceipts.filter(
          (receipt) =>
            receipt.LeaseReceiptID && receipt.PostingAmount > 0 && receipt.DebitAccountID && receipt.CreditAccountID && receipt.DebitAccountID !== receipt.CreditAccountID
        );
      }
    }

    return {
      IsValid: errors.length === 0,
      Errors: errors,
      Warnings: warnings,
      ValidatedTransactions: validatedTransactions,
    };
  }

  /**
   * Validate allocation data before allocating receipts to invoices
   * @param allocationData - The allocation data to validate
   * @returns Allocation validation response
   */
  validateAllocationData(allocationData: ReceiptAllocationRequest): AllocationValidationResponse {
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalAllocation = 0;

    if (!allocationData.LeaseReceiptID) {
      errors.push("Receipt ID is required.");
    }

    if (allocationData.InvoiceAllocations) {
      allocationData.InvoiceAllocations.forEach((allocation, index) => {
        if (!allocation.LeaseInvoiceID) {
          errors.push(`Allocation ${index + 1}: Invoice ID is required.`);
        }

        if (!allocation.AllocationAmount || allocation.AllocationAmount <= 0) {
          errors.push(`Allocation ${index + 1}: Valid allocation amount is required.`);
        }

        totalAllocation += allocation.AllocationAmount || 0;
      });

      // Note: Receipt amount validation would need to be done server-side as we don't have the receipt data here
      if (totalAllocation <= 0) {
        errors.push("Total allocation amount must be greater than zero.");
      }
    } else if (!allocationData.LeaseInvoiceID) {
      errors.push("Either Invoice ID or Invoice Allocations are required.");
    }

    return {
      IsValid: errors.length === 0,
      Errors: errors,
      Warnings: warnings,
      TotalAllocation: totalAllocation,
      RemainingAmount: 0, // Would be calculated server-side
    };
  }

  // ========== Export and Utility Methods ==========

  /**
   * Export receipts to CSV format
   * @param receipts - Array of receipts to export
   * @param options - Export options
   * @returns CSV string
   */
  exportReceiptsToCSV(receipts: ContractReceipt[], options: ReceiptExportOptions = { format: "CSV", includeHeaders: true, includePostings: false }): string {
    if (!receipts || receipts.length === 0) {
      return options.includeHeaders ? "No data to export" : "";
    }

    const headers = [
      "Receipt No",
      "Receipt Date",
      "Customer Name",
      "Invoice No",
      "Payment Type",
      "Payment Status",
      "Received Amount",
      "Security Deposit",
      "Penalty Amount",
      "Discount Amount",
      "Is Advance Payment",
      "Bank Name",
      "Cheque No",
      "Transaction Reference",
      "Deposit Date",
      "Clearance Date",
      "Is Posted",
      "Notes",
    ];

    const csvRows: string[] = [];

    if (options.includeHeaders) {
      csvRows.push(headers.join(","));
    }

    receipts.forEach((receipt) => {
      const row = [
        `"${receipt.ReceiptNo}"`,
        `"${new Date(receipt.ReceiptDate).toLocaleDateString()}"`,
        `"${receipt.CustomerName || ""}"`,
        `"${receipt.InvoiceNo || ""}"`,
        `"${receipt.PaymentType}"`,
        `"${receipt.PaymentStatus}"`,
        receipt.ReceivedAmount.toFixed(2),
        (receipt.SecurityDepositAmount || 0).toFixed(2),
        (receipt.PenaltyAmount || 0).toFixed(2),
        (receipt.DiscountAmount || 0).toFixed(2),
        receipt.IsAdvancePayment ? "Yes" : "No",
        `"${receipt.BankName || ""}"`,
        `"${receipt.ChequeNo || ""}"`,
        `"${receipt.TransactionReference || ""}"`,
        `"${receipt.DepositDate ? new Date(receipt.DepositDate).toLocaleDateString() : ""}"`,
        `"${receipt.ClearanceDate ? new Date(receipt.ClearanceDate).toLocaleDateString() : ""}"`,
        receipt.IsPosted ? "Yes" : "No",
        `"${receipt.Notes || ""}"`,
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }

  /**
   * Generate receipt number
   * @param companyId - Company ID
   * @param receiptDate - Receipt date
   * @param prefix - Optional prefix (default: 'REC')
   * @returns Generated receipt number
   */
  generateReceiptNumber(companyId: number, receiptDate: Date, prefix: string = "REC"): string {
    const year = receiptDate.getFullYear().toString().slice(-2);
    const month = String(receiptDate.getMonth() + 1).padStart(2, "0");
    const timestamp = Date.now().toString().slice(-6);

    return `${prefix}-${year}${month}-${companyId}-${timestamp}`;
  }

  /**
   * Calculate days between receipt and deposit
   * @param receiptDate - Receipt date
   * @param depositDate - Deposit date (optional, uses current date if not provided)
   * @returns Number of days
   */
  calculateDaysToDeposit(receiptDate: Date, depositDate?: Date): number {
    const toDate = depositDate || new Date();
    const diffTime = Math.abs(toDate.getTime() - receiptDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get receipt status display
   * @param receipt - Receipt object
   * @returns Status display string with color indication
   */
  getReceiptStatusDisplay(receipt: ContractReceipt): { status: string; color: string; priority: number } {
    if (receipt.PaymentStatus === PAYMENT_STATUS.BOUNCED) {
      return { status: "Bounced", color: "red", priority: 1 };
    }

    if (receipt.PaymentStatus === PAYMENT_STATUS.CANCELLED) {
      return { status: "Cancelled", color: "gray", priority: 2 };
    }

    if (receipt.RequiresDeposit && !receipt.DepositDate) {
      const daysToDeposit = receipt.DaysToDeposit || 0;
      if (daysToDeposit > 7) {
        return { status: "Overdue Deposit", color: "red", priority: 3 };
      } else if (daysToDeposit > 3) {
        return { status: "Due Soon", color: "orange", priority: 4 };
      } else {
        return { status: "Pending Deposit", color: "yellow", priority: 5 };
      }
    }

    if (!receipt.IsPosted) {
      return { status: "Unposted", color: "blue", priority: 6 };
    }

    return { status: "Completed", color: "green", priority: 7 };
  }
}

// Export a singleton instance
export const leaseReceiptService = new ContractReceiptService();
