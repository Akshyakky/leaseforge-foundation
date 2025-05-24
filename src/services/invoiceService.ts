// src/services/invoiceService.ts
import { BaseService, BaseRequest } from "./BaseService";
import {
  LeaseInvoice,
  InvoiceStatistics,
  OverdueInvoice,
  PaymentApplication,
  InvoicePosting,
  InvoiceSearchParams,
  InvoiceRequest,
  InvoiceUpdateRequest,
  PaymentApplicationRequest,
  RecurringInvoiceParams,
  OverdueInvoiceParams,
  ApiResponse,
} from "../types/invoiceTypes";

// Re-export types for convenience
export type {
  LeaseInvoice,
  InvoiceStatistics,
  OverdueInvoice,
  PaymentApplication,
  InvoicePosting,
  InvoiceSearchParams,
  InvoiceRequest,
  InvoiceUpdateRequest,
  PaymentApplicationRequest,
  RecurringInvoiceParams,
  OverdueInvoiceParams,
};

/**
 * Service for lease invoice management operations
 */
class InvoiceService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/invoice");
  }

  /**
   * Create a new lease invoice
   * @param data - The invoice data to create
   * @returns Response with status and newly created invoice ID
   */
  async createInvoice(data: InvoiceRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Invoice
      parameters: {
        // Invoice master data
        InvoiceNo: data.invoice.InvoiceNo,
        InvoiceDate: data.invoice.InvoiceDate,
        DueDate: data.invoice.DueDate,
        ContractID: data.invoice.ContractID,
        ContractUnitID: data.invoice.ContractUnitID,
        CustomerID: data.invoice.CustomerID,
        CompanyID: data.invoice.CompanyID,
        FiscalYearID: data.invoice.FiscalYearID,
        InvoiceType: data.invoice.InvoiceType,
        InvoiceStatus: data.invoice.InvoiceStatus,
        PeriodFromDate: data.invoice.PeriodFromDate,
        PeriodToDate: data.invoice.PeriodToDate,
        SubTotal: data.invoice.SubTotal,
        TaxAmount: data.invoice.TaxAmount,
        DiscountAmount: data.invoice.DiscountAmount,
        TotalAmount: data.invoice.TotalAmount,
        PaidAmount: data.invoice.PaidAmount,
        BalanceAmount: data.invoice.BalanceAmount,
        CurrencyID: data.invoice.CurrencyID,
        ExchangeRate: data.invoice.ExchangeRate,
        PaymentTermID: data.invoice.PaymentTermID,
        SalesPersonID: data.invoice.SalesPersonID,
        TaxID: data.invoice.TaxID,
        IsRecurring: data.invoice.IsRecurring,
        RecurrencePattern: data.invoice.RecurrencePattern,
        NextInvoiceDate: data.invoice.NextInvoiceDate,
        Notes: data.invoice.Notes,
        InternalNotes: data.invoice.InternalNotes,

        // Audit parameters
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice created successfully");
      return {
        Status: 1,
        Message: response.message || "Invoice created successfully",
        NewInvoiceID: response.NewInvoiceID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create invoice",
    };
  }

  /**
   * Update an existing lease invoice
   * @param data - The invoice data to update
   * @returns Response with status
   */
  async updateInvoice(data: InvoiceUpdateRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Invoice
      parameters: {
        LeaseInvoiceID: data.invoice.LeaseInvoiceID,
        InvoiceNo: data.invoice.InvoiceNo,
        InvoiceDate: data.invoice.InvoiceDate,
        DueDate: data.invoice.DueDate,
        ContractID: data.invoice.ContractID,
        ContractUnitID: data.invoice.ContractUnitID,
        CustomerID: data.invoice.CustomerID,
        InvoiceType: data.invoice.InvoiceType,
        InvoiceStatus: data.invoice.InvoiceStatus,
        PeriodFromDate: data.invoice.PeriodFromDate,
        PeriodToDate: data.invoice.PeriodToDate,
        SubTotal: data.invoice.SubTotal,
        TaxAmount: data.invoice.TaxAmount,
        DiscountAmount: data.invoice.DiscountAmount,
        TotalAmount: data.invoice.TotalAmount,
        BalanceAmount: data.invoice.BalanceAmount,
        CurrencyID: data.invoice.CurrencyID,
        ExchangeRate: data.invoice.ExchangeRate,
        PaymentTermID: data.invoice.PaymentTermID,
        SalesPersonID: data.invoice.SalesPersonID,
        TaxID: data.invoice.TaxID,
        IsRecurring: data.invoice.IsRecurring,
        RecurrencePattern: data.invoice.RecurrencePattern,
        NextInvoiceDate: data.invoice.NextInvoiceDate,
        Notes: data.invoice.Notes,
        InternalNotes: data.invoice.InternalNotes,

        // Audit parameters
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
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
   * @returns Array of invoices
   */
  async getAllInvoices(): Promise<LeaseInvoice[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Invoices
      parameters: {},
    };

    const response = await this.execute<LeaseInvoice[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get an invoice by ID
   * @param invoiceId - The ID of the invoice to fetch
   * @returns The invoice object or null if not found
   */
  async getInvoiceById(invoiceId: number): Promise<LeaseInvoice | null> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Invoice by ID
      parameters: {
        LeaseInvoiceID: invoiceId,
      },
    };

    const response = await this.execute<LeaseInvoice[]>(request);
    return response.success && response.data && response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Delete an invoice
   * @param invoiceId - The ID of the invoice to delete
   * @returns Response with status
   */
  async deleteInvoice(invoiceId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Invoice
      parameters: {
        LeaseInvoiceID: invoiceId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
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

  /**
   * Search for invoices with filters
   * @param params - Search parameters
   * @returns Array of matching invoices
   */
  async searchInvoices(params: InvoiceSearchParams = {}): Promise<LeaseInvoice[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Invoices with Filters
      parameters: {
        SearchText: params.searchText,
        FilterCustomerID: params.filterCustomerID,
        FilterContractID: params.filterContractID,
        FilterInvoiceType: params.filterInvoiceType,
        FilterInvoiceStatus: params.filterInvoiceStatus,
        FilterFromDate: params.filterFromDate,
        FilterToDate: params.filterToDate,
        FilterCompanyID: params.filterCompanyID,
        FilterFiscalYearID: params.filterFiscalYearID,
      },
    };

    const response = await this.execute<LeaseInvoice[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Change invoice status
   * @param invoiceId - The ID of the invoice
   * @param status - The new status
   * @returns Response with status
   */
  async changeInvoiceStatus(invoiceId: number, status: string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Change Invoice Status
      parameters: {
        LeaseInvoiceID: invoiceId,
        InvoiceStatus: status,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
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

  /**
   * Get invoice statistics
   * @param companyId - Optional company ID filter
   * @param fiscalYearId - Optional fiscal year ID filter
   * @returns Invoice statistics
   */
  async getInvoiceStatistics(companyId?: number, fiscalYearId?: number): Promise<InvoiceStatistics> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Invoice Statistics
      parameters: {
        FilterCompanyID: companyId,
        FilterFiscalYearID: fiscalYearId,
      },
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        statusCounts: response.table1 || [],
        overdueSummary:
          response.table2 && response.table2.length > 0
            ? response.table2[0]
            : {
                OverdueCount: 0,
                OverdueAmount: 0,
              },
      };
    }

    return {
      statusCounts: [],
      overdueSummary: {
        OverdueCount: 0,
        OverdueAmount: 0,
      },
    };
  }

  /**
   * Apply payment to an invoice
   * @param data - Payment application data
   * @returns Response with status and new amounts
   */
  async applyPayment(data: PaymentApplicationRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Apply Payment to Invoice
      parameters: {
        LeaseInvoiceID: data.LeaseInvoiceID,
        PaymentAmount: data.PaymentAmount,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment applied successfully");
      return {
        Status: 1,
        Message: response.message || "Payment applied successfully",
        NewPaidAmount: response.NewPaidAmount,
        NewBalanceAmount: response.NewBalanceAmount,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to apply payment",
    };
  }

  /**
   * Get overdue invoices
   * @param params - Overdue invoice parameters
   * @returns Array of overdue invoices
   */
  async getOverdueInvoices(params: OverdueInvoiceParams = {}): Promise<OverdueInvoice[]> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Get Overdue Invoices
      parameters: {
        OverdueDays: params.overdueDays,
        FilterCustomerID: params.filterCustomerID,
        FilterCompanyID: params.filterCompanyID,
      },
    };

    const response = await this.execute<OverdueInvoice[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Post invoice to General Ledger
   * @param invoiceId - The ID of the invoice to post
   * @returns Response with posting details
   */
  async postInvoiceToGL(invoiceId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 11, // Mode 11: Post Invoice to GL
      parameters: {
        LeaseInvoiceID: invoiceId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice posted to GL successfully");
      return {
        Status: 1,
        Message: response.message || "Invoice posted to GL successfully",
        PostingID: response.PostingID,
        VoucherNo: response.VoucherNo,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to post invoice to GL",
    };
  }

  /**
   * Get invoices by customer
   * @param customerId - The customer ID
   * @returns Array of invoices for the customer
   */
  async getInvoicesByCustomer(customerId: number): Promise<LeaseInvoice[]> {
    return this.searchInvoices({ filterCustomerID: customerId });
  }

  /**
   * Get invoices by contract
   * @param contractId - The contract ID
   * @returns Array of invoices for the contract
   */
  async getInvoicesByContract(contractId: number): Promise<LeaseInvoice[]> {
    return this.searchInvoices({ filterContractID: contractId });
  }

  /**
   * Get invoices by status
   * @param status - The invoice status
   * @returns Array of invoices with the specified status
   */
  async getInvoicesByStatus(status: string): Promise<LeaseInvoice[]> {
    return this.searchInvoices({ filterInvoiceStatus: status });
  }

  /**
   * Get invoices by type
   * @param type - The invoice type
   * @returns Array of invoices with the specified type
   */
  async getInvoicesByType(type: string): Promise<LeaseInvoice[]> {
    return this.searchInvoices({ filterInvoiceType: type });
  }

  /**
   * Get invoices for a date range
   * @param fromDate - Start date
   * @param toDate - End date
   * @returns Array of invoices in the date range
   */
  async getInvoicesByDateRange(fromDate: string | Date, toDate: string | Date): Promise<LeaseInvoice[]> {
    return this.searchInvoices({ filterFromDate: fromDate, filterToDate: toDate });
  }

  /**
   * Get invoices that are paid
   * @returns Array of paid invoices
   */
  async getPaidInvoices(): Promise<LeaseInvoice[]> {
    return this.searchInvoices({ filterInvoiceStatus: "Paid" });
  }

  /**
   * Get invoices that are pending
   * @returns Array of pending invoices
   */
  async getPendingInvoices(): Promise<LeaseInvoice[]> {
    return this.searchInvoices({ filterInvoiceStatus: "Pending" });
  }

  /**
   * Get invoices that are partially paid
   * @returns Array of partially paid invoices
   */
  async getPartiallyPaidInvoices(): Promise<LeaseInvoice[]> {
    return this.searchInvoices({ filterInvoiceStatus: "Partial" });
  }

  /**
   * Helper method to get the current user ID
   * @returns The current user ID
   */
  private getCurrentUserId(): number | undefined {
    try {
      const state = (window as any).store?.getState();
      if (state?.auth?.user) {
        return state.auth.user.userID;
      }
    } catch (error) {
      console.warn("Error retrieving current user ID from store:", error);
    }
    return undefined;
  }
}

// Export a singleton instance
export const invoiceService = new InvoiceService();
