// src/services/journalVoucherService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  JournalVoucher,
  JournalVoucherLine,
  JournalVoucherAttachment,
  JournalVoucherRequest,
  JournalVoucherResponse,
  JournalSearchFilters,
  JournalSummaryReport,
  TrialBalanceValidation,
  AccountBalance,
  JournalStatistics,
  CreateJournalVoucherResponse,
  ApprovalResponse,
  ReversalResponse,
  AttachmentResponse,
  NextVoucherNumberResponse,
  AccountBalanceResponse,
  TrialBalanceResponse,
  JournalStatus,
  JournalType,
  ApprovalAction,
  TransactionType,
  Account,
  Company,
  FiscalYear,
  Currency,
  CostCenter,
  Customer,
  Supplier,
  DocType,
  Tax,
  JournalEntryTemplate,
  JournalRegisterReport,
  AccountLedgerReport,
} from "../types/journalVoucherTypes";

/**
 * Service for journal voucher operations
 */
class JournalVoucherService extends BaseService {
  constructor() {
    super("/Master/JournalVoucher");
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
  private async processAttachmentFile(attachment: Partial<JournalVoucherAttachment>): Promise<Partial<JournalVoucherAttachment>> {
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
   * Validate journal voucher data before submission
   * @param data - The voucher data to validate
   * @returns Validation result
   */
  private validateJournalVoucherData(data: JournalVoucherRequest): { isValid: boolean; errors: string[] } {
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
      errors.push("At least one journal line is required");
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

        const hasDebit = (line.DebitAmount || 0) > 0;
        const hasCredit = (line.CreditAmount || 0) > 0;

        if (!hasDebit && !hasCredit) {
          errors.push(`Line ${index + 1}: Either debit or credit amount must be greater than zero`);
        }

        if (hasDebit && hasCredit) {
          errors.push(`Line ${index + 1}: Cannot have both debit and credit amounts on the same line`);
        }

        if (hasDebit && line.TransactionType !== TransactionType.DEBIT) {
          errors.push(`Line ${index + 1}: Transaction type must be 'Debit' when debit amount is specified`);
        }

        if (hasCredit && line.TransactionType !== TransactionType.CREDIT) {
          errors.push(`Line ${index + 1}: Transaction type must be 'Credit' when credit amount is specified`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // CORE JOURNAL VOUCHER OPERATIONS

  /**
   * Create a new journal voucher
   * @param data - The voucher data including lines and attachments
   * @returns Response with status and voucher details
   */
  async createJournalVoucher(data: JournalVoucherRequest): Promise<CreateJournalVoucherResponse> {
    // Validate data
    const validation = this.validateJournalVoucherData(data);
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
      mode: 1, // Mode 1: Create New Journal Voucher
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
      this.showSuccess("Journal voucher created successfully");
      return {
        success: true,
        message: response.message || "Journal voucher created successfully",
        voucherNo: response.VoucherNo,
        postingId: response.PostingID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to create journal voucher",
    };
  }

  /**
   * Update an existing journal voucher
   * @param data - The voucher data including lines and attachments
   * @returns Response with status
   */
  async updateJournalVoucher(data: JournalVoucherRequest & { voucherNo: string }): Promise<CreateJournalVoucherResponse> {
    // Validate data
    const validation = this.validateJournalVoucherData(data);
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
      mode: 2, // Mode 2: Update Existing Journal Voucher
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
      this.showSuccess("Journal voucher updated successfully");
      return {
        success: true,
        message: response.message || "Journal voucher updated successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update journal voucher",
    };
  }

  /**
   * Get all journal vouchers with optional filtering
   * @param filters - Optional search and filter criteria
   * @returns Array of journal vouchers
   */
  async getAllJournalVouchers(filters?: JournalSearchFilters): Promise<JournalVoucher[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Get All Journal Vouchers
      parameters: {
        FilterCompanyID: filters?.companyId,
        FilterFiscalYearID: filters?.fiscalYearId,
        FilterStatus: filters?.status,
        FilterSupplierID: filters?.supplierId,
        FilterAccountID: filters?.accountId,
        FilterDateFrom: filters?.dateFrom?.toISOString().split("T")[0],
        FilterDateTo: filters?.dateTo?.toISOString().split("T")[0],
        JournalType: filters?.journalType,
      },
    };

    const response = await this.execute<JournalVoucher[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get journal voucher by voucher number (including lines and attachments)
   * @param voucherNo - The voucher number
   * @param companyId - Optional company ID filter
   * @returns Voucher with lines and attachments
   */
  async getJournalVoucherByNumber(voucherNo: string, companyId?: number): Promise<JournalVoucherResponse> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Get Journal Voucher by Voucher Number
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      // Process attachments to create file URLs
      const attachments = (response.table3 || []).map((attachment: JournalVoucherAttachment) => {
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
   * Delete a journal voucher
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @returns Response with status
   */
  async deleteJournalVoucher(voucherNo: string, companyId: number): Promise<ApprovalResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Delete Journal Voucher
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Journal voucher deleted successfully");
      return {
        success: true,
        message: response.message || "Journal voucher deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete journal voucher",
    };
  }

  // SEARCH AND FILTERING

  /**
   * Search journal vouchers
   * @param filters - Search criteria and filters
   * @returns Array of matching vouchers
   */
  async searchJournalVouchers(filters: JournalSearchFilters): Promise<JournalVoucher[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Journal Vouchers
      parameters: {
        SearchText: filters.searchText,
        FilterCompanyID: filters.companyId,
        FilterFiscalYearID: filters.fiscalYearId,
        FilterStatus: filters.status,
        FilterSupplierID: filters.supplierId,
        FilterAccountID: filters.accountId,
        FilterDateFrom: filters.dateFrom?.toISOString().split("T")[0],
        FilterDateTo: filters.dateTo?.toISOString().split("T")[0],
        JournalType: filters.journalType,
      },
    };

    const response = await this.execute<JournalVoucher[]>(request);
    return response.success ? response.data || [] : [];
  }

  // APPROVAL WORKFLOW

  /**
   * Approve or reject a journal voucher
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @param action - Approve or Reject
   * @param comments - Optional approval comments
   * @returns Response with status
   */
  async approveOrRejectJournalVoucher(voucherNo: string, companyId: number, action: ApprovalAction, comments?: string): Promise<ApprovalResponse> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Approve/Reject Journal Voucher
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
        ApprovalAction: action,
        ApprovalComments: comments,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`Journal voucher ${action.toLowerCase()}d successfully`);
      return {
        success: true,
        message: response.message || `Journal voucher ${action.toLowerCase()}d successfully`,
      };
    }

    return {
      success: false,
      message: response.message || `Failed to ${action.toLowerCase()} journal voucher`,
    };
  }

  /**
   * Submit journal voucher for approval
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @returns Response with status
   */
  async submitJournalVoucherForApproval(voucherNo: string, companyId: number): Promise<ApprovalResponse> {
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
      this.showSuccess("Journal voucher submitted for approval successfully");
      return {
        success: true,
        message: response.message || "Journal voucher submitted for approval successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to submit journal voucher for approval",
    };
  }

  // REVERSAL OPERATIONS

  /**
   * Reverse a posted journal voucher
   * @param voucherNo - The voucher number
   * @param companyId - The company ID
   * @param reason - Reason for reversal
   * @returns Response with reversal details
   */
  async reverseJournalVoucher(voucherNo: string, companyId: number, reason: string): Promise<ReversalResponse> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Reverse Journal Voucher
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
      this.showSuccess("Journal voucher reversed successfully");
      return {
        success: true,
        message: response.message || "Journal voucher reversed successfully",
        reversalVoucherNo: response.ReversalVoucherNo,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to reverse journal voucher",
    };
  }

  // ATTACHMENT MANAGEMENT

  /**
   * Add attachment to journal voucher
   * @param attachment - The attachment data
   * @returns Response with attachment ID
   */
  async addJournalVoucherAttachment(attachment: Partial<JournalVoucherAttachment> & { PostingID: number }): Promise<AttachmentResponse> {
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
   * Update journal voucher attachment
   * @param attachment - The attachment data to update
   * @returns Response with status
   */
  async updateJournalVoucherAttachment(attachment: Partial<JournalVoucherAttachment> & { PostingAttachmentID: number }): Promise<AttachmentResponse> {
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
   * Delete journal voucher attachment
   * @param attachmentId - The attachment ID
   * @returns Response with status
   */
  async deleteJournalVoucherAttachment(attachmentId: number): Promise<AttachmentResponse> {
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
  async getJournalVoucherAttachmentsByPostingId(postingId: number): Promise<JournalVoucherAttachment[]> {
    const request: BaseRequest = {
      mode: 18, // Mode 18: Get Attachments by Posting ID
      parameters: {
        PostingID: postingId,
      },
    };

    const response = await this.execute<JournalVoucherAttachment[]>(request);

    if (response.success) {
      // Process attachments to create file URLs
      const attachments = (response.data || []).map((attachment: JournalVoucherAttachment) => {
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
   * Get journal summary report
   * @param filters - Date and company filters
   * @returns Summary report data
   */
  async getJournalSummaryReport(filters: { dateFrom?: Date; dateTo?: Date; companyId?: number; fiscalYearId?: number }): Promise<JournalSummaryReport[]> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Get Journal Summary Report
      parameters: {
        FilterDateFrom: filters.dateFrom?.toISOString().split("T")[0],
        FilterDateTo: filters.dateTo?.toISOString().split("T")[0],
        FilterCompanyID: filters.companyId,
        FilterFiscalYearID: filters.fiscalYearId,
      },
    };

    const response = await this.execute<JournalSummaryReport[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Validate trial balance for journal vouchers
   * @param filters - Date and company filters
   * @returns Array of unbalanced vouchers
   */
  async validateTrialBalance(filters: { dateFrom?: Date; dateTo?: Date; companyId?: number }): Promise<TrialBalanceValidation[]> {
    const request: BaseRequest = {
      mode: 19, // Mode 19: Trial Balance Validation
      parameters: {
        FilterDateFrom: filters.dateFrom?.toISOString().split("T")[0],
        FilterDateTo: filters.dateTo?.toISOString().split("T")[0],
        FilterCompanyID: filters.companyId,
      },
    };

    const response = await this.execute<TrialBalanceValidation[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Check if voucher number exists
   * @param voucherNo - The voucher number to check
   * @param companyId - The company ID
   * @param postingId - Optional posting ID to exclude from check
   * @returns Whether voucher number exists
   */
  async checkJournalVoucherNumberExists(voucherNo: string, companyId: number, postingId?: number): Promise<boolean> {
    const request: BaseRequest = {
      mode: 11, // Mode 11: Check if Voucher Number exists
      parameters: {
        VoucherNo: voucherNo,
        CompanyID: companyId,
        PostingID: postingId,
      },
    };

    const response = await this.execute(request, false);
    return response.Status === 0; // Status 0 means it exists
  }

  /**
   * Get next voucher number
   * @param companyId - The company ID
   * @param fiscalYearId - The fiscal year ID
   * @param transactionDate - The transaction date
   * @returns Next voucher number
   */
  async getNextJournalVoucherNumber(companyId: number, fiscalYearId: number, transactionDate?: Date): Promise<string> {
    const request: BaseRequest = {
      mode: 12, // Mode 12: Get Next Voucher Number
      parameters: {
        CompanyID: companyId,
        FiscalYearID: fiscalYearId,
        TransactionDate: transactionDate?.toISOString(),
      },
    };

    const response = await this.execute(request, false);
    return response.success && response.NextVoucherNo ? response.NextVoucherNo : "";
  }

  /**
   * Get account balance
   * @param accountId - The account ID
   * @param balanceDate - The date to calculate balance as of
   * @returns Account balance
   */
  async getAccountBalance(accountId: number, balanceDate?: Date): Promise<number> {
    const request: BaseRequest = {
      mode: 13, // Mode 13: Get Account Balance
      parameters: {
        AccountID: accountId,
        BalanceDate: balanceDate?.toISOString(),
      },
    };

    const response = await this.execute(request, false);
    return response.success ? response.AccountBalance || 0 : 0;
  }

  /**
   * Get journal voucher for editing
   * @param voucherNo - The voucher number
   * @param companyId - Optional company ID
   * @returns Voucher data for editing
   */
  async getJournalVoucherForEdit(voucherNo: string, companyId?: number): Promise<JournalVoucherResponse> {
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
      const attachments = (response.table3 || []).map((attachment: JournalVoucherAttachment) => {
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
   * Get journal types for dropdown
   * @returns Array of journal types
   */
  async getJournalTypes(): Promise<{ JournalType: string; Description: string }[]> {
    const request: BaseRequest = {
      mode: 20, // Mode 20: Get Journal Types for Dropdown
      parameters: {},
    };

    const response = await this.execute(request, false);
    return response.success ? response.data || [] : [];
  }

  // HELPER METHODS FOR DROPDOWNS AND MASTER DATA

  /**
   * Get journal statuses for dropdown
   * @returns Array of journal statuses
   */
  getJournalStatuses(): { value: JournalStatus; label: string }[] {
    return [
      { value: JournalStatus.DRAFT, label: "Draft" },
      { value: JournalStatus.PENDING, label: "Pending Approval" },
      { value: JournalStatus.POSTED, label: "Posted" },
      { value: JournalStatus.REJECTED, label: "Rejected" },
    ];
  }

  /**
   * Get journal types for dropdown with descriptions
   * @returns Array of journal types
   */
  getJournalTypeOptions(): { value: JournalType; label: string; description: string }[] {
    return [
      {
        value: JournalType.GENERAL,
        label: "General",
        description: "General journal entries for day-to-day transactions",
      },
      {
        value: JournalType.ADJUSTING,
        label: "Adjusting",
        description: "Period-end adjusting entries for accruals and deferrals",
      },
      {
        value: JournalType.CLOSING,
        label: "Closing",
        description: "Year-end closing entries to transfer balances",
      },
      {
        value: JournalType.REVERSING,
        label: "Reversing",
        description: "Entries that reverse previous adjusting entries",
      },
    ];
  }

  // TEMPLATE AND AUTOMATION METHODS

  /**
   * Get common journal entry templates
   * @returns Array of predefined templates
   */
  getJournalEntryTemplates(): JournalEntryTemplate[] {
    return [
      {
        templateId: "accrual_expense",
        templateName: "Accrued Expense",
        description: "Record accrued expenses at period end",
        journalType: JournalType.ADJUSTING,
        lines: [
          {
            accountCode: "6001",
            accountName: "Operating Expenses",
            transactionType: TransactionType.DEBIT,
            isAmount: true,
            description: "Accrued expense",
          },
          {
            accountCode: "3002",
            accountName: "Accrued Liabilities",
            transactionType: TransactionType.CREDIT,
            isAmount: true,
            description: "Accrued liability",
          },
        ],
      },
      {
        templateId: "prepaid_expense",
        templateName: "Prepaid Expense",
        description: "Record prepaid expenses",
        journalType: JournalType.GENERAL,
        lines: [
          {
            accountCode: "1005",
            accountName: "Prepaid Expenses",
            transactionType: TransactionType.DEBIT,
            isAmount: true,
            description: "Prepaid expense",
          },
          {
            accountCode: "1001",
            accountName: "Cash",
            transactionType: TransactionType.CREDIT,
            isAmount: true,
            description: "Cash payment",
          },
        ],
      },
      {
        templateId: "depreciation",
        templateName: "Depreciation Expense",
        description: "Record monthly depreciation",
        journalType: JournalType.ADJUSTING,
        lines: [
          {
            accountCode: "6002",
            accountName: "Depreciation Expense",
            transactionType: TransactionType.DEBIT,
            isAmount: true,
            description: "Monthly depreciation",
          },
          {
            accountCode: "1502",
            accountName: "Accumulated Depreciation",
            transactionType: TransactionType.CREDIT,
            isAmount: true,
            description: "Accumulated depreciation",
          },
        ],
      },
    ];
  }

  // UTILITY METHODS

  /**
   * Format amount for display
   * @param amount - The amount to format
   * @param currencyCode - Optional currency code
   * @returns Formatted amount string
   */
  formatAmount(amount: number, currencyCode?: string): string {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  }

  /**
   * Calculate running balance for account ledger
   * @param openingBalance - The opening balance
   * @param transactions - Array of transactions
   * @returns Array of transactions with running balances
   */
  calculateRunningBalances(openingBalance: number, transactions: { debitAmount: number; creditAmount: number }[]): ((typeof transactions)[0] & { runningBalance: number })[] {
    let runningBalance = openingBalance;

    return transactions.map((transaction) => {
      runningBalance += transaction.debitAmount - transaction.creditAmount;
      return {
        ...transaction,
        runningBalance,
      };
    });
  }

  /**
   * Validate journal entry balance
   * @param lines - Array of journal lines
   * @returns Whether the entry is balanced
   */
  validateJournalBalance(lines: Partial<JournalVoucherLine>[]): { isBalanced: boolean; variance: number } {
    const totalDebits = lines.reduce((sum, line) => sum + (line.DebitAmount || 0), 0);
    const totalCredits = lines.reduce((sum, line) => sum + (line.CreditAmount || 0), 0);
    const variance = Math.abs(totalDebits - totalCredits);

    return {
      isBalanced: variance <= 0.01,
      variance,
    };
  }

  /**
   * Generate journal entry from template
   * @param template - The template to use
   * @param amounts - Array of amounts for template placeholders
   * @param baseData - Base voucher data
   * @returns Generated journal voucher request
   */
  generateJournalFromTemplate(template: JournalEntryTemplate, amounts: number[], baseData: Partial<JournalVoucher>): JournalVoucherRequest {
    const lines: Partial<JournalVoucherLine>[] = template.lines.map((templateLine, index) => {
      const amount = templateLine.isAmount ? amounts[index] || 0 : templateLine.fixedAmount || 0;

      return {
        AccountID: 0, // Would need to resolve from account code
        TransactionType: templateLine.transactionType,
        DebitAmount: templateLine.transactionType === TransactionType.DEBIT ? amount : 0,
        CreditAmount: templateLine.transactionType === TransactionType.CREDIT ? amount : 0,
        LineDescription: templateLine.description,
      };
    });

    return {
      voucher: {
        ...baseData,
        JournalType: template.journalType,
        Description: template.description,
      },
      lines,
    };
  }
}

// Export a singleton instance
export const journalVoucherService = new JournalVoucherService();

// Also export the class for potential inheritance or testing
export { JournalVoucherService };
