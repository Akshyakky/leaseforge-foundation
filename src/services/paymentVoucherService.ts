// src/services/paymentVoucherService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  PaymentVoucher,
  PaymentVoucherLine,
  PaymentVoucherAttachment,
  PaymentVoucherRequest,
  PaymentVoucherResponse,
  PaymentSearchFilters,
  PaymentSummaryReport,
  SupplierBalance,
  SupplierPaymentHistory,
  PaymentStatistics,
  CreatePaymentVoucherResponse,
  ApprovalResponse,
  ReversalResponse,
  AttachmentResponse,
  NextVoucherNumberResponse,
  VoucherExistsResponse,
  AccountBalanceResponse,
  SupplierBalanceResponse,
  PaymentStatus,
  PaymentType,
  ApprovalAction,
  ApprovalStatus,
  TransactionType,
} from "../types/paymentVoucherTypes";

/**
 * Service for payment voucher operations
 */
class PaymentVoucherService extends BaseService {
  constructor() {
    super("/Master/paymentVoucher");
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
        const base64String = reader.result as string;
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
    const processedAttachment = { ...attachment };

    if (attachment.file) {
      processedAttachment.FileContent = await this.fileToBase64(attachment.file);
      processedAttachment.FileContentType = attachment.file.type;
      processedAttachment.FileSize = attachment.file.size;

      delete processedAttachment.file;
      delete processedAttachment.fileUrl;
    }

    return processedAttachment;
  }

  /**
   * Validate payment voucher data before submission
   * @param data - The voucher data to validate
   * @returns Validation result
   */
  private validatePaymentVoucherData(data: PaymentVoucherRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.voucher.TransactionDate) {
      errors.push("Transaction date is required");
    }

    if (!data.voucher.CompanyID) {
      errors.push("Company is required");
    }

    if (!data.voucher.FiscalYearID) {
      errors.push("Fiscal year is required");
    }

    if (!data.voucher.CurrencyID) {
      errors.push("Currency is required");
    }

    if (!data.voucher.PaymentType) {
      errors.push("Payment type is required");
    }

    if (!data.voucher.PaymentAccountID) {
      errors.push("Payment account is required");
    }

    if (!data.voucher.TotalAmount || data.voucher.TotalAmount <= 0) {
      errors.push("Total amount must be greater than zero");
    }

    if (!data.lines || data.lines.length === 0) {
      errors.push("At least one voucher line is required");
    }

    if (data.lines && data.lines.length > 0) {
      const totalLineAmount = data.lines.reduce((sum, line) => sum + (line.DebitAmount || 0), 0);

      if (Math.abs(totalLineAmount - (data.voucher.TotalAmount || 0)) > 0.01) {
        errors.push("Total line amounts must equal the payment amount");
      }

      data.lines.forEach((line, index) => {
        if (!line.AccountID) {
          errors.push(`Line ${index + 1}: Account is required`);
        }

        if (!line.DebitAmount || line.DebitAmount <= 0) {
          errors.push(`Line ${index + 1}: Debit amount must be greater than zero`);
        }

        // Ensure transaction type is Debit for payment voucher lines
        if (line.TransactionType && line.TransactionType !== TransactionType.DEBIT) {
          errors.push(`Line ${index + 1}: Payment voucher lines must be debit transactions`);
        }
      });
    }

    // Payment type specific validations
    if (data.voucher.PaymentType === PaymentType.CHEQUE) {
      if (!data.voucher.ChequeNo) {
        errors.push("Cheque number is required for cheque payments");
      }
      if (!data.voucher.ChequeDate) {
        errors.push("Cheque date is required for cheque payments");
      }
      if (!data.voucher.BankID) {
        errors.push("Bank is required for cheque payments");
      }
    }

    if (data.voucher.PaymentType === PaymentType.BANK_TRANSFER && !data.voucher.BankID) {
      errors.push("Bank is required for bank transfer payments");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // CORE PAYMENT VOUCHER OPERATIONS

  /**
   * Create a new payment voucher
   * @param data - The voucher data including lines and attachments
   * @returns Response with status and voucher details
   */
  async createPaymentVoucher(data: PaymentVoucherRequest): Promise<CreatePaymentVoucherResponse> {
    // Validate data
    const validation = this.validatePaymentVoucherData(data);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.join("; "),
      };
    }

    // Process attachments if provided
    let processedAttachments = data.attachments;
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    const request: BaseRequest = {
      mode: 1, // Mode 1: Create New Payment Voucher
      parameters: {
        ...data.voucher,
        VoucherLinesJSON: JSON.stringify(data.lines),
        AttachmentsJSON: processedAttachments && processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment voucher created successfully");
      return {
        success: true,
        message: response.message || "Payment voucher created successfully",
        voucherNo: response.VoucherNo,
        postingId: response.PostingID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to create payment voucher",
    };
  }

  /**
   * Update an existing payment voucher
   * @param data - The voucher data including lines and attachments
   * @returns Response with status
   */
  async updatePaymentVoucher(data: PaymentVoucherRequest & { voucherNo: string }): Promise<CreatePaymentVoucherResponse> {
    // Validate data
    const validation = this.validatePaymentVoucherData(data);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.join("; "),
      };
    }

    // Process attachments if provided
    let processedAttachments = data.attachments;
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Payment Voucher
      parameters: {
        ...data.voucher,
        VoucherNo: data.voucherNo,
        VoucherLinesJSON: JSON.stringify(data.lines),
        AttachmentsJSON: processedAttachments && processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment voucher updated successfully");
      return {
        success: true,
        message: response.message || "Payment voucher updated successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update payment voucher",
    };
  }

  /**
   * Get all payment vouchers with optional filtering
   * @param filters - Optional search and filter criteria
   * @returns Array of payment vouchers
   */
  async getAllPaymentVouchers(filters?: PaymentSearchFilters): Promise<PaymentVoucher[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Get All Payment Vouchers
      parameters: {
        FilterCompanyID: filters?.companyId,
        FilterFiscalYearID: filters?.fiscalYearId,
        FilterStatus: filters?.status,
        FilterApprovalStatus: filters?.approvalStatus,
        FilterSupplierID: filters?.supplierId,
        FilterPaymentType: filters?.paymentType,
        FilterDateFrom: filters?.dateFrom?.toISOString().split("T")[0],
        FilterDateTo: filters?.dateTo?.toISOString().split("T")[0],
      },
    };

    const response = await this.execute<PaymentVoucher[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get payment voucher by voucher number (including lines and attachments)
   * @param voucherNo - The voucher number
   * @param companyId - Optional company ID filter
   * @returns Voucher with lines and attachments
   */
  async getPaymentVoucherByNumber(voucherNo: string, companyId?: number): Promise<PaymentVoucherResponse> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Get Payment Voucher by Voucher Number
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      // Process attachments to create file URLs
      const attachments = (response.table3 || []).map((attachment: PaymentVoucherAttachment) => {
        if (attachment.FileContent && attachment.FileContentType) {
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
   * Delete a payment voucher
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @returns Response with status
   */
  async deletePaymentVoucher(voucherNo: string, companyId: number): Promise<ApprovalResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Delete Payment Voucher
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment voucher deleted successfully");
      return {
        success: true,
        message: response.message || "Payment voucher deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete payment voucher",
    };
  }

  // SEARCH AND FILTERING

  /**
   * Search payment vouchers
   * @param filters - Search criteria and filters
   * @returns Array of matching vouchers
   */
  async searchPaymentVouchers(filters: PaymentSearchFilters): Promise<PaymentVoucher[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Payment Vouchers
      parameters: {
        SearchText: filters.searchText,
        FilterCompanyID: filters.companyId,
        FilterFiscalYearID: filters.fiscalYearId,
        FilterStatus: filters.status,
        FilterApprovalStatus: filters.approvalStatus,
        FilterSupplierID: filters.supplierId,
        FilterPaymentType: filters.paymentType,
        FilterDateFrom: filters.dateFrom?.toISOString().split("T")[0],
        FilterDateTo: filters.dateTo?.toISOString().split("T")[0],
        FilterAccountID: filters.accountId,
      },
    };

    const response = await this.execute<PaymentVoucher[]>(request);
    return response.success ? response.data || [] : [];
  }

  // APPROVAL WORKFLOW

  /**
   * Approve or reject a payment voucher
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @param action - Approve or Reject
   * @param comments - Optional approval comments or rejection reason
   * @returns Response with status
   */
  async approveOrRejectPaymentVoucher(voucherNo: string, companyId: number, action: ApprovalAction, comments?: string): Promise<ApprovalResponse> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Approve/Reject Payment Voucher
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
        ApprovalAction: action,
        ApprovalComments: action === ApprovalAction.APPROVE ? comments : undefined,
        RejectionReason: action === ApprovalAction.REJECT ? comments : undefined,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`Payment voucher ${action.toLowerCase()}d successfully`);
      return {
        success: true,
        message: response.message || `Payment voucher ${action.toLowerCase()}d successfully`,
      };
    }

    return {
      success: false,
      message: response.message || `Failed to ${action.toLowerCase()} payment voucher`,
    };
  }

  /**
   * Submit payment voucher for approval
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @returns Response with status
   */
  async submitPaymentVoucherForApproval(voucherNo: string, companyId: number): Promise<ApprovalResponse> {
    const request: BaseRequest = {
      mode: 14, // Mode 14: Submit Voucher for Approval
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment voucher submitted for approval successfully");
      return {
        success: true,
        message: response.message || "Payment voucher submitted for approval successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to submit payment voucher for approval",
    };
  }

  /**
   * Get payment vouchers pending approval
   * @param filters - Optional filtering criteria
   * @returns Array of payment vouchers pending approval
   */
  async getPaymentVouchersPendingApproval(filters?: { companyId?: number; fiscalYearId?: number }): Promise<PaymentVoucher[]> {
    const request: BaseRequest = {
      mode: 21, // Mode 21: Get Vouchers Pending Approval
      parameters: {
        FilterCompanyID: filters?.companyId,
        FilterFiscalYearID: filters?.fiscalYearId,
      },
    };

    const response = await this.execute<PaymentVoucher[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Reset payment voucher approval status
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @returns Response with status
   */
  async resetPaymentVoucherApprovalStatus(voucherNo: string, companyId: number): Promise<ApprovalResponse> {
    const request: BaseRequest = {
      mode: 22, // Mode 22: Reset Approval Status
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment voucher approval status reset successfully");
      return {
        success: true,
        message: response.message || "Payment voucher approval status reset successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to reset payment voucher approval status",
    };
  }

  // REVERSAL OPERATIONS

  /**
   * Reverse a paid payment voucher
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @param reason - Reason for reversal
   * @returns Response with reversal details
   */
  async reversePaymentVoucher(voucherNo: string, companyId: number, reason: string): Promise<ReversalResponse> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Reverse Payment Voucher
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
        ReferenceNo: reason, // Note: stored procedure uses ReferenceNo for reversal reason
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Payment voucher reversed successfully");
      return {
        success: true,
        message: response.message || "Payment voucher reversed successfully",
        reversalVoucherNo: response.ReversalVoucherNo,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to reverse payment voucher",
    };
  }

  // SUPPLIER MANAGEMENT

  /**
   * Get supplier outstanding balance
   * @param supplierId - The supplier ID
   * @param balanceDate - Optional date to calculate balance as of
   * @returns Supplier balance information
   */
  async getSupplierOutstandingBalance(supplierId: number, balanceDate?: Date): Promise<SupplierBalance | null> {
    const request: BaseRequest = {
      mode: 19, // Mode 19: Get Supplier Outstanding Balance
      parameters: {
        SupplierID: supplierId,
        BalanceDate: balanceDate?.toISOString().split("T")[0],
      },
    };

    const response = await this.execute(request, false);

    if (response.success || response.Status === 1) {
      return {
        SupplierID: response.SupplierID || supplierId,
        OutstandingBalance: response.SupplierBalance || 0,
        BalanceDate: balanceDate || new Date(),
      } as SupplierBalance;
    }

    return null;
  }

  /**
   * Get payment history for a supplier
   * @param supplierId - The supplier ID
   * @param filters - Optional date filters
   * @returns Array of payment history records
   */
  async getSupplierPaymentHistory(supplierId: number, filters?: { dateFrom?: Date; dateTo?: Date }): Promise<SupplierPaymentHistory[]> {
    const request: BaseRequest = {
      mode: 20, // Mode 20: Get Payment Vouchers by Supplier
      parameters: {
        SupplierID: supplierId,
        FilterDateFrom: filters?.dateFrom?.toISOString().split("T")[0],
        FilterDateTo: filters?.dateTo?.toISOString().split("T")[0],
      },
    };

    const response = await this.execute<SupplierPaymentHistory[]>(request);
    return response.success ? response.data || [] : [];
  }

  // ATTACHMENT MANAGEMENT

  /**
   * Add attachment to payment voucher
   * @param attachment - The attachment data
   * @returns Response with attachment ID
   */
  async addPaymentVoucherAttachment(attachment: Partial<PaymentVoucherAttachment> & { PostingID: number }): Promise<AttachmentResponse> {
    const processedAttachment = await this.processAttachmentFile(attachment);

    const request: BaseRequest = {
      mode: 15, // Mode 15: Add Single Attachment
      parameters: {
        ...processedAttachment,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment added successfully");
      return {
        success: true,
        message: response.message || "Attachment added successfully",
        attachmentId: response.NewAttachmentID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to add attachment",
    };
  }

  /**
   * Update payment voucher attachment
   * @param attachment - The attachment data to update
   * @returns Response with status
   */
  async updatePaymentVoucherAttachment(attachment: Partial<PaymentVoucherAttachment> & { PostingAttachmentID: number }): Promise<AttachmentResponse> {
    const processedAttachment = await this.processAttachmentFile(attachment);

    const request: BaseRequest = {
      mode: 16, // Mode 16: Update Single Attachment
      parameters: {
        ...processedAttachment,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment updated successfully");
      return {
        success: true,
        message: response.message || "Attachment updated successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update attachment",
    };
  }

  /**
   * Delete payment voucher attachment
   * @param attachmentId - The attachment ID
   * @returns Response with status
   */
  async deletePaymentVoucherAttachment(attachmentId: number): Promise<AttachmentResponse> {
    const request: BaseRequest = {
      mode: 17, // Mode 17: Delete Single Attachment
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
        success: true,
        message: response.message || "Attachment deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete attachment",
    };
  }

  /**
   * Get attachments by posting ID
   * @param postingId - The posting ID
   * @returns Array of attachments
   */
  async getPaymentVoucherAttachmentsByPostingId(postingId: number): Promise<PaymentVoucherAttachment[]> {
    const request: BaseRequest = {
      mode: 18, // Mode 18: Get Attachments by Posting ID
      parameters: {
        PostingID: postingId,
      },
    };

    const response = await this.execute<PaymentVoucherAttachment[]>(request);

    if (response.success) {
      // Process attachments to create file URLs
      const attachments = (response.data || []).map((attachment: PaymentVoucherAttachment) => {
        if (attachment.FileContent && attachment.FileContentType) {
          attachment.fileUrl = `data:${attachment.FileContentType};base64,${attachment.FileContent}`;
        }
        return attachment;
      });

      return attachments;
    }

    return [];
  }

  // REPORTS AND UTILITIES

  /**
   * Get payment summary report
   * @param filters - Date and company filters
   * @returns Summary report data
   */
  async getPaymentSummaryReport(filters: { dateFrom?: Date; dateTo?: Date; companyId?: number; fiscalYearId?: number }): Promise<PaymentSummaryReport[]> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Get Payment Summary Report
      parameters: {
        FilterDateFrom: filters.dateFrom?.toISOString().split("T")[0],
        FilterDateTo: filters.dateTo?.toISOString().split("T")[0],
        FilterCompanyID: filters.companyId,
        FilterFiscalYearID: filters.fiscalYearId,
      },
    };

    const response = await this.execute<PaymentSummaryReport[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Check if voucher number exists
   * @param voucherNo - The voucher number to check
   * @param companyId - The company ID
   * @param postingId - Optional posting ID to exclude from check
   * @returns Whether voucher number exists
   */
  async checkPaymentVoucherNumberExists(voucherNo: string, companyId: number, postingId?: number): Promise<VoucherExistsResponse> {
    const request: BaseRequest = {
      mode: 11, // Mode 11: Check if Voucher Number exists
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
        PostingID: postingId,
      },
    };

    const response = await this.execute(request, false);

    return {
      exists: response.Status === 0, // Status 0 means it exists
      message: response.Message || "",
    };
  }

  /**
   * Get next voucher number
   * @param companyId - The company ID
   * @param fiscalYearId - The fiscal year ID
   * @param transactionDate - The transaction date
   * @returns Next voucher number
   */
  async getNextPaymentVoucherNumber(companyId: number, fiscalYearId: number, transactionDate?: Date): Promise<NextVoucherNumberResponse> {
    const request: BaseRequest = {
      mode: 12, // Mode 12: Get Next Voucher Number
      parameters: {
        CompanyID: companyId,
        FiscalYearID: fiscalYearId,
        TransactionDate: transactionDate?.toISOString().split("T")[0],
      },
    };

    const response = await this.execute(request, false);

    return {
      success: response.success || response.Status === 1,
      message: response.Message || "",
      nextVoucherNo: response.NextVoucherNo || "",
    };
  }

  /**
   * Get account balance
   * @param accountId - The account ID
   * @param balanceDate - The date to calculate balance as of
   * @returns Account balance
   */
  async getAccountBalance(accountId: number, balanceDate?: Date): Promise<AccountBalanceResponse> {
    const request: BaseRequest = {
      mode: 13, // Mode 13: Get Account Balance
      parameters: {
        AccountID: accountId,
        BalanceDate: balanceDate?.toISOString().split("T")[0],
      },
    };

    const response = await this.execute(request, false);

    return {
      success: response.success || response.Status === 1,
      message: response.Message || "",
      accountBalance: response.AccountBalance || 0,
    };
  }

  /**
   * Get payment voucher for editing
   * @param voucherNo - The voucher number
   * @param companyId - Optional company ID
   * @returns Voucher data for editing
   */
  async getPaymentVoucherForEdit(voucherNo: string, companyId?: number): Promise<PaymentVoucherResponse> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Voucher for Edit
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      // Process attachments to create file URLs
      const attachments = (response.table3 || []).map((attachment: PaymentVoucherAttachment) => {
        if (attachment.FileContent && attachment.FileContentType) {
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

  // UTILITY METHODS

  /**
   * Get payment types for dropdown
   * @returns Array of payment types
   */
  getPaymentTypes(): { value: PaymentType; label: string }[] {
    return [
      { value: PaymentType.CASH, label: "Cash" },
      { value: PaymentType.CHEQUE, label: "Cheque" },
      { value: PaymentType.BANK_TRANSFER, label: "Bank Transfer" },
      { value: PaymentType.ONLINE, label: "Online Payment" },
      { value: PaymentType.WIRE_TRANSFER, label: "Wire Transfer" },
      { value: PaymentType.CREDIT_CARD, label: "Credit Card" },
      { value: PaymentType.DEBIT_CARD, label: "Debit Card" },
    ];
  }

  /**
   * Get payment statuses for dropdown
   * @returns Array of payment statuses
   */
  getPaymentStatuses(): { value: PaymentStatus; label: string }[] {
    return [
      { value: PaymentStatus.DRAFT, label: "Draft" },
      { value: PaymentStatus.PENDING, label: "Pending Approval" },
      { value: PaymentStatus.PAID, label: "Paid" },
      { value: PaymentStatus.REJECTED, label: "Rejected" },
      { value: PaymentStatus.CANCELLED, label: "Cancelled" },
      { value: PaymentStatus.REVERSED, label: "Reversed" },
    ];
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
      currency: currencyCode || "AED",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  }

  /**
   * Calculate payment due date based on payment terms
   * @param transactionDate - The transaction date
   * @param paymentTermDays - Number of days for payment
   * @returns Due date
   */
  calculateDueDate(transactionDate: Date, paymentTermDays: number): Date {
    const dueDate = new Date(transactionDate);
    dueDate.setDate(dueDate.getDate() + paymentTermDays);
    return dueDate;
  }

  /**
   * Validate cheque details
   * @param chequeNo - Cheque number
   * @param chequeDate - Cheque date
   * @param bankId - Bank ID
   * @returns Validation result
   */
  validateChequeDetails(chequeNo: string, chequeDate: Date, bankId: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!chequeNo || chequeNo.trim().length === 0) {
      errors.push("Cheque number is required");
    }

    if (!chequeDate) {
      errors.push("Cheque date is required");
    }

    if (!bankId) {
      errors.push("Bank is required");
    }

    if (chequeDate && chequeDate > new Date()) {
      errors.push("Cheque date cannot be in the future");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get payment method description
   * @param paymentType - The payment type
   * @returns Human readable description
   */
  getPaymentMethodDescription(paymentType: PaymentType): string {
    const descriptions = {
      [PaymentType.CASH]: "Cash payment",
      [PaymentType.CHEQUE]: "Payment by cheque",
      [PaymentType.BANK_TRANSFER]: "Bank transfer",
      [PaymentType.ONLINE]: "Online payment",
      [PaymentType.WIRE_TRANSFER]: "Wire transfer",
      [PaymentType.CREDIT_CARD]: "Credit card payment",
      [PaymentType.DEBIT_CARD]: "Debit card payment",
    };
    return descriptions[paymentType] || "Unknown payment method";
  }

  /**
   * Check if payment type requires bank details
   * @param paymentType - The payment type
   * @returns Whether bank details are required
   */
  requiresBankDetails(paymentType: PaymentType): boolean {
    return [PaymentType.CHEQUE, PaymentType.BANK_TRANSFER, PaymentType.WIRE_TRANSFER].includes(paymentType);
  }

  /**
   * Check if payment type requires cheque details
   * @param paymentType - The payment type
   * @returns Whether cheque details are required
   */
  requiresChequeDetails(paymentType: PaymentType): boolean {
    return paymentType === PaymentType.CHEQUE;
  }
}

// Export a singleton instance
export const paymentVoucherService = new PaymentVoucherService();

// Also export the class for potential inheritance or testing
export { PaymentVoucherService };
