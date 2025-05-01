// src/services/financialPostingService.ts
import { BaseService, BaseRequest } from "./BaseService";
import {
  Posting,
  PostingDetail,
  PostingAttachment,
  PostingValidation,
  PostingStatistics,
  GeneralLedgerReport,
  TrialBalanceReport,
  ProfitLossReport,
  BalanceSheetReport,
  PostingSearchParams,
  ApiResponse,
} from "../types/financialPostingTypes";

/**
 * Service for financial posting operations
 */
class FinancialPostingService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/financialposting");
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
  private async processAttachmentFile(attachment: Partial<PostingAttachment>): Promise<Partial<PostingAttachment>> {
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
   * Create a new financial posting with details and attachments
   * @param data - The posting data, details, and attachments
   * @returns Response with status and newly created posting ID
   */
  async createPosting(data: { posting: Partial<Posting>; details: Partial<PostingDetail>[]; attachments?: Partial<PostingAttachment>[] }): Promise<ApiResponse> {
    // Process attachments if provided
    let processedAttachments: Partial<PostingAttachment>[] | undefined = data.attachments;
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    // Prepare JSON data for child records
    const detailsJSON = data.details.length > 0 ? JSON.stringify(data.details) : null;
    const attachmentsJSON = processedAttachments && processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null;

    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Posting
      parameters: {
        // Posting header parameters
        PostingNo: data.posting.PostingNo,
        PostingType: data.posting.PostingType,
        PostingDate: data.posting.PostingDate,
        TransactionDate: data.posting.TransactionDate,
        FiscalYearID: data.posting.FiscalYearID,
        ReferenceNo: data.posting.ReferenceNo,
        SourceType: data.posting.SourceType,
        SourceID: data.posting.SourceID,
        AccountID: data.posting.AccountID,
        TotalDebit: data.posting.TotalDebit,
        TotalCredit: data.posting.TotalCredit,
        CurrencyID: data.posting.CurrencyID,
        ExchangeRate: data.posting.ExchangeRate,
        Narration: data.posting.Narration,
        PostingStatus: data.posting.PostingStatus,
        CompanyID: data.posting.CompanyID,
        CostCenter1ID: data.posting.CostCenter1ID,
        CostCenter2ID: data.posting.CostCenter2ID,
        CostCenter3ID: data.posting.CostCenter3ID,
        CostCenter4ID: data.posting.CostCenter4ID,

        // JSON parameters for child records
        PostingDetailsJSON: detailsJSON,
        AttachmentsJSON: attachmentsJSON,

        // Current user information for audit
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Financial posting created successfully");
      return {
        Status: 1,
        Message: response.message || "Financial posting created successfully",
        NewPostingID: response.NewPostingID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create financial posting",
    };
  }

  /**
   * Update an existing financial posting with details and attachments
   * @param data - The posting data, details, and attachments
   * @returns Response with status
   */
  async updatePosting(data: {
    posting: Partial<Posting> & { PostingID: number };
    details: Partial<PostingDetail>[];
    attachments?: Partial<PostingAttachment>[];
  }): Promise<ApiResponse> {
    // Process attachments if provided
    let processedAttachments: Partial<PostingAttachment>[] | undefined = data.attachments;
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    // Prepare JSON data for child records
    const detailsJSON = data.details.length > 0 ? JSON.stringify(data.details) : null;
    const attachmentsJSON = processedAttachments && processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null;

    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Posting
      parameters: {
        // Posting header parameters
        PostingID: data.posting.PostingID,
        PostingNo: data.posting.PostingNo,
        PostingType: data.posting.PostingType,
        PostingDate: data.posting.PostingDate,
        TransactionDate: data.posting.TransactionDate,
        FiscalYearID: data.posting.FiscalYearID,
        ReferenceNo: data.posting.ReferenceNo,
        SourceType: data.posting.SourceType,
        SourceID: data.posting.SourceID,
        AccountID: data.posting.AccountID,
        TotalDebit: data.posting.TotalDebit,
        TotalCredit: data.posting.TotalCredit,
        CurrencyID: data.posting.CurrencyID,
        ExchangeRate: data.posting.ExchangeRate,
        Narration: data.posting.Narration,
        PostingStatus: data.posting.PostingStatus,
        CompanyID: data.posting.CompanyID,
        CostCenter1ID: data.posting.CostCenter1ID,
        CostCenter2ID: data.posting.CostCenter2ID,
        CostCenter3ID: data.posting.CostCenter3ID,
        CostCenter4ID: data.posting.CostCenter4ID,

        // JSON parameters for child records
        PostingDetailsJSON: detailsJSON,
        AttachmentsJSON: attachmentsJSON,

        // Current user information for audit
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Financial posting updated successfully");
      return {
        Status: 1,
        Message: response.message || "Financial posting updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update financial posting",
    };
  }

  /**
   * Post/finalize a draft posting
   * @param postingId - The ID of the posting to finalize
   * @returns Response with status
   */
  async postFinancialPosting(postingId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Post/Finalize Posting
      parameters: {
        PostingID: postingId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Financial posting finalized successfully");
      return {
        Status: 1,
        Message: response.message || "Financial posting finalized successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to finalize financial posting",
    };
  }

  /**
   * Get a posting by ID (including details and attachments)
   * @param postingId - The ID of the posting to fetch
   * @returns Object containing the posting, details, and attachments
   */
  async getPostingById(postingId: number): Promise<{
    posting: Posting | null;
    details: PostingDetail[];
    attachments: PostingAttachment[];
  }> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Posting by ID
      parameters: {
        PostingID: postingId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      // Process attachments to create file URLs for display if needed
      const attachments = (response.table3 || []).map((attachment: PostingAttachment) => {
        if (attachment.FileContent && attachment.FileContentType) {
          // Create a data URL for display
          attachment.fileUrl = `data:${attachment.FileContentType};base64,${attachment.FileContent}`;
        }
        return attachment;
      });

      return {
        posting: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        details: response.table2 || [],
        attachments: attachments,
      };
    }

    return { posting: null, details: [], attachments: [] };
  }

  /**
   * Reverse/cancel a posting
   * @param postingId - The ID of the posting to reverse
   * @param reversalReason - The reason for reversal
   * @returns Response with status and reversal posting ID
   */
  async reversePosting(postingId: number, reversalReason: string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Reverse/Cancel Posting
      parameters: {
        PostingID: postingId,
        ReversalReason: reversalReason,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Posting reversed successfully");
      return {
        Status: 1,
        Message: response.message || "Posting reversed successfully",
        ReversalPostingID: response.ReversalPostingID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reverse posting",
    };
  }

  /**
   * Search for postings with filters
   * @param params - Search parameters
   * @returns Array of matching postings
   */
  async searchPostings(params: PostingSearchParams = {}): Promise<Posting[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Postings with Filters
      parameters: {
        SearchText: params.searchText,
        FilterPostingType: params.postingType,
        FilterPostingStatus: params.postingStatus,
        FilterFromDate: params.fromDate,
        FilterToDate: params.toDate,
        FilterSourceType: params.sourceType,
        FilterSourceID: params.sourceID,
        FilterAccountID: params.accountID,
        FilterCurrencyID: params.currencyID,
        FilterCompanyID: params.companyID,
      },
    };

    const response = await this.execute<Posting[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get postings by source (Contract, Termination, etc.)
   * @param sourceType - The source type
   * @param sourceId - The source ID
   * @returns Array of postings for the specified source
   */
  async getPostingsBySource(sourceType: string, sourceId: number): Promise<Posting[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Posting Transactions by Source
      parameters: {
        SourceType: sourceType,
        SourceID: sourceId,
      },
    };

    const response = await this.execute<Posting[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get posting statistics
   * @param fromDate - Start date for statistics
   * @param toDate - End date for statistics
   * @param companyId - Optional company ID filter
   * @returns Posting statistics
   */
  async getPostingStatistics(fromDate?: Date | string, toDate?: Date | string, companyId?: number): Promise<PostingStatistics> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Posting Statistics
      parameters: {
        FilterFromDate: fromDate,
        FilterToDate: toDate,
        FilterCompanyID: companyId,
      },
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        byType: response.table1 || [],
        byDay: response.table2 || [],
        topAccounts: response.table3 || [],
      };
    }

    return {
      byType: [],
      byDay: [],
      topAccounts: [],
    };
  }

  /**
   * Validate a posting (check debits = credits)
   * @param postingId - The ID of an existing posting to validate, or null for new posting
   * @param details - Optional posting details for new postings
   * @returns Validation result
   */
  async validatePosting(postingId?: number, details?: Partial<PostingDetail>[]): Promise<PostingValidation> {
    let parameters: any = {
      PostingID: postingId,
    };

    // If details are provided for a new posting, add them as JSON
    if (!postingId && details && details.length > 0) {
      parameters.PostingDetailsJSON = JSON.stringify(details);
    }

    const request: BaseRequest = {
      mode: 9, // Mode 9: Validate Posting
      parameters,
    };

    const response = await this.execute<PostingValidation>(request);

    if (response.success) {
      return {
        Status: response.Status,
        Message: response.Message,
        TotalDebit: response.TotalDebit || 0,
        TotalCredit: response.TotalCredit || 0,
        Difference: response.Difference || 0,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Validation failed",
      TotalDebit: 0,
      TotalCredit: 0,
      Difference: 0,
    };
  }

  /**
   * Add a detail line to a posting
   * @param detail - The detail data to add
   * @returns Response with status and new detail ID
   */
  async addPostingDetail(detail: Partial<PostingDetail> & { PostingID: number }): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Add Detail to Posting
      parameters: {
        PostingID: detail.PostingID,
        LineNo: detail.LineNo,
        DetailAccountID: detail.AccountID,
        DebitAmount: detail.DebitAmount,
        CreditAmount: detail.CreditAmount,
        DetailNarration: detail.Narration,
        DetailReferenceNo: detail.ReferenceNo,
        ReferenceDate: detail.ReferenceDate,
        DetailCostCenter1ID: detail.CostCenter1ID,
        DetailCostCenter2ID: detail.CostCenter2ID,
        DetailCostCenter3ID: detail.CostCenter3ID,
        DetailCostCenter4ID: detail.CostCenter4ID,
        CustomerID: detail.CustomerID,
        ContractID: detail.ContractID,
        UnitID: detail.UnitID,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Posting detail added successfully");
      return {
        Status: 1,
        Message: response.message || "Posting detail added successfully",
        NewDetailID: response.NewDetailID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to add posting detail",
    };
  }

  /**
   * Update a posting detail
   * @param detail - The detail data to update
   * @returns Response with status
   */
  async updatePostingDetail(detail: Partial<PostingDetail> & { PostingDetailID: number }): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 11, // Mode 11: Update Posting Detail
      parameters: {
        PostingDetailID: detail.PostingDetailID,
        DetailAccountID: detail.AccountID,
        DebitAmount: detail.DebitAmount,
        CreditAmount: detail.CreditAmount,
        DetailNarration: detail.Narration,
        DetailReferenceNo: detail.ReferenceNo,
        ReferenceDate: detail.ReferenceDate,
        DetailCostCenter1ID: detail.CostCenter1ID,
        DetailCostCenter2ID: detail.CostCenter2ID,
        DetailCostCenter3ID: detail.CostCenter3ID,
        DetailCostCenter4ID: detail.CostCenter4ID,
        CustomerID: detail.CustomerID,
        ContractID: detail.ContractID,
        UnitID: detail.UnitID,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Posting detail updated successfully");
      return {
        Status: 1,
        Message: response.message || "Posting detail updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update posting detail",
    };
  }

  /**
   * Delete a posting detail
   * @param detailId - The ID of the detail to delete
   * @returns Response with status
   */
  async deletePostingDetail(detailId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 12, // Mode 12: Delete Posting Detail
      parameters: {
        PostingDetailID: detailId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Posting detail deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Posting detail deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete posting detail",
    };
  }

  /**
   * Add an attachment to a posting
   * @param attachment - The attachment data to add
   * @returns Response with status and new attachment ID
   */
  async addPostingAttachment(attachment: Partial<PostingAttachment> & { PostingID: number }): Promise<ApiResponse> {
    // Process the attachment file if present
    const processedAttachment = await this.processAttachmentFile(attachment);

    const request: BaseRequest = {
      mode: 13, // Mode 13: Add Attachment to Posting
      parameters: {
        PostingID: processedAttachment.PostingID,
        DocTypeID: processedAttachment.DocTypeID,
        DocumentName: processedAttachment.DocumentName,
        FilePath: processedAttachment.FilePath,
        FileContent: processedAttachment.FileContent,
        FileContentType: processedAttachment.FileContentType,
        FileSize: processedAttachment.FileSize,
        DocIssueDate: processedAttachment.DocIssueDate,
        DocExpiryDate: processedAttachment.DocExpiryDate,
        AttachmentRemarks: processedAttachment.Remarks,
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
        NewAttachmentID: response.NewAttachmentID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to add attachment",
    };
  }

  /**
   * Update a posting attachment
   * @param attachment - The attachment data to update
   * @returns Response with status
   */
  async updatePostingAttachment(attachment: Partial<PostingAttachment> & { PostingAttachmentID: number }): Promise<ApiResponse> {
    // Process the attachment file if present
    const processedAttachment = await this.processAttachmentFile(attachment);

    const request: BaseRequest = {
      mode: 14, // Mode 14: Update Posting Attachment
      parameters: {
        PostingAttachmentID: processedAttachment.PostingAttachmentID,
        DocTypeID: processedAttachment.DocTypeID,
        DocumentName: processedAttachment.DocumentName,
        FilePath: processedAttachment.FilePath,
        FileContent: processedAttachment.FileContent,
        FileContentType: processedAttachment.FileContentType,
        FileSize: processedAttachment.FileSize,
        DocIssueDate: processedAttachment.DocIssueDate,
        DocExpiryDate: processedAttachment.DocExpiryDate,
        AttachmentRemarks: processedAttachment.Remarks,
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
   * Delete a posting attachment
   * @param attachmentId - The ID of the attachment to delete
   * @returns Response with status
   */
  async deletePostingAttachment(attachmentId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 15, // Mode 15: Delete Posting Attachment
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
   * Generate a general ledger report
   * @param fromDate - Start date for the report
   * @param toDate - End date for the report
   * @param accountId - Optional account ID filter
   * @param companyId - Optional company ID filter
   * @returns General ledger report data
   */
  async generateGeneralLedgerReport(fromDate: Date | string, toDate: Date | string, accountId?: number, companyId?: number): Promise<GeneralLedgerReport[]> {
    const request: BaseRequest = {
      mode: 16, // Mode 16: Generate General Ledger Report
      parameters: {
        FilterFromDate: fromDate,
        FilterToDate: toDate,
        FilterAccountID: accountId,
        FilterCompanyID: companyId,
      },
    };

    const response = await this.execute<GeneralLedgerReport[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Generate a trial balance report
   * @param asOfDate - The date as of which to generate the report
   * @param companyId - Optional company ID filter
   * @returns Trial balance report data
   */
  async generateTrialBalanceReport(asOfDate: Date | string, companyId?: number): Promise<TrialBalanceReport[]> {
    const request: BaseRequest = {
      mode: 17, // Mode 17: Generate Trial Balance Report
      parameters: {
        FilterToDate: asOfDate,
        FilterCompanyID: companyId,
      },
    };

    const response = await this.execute<TrialBalanceReport[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Generate a profit and loss report
   * @param fromDate - Start date for the report
   * @param toDate - End date for the report
   * @param companyId - Optional company ID filter
   * @returns Profit and loss report data
   */
  async generateProfitLossReport(fromDate: Date | string, toDate: Date | string, companyId?: number): Promise<ProfitLossReport[]> {
    const request: BaseRequest = {
      mode: 18, // Mode 18: Generate Profit & Loss Report
      parameters: {
        FilterFromDate: fromDate,
        FilterToDate: toDate,
        FilterCompanyID: companyId,
      },
    };

    const response = await this.execute<ProfitLossReport[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Generate a balance sheet report
   * @param asOfDate - The date as of which to generate the report
   * @param companyId - Optional company ID filter
   * @returns Balance sheet report data
   */
  async generateBalanceSheetReport(asOfDate: Date | string, companyId?: number): Promise<BalanceSheetReport[]> {
    const request: BaseRequest = {
      mode: 19, // Mode 19: Generate Balance Sheet Report
      parameters: {
        FilterToDate: asOfDate,
        FilterCompanyID: companyId,
      },
    };

    const response = await this.execute<BalanceSheetReport[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Helper method to get the current user ID
   * @returns The current user ID
   */
  private getCurrentUserId(): number | undefined {
    try {
      const state = (window as any).store.getState();
      if (state && state.auth && state.auth.user) {
        return state.auth.user.userID;
      }
    } catch (error) {
      console.warn("Error retrieving current user ID from store:", error);
    }
    return undefined;
  }
}

// Export a singleton instance
export const financialPostingService = new FinancialPostingService();
