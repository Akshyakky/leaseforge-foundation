// src/services/leaseInvoiceGenerationService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  EligibleUnit,
  GeneratedLeaseInvoice,
  LeaseInvoiceDetails,
  SelectedUnitForInvoice,
  LeaseInvoiceFilters,
  InvoiceGenerationRequest,
  InvoicePostingRequest,
  InvoiceReversalRequest,
  InvoiceCancellationRequest,
  InvoiceGenerationResponse,
  InvoicePostingResponse,
  LeaseInvoiceStatistics,
  InvoiceValidationResponse,
  BulkInvoiceOperationStatus,
  InvoicePrintRequest,
  CustomerInvoiceSummary,
  InvoiceAging,
  RecurringInvoiceSettings,
  UnitType,
  PaymentTerm,
  Tax,
  AdditionalCharge,
  LEASE_INVOICE_MODES,
  INVOICE_TYPES,
  INVOICE_STATUSES,
} from "../types/leaseInvoiceGenerationTypes";

/**
 * Service for lease invoice generation operations
 */
class LeaseInvoiceGenerationService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/LeaseInvoiceGeneration");
  }

  /**
   * Get eligible units for invoice generation
   * @param filters - Filter parameters for the search
   * @returns Array of eligible units
   */
  async getEligibleUnits(filters: LeaseInvoiceFilters = {}): Promise<EligibleUnit[]> {
    const request: BaseRequest = {
      mode: LEASE_INVOICE_MODES.GET_ELIGIBLE_UNITS,
      parameters: {
        PropertyID: filters.PropertyID,
        UnitID: filters.UnitID,
        UnitTypeID: filters.UnitTypeID,
        CustomerID: filters.CustomerID,
        LeaseNo: filters.LeaseNo,
        CompanyID: filters.CompanyID,
        FiscalYearID: filters.FiscalYearID,
        TransactionDate: filters.TransactionDate?.toISOString().split("T")[0],
        DueDateFrom: filters.DueDateFrom?.toISOString().split("T")[0],
        DueDateTo: filters.DueDateTo?.toISOString().split("T")[0],
        InvoiceType: filters.InvoiceType,
      },
    };

    const response = await this.execute<EligibleUnit[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Generate installment invoices for selected units
   * @param generationData - The invoice generation request parameters
   * @returns Response with generation status and details
   */
  async generateInstallmentInvoices(generationData: InvoiceGenerationRequest): Promise<InvoiceGenerationResponse> {
    // Validate required parameters
    if (!generationData.SelectedUnits || generationData.SelectedUnits.length === 0) {
      return {
        success: false,
        message: "No units selected for invoice generation.",
      };
    }

    if (!generationData.DueDate) {
      return {
        success: false,
        message: "Due date is required.",
      };
    }

    // Prepare selected units JSON
    const selectedUnitsJSON = JSON.stringify(generationData.SelectedUnits);

    const request: BaseRequest = {
      mode: LEASE_INVOICE_MODES.GENERATE_INSTALLMENT_INVOICES,
      parameters: {
        SelectedUnitsJSON: selectedUnitsJSON,
        InvoiceDate: generationData.InvoiceDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
        DueDate: generationData.DueDate.toISOString().split("T")[0],
        PeriodFromDate: generationData.PeriodFromDate?.toISOString().split("T")[0],
        PeriodToDate: generationData.PeriodToDate?.toISOString().split("T")[0],
        IncludeOtherCharges: generationData.IncludeOtherCharges || false,
        AutoGenerateNumber: generationData.AutoGenerateNumber !== false, // default to true
        InvoiceNarration: generationData.InvoiceNarration,
        InvoiceType: generationData.InvoiceType || "Installment",
        CompanyID: generationData.CompanyID,
        FiscalYearID: generationData.FiscalYearID,
        CurrencyID: generationData.CurrencyID,
        ExchangeRate: generationData.ExchangeRate || 1.0,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(response.message || "Invoices generated successfully");
      return {
        success: true,
        message: response.message || "Invoices generated successfully",
        InvoiceCount: response.InvoiceCount,
        TotalAmount: response.TotalAmount,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to generate invoices",
    };
  }

  /**
   * Generate general lease invoices
   * @param generationData - The invoice generation request parameters
   * @returns Response with generation status and details
   */
  async generateGeneralInvoices(generationData: InvoiceGenerationRequest): Promise<InvoiceGenerationResponse> {
    // Similar validation as installment invoices
    if (!generationData.SelectedUnits || generationData.SelectedUnits.length === 0) {
      return {
        success: false,
        message: "No units selected for invoice generation.",
      };
    }

    const selectedUnitsJSON = JSON.stringify(generationData.SelectedUnits);

    const request: BaseRequest = {
      mode: LEASE_INVOICE_MODES.GENERATE_GENERAL_INVOICES,
      parameters: {
        SelectedUnitsJSON: selectedUnitsJSON,
        InvoiceDate: generationData.InvoiceDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
        DueDate: generationData.DueDate?.toISOString().split("T")[0],
        PeriodFromDate: generationData.PeriodFromDate?.toISOString().split("T")[0],
        PeriodToDate: generationData.PeriodToDate?.toISOString().split("T")[0],
        IncludeOtherCharges: generationData.IncludeOtherCharges || false,
        AutoGenerateNumber: generationData.AutoGenerateNumber !== false,
        InvoiceNarration: generationData.InvoiceNarration,
        InvoiceType: generationData.InvoiceType || "General",
        CompanyID: generationData.CompanyID,
        FiscalYearID: generationData.FiscalYearID,
        CurrencyID: generationData.CurrencyID,
        ExchangeRate: generationData.ExchangeRate || 1.0,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(response.message || "General invoices generated successfully");
      return {
        success: true,
        message: response.message || "General invoices generated successfully",
        InvoiceCount: response.InvoiceCount,
        TotalAmount: response.TotalAmount,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to generate general invoices",
    };
  }

  /**
   * Get generated lease invoices with filtering options
   * @param filters - Filter parameters for the search
   * @returns Array of generated invoices
   */
  async getGeneratedInvoices(filters: LeaseInvoiceFilters = {}): Promise<GeneratedLeaseInvoice[]> {
    const request: BaseRequest = {
      mode: LEASE_INVOICE_MODES.GET_GENERATED_INVOICES,
      parameters: {
        PropertyID: filters.PropertyID,
        UnitID: filters.UnitID,
        CustomerID: filters.CustomerID,
        CompanyID: filters.CompanyID,
        FiscalYearID: filters.FiscalYearID,
        InvoiceType: filters.InvoiceType,
        DueDateFrom: filters.DueDateFrom?.toISOString().split("T")[0],
        DueDateTo: filters.DueDateTo?.toISOString().split("T")[0],
        TransactionDate: filters.TransactionDate?.toISOString().split("T")[0],
      },
    };

    const response = await this.execute<GeneratedLeaseInvoice[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Post a lease invoice to accounting
   * @param postingData - The posting request parameters
   * @returns Response with posting status
   */
  async postInvoiceToAccounting(postingData: InvoicePostingRequest): Promise<InvoicePostingResponse> {
    // Validate required parameters
    if (!postingData.LeaseInvoiceID) {
      return {
        success: false,
        message: "Invoice ID is required for posting.",
      };
    }

    if (!postingData.DebitAccountID || !postingData.CreditAccountID) {
      return {
        success: false,
        message: "Both Debit and Credit Account IDs are required.",
      };
    }

    const request: BaseRequest = {
      mode: LEASE_INVOICE_MODES.POST_INVOICE_TO_ACCOUNTING,
      parameters: {
        LeaseInvoiceID: postingData.LeaseInvoiceID,
        PostingDate: postingData.PostingDate?.toISOString().split("T")[0],
        DebitAccountID: postingData.DebitAccountID,
        CreditAccountID: postingData.CreditAccountID,
        PostingAmount: postingData.PostingAmount,
        PostingNarration: postingData.PostingNarration,
        ReferenceNo: postingData.ReferenceNo,
        CurrencyID: postingData.CurrencyID,
        ExchangeRate: postingData.ExchangeRate || 1.0,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice posted to accounting successfully");
      return {
        success: true,
        message: response.message || "Invoice posted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to post invoice",
    };
  }

  /**
   * Reverse a posted invoice
   * @param reversalData - The reversal request parameters
   * @returns Response with reversal status
   */
  async reversePostedInvoice(reversalData: InvoiceReversalRequest): Promise<InvoicePostingResponse> {
    if (!reversalData.LeaseInvoiceID) {
      return {
        success: false,
        message: "Invoice ID is required for reversal.",
      };
    }

    if (!reversalData.ReversalReason || reversalData.ReversalReason.trim().length === 0) {
      return {
        success: false,
        message: "Reversal reason is required.",
      };
    }

    const request: BaseRequest = {
      mode: LEASE_INVOICE_MODES.REVERSE_POSTED_INVOICE,
      parameters: {
        LeaseInvoiceID: reversalData.LeaseInvoiceID,
        ReversalReason: reversalData.ReversalReason,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice posting reversed successfully");
      return {
        success: true,
        message: response.message || "Invoice posting reversed successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to reverse invoice posting",
    };
  }

  /**
   * Get detailed information for a specific invoice
   * @param invoiceId - ID of the invoice
   * @returns Invoice details
   */
  async getInvoiceDetails(invoiceId: number): Promise<LeaseInvoiceDetails | null> {
    if (!invoiceId) {
      return null;
    }

    const request: BaseRequest = {
      mode: LEASE_INVOICE_MODES.GET_INVOICE_DETAILS,
      parameters: {
        LeaseInvoiceID: invoiceId,
      },
    };

    const response = await this.execute<LeaseInvoiceDetails>(request);

    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data[0] : response.data;
    }

    return null;
  }

  /**
   * Cancel a lease invoice
   * @param cancellationData - The cancellation request parameters
   * @returns Response with cancellation status
   */
  async cancelInvoice(cancellationData: InvoiceCancellationRequest): Promise<InvoicePostingResponse> {
    if (!cancellationData.LeaseInvoiceID) {
      return {
        success: false,
        message: "Invoice ID is required for cancellation.",
      };
    }

    if (!cancellationData.CancelReason || cancellationData.CancelReason.trim().length === 0) {
      return {
        success: false,
        message: "Cancellation reason is required.",
      };
    }

    const request: BaseRequest = {
      mode: LEASE_INVOICE_MODES.CANCEL_INVOICE,
      parameters: {
        LeaseInvoiceID: cancellationData.LeaseInvoiceID,
        CancelReason: cancellationData.CancelReason,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice cancelled successfully");
      return {
        success: true,
        message: response.message || "Invoice cancelled successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to cancel invoice",
    };
  }

  /**
   * Validate invoice generation parameters
   * @param generationData - The invoice generation request to validate
   * @returns Validation response with errors and warnings
   */
  async validateInvoiceGeneration(generationData: InvoiceGenerationRequest): Promise<InvoiceValidationResponse> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Client-side validation
    if (!generationData.SelectedUnits || generationData.SelectedUnits.length === 0) {
      errors.push("No units selected for invoice generation.");
    }

    if (!generationData.DueDate) {
      errors.push("Due date is required.");
    }

    // Validate each selected unit
    generationData.SelectedUnits?.forEach((unit, index) => {
      if (!unit.ContractUnitID) {
        errors.push(`Unit ${index + 1}: Contract Unit ID is required.`);
      }

      if (!unit.InvoiceAmount || unit.InvoiceAmount <= 0) {
        errors.push(`Unit ${index + 1}: Valid invoice amount is required.`);
      }

      if (unit.InvoiceAmount > 1000000) {
        warnings.push(`Unit ${index + 1}: Invoice amount seems unusually high.`);
      }
    });

    // Check for weekend due date (warning)
    if (generationData.DueDate) {
      const dayOfWeek = generationData.DueDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        warnings.push("Due date falls on a weekend.");
      }
    }

    // Check for past due date (warning)
    if (generationData.DueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (generationData.DueDate < today) {
        warnings.push("Due date is in the past.");
      }
    }

    // Check invoice date vs due date
    if (generationData.InvoiceDate && generationData.DueDate) {
      if (generationData.InvoiceDate > generationData.DueDate) {
        errors.push("Invoice date cannot be after due date.");
      }
    }

    return {
      IsValid: errors.length === 0,
      Errors: errors,
      Warnings: warnings,
    };
  }

  /**
   * Get invoice statistics for dashboard
   * @param companyId - Optional company filter
   * @param fiscalYearId - Optional fiscal year filter
   * @returns Statistics object
   */
  async getInvoiceStatistics(companyId?: number, fiscalYearId?: number): Promise<LeaseInvoiceStatistics> {
    // This would ideally be a separate mode in the stored procedure
    // For now, we'll use the existing modes to gather statistics

    const invoices = await this.getGeneratedInvoices({
      CompanyID: companyId,
      FiscalYearID: fiscalYearId,
    });

    // Calculate statistics
    const totalInvoices = invoices.length;
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.TotalAmount, 0);

    const pendingInvoices = invoices.filter((inv) => inv.InvoiceStatus === "Active" || inv.InvoiceStatus === "Pending");
    const paidInvoices = invoices.filter((inv) => inv.PaidAmount >= inv.TotalAmount);
    const overdueInvoices = invoices.filter((inv) => {
      const dueDate = new Date(inv.DueDate);
      const today = new Date();
      return dueDate < today && inv.BalanceAmount > 0;
    });

    // Group by invoice type
    const invoicesByType = invoices.reduce((acc, inv) => {
      const existing = acc.find((item) => item.InvoiceType === inv.InvoiceType);
      if (existing) {
        existing.Count++;
        existing.Amount += inv.TotalAmount;
      } else {
        acc.push({
          InvoiceType: inv.InvoiceType,
          Count: 1,
          Amount: inv.TotalAmount,
        });
      }
      return acc;
    }, [] as { InvoiceType: string; Count: number; Amount: number }[]);

    // Group by status
    const invoicesByStatus = invoices.reduce((acc, inv) => {
      const existing = acc.find((item) => item.Status === inv.InvoiceStatus);
      if (existing) {
        existing.Count++;
        existing.Amount += inv.TotalAmount;
      } else {
        acc.push({
          Status: inv.InvoiceStatus,
          Count: 1,
          Amount: inv.TotalAmount,
        });
      }
      return acc;
    }, [] as { Status: string; Count: number; Amount: number }[]);

    return {
      TotalInvoices: totalInvoices,
      TotalInvoiceAmount: totalInvoiceAmount,
      PendingInvoices: pendingInvoices.length,
      PendingAmount: pendingInvoices.reduce((sum, inv) => sum + inv.BalanceAmount, 0),
      OverdueInvoices: overdueInvoices.length,
      OverdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.BalanceAmount, 0),
      PaidInvoices: paidInvoices.length,
      PaidAmount: paidInvoices.reduce((sum, inv) => sum + inv.PaidAmount, 0),
      InvoicesByType: invoicesByType,
      InvoicesByStatus: invoicesByStatus,
    };
  }

  /**
   * Get customer invoice summary for analysis
   * @param filters - Optional filters for customer selection
   * @returns Array of customer summaries
   */
  async getCustomerInvoiceSummary(filters: LeaseInvoiceFilters = {}): Promise<CustomerInvoiceSummary[]> {
    const invoices = await this.getGeneratedInvoices(filters);

    // Group invoices by customer
    const customerSummaries = invoices.reduce((acc, invoice) => {
      const existing = acc.find((summary) => summary.CustomerName === invoice.Tenant);

      if (existing) {
        existing.TotalInvoices++;
        existing.TotalAmount += invoice.TotalAmount;
        existing.PaidAmount += invoice.PaidAmount;
        existing.BalanceAmount += invoice.BalanceAmount;

        // Check if overdue
        const dueDate = new Date(invoice.DueDate);
        const today = new Date();
        if (dueDate < today && invoice.BalanceAmount > 0) {
          existing.OverdueAmount += invoice.BalanceAmount;
        }

        // Update last invoice date if newer
        const invoiceDate = new Date(invoice.InvoiceDate);
        const lastInvoiceDate = new Date(existing.LastInvoiceDate);
        if (invoiceDate > lastInvoiceDate) {
          existing.LastInvoiceDate = invoice.InvoiceDate;
        }
      } else {
        const dueDate = new Date(invoice.DueDate);
        const today = new Date();
        const overdueAmount = dueDate < today && invoice.BalanceAmount > 0 ? invoice.BalanceAmount : 0;

        acc.push({
          CustomerID: 0, // Would need to be provided by the API
          CustomerName: invoice.Tenant,
          TotalInvoices: 1,
          TotalAmount: invoice.TotalAmount,
          PaidAmount: invoice.PaidAmount,
          BalanceAmount: invoice.BalanceAmount,
          OverdueAmount: overdueAmount,
          LastInvoiceDate: invoice.InvoiceDate,
        });
      }

      return acc;
    }, [] as CustomerInvoiceSummary[]);

    return customerSummaries.sort((a, b) => b.BalanceAmount - a.BalanceAmount);
  }

  /**
   * Export invoices to CSV format
   * @param invoices - Array of invoices to export
   * @param includeHeaders - Whether to include column headers
   * @returns CSV string
   */
  exportInvoicesToCSV(invoices: GeneratedLeaseInvoice[], includeHeaders = true): string {
    if (!invoices || invoices.length === 0) {
      return includeHeaders ? "No data to export" : "";
    }

    const headers = [
      "Invoice No",
      "Invoice Date",
      "Due Date",
      "Invoice Type",
      "Invoice Status",
      "Property",
      "Unit No",
      "Tenant",
      "Sub Total",
      "Tax Amount",
      "Total Amount",
      "Paid Amount",
      "Balance Amount",
      "Currency",
      "Posting Status",
      "Description",
    ];

    const csvRows: string[] = [];

    if (includeHeaders) {
      csvRows.push(headers.join(","));
    }

    invoices.forEach((invoice) => {
      const row = [
        `"${invoice.InvoiceNo}"`,
        `"${new Date(invoice.InvoiceDate).toLocaleDateString()}"`,
        `"${new Date(invoice.DueDate).toLocaleDateString()}"`,
        `"${invoice.InvoiceType}"`,
        `"${invoice.InvoiceStatus}"`,
        `"${invoice.Property}"`,
        `"${invoice.UnitNo}"`,
        `"${invoice.Tenant}"`,
        invoice.SubTotal.toFixed(2),
        invoice.TaxAmount.toFixed(2),
        invoice.TotalAmount.toFixed(2),
        invoice.PaidAmount.toFixed(2),
        invoice.BalanceAmount.toFixed(2),
        `"${invoice.Currency}"`,
        `"${invoice.PostingStatus}"`,
        `"${invoice.Description || ""}"`,
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }

  /**
   * Get invoice aging analysis
   * @param filters - Optional filters for analysis
   * @returns Array of aging buckets
   */
  async getInvoiceAgingAnalysis(filters: LeaseInvoiceFilters = {}): Promise<InvoiceAging[]> {
    const invoices = await this.getGeneratedInvoices(filters);
    const today = new Date();

    // Define aging buckets
    const agingBuckets = [
      { AgeGroup: "Current", DaysRange: "0-30 days", min: 0, max: 30 },
      { AgeGroup: "31-60 Days", DaysRange: "31-60 days", min: 31, max: 60 },
      { AgeGroup: "61-90 Days", DaysRange: "61-90 days", min: 61, max: 90 },
      { AgeGroup: "91-120 Days", DaysRange: "91-120 days", min: 91, max: 120 },
      { AgeGroup: "Over 120 Days", DaysRange: "Over 120 days", min: 121, max: Number.MAX_SAFE_INTEGER },
    ];

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.BalanceAmount, 0);

    const agingAnalysis = agingBuckets.map((bucket) => {
      const invoicesInBucket = invoices.filter((invoice) => {
        const dueDate = new Date(invoice.DueDate);
        const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysPastDue >= bucket.min && daysPastDue <= bucket.max && invoice.BalanceAmount > 0;
      });

      const bucketAmount = invoicesInBucket.reduce((sum, inv) => sum + inv.BalanceAmount, 0);

      return {
        AgeGroup: bucket.AgeGroup,
        DaysRange: bucket.DaysRange,
        InvoiceCount: invoicesInBucket.length,
        TotalAmount: bucketAmount,
        Percentage: totalAmount > 0 ? (bucketAmount / totalAmount) * 100 : 0,
      };
    });

    return agingAnalysis;
  }

  /**
   * Bulk validate multiple invoice operations
   * @param operations - Array of invoice operations to validate
   * @returns Array of operation statuses
   */
  async bulkValidateOperations(operations: any[]): Promise<BulkInvoiceOperationStatus[]> {
    const results: BulkInvoiceOperationStatus[] = [];

    for (const operation of operations) {
      try {
        // Perform validation based on operation type
        let isValid = true;
        let message = "Valid";

        if (operation.type === "generate") {
          const validation = await this.validateInvoiceGeneration(operation.data);
          isValid = validation.IsValid;
          message = validation.Errors.length > 0 ? validation.Errors.join(", ") : "Valid";
        }

        results.push({
          ContractUnitID: operation.ContractUnitID || 0,
          UnitNo: operation.UnitNo || "",
          Status: isValid ? "Success" : "Failed",
          Message: message,
        });
      } catch (error) {
        results.push({
          ContractUnitID: operation.ContractUnitID || 0,
          UnitNo: operation.UnitNo || "",
          Status: "Failed",
          Message: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }

    return results;
  }
}

// Export a singleton instance
export const leaseInvoiceGenerationService = new LeaseInvoiceGenerationService();
