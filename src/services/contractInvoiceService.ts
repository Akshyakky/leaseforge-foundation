// src/services/contractInvoiceService.ts - Updated with Approval Methods
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  ContractInvoice,
  InvoiceGenerationRequest,
  InvoiceUpdateRequest,
  InvoiceSearchParams,
  InvoicePostingRequest,
  BulkInvoicePostingRequest,
  PostingReversalRequest,
  InvoicePaymentRequest,
  InvoiceApprovalRequest,
  InvoiceRejectionRequest,
  BulkInvoiceApprovalRequest,
  BulkInvoiceRejectionRequest,
  UnpostedInvoice,
  InvoiceStatistics,
  PostingSummary,
  InvoiceDashboardData,
  InvoiceValidationResponse,
  PostingValidationResponse,
  ApiResponse,
  InvoiceGenerationResponse,
  PostingResponse,
  InvoicePayment,
  InvoicePosting,
  CONTRACT_INVOICE_MODES,
  INVOICE_STATUS,
  APPROVAL_STATUS,
  INVOICE_TYPE,
  SelectedInvoiceForPosting,
  InvoiceExportOptions,
  ContractUnitForInvoice,
} from "../types/contractInvoiceTypes";

// Re-export types for convenience
export type {
  ContractInvoice,
  InvoiceGenerationRequest,
  InvoiceUpdateRequest,
  InvoiceSearchParams,
  InvoicePostingRequest,
  BulkInvoicePostingRequest,
  PostingReversalRequest,
  InvoicePaymentRequest,
  UnpostedInvoice,
  InvoiceStatistics,
  PostingSummary,
  InvoiceDashboardData,
  SelectedInvoiceForPosting,
};

/**
 * Service for contract invoice management operations with approval workflow
 */
class ContractInvoiceService extends BaseService {
  constructor() {
    super("/Master/contractInvoiceManagement");
  }

  // ========== Invoice Generation Methods ==========

  /**
   * Generate a single invoice from a contract
   */
  async generateSingleInvoice(data: InvoiceGenerationRequest): Promise<InvoiceGenerationResponse> {
    if (!data.CompanyID || !data.FiscalYearID) {
      return {
        Status: 0,
        Message: "Company ID and Fiscal Year ID are required.",
      };
    }

    if (!data.ContractID && !data.ContractUnitID) {
      return {
        Status: 0,
        Message: "Contract ID or Contract Unit ID is required.",
      };
    }

    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.GENERATE_INVOICE,
      parameters: {
        GenerationMode: data.GenerationMode || "Single",
        CompanyID: data.CompanyID,
        FiscalYearID: data.FiscalYearID,
        ContractID: data.ContractID,
        ContractUnitID: data.ContractUnitID,
        CustomerID: data.CustomerID,
        InvoiceDate: data.InvoiceDate ? new Date(data.InvoiceDate).toISOString().split("T")[0] : undefined,
        InvoiceType: data.InvoiceType,
        InvoiceStatus: data.InvoiceStatus,
        PeriodFromDate: data.PeriodFromDate ? new Date(data.PeriodFromDate).toISOString().split("T")[0] : undefined,
        PeriodToDate: data.PeriodToDate ? new Date(data.PeriodToDate).toISOString().split("T")[0] : undefined,
        SubTotal: data.SubTotal,
        TaxAmount: data.TaxAmount,
        DiscountAmount: data.DiscountAmount,
        TotalAmount: data.TotalAmount,
        CurrencyID: data.CurrencyID,
        ExchangeRate: data.ExchangeRate,
        PaymentTermID: data.PaymentTermID,
        TaxID: data.TaxID,
        IsRecurring: data.IsRecurring,
        RecurrencePattern: data.RecurrencePattern,
        NextInvoiceDate: data.NextInvoiceDate ? new Date(data.NextInvoiceDate).toISOString().split("T")[0] : undefined,
        Notes: data.Notes,
        InternalNotes: data.InternalNotes,
        AutoNumbering: data.AutoNumbering,
        AutoPost: data.AutoPost,
        PostingDate: data.PostingDate ? new Date(data.PostingDate).toISOString().split("T")[0] : undefined,
        DebitAccountID: data.DebitAccountID,
        CreditAccountID: data.CreditAccountID,
        PostingNarration: data.PostingNarration,
        // Approval parameters
        RequiresApproval: data.RequiresApproval,
        ApprovalStatus: data.ApprovalStatus || APPROVAL_STATUS.PENDING,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice generated successfully");
      return {
        Status: 1,
        Message: response.message || "Invoice generated successfully",
        NewInvoiceID: response.NewInvoiceID,
        InvoiceNo: response.InvoiceNo,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to generate invoice",
    };
  }

  /**
   * Generate multiple invoices from contract units
   */
  async generateBatchInvoices(data: InvoiceGenerationRequest): Promise<InvoiceGenerationResponse> {
    if (!data.CompanyID || !data.FiscalYearID) {
      return {
        Status: 0,
        Message: "Company ID and Fiscal Year ID are required.",
      };
    }

    if (!data.ContractUnits || data.ContractUnits.length === 0) {
      return {
        Status: 0,
        Message: "Contract units are required for batch generation.",
      };
    }

    const contractUnitsJSON = JSON.stringify(data.ContractUnits);

    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.GENERATE_INVOICE,
      parameters: {
        GenerationMode: data.GenerationMode || "Batch",
        CompanyID: data.CompanyID,
        FiscalYearID: data.FiscalYearID,
        InvoiceDate: data.InvoiceDate ? new Date(data.InvoiceDate).toISOString().split("T")[0] : undefined,
        InvoiceType: data.InvoiceType,
        InvoiceStatus: data.InvoiceStatus,
        CurrencyID: data.CurrencyID,
        ExchangeRate: data.ExchangeRate,
        PaymentTermID: data.PaymentTermID,
        TaxID: data.TaxID,
        IsRecurring: data.IsRecurring,
        RecurrencePattern: data.RecurrencePattern,
        NextInvoiceDate: data.NextInvoiceDate ? new Date(data.NextInvoiceDate).toISOString().split("T")[0] : undefined,
        Notes: data.Notes,
        InternalNotes: data.InternalNotes,
        AutoNumbering: data.AutoNumbering,
        BulkGeneration: data.BulkGeneration,
        ContractUnitsJSON: contractUnitsJSON,
        // Approval parameters
        RequiresApproval: data.RequiresApproval,
        ApprovalStatus: data.ApprovalStatus || APPROVAL_STATUS.PENDING,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`Batch invoice generation completed. Generated: ${response.GeneratedCount} invoices`);
      return {
        Status: 1,
        Message: response.message || "Batch invoice generation completed",
        GeneratedCount: response.GeneratedCount,
        GeneratedTotal: response.GeneratedTotal,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to generate batch invoices",
    };
  }

  // ========== Invoice CRUD Methods ==========

  /**
   * Update an existing invoice
   */
  async updateInvoice(data: InvoiceUpdateRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.UPDATE_INVOICE,
      parameters: {
        LeaseInvoiceID: data.LeaseInvoiceID,
        InvoiceNo: data.InvoiceNo,
        InvoiceDate: data.InvoiceDate ? new Date(data.InvoiceDate).toISOString().split("T")[0] : undefined,
        DueDate: data.DueDate ? new Date(data.DueDate).toISOString().split("T")[0] : undefined,
        InvoiceType: data.InvoiceType,
        InvoiceStatus: data.InvoiceStatus,
        PeriodFromDate: data.PeriodFromDate ? new Date(data.PeriodFromDate).toISOString().split("T")[0] : undefined,
        PeriodToDate: data.PeriodToDate ? new Date(data.PeriodToDate).toISOString().split("T")[0] : undefined,
        SubTotal: data.SubTotal,
        TaxAmount: data.TaxAmount,
        DiscountAmount: data.DiscountAmount,
        TotalAmount: data.TotalAmount,
        CurrencyID: data.CurrencyID,
        ExchangeRate: data.ExchangeRate,
        PaymentTermID: data.PaymentTermID,
        SalesPersonID: data.SalesPersonID,
        TaxID: data.TaxID,
        IsRecurring: data.IsRecurring,
        RecurrencePattern: data.RecurrencePattern,
        NextInvoiceDate: data.NextInvoiceDate ? new Date(data.NextInvoiceDate).toISOString().split("T")[0] : undefined,
        Notes: data.Notes,
        InternalNotes: data.InternalNotes,
        // Approval parameters
        RequiresApproval: data.RequiresApproval,
        ApprovalStatus: data.ApprovalStatus,
        ApprovalComments: data.ApprovalComments,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice updated successfully");
      return {
        Status: 1,
        Message: response.message || "Invoice updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update invoice",
    };
  }

  /**
   * Get all active invoices
   */
  async getAllInvoices(): Promise<ContractInvoice[]> {
    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.GET_ALL_INVOICES,
      parameters: {},
    };

    const response = await this.execute<ContractInvoice[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get an invoice by ID with related data
   */
  async getInvoiceById(invoiceId: number): Promise<{
    invoice: ContractInvoice | null;
    payments: InvoicePayment[];
    postings: InvoicePosting[];
  }> {
    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.GET_INVOICE_BY_ID,
      parameters: {
        LeaseInvoiceID: invoiceId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        invoice: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        payments: response.table2 || [],
        postings: response.table3 || [],
      };
    }

    return { invoice: null, payments: [], postings: [] };
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(invoiceId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.DELETE_INVOICE,
      parameters: {
        LeaseInvoiceID: invoiceId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Invoice deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete invoice",
    };
  }

  // ========== Approval Methods ==========

  /**
   * Approve an invoice
   */
  async approveInvoice(data: InvoiceApprovalRequest): Promise<ApiResponse> {
    if (!data.invoiceId) {
      return {
        Status: 0,
        Message: "Invoice ID is required for approval.",
      };
    }

    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.APPROVE_INVOICE,
      parameters: {
        LeaseInvoiceID: data.invoiceId,
        ApprovalComments: data.approvalComments,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice approved successfully");
      return {
        Status: 1,
        Message: response.message || "Invoice approved successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to approve invoice",
    };
  }

  /**
   * Reject an invoice
   */
  async rejectInvoice(data: InvoiceRejectionRequest): Promise<ApiResponse> {
    if (!data.invoiceId) {
      return {
        Status: 0,
        Message: "Invoice ID is required for rejection.",
      };
    }

    if (!data.rejectionReason || data.rejectionReason.trim().length === 0) {
      return {
        Status: 0,
        Message: "Rejection reason is required.",
      };
    }

    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.REJECT_INVOICE,
      parameters: {
        LeaseInvoiceID: data.invoiceId,
        RejectionReason: data.rejectionReason,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice rejected successfully");
      return {
        Status: 1,
        Message: response.message || "Invoice rejected successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reject invoice",
    };
  }

  /**
   * Reset invoice approval status
   */
  async resetApprovalStatus(invoiceId: number): Promise<ApiResponse> {
    if (!invoiceId) {
      return {
        Status: 0,
        Message: "Invoice ID is required to reset approval status.",
      };
    }

    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.RESET_INVOICE_APPROVAL,
      parameters: {
        LeaseInvoiceID: invoiceId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice approval status reset successfully");
      return {
        Status: 1,
        Message: response.message || "Invoice approval status reset successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reset invoice approval status",
    };
  }

  /**
   * Get invoices pending approval
   */
  async getInvoicesPendingApproval(companyId?: number, fiscalYearId?: number): Promise<ContractInvoice[]> {
    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.GET_PENDING_APPROVAL_INVOICES,
      parameters: {
        CompanyID: companyId,
        FiscalYearID: fiscalYearId,
      },
    };

    const response = await this.execute<ContractInvoice[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Bulk approve invoices
   */
  async bulkApproveInvoices(data: BulkInvoiceApprovalRequest): Promise<ApiResponse> {
    if (!data.invoiceIds || data.invoiceIds.length === 0) {
      return {
        Status: 0,
        Message: "No invoices selected for approval.",
      };
    }

    let successCount = 0;
    let failureCount = 0;

    const promises = data.invoiceIds.map(async (invoiceId) => {
      try {
        const result = await this.approveInvoice({
          invoiceId,
          approvalComments: data.approvalComments,
        });
        if (result.Status === 1) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        failureCount++;
      }
    });

    await Promise.all(promises);

    if (successCount > 0) {
      this.showSuccess(`${successCount} invoices approved successfully${failureCount > 0 ? `, ${failureCount} failed` : ""}`);
    }

    return {
      Status: successCount > 0 ? 1 : 0,
      Message: `${successCount} invoices approved successfully${failureCount > 0 ? `, ${failureCount} failed` : ""}`,
      PostedCount: successCount,
      FailedCount: failureCount,
    };
  }

  /**
   * Bulk reject invoices
   */
  async bulkRejectInvoices(data: BulkInvoiceRejectionRequest): Promise<ApiResponse> {
    if (!data.invoiceIds || data.invoiceIds.length === 0) {
      return {
        Status: 0,
        Message: "No invoices selected for rejection.",
      };
    }

    if (!data.rejectionReason || data.rejectionReason.trim().length === 0) {
      return {
        Status: 0,
        Message: "Rejection reason is required for bulk rejection.",
      };
    }

    let successCount = 0;
    let failureCount = 0;

    const promises = data.invoiceIds.map(async (invoiceId) => {
      try {
        const result = await this.rejectInvoice({
          invoiceId,
          rejectionReason: data.rejectionReason,
        });
        if (result.Status === 1) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        failureCount++;
      }
    });

    await Promise.all(promises);

    if (successCount > 0) {
      this.showSuccess(`${successCount} invoices rejected successfully${failureCount > 0 ? `, ${failureCount} failed` : ""}`);
    }

    return {
      Status: successCount > 0 ? 1 : 0,
      Message: `${successCount} invoices rejected successfully${failureCount > 0 ? `, ${failureCount} failed` : ""}`,
      PostedCount: successCount,
      FailedCount: failureCount,
    };
  }

  // ========== Search and Filter Methods ==========

  /**
   * Search for invoices with filters
   */
  async searchInvoices(params: InvoiceSearchParams = {}): Promise<ContractInvoice[]> {
    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.SEARCH_INVOICES,
      parameters: {
        SearchText: params.searchText,
        FilterInvoiceStatus: params.FilterInvoiceStatus,
        FilterInvoiceType: params.FilterInvoiceType,
        FilterApprovalStatus: params.FilterApprovalStatus,
        FilterPropertyID: params.FilterPropertyID,
        FilterUnitID: params.FilterUnitID,
        FilterCustomerID: params.FilterCustomerID,
        FilterContractID: params.FilterContractID,
        FilterFromDate: params.FilterFromDate ? new Date(params.FilterFromDate).toISOString().split("T")[0] : undefined,
        FilterToDate: params.FilterToDate ? new Date(params.FilterToDate).toISOString().split("T")[0] : undefined,
        FilterDueDateFrom: params.FilterDueDateFrom ? new Date(params.FilterDueDateFrom).toISOString().split("T")[0] : undefined,
        FilterDueDateTo: params.FilterDueDateTo ? new Date(params.FilterDueDateTo).toISOString().split("T")[0] : undefined,
        FilterPostedOnly: params.FilterPostedOnly,
        FilterUnpostedOnly: params.FilterUnpostedOnly,
        FilterOverdueOnly: params.FilterOverdueOnly,
        FilterPendingApprovalOnly: params.FilterPendingApprovalOnly,
        CompanyID: params.CompanyID,
        FiscalYearID: params.FiscalYearID,
      },
    };

    const response = await this.execute<ContractInvoice[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Change invoice status
   */
  async changeInvoiceStatus(invoiceId: number, status: string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.CHANGE_INVOICE_STATUS,
      parameters: {
        LeaseInvoiceID: invoiceId,
        InvoiceStatus: status,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`Invoice status changed to ${status} successfully`);
      return {
        Status: 1,
        Message: response.message || `Invoice status changed to ${status} successfully`,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to change invoice status",
    };
  }

  // ========== Statistics and Reporting Methods ==========

  /**
   * Get invoice statistics and dashboard data
   */
  async getInvoiceStatistics(companyId?: number, fiscalYearId?: number): Promise<InvoiceStatistics> {
    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.GET_INVOICE_STATISTICS,
      parameters: {
        CompanyID: companyId,
        FiscalYearID: fiscalYearId,
      },
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        statusCounts: response.table1 || [],
        approvalStatusCounts: response.table2 || [],
        overdueInvoices: Array.isArray(response.table3)
          ? response.table3[0] || { OverdueCount: 0, OverdueAmount: 0, AvgDaysOverdue: 0 }
          : response.table3 || { OverdueCount: 0, OverdueAmount: 0, AvgDaysOverdue: 0 },
        monthlyTrends: response.table4 || [],
      };
    }

    return {
      statusCounts: [],
      approvalStatusCounts: [],
      overdueInvoices: { OverdueCount: 0, OverdueAmount: 0, AvgDaysOverdue: 0 },
      monthlyTrends: [],
    };
  }

  /**
   * Get dashboard data for invoice management
   * @param companyId - Optional company filter
   * @param fiscalYearId - Optional fiscal year filter
   * @returns Dashboard data
   */
  async getDashboardData(companyId?: number, fiscalYearId?: number): Promise<InvoiceDashboardData> {
    const statistics = await this.getInvoiceStatistics(companyId, fiscalYearId);
    const recentInvoices = await this.searchInvoices({
      CompanyID: companyId,
      FiscalYearID: fiscalYearId,
    });

    // Calculate dashboard metrics
    const totalAmounts = statistics.statusCounts.reduce(
      (acc, curr) => ({
        total: acc.total + curr.TotalAmount,
        paid: acc.paid + curr.PaidAmount,
        outstanding: acc.outstanding + curr.BalanceAmount,
      }),
      { total: 0, paid: 0, outstanding: 0 }
    );

    const overdueAmount = statistics.overdueInvoices.OverdueAmount || 0;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const currentMonthData = statistics.monthlyTrends.find((trend) => trend.InvoiceMonth === currentMonth && trend.InvoiceYear === currentYear);

    return {
      totalInvoices: statistics.statusCounts.reduce((sum, status) => sum + status.InvoiceCount, 0),
      totalAmount: totalAmounts.total,
      paidAmount: totalAmounts.paid,
      outstandingAmount: totalAmounts.outstanding,
      overdueAmount: overdueAmount,
      currentMonthGenerated: currentMonthData?.TotalAmount || 0,
      currentMonthCollected: currentMonthData?.CollectedAmount || 0,
      recentInvoices: recentInvoices.slice(0, 10),
      overdueInvoices: recentInvoices.filter((inv) => inv.IsOverdue).slice(0, 10),
      paymentTrends: statistics.monthlyTrends.map((trend) => ({
        month: `${trend.InvoiceYear}-${String(trend.InvoiceMonth).padStart(2, "0")}`,
        generated: trend.TotalAmount,
        collected: trend.CollectedAmount,
      })),
    };
  }

  // ========== Posting Methods ==========

  /**
   * Get unposted invoices for posting
   * @param filters - Filter parameters
   * @returns Array of unposted invoices
   */
  async getUnpostedInvoices(filters: InvoiceSearchParams = {}): Promise<UnpostedInvoice[]> {
    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.GET_UNPOSTED_INVOICES,
      parameters: {
        CompanyID: filters.CompanyID,
        FiscalYearID: filters.FiscalYearID,
        FilterPropertyID: filters.FilterPropertyID,
        FilterCustomerID: filters.FilterCustomerID,
        FilterFromDate: filters.FilterFromDate ? new Date(filters.FilterFromDate).toISOString().split("T")[0] : undefined,
        FilterToDate: filters.FilterToDate ? new Date(filters.FilterToDate).toISOString().split("T")[0] : undefined,
      },
    };

    const response = await this.execute<UnpostedInvoice[]>(request);
    return response.success ? response.data || [] : [];
  }

  // ========== Utility Methods ==========

  /**
   * Check if invoice can be edited based on approval status
   */
  canEditInvoice(invoice: ContractInvoice): boolean {
    return invoice.ApprovalStatus !== APPROVAL_STATUS.APPROVED;
  }

  /**
   * Check if invoice can be deleted based on approval status and posting status
   */
  canDeleteInvoice(invoice: ContractInvoice): boolean {
    return invoice.ApprovalStatus !== APPROVAL_STATUS.APPROVED && !invoice.IsPosted;
  }

  /**
   * Check if invoice can be posted based on approval status
   */
  canPostInvoice(invoice: ContractInvoice): boolean {
    return invoice.ApprovalStatus === APPROVAL_STATUS.APPROVED && !invoice.IsPosted;
  }

  // ========== Existing Methods (Keep unchanged) ==========
  // Note: Include all the existing methods from the original service
  // such as posting methods, payment methods, validation methods, etc.
  // They remain the same but should use the updated types

  async postSingleInvoice(postingData: InvoicePostingRequest): Promise<PostingResponse> {
    if (!postingData.LeaseInvoiceID || !postingData.PostingDate || !postingData.DebitAccountID || !postingData.CreditAccountID) {
      return {
        Status: 0,
        Message: "Invoice ID, Posting Date, Debit Account, and Credit Account are required.",
      };
    }

    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.POST_SINGLE_INVOICE,
      parameters: {
        LeaseInvoiceID: postingData.LeaseInvoiceID,
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
      this.showSuccess("Invoice posted successfully");
      return {
        Status: 1,
        Message: response.message || "Invoice posted successfully",
        VoucherNo: response.VoucherNo,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to post invoice",
    };
  }

  /**
   * Post multiple invoices in bulk
   * @param postingData - The bulk posting request data
   * @returns Response with posting status and counts
   */
  async postMultipleInvoices(postingData: BulkInvoicePostingRequest): Promise<PostingResponse> {
    // Validate required parameters
    if (!postingData.PostingDate) {
      return {
        Status: 0,
        Message: "Posting Date is required.",
      };
    }

    if (!postingData.SelectedInvoices || postingData.SelectedInvoices.length === 0) {
      return {
        Status: 0,
        Message: "No invoices selected for posting.",
      };
    }

    // Prepare selected invoices JSON
    const selectedInvoicesJSON = JSON.stringify(postingData.SelectedInvoices);

    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.POST_MULTIPLE_INVOICES,
      parameters: {
        PostingDate: new Date(postingData.PostingDate).toISOString().split("T")[0],
        CurrencyID: postingData.CurrencyID,
        ExchangeRate: postingData.ExchangeRate,
        SelectedInvoicesJSON: selectedInvoicesJSON,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`Bulk posting completed. Posted: ${response.PostedCount}, Failed: ${response.FailedCount}`);
      return {
        Status: 1,
        Message: response.message || "Bulk posting completed",
        PostedCount: response.PostedCount,
        FailedCount: response.FailedCount,
        TotalPostedAmount: response.TotalPostedAmount,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to post invoices",
    };
  }

  /**
   * Reverse an invoice posting
   * @param reversalData - The reversal request data
   * @returns Response with reversal status
   */
  async reverseInvoicePosting(reversalData: PostingReversalRequest): Promise<ApiResponse> {
    if (!reversalData.PostingID) {
      return {
        Status: 0,
        Message: "Posting ID is required for reversal.",
      };
    }

    if (!reversalData.ReversalReason || reversalData.ReversalReason.trim().length === 0) {
      return {
        Status: 0,
        Message: "Reversal reason is required.",
      };
    }

    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.REVERSE_INVOICE_POSTING,
      parameters: {
        PostingID: reversalData.PostingID,
        ReversalReason: reversalData.ReversalReason,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice posting reversed successfully");
      return {
        Status: 1,
        Message: response.message || "Invoice posting reversed successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reverse invoice posting",
    };
  }

  async recordPayment(paymentData: InvoicePaymentRequest): Promise<ApiResponse> {
    if (!paymentData.LeaseInvoiceID || !paymentData.PaymentAmount || paymentData.PaymentAmount <= 0) {
      return {
        Status: 0,
        Message: "Invoice ID and valid Payment Amount are required.",
      };
    }

    const request: BaseRequest = {
      mode: CONTRACT_INVOICE_MODES.RECORD_PAYMENT,
      parameters: {
        LeaseInvoiceID: paymentData.LeaseInvoiceID,
        PaymentAmount: paymentData.PaymentAmount,
        PaymentDate: paymentData.PaymentDate ? new Date(paymentData.PaymentDate).toISOString().split("T")[0] : undefined,
        PaymentReference: paymentData.PaymentReference,
        PaymentMethod: paymentData.PaymentMethod,
        Notes: paymentData.Notes,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment recorded successfully");
      return {
        Status: 1,
        Message: response.message || "Payment recorded successfully",
        ReceiptNo: response.ReceiptNo,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to record payment",
    };
  }
  // ========== Validation Methods ==========

  /**
   * Validate invoice data before generation or update
   * @param invoiceData - The invoice data to validate
   * @returns Validation response with errors and warnings
   */
  validateInvoiceData(invoiceData: Partial<InvoiceGenerationRequest | InvoiceUpdateRequest>): InvoiceValidationResponse {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    // if (!invoiceData.CompanyID) {
    //   errors.push("Company is required.");
    // }

    // if (!invoiceData.FiscalYearID) {
    //   errors.push("Fiscal Year is required.");
    // }

    // Date validation
    if (invoiceData.InvoiceDate) {
      const invoiceDate = new Date(invoiceData.InvoiceDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (invoiceDate > today) {
        warnings.push("Invoice date is in the future.");
      }
    }

    // Amount validation
    if (invoiceData.TotalAmount !== undefined && invoiceData.TotalAmount <= 0) {
      errors.push("Total amount must be greater than zero.");
    }

    if (invoiceData.SubTotal !== undefined && invoiceData.TaxAmount !== undefined && invoiceData.DiscountAmount !== undefined) {
      const calculatedTotal = invoiceData.SubTotal + (invoiceData.TaxAmount || 0) - (invoiceData.DiscountAmount || 0);
      if (invoiceData.TotalAmount !== undefined && Math.abs(calculatedTotal - invoiceData.TotalAmount) > 0.01) {
        errors.push("Total amount does not match calculated value (SubTotal + Tax - Discount).");
      }
    }

    // Period validation
    if (invoiceData.PeriodFromDate && invoiceData.PeriodToDate) {
      const fromDate = new Date(invoiceData.PeriodFromDate);
      const toDate = new Date(invoiceData.PeriodToDate);

      if (fromDate >= toDate) {
        errors.push("Period From Date must be before Period To Date.");
      }
    }

    return {
      IsValid: errors.length === 0,
      Errors: errors,
      Warnings: warnings,
    };
  }

  /**
   * Validate posting data before posting invoices
   * @param postingData - The posting data to validate
   * @returns Posting validation response
   */
  validatePostingData(postingData: InvoicePostingRequest | BulkInvoicePostingRequest): PostingValidationResponse {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validatedTransactions: SelectedInvoiceForPosting[] = [];

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
    if ("LeaseInvoiceID" in postingData) {
      // Single invoice posting validation
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
      if (!postingData.SelectedInvoices || postingData.SelectedInvoices.length === 0) {
        errors.push("No invoices selected for posting.");
      } else {
        postingData.SelectedInvoices.forEach((invoice, index) => {
          if (!invoice.LeaseInvoiceID) {
            errors.push(`Invoice ${index + 1}: Invoice ID is required.`);
          }

          if (!invoice.PostingAmount || invoice.PostingAmount <= 0) {
            errors.push(`Invoice ${index + 1}: Valid posting amount is required.`);
          }

          if (!invoice.DebitAccountID) {
            errors.push(`Invoice ${index + 1}: Debit account is required.`);
          }

          if (!invoice.CreditAccountID) {
            errors.push(`Invoice ${index + 1}: Credit account is required.`);
          }

          if (invoice.DebitAccountID === invoice.CreditAccountID) {
            errors.push(`Invoice ${index + 1}: Debit and credit accounts cannot be the same.`);
          }
        });

        validatedTransactions = postingData.SelectedInvoices.filter(
          (invoice) =>
            invoice.LeaseInvoiceID && invoice.PostingAmount > 0 && invoice.DebitAccountID && invoice.CreditAccountID && invoice.DebitAccountID !== invoice.CreditAccountID
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

  // ========== Export and Utility Methods ==========

  /**
   * Export invoices to CSV format
   * @param invoices - Array of invoices to export
   * @param options - Export options
   * @returns CSV string
   */
  exportInvoicesToCSV(
    invoices: ContractInvoice[],
    options: InvoiceExportOptions = { format: "CSV", includeHeaders: true, includePayments: false, includePostings: false }
  ): string {
    if (!invoices || invoices.length === 0) {
      return options.includeHeaders ? "No data to export" : "";
    }

    const headers = [
      "Invoice No",
      "Invoice Date",
      "Due Date",
      "Customer Name",
      "Contract No",
      "Unit No",
      "Property Name",
      "Invoice Type",
      "Invoice Status",
      "Period From",
      "Period To",
      "Sub Total",
      "Tax Amount",
      "Discount Amount",
      "Total Amount",
      "Paid Amount",
      "Balance Amount",
      "Currency",
      "Is Overdue",
      "Days Overdue",
      "Is Posted",
    ];

    const csvRows: string[] = [];

    if (options.includeHeaders) {
      csvRows.push(headers.join(","));
    }

    invoices.forEach((invoice) => {
      const row = [
        `"${invoice.InvoiceNo}"`,
        `"${new Date(invoice.InvoiceDate).toLocaleDateString()}"`,
        `"${new Date(invoice.DueDate).toLocaleDateString()}"`,
        `"${invoice.CustomerName || ""}"`,
        `"${invoice.ContractNo || ""}"`,
        `"${invoice.UnitNo || ""}"`,
        `"${invoice.PropertyName || ""}"`,
        `"${invoice.InvoiceType}"`,
        `"${invoice.InvoiceStatus}"`,
        `"${invoice.PeriodFromDate ? new Date(invoice.PeriodFromDate).toLocaleDateString() : ""}"`,
        `"${invoice.PeriodToDate ? new Date(invoice.PeriodToDate).toLocaleDateString() : ""}"`,
        invoice.SubTotal.toFixed(2),
        (invoice.TaxAmount || 0).toFixed(2),
        (invoice.DiscountAmount || 0).toFixed(2),
        invoice.TotalAmount.toFixed(2),
        invoice.PaidAmount.toFixed(2),
        invoice.BalanceAmount.toFixed(2),
        `"${invoice.CurrencyCode || ""}"`,
        invoice.IsOverdue ? "Yes" : "No",
        (invoice.DaysOverdue || 0).toString(),
        invoice.IsPosted ? "Yes" : "No",
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }

  /**
   * Calculate invoice amount based on contract unit and period
   * @param contractUnit - Contract unit data
   * @param periodFromDate - Period start date
   * @param periodToDate - Period end date
   * @returns Calculated invoice amounts
   */
  calculateInvoiceAmount(
    contractUnit: ContractUnitForInvoice,
    periodFromDate: Date,
    periodToDate: Date
  ): {
    subTotal: number;
    taxAmount: number;
    totalAmount: number;
    daysInPeriod: number;
  } {
    const daysInPeriod = Math.ceil((periodToDate.getTime() - periodFromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const rentPerDay = (contractUnit.RentPerMonth || 0) / 30;
    const subTotal = rentPerDay * daysInPeriod;
    const taxAmount = subTotal * ((contractUnit.TaxPercentage || 0) / 100);
    const totalAmount = subTotal + taxAmount - (contractUnit.DiscountAmount || 0);

    return {
      subTotal: Math.round(subTotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      daysInPeriod,
    };
  }

  /**
   * Generate invoice number
   * @param companyId - Company ID
   * @param invoiceDate - Invoice date
   * @param prefix - Optional prefix (default: 'INV')
   * @returns Generated invoice number
   */
  generateInvoiceNumber(companyId: number, invoiceDate: Date, prefix: string = "INV"): string {
    const year = invoiceDate.getFullYear().toString().slice(-2);
    const month = String(invoiceDate.getMonth() + 1).padStart(2, "0");
    const timestamp = Date.now().toString().slice(-6);

    return `${prefix}-${year}${month}-${companyId}-${timestamp}`;
  }
}

// Export a singleton instance
export const contractInvoiceService = new ContractInvoiceService();
