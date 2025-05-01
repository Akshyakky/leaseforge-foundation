// src/services/financialPostingService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  Posting,
  PostingDetail,
  PostingAttachment,
  PostingStatistics,
  PostingSearchParams,
  GeneralLedgerEntry,
  TrialBalanceEntry,
  ProfitLossEntry,
  BalanceSheetEntry,
  PostingRequest,
  ApiResponse,
} from "../types/financialPostingTypes";

/**
 * Service for financial posting operations
 */
class FinancialPostingService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Financial/posting");
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
   * Create a new posting with details and attachments
   * @param data - The posting data, details, and attachments
   * @returns Response with status and newly created posting ID
   */
  async createPosting(data: PostingRequest): Promise<ApiResponse> {
    // Process attachments if provided
    let processedAttachments = data.attachments;
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    // Prepare JSON data for child records
    const detailsJSON = data.details && data.details.length > 0 ? JSON.stringify(data.details) : null;
    const attachmentsJSON = processedAttachments && processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null;

    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Posting
      parameters: {
        // Posting master data
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

        // Current user info
        CurrentUserID: data.posting.CreatedID,
        CurrentUserName: data.posting.CreatedBy,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Posting created successfully");
      return {
        Status: 1,
        Message: response.message || "Posting created successfully",
        NewPostingID: response.NewPostingID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create posting",
    };
  }
}
