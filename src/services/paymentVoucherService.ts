// src/services/paymentVoucherService.ts
import { BaseService, BaseRequest } from "./BaseService";
import {
  PaymentVoucher,
  PaymentVoucherLine,
  PaymentVoucherAttachment,
  PaymentVoucherStatistics,
  PaymentVoucherSummaryReport,
  PaymentVoucherSearchParams,
  PaymentVoucherRequest,
  PaymentVoucherUpdateRequest,
  PaymentVoucherApprovalRequest,
  PaymentVoucherPostingRequest,
  PaymentVoucherReversalRequest,
  PaymentVoucherAttachmentRequest,
  PaymentType,
  PaymentStatus,
  ApiResponse,
} from "../types/paymentVoucherTypes";

// Re-export types for convenience
export type {
  PaymentVoucher,
  PaymentVoucherLine,
  PaymentVoucherAttachment,
  PaymentVoucherStatistics,
  PaymentVoucherSummaryReport,
  PaymentVoucherSearchParams,
  PaymentVoucherRequest,
  PaymentVoucherUpdateRequest,
  PaymentVoucherApprovalRequest,
  PaymentVoucherPostingRequest,
  PaymentVoucherReversalRequest,
  PaymentVoucherAttachmentRequest,
};

// Re-export enums
export { PaymentType, PaymentStatus };

/**
 * Service for payment voucher management operations
 * Implements all modes of the sp_PaymentVoucherManagement stored procedure
 */
class PaymentVoucherService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/paymentvoucher");
  }

  /**
   * Convert File to base64 string
   * @param file - The file to convert
   * @returns Promise with base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Extract the base64 string from the Data URL
        const base64String = reader.result as string;
        // Remove the Data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Content = base64String.split(",")[1];
        resolve(base64Content);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Process attachment file for upload
   * @param attachment - The attachment with file data
   * @returns Processed attachment ready for API
   */
  private async processAttachmentFile(attachment: Partial<PaymentVoucherAttachment>): Promise<Partial<PaymentVoucherAttachment>> {
    // Clone the attachment to avoid modifying the original
    const processedAttachment = { ...attachment };

    // If there's a file object, convert it to base64
    if (attachment.file) {
      processedAttachment.FileContent = await this.fileToBase64(attachment.file);
      processedAttachment.FileContentType = attachment.file.type;
      processedAttachment.FileSize = attachment.file.size;

      // Remove the file object as it's not needed for the API
      delete processedAttachment.file;
      delete processedAttachment.fileUrl;
    }

    return processedAttachment;
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

  /**
   * Mode 1: Create a new payment voucher with optional lines and attachments
   * @param data - The payment voucher data, lines, and attachments
   * @returns Response with status and newly created voucher details
   */
  async createPaymentVoucher(data: PaymentVoucherRequest): Promise<ApiResponse> {
    // Process attachments if provided
    let processedAttachments = data.attachments;
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    // Prepare JSON data for child records
    const paymentLinesJSON = data.paymentLines && data.paymentLines.length > 0 ? JSON.stringify(data.paymentLines) : null;
    const attachmentsJSON = processedAttachments && processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null;

    const request: BaseRequest = {
      mode: 1, // Mode 1: Create New Payment Voucher
      parameters: {
        // Payment Voucher Header Parameters
        VoucherNo: data.voucher.VoucherNo,
        TransactionDate: data.voucher.TransactionDate ? this.formatDate(data.voucher.TransactionDate) : undefined,
        PostingDate: data.voucher.PostingDate ? this.formatDate(data.voucher.PostingDate) : undefined,
        CompanyID: data.voucher.CompanyID,
        FiscalYearID: data.voucher.FiscalYearID,
        SupplierID: data.voucher.SupplierID,
        PaymentType: data.voucher.PaymentType || PaymentType.CASH,
        PaymentStatus: data.voucher.PaymentStatus || PaymentStatus.DRAFT,
        TotalAmount: data.voucher.TotalAmount,
        CurrencyID: data.voucher.CurrencyID,
        ExchangeRate: data.voucher.ExchangeRate || 1.0,
        BaseCurrencyAmount: data.voucher.BaseCurrencyAmount,

        // Bank/Cheque Details
        BankID: data.voucher.BankID,
        BankAccountNo: data.voucher.BankAccountNo,
        ChequeNo: data.voucher.ChequeNo,
        ChequeDate: data.voucher.ChequeDate ? this.formatDate(data.voucher.ChequeDate) : undefined,
        TransactionReference: data.voucher.TransactionReference,

        // GL Account Details
        BankAccountID: data.voucher.BankAccountID,
        PayableAccountID: data.voucher.PayableAccountID,

        // Description and Notes
        Description: data.voucher.Description,
        Narration: data.voucher.Narration,
        InternalNotes: data.voucher.InternalNotes,

        // Cost Center Information
        CostCenter1ID: data.voucher.CostCenter1ID,
        CostCenter2ID: data.voucher.CostCenter2ID,
        CostCenter3ID: data.voucher.CostCenter3ID,
        CostCenter4ID: data.voucher.CostCenter4ID,

        // Tax Information
        TaxID: data.voucher.TaxID,
        TaxPercentage: data.voucher.TaxPercentage,
        TaxAmount: data.voucher.TaxAmount,
        IsTaxInclusive: data.voucher.IsTaxInclusive,
        BaseAmount: data.voucher.BaseAmount,

        // Reference Information
        ReferenceType: data.voucher.ReferenceType,
        ReferenceID: data.voucher.ReferenceID,
        ReferenceNo: data.voucher.ReferenceNo,

        // Approval Workflow
        ApprovedBy: data.voucher.ApprovedBy,
        ApprovedOn: data.voucher.ApprovedOn ? this.formatDate(data.voucher.ApprovedOn) : undefined,
        RequiresApproval: data.voucher.RequiresApproval,

        // Additional Parameters
        AutoPostToGL: data.voucher.AutoPostToGL || false,
        IsRecurring: data.voucher.IsRecurring || false,
        RecurrencePattern: data.voucher.RecurrencePattern,

        // JSON parameters for child records
        PaymentLinesJSON: paymentLinesJSON,
        AttachmentsJSON: attachmentsJSON,

        // Audit parameters
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment voucher created successfully");
      return {
        Status: 1,
        Message: response.message || "Payment voucher created successfully",
        VoucherNo: response.VoucherNo,
        PostingID: response.NewPostingID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create payment voucher",
    };
  }

  /**
   * Mode 2: Update an existing payment voucher with optional lines and attachments
   * @param data - The payment voucher data, lines, and attachments
   * @returns Response with status
   */
  async updatePaymentVoucher(data: PaymentVoucherUpdateRequest): Promise<ApiResponse> {
    // Process attachments if provided
    let processedAttachments = data.attachments;
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    // Prepare JSON data for child records
    const paymentLinesJSON = data.paymentLines && data.paymentLines.length > 0 ? JSON.stringify(data.paymentLines) : null;
    const attachmentsJSON = processedAttachments && processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null;

    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Payment Voucher
      parameters: {
        VoucherNo: data.voucher.VoucherNo,
        TransactionDate: data.voucher.TransactionDate ? this.formatDate(data.voucher.TransactionDate) : undefined,
        PostingDate: data.voucher.PostingDate ? this.formatDate(data.voucher.PostingDate) : undefined,
        CompanyID: data.voucher.CompanyID,
        FiscalYearID: data.voucher.FiscalYearID,
        SupplierID: data.voucher.SupplierID,
        PaymentType: data.voucher.PaymentType,
        PaymentStatus: data.voucher.PaymentStatus,
        TotalAmount: data.voucher.TotalAmount,
        CurrencyID: data.voucher.CurrencyID,
        ExchangeRate: data.voucher.ExchangeRate,
        BaseCurrencyAmount: data.voucher.BaseCurrencyAmount,

        // Bank/Cheque Details
        BankID: data.voucher.BankID,
        BankAccountNo: data.voucher.BankAccountNo,
        ChequeNo: data.voucher.ChequeNo,
        ChequeDate: data.voucher.ChequeDate ? this.formatDate(data.voucher.ChequeDate) : undefined,
        TransactionReference: data.voucher.TransactionReference,

        // GL Account Details
        BankAccountID: data.voucher.BankAccountID,
        PayableAccountID: data.voucher.PayableAccountID,

        // Description and Notes
        Description: data.voucher.Description,
        Narration: data.voucher.Narration,
        InternalNotes: data.voucher.InternalNotes,

        // Cost Center Information
        CostCenter1ID: data.voucher.CostCenter1ID,
        CostCenter2ID: data.voucher.CostCenter2ID,
        CostCenter3ID: data.voucher.CostCenter3ID,
        CostCenter4ID: data.voucher.CostCenter4ID,

        // Tax Information
        TaxID: data.voucher.TaxID,
        TaxPercentage: data.voucher.TaxPercentage,
        TaxAmount: data.voucher.TaxAmount,
        IsTaxInclusive: data.voucher.IsTaxInclusive,
        BaseAmount: data.voucher.BaseAmount,

        // Reference Information
        ReferenceType: data.voucher.ReferenceType,
        ReferenceID: data.voucher.ReferenceID,
        ReferenceNo: data.voucher.ReferenceNo,

        // Additional Parameters
        AutoPostToGL: data.voucher.AutoPostToGL,
        IsRecurring: data.voucher.IsRecurring,
        RecurrencePattern: data.voucher.RecurrencePattern,

        // JSON parameters for child records
        PaymentLinesJSON: paymentLinesJSON,
        AttachmentsJSON: attachmentsJSON,

        // Audit parameters
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment voucher updated successfully");
      return {
        Status: 1,
        Message: response.message || "Payment voucher updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update payment voucher",
    };
  }

  /**
   * Mode 3: Get all payment vouchers with optional filters
   * @param companyId - Optional company ID filter
   * @param fiscalYearId - Optional fiscal year ID filter
   * @returns Array of payment vouchers
   */
  async getAllPaymentVouchers(companyId?: number, fiscalYearId?: number): Promise<PaymentVoucher[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Get All Payment Vouchers
      parameters: {
        FilterCompanyID: companyId,
        FilterFiscalYearID: fiscalYearId,
      },
    };

    const response = await this.execute<PaymentVoucher[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Mode 4: Get a payment voucher by voucher number (including line items and attachments)
   * @param voucherNo - The voucher number to fetch
   * @returns Payment voucher object with lines and attachments
   */
  async getPaymentVoucherByVoucherNo(voucherNo: string): Promise<{
    voucher: PaymentVoucher | null;
    lines: PaymentVoucherLine[];
    attachments: PaymentVoucherAttachment[];
  }> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Get Payment Voucher by Voucher Number
      parameters: {
        VoucherNo: voucherNo,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      // Process attachments to create file URLs for display if needed
      const attachments = (response.table3 || []).map((attachment: PaymentVoucherAttachment) => {
        if (attachment.FileContent && attachment.FileContentType) {
          // Create a data URL for display
          attachment.fileUrl = `data:${attachment.FileContentType};base64,${attachment.FileContent}`;
        }
        return attachment;
      });

      return {
        voucher: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        lines: response.table2 || [],
        attachments: attachments,
      };
    }

    return { voucher: null, lines: [], attachments: [] };
  }

  /**
   * Mode 5: Delete a payment voucher
   * @param voucherNo - The voucher number to delete
   * @returns Response with status
   */
  async deletePaymentVoucher(voucherNo: string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Delete Payment Voucher
      parameters: {
        VoucherNo: voucherNo,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment voucher deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Payment voucher deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete payment voucher",
    };
  }

  /**
   * Mode 6: Search for payment vouchers with filters
   * @param params - Search parameters
   * @returns Array of matching payment vouchers
   */
  async searchPaymentVouchers(params: PaymentVoucherSearchParams = {}): Promise<PaymentVoucher[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Payment Vouchers
      parameters: {
        SearchText: params.searchText,
        FilterSupplierID: params.filterSupplierID,
        FilterBankID: params.filterBankID,
        FilterPaymentType: params.filterPaymentType,
        FilterPaymentStatus: params.filterPaymentStatus,
        FilterCompanyID: params.filterCompanyID,
        FilterFiscalYearID: params.filterFiscalYearID,
        DateFrom: params.dateFrom ? this.formatDate(params.dateFrom) : undefined,
        DateTo: params.dateTo ? this.formatDate(params.dateTo) : undefined,
      },
    };

    const response = await this.execute<PaymentVoucher[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Mode 7: Approve a payment voucher
   * @param data - Approval request data
   * @returns Response with status
   */
  async approvePaymentVoucher(data: PaymentVoucherApprovalRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Approve Payment Voucher
      parameters: {
        VoucherNo: data.VoucherNo,
        ApprovedBy: data.ApprovedBy || this.getCurrentUserId(),
        ApprovedOn: data.ApprovedOn ? this.formatDate(data.ApprovedOn) : undefined,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment voucher approved successfully");
      return {
        Status: 1,
        Message: response.message || "Payment voucher approved successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to approve payment voucher",
    };
  }

  /**
   * Mode 8: Post payment voucher to General Ledger
   * @param data - Posting request data
   * @returns Response with status
   */
  async postPaymentVoucherToGL(data: PaymentVoucherPostingRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Post Payment Voucher to GL
      parameters: {
        VoucherNo: data.VoucherNo,
        AutoPostToGL: data.AutoPostToGL || true,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment voucher posted to GL successfully");
      return {
        Status: 1,
        Message: response.message || "Payment voucher posted to GL successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to post payment voucher to GL",
    };
  }

  /**
   * Mode 9: Reverse a payment voucher
   * @param data - Reversal request data
   * @returns Response with status and reversal voucher number
   */
  async reversePaymentVoucher(data: PaymentVoucherReversalRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Reverse Payment Voucher
      parameters: {
        VoucherNo: data.VoucherNo,
        Description: data.ReversalReason,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment voucher reversed successfully");
      return {
        Status: 1,
        Message: response.message || "Payment voucher reversed successfully",
        ReversalVoucherNo: response.ReversalVoucherNo,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reverse payment voucher",
    };
  }

  /**
   * Mode 10: Add attachment to payment voucher
   * @param data - Attachment data to add
   * @returns Response with status and new attachment ID
   */
  async addAttachment(data: PaymentVoucherAttachmentRequest): Promise<ApiResponse> {
    // Process the attachment file if present
    const processedAttachment = await this.processAttachmentFile(data);

    const request: BaseRequest = {
      mode: 10, // Mode 10: Add Attachment to Payment Voucher
      parameters: {
        VoucherNo: data.VoucherNo,
        DocTypeID: processedAttachment.DocTypeID,
        DocumentName: processedAttachment.DocumentName,
        FilePath: processedAttachment.FilePath,
        FileContent: processedAttachment.FileContent,
        FileContentType: processedAttachment.FileContentType,
        FileSize: processedAttachment.FileSize,
        DocumentDescription: processedAttachment.DocumentDescription,
        IsRequired: processedAttachment.IsRequired || false,
        DisplayOrder: processedAttachment.DisplayOrder || 0,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment added successfully");
      return {
        Status: 1,
        Message: response.message || "Attachment added successfully",
        AttachmentID: response.AttachmentID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to add attachment",
    };
  }

  /**
   * Mode 11: Update payment voucher attachment
   * @param data - Attachment data to update
   * @returns Response with status
   */
  async updateAttachment(data: PaymentVoucherAttachmentRequest & { PostingAttachmentID: number }): Promise<ApiResponse> {
    // Process the attachment file if present
    const processedAttachment = await this.processAttachmentFile(data);

    const request: BaseRequest = {
      mode: 11, // Mode 11: Update Attachment
      parameters: {
        PostingAttachmentID: data.PostingAttachmentID,
        DocTypeID: processedAttachment.DocTypeID,
        DocumentName: processedAttachment.DocumentName,
        FilePath: processedAttachment.FilePath,
        FileContent: processedAttachment.FileContent,
        FileContentType: processedAttachment.FileContentType,
        FileSize: processedAttachment.FileSize,
        DocumentDescription: processedAttachment.DocumentDescription,
        IsRequired: processedAttachment.IsRequired,
        DisplayOrder: processedAttachment.DisplayOrder,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment updated successfully");
      return {
        Status: 1,
        Message: response.message || "Attachment updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update attachment",
    };
  }

  /**
   * Mode 12: Delete payment voucher attachment
   * @param attachmentId - The ID of the attachment to delete
   * @returns Response with status
   */
  async deleteAttachment(attachmentId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 12, // Mode 12: Delete Attachment
      parameters: {
        PostingAttachmentID: attachmentId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Attachment deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete attachment",
    };
  }

  /**
   * Mode 13: Get payment voucher summary report
   * @param companyId - Optional company ID filter
   * @param fiscalYearId - Optional fiscal year ID filter
   * @param dateFrom - Optional start date filter
   * @param dateTo - Optional end date filter
   * @returns Array of payment voucher summary data
   */
  async getPaymentVoucherSummaryReport(companyId?: number, fiscalYearId?: number, dateFrom?: string | Date, dateTo?: string | Date): Promise<PaymentVoucherSummaryReport[]> {
    const request: BaseRequest = {
      mode: 13, // Mode 13: Get Payment Voucher Summary Report
      parameters: {
        FilterCompanyID: companyId,
        FilterFiscalYearID: fiscalYearId,
        DateFrom: dateFrom ? this.formatDate(dateFrom) : undefined,
        DateTo: dateTo ? this.formatDate(dateTo) : undefined,
      },
    };

    const response = await this.execute<PaymentVoucherSummaryReport[]>(request);
    return response.success ? response.data || [] : [];
  }

  // Convenience methods for common operations

  /**
   * Get payment vouchers by supplier
   * @param supplierId - The supplier ID
   * @returns Array of payment vouchers for the supplier
   */
  async getPaymentVouchersBySupplier(supplierId: number): Promise<PaymentVoucher[]> {
    return this.searchPaymentVouchers({ filterSupplierID: supplierId });
  }

  /**
   * Get payment vouchers by status
   * @param status - The payment status
   * @returns Array of payment vouchers with the specified status
   */
  async getPaymentVouchersByStatus(status: string): Promise<PaymentVoucher[]> {
    return this.searchPaymentVouchers({ filterPaymentStatus: status });
  }

  /**
   * Get payment vouchers by payment type
   * @param paymentType - The payment type
   * @returns Array of payment vouchers with the specified payment type
   */
  async getPaymentVouchersByPaymentType(paymentType: string): Promise<PaymentVoucher[]> {
    return this.searchPaymentVouchers({ filterPaymentType: paymentType });
  }

  /**
   * Get payment vouchers for a date range
   * @param fromDate - Start date
   * @param toDate - End date
   * @returns Array of payment vouchers in the date range
   */
  async getPaymentVouchersByDateRange(fromDate: string | Date, toDate: string | Date): Promise<PaymentVoucher[]> {
    return this.searchPaymentVouchers({ dateFrom: fromDate, dateTo: toDate });
  }

  /**
   * Get draft payment vouchers
   * @returns Array of draft payment vouchers
   */
  async getDraftPaymentVouchers(): Promise<PaymentVoucher[]> {
    return this.getPaymentVouchersByStatus(PaymentStatus.DRAFT);
  }

  /**
   * Get pending payment vouchers (requiring approval)
   * @returns Array of pending payment vouchers
   */
  async getPendingPaymentVouchers(): Promise<PaymentVoucher[]> {
    return this.getPaymentVouchersByStatus(PaymentStatus.PENDING);
  }

  /**
   * Get approved payment vouchers (ready for posting)
   * @returns Array of approved payment vouchers
   */
  async getApprovedPaymentVouchers(): Promise<PaymentVoucher[]> {
    return this.getPaymentVouchersByStatus(PaymentStatus.APPROVED);
  }

  /**
   * Get posted payment vouchers
   * @returns Array of posted payment vouchers
   */
  async getPostedPaymentVouchers(): Promise<PaymentVoucher[]> {
    return this.getPaymentVouchersByStatus(PaymentStatus.POSTED);
  }

  /**
   * Get cash payment vouchers
   * @returns Array of cash payment vouchers
   */
  async getCashPaymentVouchers(): Promise<PaymentVoucher[]> {
    return this.getPaymentVouchersByPaymentType(PaymentType.CASH);
  }

  /**
   * Get cheque payment vouchers
   * @returns Array of cheque payment vouchers
   */
  async getChequePaymentVouchers(): Promise<PaymentVoucher[]> {
    return this.getPaymentVouchersByPaymentType(PaymentType.CHEQUE);
  }

  /**
   * Get bank transfer payment vouchers
   * @returns Array of bank transfer payment vouchers
   */
  async getBankTransferPaymentVouchers(): Promise<PaymentVoucher[]> {
    return this.getPaymentVouchersByPaymentType(PaymentType.BANK_TRANSFER);
  }

  /**
   * Bulk approve payment vouchers
   * @param voucherNumbers - Array of voucher numbers to approve
   * @returns Array of approval results
   */
  async bulkApprovePaymentVouchers(voucherNumbers: string[]): Promise<ApiResponse[]> {
    const results: ApiResponse[] = [];

    for (const voucherNo of voucherNumbers) {
      try {
        const result = await this.approvePaymentVoucher({ VoucherNo: voucherNo });
        results.push(result);
      } catch (error) {
        results.push({
          Status: 0,
          Message: `Failed to approve voucher ${voucherNo}: ${error}`,
        });
      }
    }

    return results;
  }

  /**
   * Bulk post payment vouchers to GL
   * @param voucherNumbers - Array of voucher numbers to post
   * @returns Array of posting results
   */
  async bulkPostPaymentVouchers(voucherNumbers: string[]): Promise<ApiResponse[]> {
    const results: ApiResponse[] = [];

    for (const voucherNo of voucherNumbers) {
      try {
        const result = await this.postPaymentVoucherToGL({ VoucherNo: voucherNo });
        results.push(result);
      } catch (error) {
        results.push({
          Status: 0,
          Message: `Failed to post voucher ${voucherNo}: ${error}`,
        });
      }
    }

    return results;
  }

  /**
   * Validate payment voucher data before creation/update
   * @param voucher - The payment voucher to validate
   * @returns Validation result with any errors
   */
  async validatePaymentVoucher(voucher: Partial<PaymentVoucher>): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Required field validations
    if (!voucher.CompanyID) {
      errors.push("Company is required");
    }

    if (!voucher.FiscalYearID) {
      errors.push("Fiscal Year is required");
    }

    if (!voucher.TotalAmount || voucher.TotalAmount <= 0) {
      errors.push("Total amount must be greater than zero");
    }

    if (!voucher.PaymentType) {
      errors.push("Payment type is required");
    }

    // Payment type specific validations
    if (voucher.PaymentType === PaymentType.CHEQUE) {
      if (!voucher.ChequeNo) {
        errors.push("Cheque number is required for cheque payments");
      }
      if (!voucher.BankID) {
        errors.push("Bank is required for cheque payments");
      }
    }

    if (voucher.PaymentType === PaymentType.BANK_TRANSFER) {
      if (!voucher.BankID) {
        errors.push("Bank is required for bank transfer payments");
      }
      if (!voucher.TransactionReference) {
        errors.push("Transaction reference is required for bank transfers");
      }
    }

    // Date validations
    if (voucher.TransactionDate && voucher.PostingDate) {
      const transactionDate = new Date(voucher.TransactionDate);
      const postingDate = new Date(voucher.PostingDate);

      if (postingDate < transactionDate) {
        errors.push("Posting date cannot be earlier than transaction date");
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Export a singleton instance
export const paymentVoucherService = new PaymentVoucherService();
