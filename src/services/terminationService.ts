// src/services/terminationService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  ContractTermination,
  TerminationDeduction,
  TerminationAttachment,
  TerminationRequest,
  TerminationSearchParams,
  TerminationStatistics,
  TerminationApprovalRequest,
  TerminationRejectionRequest,
  ApiResponse,
} from "../types/terminationTypes";

// Re-export types from terminationTypes
export type {
  ContractTermination,
  TerminationDeduction,
  TerminationAttachment,
  TerminationRequest,
  TerminationSearchParams,
  TerminationStatistics,
  TerminationApprovalRequest,
  TerminationRejectionRequest,
  ApiResponse,
};

/**
 * Service for contract termination operations
 */
class TerminationService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/contractTermination");
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
  private async processAttachmentFile(attachment: Partial<TerminationAttachment>): Promise<Partial<TerminationAttachment>> {
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
   * Create a new termination with deductions and attachments
   * @param data - The termination data, deductions, and attachments
   * @returns Response with status and newly created termination ID
   */
  async createTermination(data: TerminationRequest): Promise<ApiResponse> {
    // Process attachments if provided
    let processedAttachments = data.attachments;
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    // Prepare JSON data for child records
    const deductionsJSON = data.deductions && data.deductions.length > 0 ? JSON.stringify(data.deductions) : null;
    const attachmentsJSON = processedAttachments && processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null;

    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Termination
      parameters: {
        // Termination master data
        TerminationNo: data.termination.TerminationNo,
        ContractID: data.termination.ContractID,
        TerminationDate: data.termination.TerminationDate,
        NoticeDate: data.termination.NoticeDate,
        EffectiveDate: data.termination.EffectiveDate,
        VacatingDate: data.termination.VacatingDate,
        MoveOutDate: data.termination.MoveOutDate,
        KeyReturnDate: data.termination.KeyReturnDate,
        StayPeriodDays: data.termination.StayPeriodDays,
        StayPeriodAmount: data.termination.StayPeriodAmount,
        TerminationReason: data.termination.TerminationReason,
        TerminationStatus: data.termination.TerminationStatus,
        TotalDeductions: data.termination.TotalDeductions,
        SecurityDepositAmount: data.termination.SecurityDepositAmount,
        AdjustAmount: data.termination.AdjustAmount,
        TotalInvoiced: data.termination.TotalInvoiced,
        TotalReceived: data.termination.TotalReceived,
        CreditNoteAmount: data.termination.CreditNoteAmount,
        RefundAmount: data.termination.RefundAmount,
        IsRefundProcessed: data.termination.IsRefundProcessed,
        RefundDate: data.termination.RefundDate,
        RefundReference: data.termination.RefundReference,
        Notes: data.termination.Notes,

        // Approval fields
        ApprovalStatus: data.termination.ApprovalStatus,
        RequiresApproval: data.termination.RequiresApproval,
        ApprovalComments: data.termination.ApprovalComments,
        RejectionReason: data.termination.RejectionReason,

        // JSON parameters for child records
        DeductionsJSON: deductionsJSON,
        AttachmentsJSON: attachmentsJSON,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Termination created successfully");
      return {
        Status: 1,
        Message: response.message || "Termination created successfully",
        NewTerminationID: response.NewTerminationID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create termination",
    };
  }

  /**
   * Update an existing termination with deductions and attachments
   * @param data - The termination data, deductions, and attachments
   * @returns Response with status
   */
  async updateTermination(data: TerminationRequest & { termination: Partial<ContractTermination> & { TerminationID: number } }): Promise<ApiResponse> {
    // Process attachments if provided
    let processedAttachments = data.attachments;
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    // Prepare JSON data for child records
    const deductionsJSON = data.deductions && data.deductions.length > 0 ? JSON.stringify(data.deductions) : null;
    const attachmentsJSON = processedAttachments && processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null;

    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Termination
      parameters: {
        // Termination master data
        TerminationID: data.termination.TerminationID,
        TerminationNo: data.termination.TerminationNo,
        ContractID: data.termination.ContractID,
        TerminationDate: data.termination.TerminationDate,
        NoticeDate: data.termination.NoticeDate,
        EffectiveDate: data.termination.EffectiveDate,
        VacatingDate: data.termination.VacatingDate,
        MoveOutDate: data.termination.MoveOutDate,
        KeyReturnDate: data.termination.KeyReturnDate,
        StayPeriodDays: data.termination.StayPeriodDays,
        StayPeriodAmount: data.termination.StayPeriodAmount,
        TerminationReason: data.termination.TerminationReason,
        TerminationStatus: data.termination.TerminationStatus,
        TotalDeductions: data.termination.TotalDeductions,
        SecurityDepositAmount: data.termination.SecurityDepositAmount,
        AdjustAmount: data.termination.AdjustAmount,
        TotalInvoiced: data.termination.TotalInvoiced,
        TotalReceived: data.termination.TotalReceived,
        CreditNoteAmount: data.termination.CreditNoteAmount,
        RefundAmount: data.termination.RefundAmount,
        IsRefundProcessed: data.termination.IsRefundProcessed,
        RefundDate: data.termination.RefundDate,
        RefundReference: data.termination.RefundReference,
        Notes: data.termination.Notes,

        // Approval fields
        ApprovalStatus: data.termination.ApprovalStatus,
        RequiresApproval: data.termination.RequiresApproval,
        ApprovalComments: data.termination.ApprovalComments,
        RejectionReason: data.termination.RejectionReason,

        // JSON parameters for child records
        DeductionsJSON: deductionsJSON,
        AttachmentsJSON: attachmentsJSON,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Termination updated successfully");
      return {
        Status: 1,
        Message: response.message || "Termination updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update termination",
    };
  }

  /**
   * Get all active terminations
   * @returns Array of terminations
   */
  async getAllTerminations(): Promise<ContractTermination[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Terminations
      parameters: {},
    };

    const response = await this.execute<ContractTermination[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a termination by ID (including deductions and attachments)
   * @param terminationId - The ID of the termination to fetch
   * @returns Termination object with deductions and attachments
   */
  async getTerminationById(terminationId: number): Promise<{
    termination: ContractTermination | null;
    deductions: TerminationDeduction[];
    attachments: TerminationAttachment[];
  }> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Termination by ID
      parameters: {
        TerminationID: terminationId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      // Process attachments to create file URLs for display if needed
      const attachments = (response.table3 || []).map((attachment: TerminationAttachment) => {
        if (attachment.FileContent && attachment.FileContentType) {
          // Create a data URL for display
          attachment.fileUrl = `data:${attachment.FileContentType};base64,${attachment.FileContent}`;
        }
        return attachment;
      });

      return {
        termination: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        deductions: response.table2 || [],
        attachments: attachments,
      };
    }

    return { termination: null, deductions: [], attachments: [] };
  }

  /**
   * Delete a termination
   * @param terminationId - The ID of the termination to delete
   * @returns Response with status
   */
  async deleteTermination(terminationId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Termination
      parameters: {
        TerminationID: terminationId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Termination deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Termination deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete termination",
    };
  }

  /**
   * Search for terminations with filters
   * @param params - Search parameters
   * @returns Array of matching terminations
   */
  async searchTerminations(params: TerminationSearchParams = {}): Promise<ContractTermination[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Terminations with Filters
      parameters: {
        SearchText: params.searchText,
        FilterContractID: params.contractID,
        FilterTerminationStatus: params.terminationStatus,
        FilterApprovalStatus: params.approvalStatus,
        FilterFromDate: params.fromDate,
        FilterToDate: params.toDate,
        FilterCustomerID: params.customerID,
        FilterPropertyID: params.propertyID,
        FilterUnitID: params.unitID,
      },
    };

    const response = await this.execute<ContractTermination[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Change termination status
   * @param terminationId - The ID of the termination
   * @param status - The new status
   * @returns Response with status
   */
  async changeTerminationStatus(terminationId: number, status: string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Change Termination Status
      parameters: {
        TerminationID: terminationId,
        TerminationStatus: status,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`Termination status changed to ${status} successfully`);
      return {
        Status: 1,
        Message: response.message || `Termination status changed to ${status} successfully`,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to change termination status",
    };
  }

  /**
   * Process refund for a termination
   * @param terminationId - The ID of the termination
   * @param refundDate - The refund date
   * @param refundReference - The refund reference
   * @returns Response with status
   */
  async processRefund(terminationId: number, refundDate: string | Date, refundReference: string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Process Refund
      parameters: {
        TerminationID: terminationId,
        RefundDate: refundDate,
        RefundReference: refundReference,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Refund processed successfully");
      return {
        Status: 1,
        Message: response.message || "Refund processed successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to process refund",
    };
  }

  /**
   * Calculate termination figures
   * @param terminationId - The ID of the termination
   * @returns Calculated figures and response status
   */
  async calculateTerminationFigures(terminationId: number): Promise<{
    success: boolean;
    message: string;
    figures?: {
      SecurityDepositAmount: number;
      TotalDeductions: number;
      AdjustAmount: number;
      TotalInvoiced: number;
      TotalReceived: number;
      CreditNoteAmount: number;
      RefundAmount: number;
    };
  }> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Calculate Termination Figures
      parameters: {
        TerminationID: terminationId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Termination figures calculated successfully");
      return {
        success: true,
        message: response.message || "Termination figures calculated successfully",
        figures: {
          SecurityDepositAmount: response.SecurityDepositAmount,
          TotalDeductions: response.TotalDeductions,
          AdjustAmount: response.AdjustAmount,
          TotalInvoiced: response.TotalInvoiced,
          TotalReceived: response.TotalReceived,
          CreditNoteAmount: response.CreditNoteAmount,
          RefundAmount: response.RefundAmount,
        },
      };
    }

    return {
      success: false,
      message: response.message || "Failed to calculate termination figures",
    };
  }

  /**
   * Approve a termination
   * @param data - Approval request data
   * @returns Response with status
   */
  async approveTermination(data: TerminationApprovalRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 19, // Mode 19: Approve Termination
      parameters: {
        TerminationID: data.terminationId,
        ApprovalComments: data.approvalComments,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Termination approved successfully");
      return {
        Status: 1,
        Message: response.message || "Termination approved successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to approve termination",
    };
  }

  /**
   * Reject a termination
   * @param data - Rejection request data
   * @returns Response with status
   */
  async rejectTermination(data: TerminationRejectionRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 20, // Mode 20: Reject Termination
      parameters: {
        TerminationID: data.terminationId,
        RejectionReason: data.rejectionReason,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Termination rejected successfully");
      return {
        Status: 1,
        Message: response.message || "Termination rejected successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reject termination",
    };
  }

  /**
   * Reset termination approval status
   * @param terminationId - The ID of the termination
   * @returns Response with status
   */
  async resetApprovalStatus(terminationId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 21, // Mode 21: Reset Termination Approval Status
      parameters: {
        TerminationID: terminationId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Termination approval status reset successfully");
      return {
        Status: 1,
        Message: response.message || "Termination approval status reset successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reset approval status",
    };
  }

  /**
   * Get terminations pending approval
   * @returns Array of terminations pending approval
   */
  async getTerminationsPendingApproval(): Promise<ContractTermination[]> {
    const request: BaseRequest = {
      mode: 22, // Mode 22: Get Terminations Pending Approval
      parameters: {},
    };

    const response = await this.execute<ContractTermination[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Add deduction to termination
   * @param deduction - The deduction data to add
   * @returns Response with status and new deduction ID
   */
  async addDeduction(deduction: Partial<TerminationDeduction> & { TerminationID: number }): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Add Deduction to Termination
      parameters: {
        TerminationID: deduction.TerminationID,
        DeductionID: deduction.DeductionID,
        DeductionName: deduction.DeductionName,
        DeductionDescription: deduction.DeductionDescription,
        DeductionAmount: deduction.DeductionAmount,
        TaxPercentage: deduction.TaxPercentage,
        TaxAmount: deduction.TaxAmount,
        DeductionTotalAmount: deduction.TotalAmount,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Deduction added successfully");
      return {
        Status: 1,
        Message: response.message || "Deduction added successfully",
        NewDeductionID: response.NewDeductionID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to add deduction",
    };
  }

  /**
   * Update termination deduction
   * @param deduction - The deduction data to update
   * @returns Response with status
   */
  async updateDeduction(deduction: Partial<TerminationDeduction> & { TerminationDeductionID: number }): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 11, // Mode 11: Update Termination Deduction
      parameters: {
        TerminationDeductionID: deduction.TerminationDeductionID,
        DeductionID: deduction.DeductionID,
        DeductionName: deduction.DeductionName,
        DeductionDescription: deduction.DeductionDescription,
        DeductionAmount: deduction.DeductionAmount,
        TaxPercentage: deduction.TaxPercentage,
        TaxAmount: deduction.TaxAmount,
        DeductionTotalAmount: deduction.TotalAmount,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Deduction updated successfully");
      return {
        Status: 1,
        Message: response.message || "Deduction updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update deduction",
    };
  }

  /**
   * Delete termination deduction
   * @param deductionId - The ID of the deduction to delete
   * @returns Response with status
   */
  async deleteDeduction(deductionId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 12, // Mode 12: Delete Termination Deduction
      parameters: {
        TerminationDeductionID: deductionId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Deduction deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Deduction deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete deduction",
    };
  }

  /**
   * Add attachment to termination
   * @param attachment - The attachment data to add
   * @returns Response with status and new attachment ID
   */
  async addAttachment(attachment: Partial<TerminationAttachment> & { TerminationID: number }): Promise<ApiResponse> {
    // Process the attachment file if present
    const processedAttachment = await this.processAttachmentFile(attachment);

    const request: BaseRequest = {
      mode: 13, // Mode 13: Add Attachment to Termination
      parameters: {
        TerminationID: processedAttachment.TerminationID,
        DocTypeID: processedAttachment.DocTypeID,
        DocumentName: processedAttachment.DocumentName,
        FilePath: processedAttachment.FilePath,
        FileContent: processedAttachment.FileContent,
        FileContentType: processedAttachment.FileContentType,
        FileSize: processedAttachment.FileSize,
        DocIssueDate: processedAttachment.DocIssueDate,
        DocExpiryDate: processedAttachment.DocExpiryDate,
        Remarks: processedAttachment.Remarks,
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
   * Update termination attachment
   * @param attachment - The attachment data to update
   * @returns Response with status
   */
  async updateAttachment(attachment: Partial<TerminationAttachment> & { TerminationAttachmentID: number }): Promise<ApiResponse> {
    // Process the attachment file if present
    const processedAttachment = await this.processAttachmentFile(attachment);

    const request: BaseRequest = {
      mode: 14, // Mode 14: Update Termination Attachment
      parameters: {
        TerminationAttachmentID: processedAttachment.TerminationAttachmentID,
        DocTypeID: processedAttachment.DocTypeID,
        DocumentName: processedAttachment.DocumentName,
        FilePath: processedAttachment.FilePath,
        FileContent: processedAttachment.FileContent,
        FileContentType: processedAttachment.FileContentType,
        FileSize: processedAttachment.FileSize,
        DocIssueDate: processedAttachment.DocIssueDate,
        DocExpiryDate: processedAttachment.DocExpiryDate,
        Remarks: processedAttachment.Remarks,
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
   * Delete termination attachment
   * @param attachmentId - The ID of the attachment to delete
   * @returns Response with status
   */
  async deleteAttachment(attachmentId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 15, // Mode 15: Delete Termination Attachment
      parameters: {
        TerminationAttachmentID: attachmentId,
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
   * Get terminations by contract ID
   * @param contractId - The contract ID
   * @returns Array of terminations for the contract
   */
  async getTerminationsByContract(contractId: number): Promise<ContractTermination[]> {
    const request: BaseRequest = {
      mode: 16, // Mode 16: Get Terminations by Contract ID
      parameters: {
        ContractID: contractId,
      },
    };

    const response = await this.execute<ContractTermination[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get termination statistics
   * @returns Termination statistics
   */
  async getTerminationStatistics(): Promise<TerminationStatistics> {
    const request: BaseRequest = {
      mode: 17, // Mode 17: Get Termination Statistics
      parameters: {},
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        statusCounts: response.table1 || [],
        approvalStatusCounts: response.table2 || [],
        monthlyTerminations: response.table3 || [],
        pendingRefunds: response.table4 || [],
        pendingApprovals: response.table5 || [],
      };
    }

    return {
      statusCounts: [],
      approvalStatusCounts: [],
      monthlyTerminations: [],
      pendingRefunds: [],
      pendingApprovals: [],
    };
  }

  /**
   * Get available deductions for termination
   * @returns Array of available deductions
   */
  async getAvailableDeductions(): Promise<any[]> {
    const request: BaseRequest = {
      mode: 18, // Mode 18: Get Available Deductions for Termination
      parameters: {},
    };

    const response = await this.execute<any[]>(request, false);
    return response.success ? response.data || [] : [];
  }
}

// Export a singleton instance
export const terminationService = new TerminationService();
