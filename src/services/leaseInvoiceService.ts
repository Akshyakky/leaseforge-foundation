// src/services/leaseInvoiceService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  LeaseInvoice,
  InvoicePaymentAllocation,
  AdditionalCharge,
  InvoiceStatistics,
  OverdueInvoice,
  OverdueStatistics,
  InvoiceSearchParams,
  GenerateInvoiceParams,
  InvoiceRequest,
  ApiResponse,
} from "../types/leaseTypes";

/**
 * Service for lease invoice management operations
 */
class LeaseInvoiceService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Lease/invoice");
  }

  /**
   * Create a new invoice with optional payment allocations and additional charges
   * @param data - The invoice data, payment allocations, and additional charges
   * @returns Response with status and newly created invoice ID
   */
  async createInvoice(data: InvoiceRequest): Promise<ApiResponse> {
    // Prepare JSON data for child records
    const paymentAllocationsJSON = data.paymentAllocations && data.paymentAllocations.length > 0 ? JSON.stringify(data.paymentAllocations) : null;

    const additionalChargesJSON = data.additionalCharges && data.additionalCharges.length > 0 ? JSON.stringify(data.additionalCharges) : null;

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
        InvoiceStatus: data.invoice.InvoiceStatus,
        InvoiceType: data.invoice.InvoiceType,
        InvoicePeriodFrom: data.invoice.InvoicePeriodFrom,
        InvoicePeriodTo: data.invoice.InvoicePeriodTo,
        InvoiceAmount: data.invoice.InvoiceAmount,
        TaxID: data.invoice.TaxID,
        TaxPercentage: data.invoice.TaxPercentage,
        TaxAmount: data.invoice.TaxAmount,
        AdditionalCharges: data.invoice.AdditionalCharges,
        DiscountAmount: data.invoice.DiscountAmount,
        TotalAmount: data.invoice.TotalAmount,
        PaidAmount: data.invoice.PaidAmount,
        BalanceAmount: data.invoice.BalanceAmount,
        CurrencyID: data.invoice.CurrencyID,
        ExchangeRate: data.invoice.ExchangeRate,
        PostingID: data.invoice.PostingID,
        PostingStatus: data.invoice.PostingStatus,
        Notes: data.invoice.Notes,
        CompanyID: data.invoice.CompanyID,

        // JSON parameters for child records
        PaymentAllocationJSON: paymentAllocationsJSON,
        AdditionalChargesJSON: additionalChargesJSON,

        // Current user info
        CurrentUserID: data.invoice.CreatedID,
        CurrentUserName: data.invoice.CreatedBy,
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
   * Update an existing invoice
   * @param data - The invoice data to update
   * @returns Response with status
   */
  async updateInvoice(data: InvoiceRequest & { invoice: Partial<LeaseInvoice> & { InvoiceID: number } }): Promise<ApiResponse> {
    // Prepare JSON data for child records
    const paymentAllocationsJSON = data.paymentAllocations && data.paymentAllocations.length > 0 ? JSON.stringify(data.paymentAllocations) : null;

    const additionalChargesJSON = data.additionalCharges && data.additionalCharges.length > 0 ? JSON.stringify(data.additionalCharges) : null;

    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Invoice
      parameters: {
        // Invoice master data
        InvoiceID: data.invoice.InvoiceID,
        InvoiceNo: data.invoice.InvoiceNo,
        InvoiceDate: data.invoice.InvoiceDate,
        DueDate: data.invoice.DueDate,
        ContractID: data.invoice.ContractID,
        ContractUnitID: data.invoice.ContractUnitID,
        CustomerID: data.invoice.CustomerID,
        InvoiceStatus: data.invoice.InvoiceStatus,
        InvoiceType: data.invoice.InvoiceType,
        InvoicePeriodFrom: data.invoice.InvoicePeriodFrom,
        InvoicePeriodTo: data.invoice.InvoicePeriodTo,
        InvoiceAmount: data.invoice.InvoiceAmount,
        TaxID: data.invoice.TaxID,
        TaxPercentage: data.invoice.TaxPercentage,
        TaxAmount: data.invoice.TaxAmount,
        AdditionalCharges: data.invoice.AdditionalCharges,
        DiscountAmount: data.invoice.DiscountAmount,
        TotalAmount: data.invoice.TotalAmount,
        PaidAmount: data.invoice.PaidAmount,
        BalanceAmount: data.invoice.BalanceAmount,
        CurrencyID: data.invoice.CurrencyID,
        ExchangeRate: data.invoice.ExchangeRate,
        PostingID: data.invoice.PostingID,
        PostingStatus: data.invoice.PostingStatus,
        Notes: data.invoice.Notes,
        CompanyID: data.invoice.CompanyID,

        // JSON parameters for child records
        PaymentAllocationJSON: paymentAllocationsJSON,
        AdditionalChargesJSON: additionalChargesJSON,

        // Current user info
        CurrentUserID: data.invoice.UpdatedID,
        CurrentUserName: data.invoice.UpdatedBy,
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
   * Get an invoice by ID (including payment allocations)
   * @param invoiceId - The ID of the invoice to fetch
   * @returns Invoice object with payment allocations
   */
  async getInvoiceById(invoiceId: number): Promise<{
    invoice: LeaseInvoice | null;
    paymentAllocations: InvoicePaymentAllocation[];
  }> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Invoice by ID
      parameters: {
        InvoiceID: invoiceId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        invoice: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        paymentAllocations: response.table2 || [],
      };
    }

    return { invoice: null, paymentAllocations: [] };
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
        InvoiceID: invoiceId,
        CurrentUserID: this.getCurrentUser(),
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
        FilterCustomerID: params.customerID,
        FilterContractID: params.contractID,
        FilterUnitID: params.unitID,
        FilterInvoiceStatus: params.invoiceStatus,
        FilterInvoiceType: params.invoiceType,
        FilterFromDate: params.fromDate,
        FilterToDate: params.toDate,
        FilterIsPaid: params.isPaid,
        FilterCompanyID: params.companyID,
      },
    };

    const response = await this.execute<LeaseInvoice[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Update an invoice status
   * @param invoiceId - The ID of the invoice
   * @param status - The new status
   * @returns Response with status
   */
  async updateInvoiceStatus(invoiceId: number, status: string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Update Invoice Status
      parameters: {
        InvoiceID: invoiceId,
        InvoiceStatus: status,
        CurrentUserID: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`Invoice status updated to ${status} successfully`);
      return {
        Status: 1,
        Message: response.message || `Invoice status updated to ${status} successfully`,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update invoice status",
    };
  }

  /**
   * Generate invoices for a contract
   * @param params - Parameters for invoice generation
   * @returns Response with status and array of generated invoice IDs
   */
  async generateInvoices(params: GenerateInvoiceParams): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Generate Invoices for Contract
      parameters: {
        GenerateForContractID: params.contractID,
        GenerateForMonth: params.month,
        GenerateForYear: params.year,
        GenerateFromDate: params.fromDate,
        GenerateToDate: params.toDate,
        GenerateInvoiceType: params.invoiceType,
        CurrentUserID: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoices generated successfully");
      return {
        Status: 1,
        Message: response.message || "Invoices generated successfully",
        GeneratedInvoices: response.data || [],
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to generate invoices",
    };
  }

  /**
   * Get invoice statistics
   * @returns Invoice statistics
   */
  async getInvoiceStatistics(): Promise<InvoiceStatistics> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Invoice Statistics
      parameters: {},
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        statusCounts: response.table1 || [],
        overdueInvoices: response.table2 || [],
        invoicesByCustomer: response.table3 || [],
        invoicesByMonth: response.table4 || [],
      };
    }

    return {
      statusCounts: [],
      overdueInvoices: [],
      invoicesByCustomer: [],
      invoicesByMonth: [],
    };
  }

  /**
   * Process payment (apply receipt to invoice)
   * @param invoiceId - The invoice ID
   * @param allocations - Payment allocations
   * @returns Response with status
   */
  async processPayment(invoiceId: number, allocations: Partial<InvoicePaymentAllocation>[]): Promise<ApiResponse> {
    const paymentAllocationJSON = JSON.stringify(allocations);

    const request: BaseRequest = {
      mode: 10, // Mode 10: Process Payment (Apply Receipt to Invoice)
      parameters: {
        InvoiceID: invoiceId,
        PaymentAllocationJSON: paymentAllocationJSON,
        CurrentUserID: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment processed successfully");
      return {
        Status: 1,
        Message: response.message || "Payment processed successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to process payment",
    };
  }

  /**
   * Post an invoice to the financial system
   * @param invoiceId - The invoice ID
   * @returns Response with status and posting ID
   */
  async postInvoiceToFinancials(invoiceId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 11, // Mode 11: Financial Posting
      parameters: {
        InvoiceID: invoiceId,
        CurrentUserID: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice posted to financial system successfully");
      return {
        Status: 1,
        Message: response.message || "Invoice posted to financial system successfully",
        PostingID: response.PostingID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to post invoice to financial system",
    };
  }

  /**
   * Get invoices by contract
   * @param contractId - The contract ID
   * @returns Array of invoices for the contract
   */
  async getInvoicesByContract(contractId: number): Promise<LeaseInvoice[]> {
    const request: BaseRequest = {
      mode: 12, // Mode 12: Get Invoices by Contract
      parameters: {
        ContractID: contractId,
      },
    };

    const response = await this.execute<LeaseInvoice[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get invoices by customer
   * @param customerId - The customer ID
   * @returns Array of invoices for the customer
   */
  async getInvoicesByCustomer(customerId: number): Promise<LeaseInvoice[]> {
    const request: BaseRequest = {
      mode: 13, // Mode 13: Get Invoices by Customer
      parameters: {
        CustomerID: customerId,
      },
    };

    const response = await this.execute<LeaseInvoice[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get invoices by unit
   * @param unitId - The unit ID
   * @returns Array of invoices for the unit
   */
  async getInvoicesByUnit(unitId: number): Promise<LeaseInvoice[]> {
    const request: BaseRequest = {
      mode: 14, // Mode 14: Get Invoices by Unit
      parameters: {
        FilterUnitID: unitId,
      },
    };

    const response = await this.execute<LeaseInvoice[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get overdue invoices report
   * @param customerId - Optional customer ID filter
   * @param contractId - Optional contract ID filter
   * @param companyId - Optional company ID filter
   * @returns Overdue invoices report
   */
  async getOverdueInvoicesReport(customerId?: number, contractId?: number, companyId?: number): Promise<OverdueStatistics> {
    const request: BaseRequest = {
      mode: 15, // Mode 15: Get Overdue Invoices Report
      parameters: {
        FilterCustomerID: customerId,
        FilterContractID: contractId,
        FilterCompanyID: companyId,
      },
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        invoices: response.table1 || [],
        agingSummary: response.table2 || [],
      };
    }

    return {
      invoices: [],
      agingSummary: [],
    };
  }
}

// Export a singleton instance
export const leaseInvoiceService = new LeaseInvoiceService();
