// src/services/invoiceService.ts - Updated to match stored procedure
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
   * Create a new lease invoice (Mode 1)
   * @param data - The invoice data to create
   * @returns Response with status and newly created invoice ID
   */
  async createInvoice(data: InvoiceRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Invoice
      parameters: {
        // Invoice master data
        InvoiceNo: data.invoice.InvoiceNo,
        InvoiceDate: this.formatDate(data.invoice.InvoiceDate),
        DueDate: this.formatDate(data.invoice.DueDate),
        ContractID: data.invoice.ContractID,
        ContractUnitID: data.invoice.ContractUnitID,
        CustomerID: data.invoice.CustomerID,
        CompanyID: data.invoice.CompanyID,
        FiscalYearID: data.invoice.FiscalYearID || 1, // Default to 1 if not provided
        InvoiceType: data.invoice.InvoiceType,
        InvoiceStatus: data.invoice.InvoiceStatus || "Draft",
        PeriodFromDate: data.invoice.PeriodFromDate ? this.formatDate(data.invoice.PeriodFromDate) : null,
        PeriodToDate: data.invoice.PeriodToDate ? this.formatDate(data.invoice.PeriodToDate) : null,
        SubTotal: data.invoice.SubTotal,
        TaxAmount: data.invoice.TaxAmount,
        DiscountAmount: data.invoice.DiscountAmount,
        TotalAmount: data.invoice.TotalAmount,
        PaidAmount: data.invoice.PaidAmount || 0,
        BalanceAmount: data.invoice.BalanceAmount,
        CurrencyID: data.invoice.CurrencyID,
        ExchangeRate: data.invoice.ExchangeRate || 1,
        PaymentTermID: data.invoice.PaymentTermID,
        SalesPersonID: data.invoice.SalesPersonID,
        TaxID: data.invoice.TaxID,
        IsRecurring: data.invoice.IsRecurring || false,
        RecurrencePattern: data.invoice.RecurrencePattern,
        NextInvoiceDate: data.invoice.NextInvoiceDate ? this.formatDate(data.invoice.NextInvoiceDate) : null,
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
        NewInvoiceID: response.data?.NewInvoiceID || response.NewInvoiceID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create invoice",
    };
  }

  /**
   * Update an existing lease invoice (Mode 2)
   * @param data - The invoice data to update
   * @returns Response with status
   */
  async updateInvoice(data: InvoiceUpdateRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Invoice
      parameters: {
        LeaseInvoiceID: data.invoice.LeaseInvoiceID,
        InvoiceNo: data.invoice.InvoiceNo,
        InvoiceDate: data.invoice.InvoiceDate ? this.formatDate(data.invoice.InvoiceDate) : undefined,
        DueDate: data.invoice.DueDate ? this.formatDate(data.invoice.DueDate) : undefined,
        ContractID: data.invoice.ContractID,
        ContractUnitID: data.invoice.ContractUnitID,
        CustomerID: data.invoice.CustomerID,
        InvoiceType: data.invoice.InvoiceType,
        InvoiceStatus: data.invoice.InvoiceStatus,
        PeriodFromDate: data.invoice.PeriodFromDate ? this.formatDate(data.invoice.PeriodFromDate) : undefined,
        PeriodToDate: data.invoice.PeriodToDate ? this.formatDate(data.invoice.PeriodToDate) : undefined,
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
        NextInvoiceDate: data.invoice.NextInvoiceDate ? this.formatDate(data.invoice.NextInvoiceDate) : undefined,
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
   * Get all active invoices (Mode 3)
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
   * Get an invoice by ID (Mode 4)
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
   * Delete an invoice (Mode 5)
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
   * Search for invoices with filters (Mode 6)
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
        FilterFromDate: params.filterFromDate ? this.formatDate(params.filterFromDate) : undefined,
        FilterToDate: params.filterToDate ? this.formatDate(params.filterToDate) : undefined,
        FilterCompanyID: params.filterCompanyID,
        FilterFiscalYearID: params.filterFiscalYearID,
      },
    };

    const response = await this.execute<LeaseInvoice[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Change invoice status (Mode 7)
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
   * Get invoice statistics (Mode 8)
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
        statusCounts: response.data?.table1 || response.table1 || [],
        overdueSummary: response.data?.table2?.[0] ||
          response.table2?.[0] || {
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
   * Apply payment to an invoice (Mode 9)
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
        NewPaidAmount: response.data?.NewPaidAmount || response.NewPaidAmount,
        NewBalanceAmount: response.data?.NewBalanceAmount || response.NewBalanceAmount,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to apply payment",
    };
  }

  /**
   * Get overdue invoices (Mode 10)
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
   * Post invoice to General Ledger (Mode 11)
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
        GLVoucherNo: response.data?.GLVoucherNo || response.GLVoucherNo,
        VoucherNo: response.data?.GLVoucherNo || response.GLVoucherNo, // Map GLVoucherNo to VoucherNo for backward compatibility
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
export const invoiceService = new InvoiceService();
