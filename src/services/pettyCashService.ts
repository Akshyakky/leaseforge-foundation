// src/services/pettyCashService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  PettyCashVoucher,
  PettyCashVoucherLine,
  PettyCashAttachment,
  PettyCashVoucherRequest,
  PettyCashVoucherResponse,
  PettyCashSearchFilters,
  PettyCashSummaryReport,
  AccountBalance,
  PettyCashStatistics,
  CreateVoucherResponse,
  ApprovalResponse,
  ReversalResponse,
  AttachmentResponse,
  NextVoucherNumberResponse,
  VoucherExistsResponse,
  VoucherStatus,
  ApprovalAction,
  ApprovalStatus,
  TransactionType,
} from "../types/pettyCashTypes";

/**
 * Service for petty cash voucher operations
 */
class PettyCashService extends BaseService {
  constructor() {
    super("/Master/PettyCash");
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
  private async processAttachmentFile(attachment: Partial<PettyCashAttachment>): Promise<Partial<PettyCashAttachment>> {
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
   * Validate voucher data before submission
   * @param data - The voucher data to validate
   * @returns Validation result
   */
  private validateVoucherData(data: PettyCashVoucherRequest): { isValid: boolean; errors: string[] } {
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

    if (!data.lines || data.lines.length === 0) {
      errors.push("At least one voucher line is required");
    }

    if (data.lines && data.lines.length > 0) {
      const totalDebits = data.lines.reduce((sum, line) => sum + (line.DebitAmount || 0), 0);
      const totalCredits = data.lines.reduce((sum, line) => sum + (line.CreditAmount || 0), 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        errors.push("Total debits must equal total credits");
      }

      data.lines.forEach((line, index) => {
        if (!line.AccountID) {
          errors.push(`Line ${index + 1}: Account is required`);
        }

        if (!line.TransactionType) {
          errors.push(`Line ${index + 1}: Transaction type is required`);
        }

        const hasDebit = (line.DebitAmount || 0) > 0;
        const hasCredit = (line.CreditAmount || 0) > 0;

        if (!hasDebit && !hasCredit) {
          errors.push(`Line ${index + 1}: Amount must be greater than zero`);
        }

        if (hasDebit && hasCredit) {
          errors.push(`Line ${index + 1}: Cannot have both debit and credit amounts`);
        }

        // Validate transaction type matches amount
        if (line.TransactionType === TransactionType.DEBIT && !hasDebit) {
          errors.push(`Line ${index + 1}: Debit transaction type requires debit amount`);
        }

        if (line.TransactionType === TransactionType.CREDIT && !hasCredit) {
          errors.push(`Line ${index + 1}: Credit transaction type requires credit amount`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // CORE VOUCHER OPERATIONS

  /**
   * Create a new petty cash voucher
   * @param data - The voucher data including lines and attachments
   * @returns Response with status and voucher details
   */
  async createVoucher(data: PettyCashVoucherRequest): Promise<CreateVoucherResponse> {
    // Validate data
    const validation = this.validateVoucherData(data);
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
      mode: 1, // Mode 1: Create New Petty Cash Voucher
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
      this.showSuccess("Petty cash voucher created successfully");
      return {
        success: true,
        message: response.message || "Voucher created successfully",
        voucherNo: response.VoucherNo,
        postingId: response.PostingID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to create voucher",
    };
  }

  /**
   * Update an existing petty cash voucher
   * @param data - The voucher data including lines and attachments
   * @returns Response with status
   */
  async updateVoucher(data: PettyCashVoucherRequest & { voucherNo: string }): Promise<CreateVoucherResponse> {
    // Validate data
    const validation = this.validateVoucherData(data);
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
      mode: 2, // Mode 2: Update Existing Petty Cash Voucher
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
      this.showSuccess("Petty cash voucher updated successfully");
      return {
        success: true,
        message: response.message || "Voucher updated successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update voucher",
    };
  }

  /**
   * Get all petty cash vouchers with optional filtering
   * @param filters - Optional search and filter criteria
   * @returns Array of vouchers
   */
  async getAllVouchers(filters?: PettyCashSearchFilters): Promise<PettyCashVoucher[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Get All Petty Cash Vouchers
      parameters: {
        FilterCompanyID: filters?.companyId,
        FilterFiscalYearID: filters?.fiscalYearId,
        FilterStatus: filters?.status,
        FilterApprovalStatus: filters?.approvalStatus,
        FilterDateFrom: filters?.dateFrom?.toISOString().split("T")[0],
        FilterDateTo: filters?.dateTo?.toISOString().split("T")[0],
      },
    };

    const response = await this.execute<PettyCashVoucher[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get petty cash voucher by voucher number (including lines and attachments)
   * @param voucherNo - The voucher number
   * @param companyId - Optional company ID filter
   * @returns Voucher with lines and attachments
   */
  async getVoucherByNumber(voucherNo: string, companyId?: number): Promise<PettyCashVoucherResponse> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Get Petty Cash Voucher by Voucher Number
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      // Process attachments to create file URLs
      const attachments = (response.table3 || []).map((attachment: PettyCashAttachment) => {
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
   * Delete a petty cash voucher
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @returns Response with status
   */
  async deleteVoucher(voucherNo: string, companyId: number): Promise<ApprovalResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Delete Petty Cash Voucher
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Petty cash voucher deleted successfully");
      return {
        success: true,
        message: response.message || "Voucher deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete voucher",
    };
  }

  // SEARCH AND FILTERING

  /**
   * Search petty cash vouchers
   * @param filters - Search criteria and filters
   * @returns Array of matching vouchers
   */
  async searchVouchers(filters: PettyCashSearchFilters): Promise<PettyCashVoucher[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Petty Cash Vouchers
      parameters: {
        SearchText: filters.searchText,
        FilterCompanyID: filters.companyId,
        FilterFiscalYearID: filters.fiscalYearId,
        FilterStatus: filters.status,
        FilterApprovalStatus: filters.approvalStatus,
        FilterDateFrom: filters.dateFrom?.toISOString().split("T")[0],
        FilterDateTo: filters.dateTo?.toISOString().split("T")[0],
        FilterAccountID: filters.accountId,
      },
    };

    const response = await this.execute<PettyCashVoucher[]>(request);
    return response.success ? response.data || [] : [];
  }

  // APPROVAL WORKFLOW

  /**
   * Approve or reject a petty cash voucher
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @param action - Approve or Reject
   * @param comments - Optional approval comments or rejection reason
   * @returns Response with status
   */
  async approveOrRejectVoucher(voucherNo: string, companyId: number, action: ApprovalAction, comments?: string): Promise<ApprovalResponse> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Approve/Reject Petty Cash Voucher
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
      this.showSuccess(`Voucher ${action.toLowerCase()}d successfully`);
      return {
        success: true,
        message: response.message || `Voucher ${action.toLowerCase()}d successfully`,
      };
    }

    return {
      success: false,
      message: response.message || `Failed to ${action.toLowerCase()} voucher`,
    };
  }

  /**
   * Submit voucher for approval
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @returns Response with status
   */
  async submitForApproval(voucherNo: string, companyId: number): Promise<ApprovalResponse> {
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
      this.showSuccess("Voucher submitted for approval successfully");
      return {
        success: true,
        message: response.message || "Voucher submitted for approval successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to submit voucher for approval",
    };
  }

  /**
   * Get vouchers pending approval
   * @param filters - Optional filtering criteria
   * @returns Array of vouchers pending approval
   */
  async getVouchersPendingApproval(filters?: { companyId?: number; fiscalYearId?: number }): Promise<PettyCashVoucher[]> {
    const request: BaseRequest = {
      mode: 19, // Mode 19: Get Vouchers Pending Approval
      parameters: {
        FilterCompanyID: filters?.companyId,
        FilterFiscalYearID: filters?.fiscalYearId,
      },
    };

    const response = await this.execute<PettyCashVoucher[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Reset voucher approval status
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @returns Response with status
   */
  async resetApprovalStatus(voucherNo: string, companyId: number): Promise<ApprovalResponse> {
    const request: BaseRequest = {
      mode: 20, // Mode 20: Reset Approval Status
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Voucher approval status reset successfully");
      return {
        success: true,
        message: response.message || "Voucher approval status reset successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to reset voucher approval status",
    };
  }

  // REVERSAL OPERATIONS

  /**
   * Reverse a posted petty cash voucher
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @param reason - Reason for reversal
   * @returns Response with reversal details
   */
  async reverseVoucher(voucherNo: string, companyId: number, reason: string): Promise<ReversalResponse> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Reverse Petty Cash Voucher
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
        ReversalReason: reason,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Voucher reversed successfully");
      return {
        success: true,
        message: response.message || "Voucher reversed successfully",
        reversalVoucherNo: response.ReversalVoucherNo,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to reverse voucher",
    };
  }

  // ATTACHMENT MANAGEMENT

  /**
   * Add attachment to voucher
   * @param attachment - The attachment data
   * @returns Response with attachment ID
   */
  async addAttachment(attachment: Partial<PettyCashAttachment> & { PostingID: number }): Promise<AttachmentResponse> {
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
   * Update attachment
   * @param attachment - The attachment data to update
   * @returns Response with status
   */
  async updateAttachment(attachment: Partial<PettyCashAttachment> & { PostingAttachmentID: number }): Promise<AttachmentResponse> {
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
   * Delete attachment
   * @param attachmentId - The attachment ID
   * @returns Response with status
   */
  async deleteAttachment(attachmentId: number): Promise<AttachmentResponse> {
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
  async getAttachmentsByPostingId(postingId: number): Promise<PettyCashAttachment[]> {
    const request: BaseRequest = {
      mode: 18, // Mode 18: Get Attachments by Posting ID
      parameters: {
        PostingID: postingId,
      },
    };

    const response = await this.execute<PettyCashAttachment[]>(request);

    if (response.success) {
      // Process attachments to create file URLs
      const attachments = (response.data || []).map((attachment: PettyCashAttachment) => {
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
   * Get petty cash summary report
   * @param filters - Date and company filters
   * @returns Summary report data
   */
  async getSummaryReport(filters: { dateFrom?: Date; dateTo?: Date; companyId?: number; fiscalYearId?: number }): Promise<PettyCashSummaryReport[]> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Get Petty Cash Summary Report
      parameters: {
        FilterDateFrom: filters.dateFrom?.toISOString().split("T")[0],
        FilterDateTo: filters.dateTo?.toISOString().split("T")[0],
        FilterCompanyID: filters.companyId,
        FilterFiscalYearID: filters.fiscalYearId,
      },
    };

    const response = await this.execute<PettyCashSummaryReport[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Check if voucher number exists
   * @param voucherNo - The voucher number to check
   * @param companyId - The company ID
   * @param postingId - Optional posting ID to exclude from check
   * @returns Whether voucher number exists
   */
  async checkVoucherNumberExists(voucherNo: string, companyId: number, postingId?: number): Promise<VoucherExistsResponse> {
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
  async getNextVoucherNumber(companyId: number, fiscalYearId: number, transactionDate?: Date): Promise<NextVoucherNumberResponse> {
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
  async getAccountBalance(accountId: number, balanceDate?: Date): Promise<AccountBalance | null> {
    const request: BaseRequest = {
      mode: 13, // Mode 13: Get Account Balance
      parameters: {
        AccountID: accountId,
        BalanceDate: balanceDate?.toISOString().split("T")[0],
      },
    };

    const response = await this.execute(request, false);

    if (response.success || response.Status === 1) {
      return {
        AccountID: accountId,
        Balance: response.AccountBalance || 0,
        BalanceDate: balanceDate || new Date(),
      };
    }

    return null;
  }

  /**
   * Get voucher for editing
   * @param voucherNo - The voucher number
   * @param companyId - Optional company ID
   * @returns Voucher data for editing
   */
  async getVoucherForEdit(voucherNo: string, companyId?: number): Promise<PettyCashVoucherResponse> {
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
      const attachments = (response.table3 || []).map((attachment: PettyCashAttachment) => {
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
}

// Export a singleton instance
export const pettyCashService = new PettyCashService();

// Also export the class for potential inheritance or testing
export { PettyCashService };
