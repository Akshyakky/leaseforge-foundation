// src/services/contractService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  Contract,
  ContractUnit,
  ContractAdditionalCharge,
  ContractAttachment,
  ContractRequest,
  ContractSearchParams,
  ContractStatistics,
  ContractApprovalRequest,
  ApiResponse,
} from "../types/contractTypes";

// Re-export types from contractTypes
export type { Contract, ContractUnit, ContractAdditionalCharge, ContractAttachment, ContractRequest, ContractSearchParams, ContractStatistics, ContractApprovalRequest };

/**
 * Service for contract management operations
 */
class ContractService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/contractmanagement");
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
  private async processAttachmentFile(attachment: Partial<ContractAttachment>): Promise<Partial<ContractAttachment>> {
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
   * Create a new contract with units, charges, and attachments
   * @param data - The contract data, units, charges, and attachments
   * @returns Response with status and newly created contract ID
   */
  async createContract(data: ContractRequest): Promise<ApiResponse> {
    // Process attachments if provided
    let processedAttachments = data.attachments;
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    // Prepare JSON data for child records
    const unitsJSON = data.units && data.units.length > 0 ? JSON.stringify(data.units) : null;
    const additionalChargesJSON = data.additionalCharges && data.additionalCharges.length > 0 ? JSON.stringify(data.additionalCharges) : null;
    const attachmentsJSON = processedAttachments && processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null;

    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Contract
      parameters: {
        // Contract master data
        ContractNo: data.contract.ContractNo,
        ContractStatus: data.contract.ContractStatus,
        CustomerID: data.contract.CustomerID,
        JointCustomerID: data.contract.JointCustomerID,
        TransactionDate: data.contract.TransactionDate,
        TotalAmount: data.contract.TotalAmount,
        AdditionalCharges: data.contract.AdditionalCharges,
        GrandTotal: data.contract.GrandTotal,
        Remarks: data.contract.Remarks,

        // Approval fields
        ApprovalStatus: data.contract.ApprovalStatus || "Pending",
        RequiresApproval: data.contract.RequiresApproval !== undefined ? data.contract.RequiresApproval : true,
        ApprovalComments: data.contract.ApprovalComments,

        // JSON parameters for child records
        UnitsJSON: unitsJSON,
        AdditionalChargesJSON: additionalChargesJSON,
        AttachmentsJSON: attachmentsJSON,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract created successfully");
      return {
        Status: 1,
        Message: response.message || "Contract created successfully",
        NewContractID: response.NewContractID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create contract",
    };
  }

  /**
   * Update an existing contract with units, charges, and attachments
   * @param data - The contract data, units, charges, and attachments
   * @returns Response with status
   */
  async updateContract(data: ContractRequest & { contract: Partial<Contract> & { ContractID: number } }): Promise<ApiResponse> {
    // Process attachments if provided
    let processedAttachments = data.attachments;
    if (data.attachments && data.attachments.length > 0) {
      processedAttachments = await Promise.all(data.attachments.map((attachment) => this.processAttachmentFile(attachment)));
    }

    // Prepare JSON data for child records
    const unitsJSON = data.units && data.units.length > 0 ? JSON.stringify(data.units) : null;
    const additionalChargesJSON = data.additionalCharges && data.additionalCharges.length > 0 ? JSON.stringify(data.additionalCharges) : null;
    const attachmentsJSON = processedAttachments && processedAttachments.length > 0 ? JSON.stringify(processedAttachments) : null;

    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Contract
      parameters: {
        // Contract master data
        ContractID: data.contract.ContractID,
        ContractNo: data.contract.ContractNo,
        ContractStatus: data.contract.ContractStatus,
        CustomerID: data.contract.CustomerID,
        JointCustomerID: data.contract.JointCustomerID,
        TransactionDate: data.contract.TransactionDate,
        TotalAmount: data.contract.TotalAmount,
        AdditionalCharges: data.contract.AdditionalCharges,
        GrandTotal: data.contract.GrandTotal,
        Remarks: data.contract.Remarks,

        // Approval fields
        ApprovalStatus: data.contract.ApprovalStatus,
        RequiresApproval: data.contract.RequiresApproval,
        ApprovalComments: data.contract.ApprovalComments,

        // JSON parameters for child records
        UnitsJSON: unitsJSON,
        AdditionalChargesJSON: additionalChargesJSON,
        AttachmentsJSON: attachmentsJSON,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract updated successfully");
      return {
        Status: 1,
        Message: response.message || "Contract updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update contract",
    };
  }

  /**
   * Get all active contracts
   * @returns Array of contracts
   */
  async getAllContracts(): Promise<Contract[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Contracts
      parameters: {},
    };

    const response = await this.execute<Contract[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a contract by ID (including units, charges, attachments)
   * @param contractId - The ID of the contract to fetch
   * @returns Contract object with units, charges, and attachments
   */
  async getContractById(contractId: number): Promise<{
    contract: Contract | null;
    units: ContractUnit[];
    additionalCharges: ContractAdditionalCharge[];
    attachments: ContractAttachment[];
  }> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Contract by ID
      parameters: {
        ContractID: contractId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      // Process attachments to create file URLs for display if needed
      const attachments = (response.table4 || []).map((attachment: ContractAttachment) => {
        if (attachment.FileContent && attachment.FileContentType) {
          // Create a data URL for display
          attachment.fileUrl = `data:${attachment.FileContentType};base64,${attachment.FileContent}`;
        }
        return attachment;
      });

      return {
        contract: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        units: response.table2 || [],
        additionalCharges: response.table3 || [],
        attachments: attachments,
      };
    }

    return { contract: null, units: [], additionalCharges: [], attachments: [] };
  }

  /**
   * Delete a contract
   * @param contractId - The ID of the contract to delete
   * @returns Response with status
   */
  async deleteContract(contractId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Contract
      parameters: {
        ContractID: contractId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Contract deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete contract",
    };
  }

  /**
   * Search for contracts with filters
   * @param params - Search parameters
   * @returns Array of matching contracts
   */
  async searchContracts(params: ContractSearchParams = {}): Promise<Contract[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Contracts with Filters
      parameters: {
        SearchText: params.searchText,
        FilterCustomerID: params.customerID,
        FilterContractStatus: params.contractStatus,
        FilterApprovalStatus: params.approvalStatus,
        FilterFromDate: params.fromDate,
        FilterToDate: params.toDate,
        FilterUnitID: params.unitID,
        FilterPropertyID: params.propertyID,
      },
    };

    const response = await this.execute<Contract[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Change contract status
   * @param contractId - The ID of the contract
   * @param status - The new status
   * @returns Response with status
   */
  async changeContractStatus(contractId: number, status: string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Change Contract Status
      parameters: {
        ContractID: contractId,
        ContractStatus: status,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`Contract status changed to ${status} successfully`);
      return {
        Status: 1,
        Message: response.message || `Contract status changed to ${status} successfully`,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to change contract status",
    };
  }

  /**
   * Get contract statistics
   * @returns Contract statistics
   */
  async getContractStatistics(): Promise<ContractStatistics> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Contract Statistics
      parameters: {},
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        statusCounts: response.table1 || [],
        approvalCounts: response.table2 || [],
        propertyUnitCounts: response.table3 || [],
        customerCounts: response.table4 || [],
      };
    }

    return {
      statusCounts: [],
      approvalCounts: [],
      propertyUnitCounts: [],
      customerCounts: [],
    };
  }

  /**
   * Get contracts by unit
   * @param unitId - The unit ID
   * @returns Array of contracts for the specified unit
   */
  async getContractsByUnit(unitId: number): Promise<Contract[]> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Contracts by Unit
      parameters: {
        UnitID: unitId,
      },
    };

    const response = await this.execute<Contract[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Add unit to contract
   * @param contractUnit - The unit data to add
   * @returns Response with status and new unit ID
   */
  async addUnitToContract(contractUnit: Partial<ContractUnit> & { ContractID: number }): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Add Unit to Contract
      parameters: {
        ContractID: contractUnit.ContractID,
        UnitID: contractUnit.UnitID,
        FromDate: contractUnit.FromDate,
        ToDate: contractUnit.ToDate,
        FitoutFromDate: contractUnit.FitoutFromDate,
        FitoutToDate: contractUnit.FitoutToDate,
        CommencementDate: contractUnit.CommencementDate,
        ContractDays: contractUnit.ContractDays,
        ContractMonths: contractUnit.ContractMonths,
        ContractYears: contractUnit.ContractYears,
        RentPerMonth: contractUnit.RentPerMonth,
        RentPerYear: contractUnit.RentPerYear,
        NoOfInstallments: contractUnit.NoOfInstallments,
        RentFreePeriodFrom: contractUnit.RentFreePeriodFrom,
        RentFreePeriodTo: contractUnit.RentFreePeriodTo,
        RentFreeAmount: contractUnit.RentFreeAmount,
        UnitTaxPercentage: contractUnit.TaxPercentage,
        UnitTaxAmount: contractUnit.TaxAmount,
        UnitTotalAmount: contractUnit.TotalAmount,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Unit added to contract successfully");
      return {
        Status: 1,
        Message: response.message || "Unit added to contract successfully",
        NewContractUnitID: response.NewContractUnitID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to add unit to contract",
    };
  }

  /**
   * Update contract unit
   * @param contractUnit - The unit data to update
   * @returns Response with status
   */
  async updateContractUnit(contractUnit: Partial<ContractUnit> & { ContractUnitID: number }): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 11, // Mode 11: Update Contract Unit
      parameters: {
        ContractUnitID: contractUnit.ContractUnitID,
        UnitID: contractUnit.UnitID,
        FromDate: contractUnit.FromDate,
        ToDate: contractUnit.ToDate,
        FitoutFromDate: contractUnit.FitoutFromDate,
        FitoutToDate: contractUnit.FitoutToDate,
        CommencementDate: contractUnit.CommencementDate,
        ContractDays: contractUnit.ContractDays,
        ContractMonths: contractUnit.ContractMonths,
        ContractYears: contractUnit.ContractYears,
        RentPerMonth: contractUnit.RentPerMonth,
        RentPerYear: contractUnit.RentPerYear,
        NoOfInstallments: contractUnit.NoOfInstallments,
        RentFreePeriodFrom: contractUnit.RentFreePeriodFrom,
        RentFreePeriodTo: contractUnit.RentFreePeriodTo,
        RentFreeAmount: contractUnit.RentFreeAmount,
        UnitTaxPercentage: contractUnit.TaxPercentage,
        UnitTaxAmount: contractUnit.TaxAmount,
        UnitTotalAmount: contractUnit.TotalAmount,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract unit updated successfully");
      return {
        Status: 1,
        Message: response.message || "Contract unit updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update contract unit",
    };
  }

  /**
   * Remove unit from contract
   * @param contractUnitId - The ID of the contract unit to remove
   * @returns Response with status
   */
  async removeUnitFromContract(contractUnitId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 12, // Mode 12: Remove Unit from Contract
      parameters: {
        ContractUnitID: contractUnitId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Unit removed from contract successfully");
      return {
        Status: 1,
        Message: response.message || "Unit removed from contract successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to remove unit from contract",
    };
  }

  /**
   * Add additional charge to contract
   * @param charge - The charge data to add
   * @returns Response with status and new charge ID
   */
  async addAdditionalCharge(charge: Partial<ContractAdditionalCharge> & { ContractID: number }): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 13, // Mode 13: Add Additional Charge to Contract
      parameters: {
        ContractID: charge.ContractID,
        AdditionalChargesID: charge.AdditionalChargesID,
        ChargeAmount: charge.Amount,
        ChargeTaxPercentage: charge.TaxPercentage,
        ChargeTaxAmount: charge.TaxAmount,
        ChargeTotalAmount: charge.TotalAmount,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Additional charge added to contract successfully");
      return {
        Status: 1,
        Message: response.message || "Additional charge added to contract successfully",
        NewContractChargeID: response.NewContractChargeID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to add additional charge to contract",
    };
  }

  /**
   * Update additional charge
   * @param charge - The charge data to update
   * @returns Response with status
   */
  async updateAdditionalCharge(charge: Partial<ContractAdditionalCharge> & { ContractAdditionalChargeID: number }): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 14, // Mode 14: Update Additional Charge
      parameters: {
        ContractAdditionalChargeID: charge.ContractAdditionalChargeID,
        AdditionalChargesID: charge.AdditionalChargesID,
        ChargeAmount: charge.Amount,
        ChargeTaxPercentage: charge.TaxPercentage,
        ChargeTaxAmount: charge.TaxAmount,
        ChargeTotalAmount: charge.TotalAmount,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Additional charge updated successfully");
      return {
        Status: 1,
        Message: response.message || "Additional charge updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update additional charge",
    };
  }

  /**
   * Remove additional charge from contract
   * @param chargeId - The ID of the charge to remove
   * @returns Response with status
   */
  async removeAdditionalCharge(chargeId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 15, // Mode 15: Remove Additional Charge
      parameters: {
        ContractAdditionalChargeID: chargeId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Additional charge removed successfully");
      return {
        Status: 1,
        Message: response.message || "Additional charge removed successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to remove additional charge",
    };
  }

  /**
   * Add attachment to contract
   * @param attachment - The attachment data to add
   * @returns Response with status and new attachment ID
   */
  async addAttachment(attachment: Partial<ContractAttachment> & { ContractID: number }): Promise<ApiResponse> {
    // Process the attachment file if present
    const processedAttachment = await this.processAttachmentFile(attachment);

    const request: BaseRequest = {
      mode: 16, // Mode 16: Add Attachment to Contract
      parameters: {
        ContractID: processedAttachment.ContractID,
        DocTypeID: processedAttachment.DocTypeID,
        DocumentName: processedAttachment.DocumentName,
        FilePath: processedAttachment.FilePath,
        FileContent: processedAttachment.FileContent,
        FileContentType: processedAttachment.FileContentType,
        FileSize: processedAttachment.FileSize,
        DocIssueDate: processedAttachment.DocIssueDate,
        DocExpiryDate: processedAttachment.DocExpiryDate,
        AttachmentRemarks: processedAttachment.Remarks,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment added to contract successfully");
      return {
        Status: 1,
        Message: response.message || "Attachment added to contract successfully",
        NewContractAttachmentID: response.NewContractAttachmentID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to add attachment to contract",
    };
  }

  /**
   * Update contract attachment
   * @param attachment - The attachment data to update
   * @returns Response with status
   */
  async updateAttachment(attachment: Partial<ContractAttachment> & { ContractAttachmentID: number }): Promise<ApiResponse> {
    // Process the attachment file if present
    const processedAttachment = await this.processAttachmentFile(attachment);

    const request: BaseRequest = {
      mode: 17, // Mode 17: Update Contract Attachment
      parameters: {
        ContractAttachmentID: processedAttachment.ContractAttachmentID,
        DocTypeID: processedAttachment.DocTypeID,
        DocumentName: processedAttachment.DocumentName,
        FilePath: processedAttachment.FilePath,
        FileContent: processedAttachment.FileContent,
        FileContentType: processedAttachment.FileContentType,
        FileSize: processedAttachment.FileSize,
        DocIssueDate: processedAttachment.DocIssueDate,
        DocExpiryDate: processedAttachment.DocExpiryDate,
        AttachmentRemarks: processedAttachment.Remarks,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract attachment updated successfully");
      return {
        Status: 1,
        Message: response.message || "Contract attachment updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update contract attachment",
    };
  }

  /**
   * Remove attachment from contract
   * @param attachmentId - The ID of the attachment to remove
   * @returns Response with status
   */
  async removeAttachment(attachmentId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 18, // Mode 18: Remove Contract Attachment
      parameters: {
        ContractAttachmentID: attachmentId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Attachment removed from contract successfully");
      return {
        Status: 1,
        Message: response.message || "Attachment removed from contract successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to remove attachment from contract",
    };
  }

  /**
   * Approve contract (Mode 19) - Manager only
   * @param approvalRequest - The approval request data
   * @returns Response with status
   */
  async approveContract(approvalRequest: ContractApprovalRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 19, // Mode 19: Approve Contract
      parameters: {
        ContractID: approvalRequest.contractId,
        ApprovalComments: approvalRequest.approvalComments,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract approved successfully");
      return {
        Status: 1,
        Message: response.message || "Contract approved successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to approve contract",
    };
  }

  /**
   * Reject contract (Mode 20) - Manager only
   * @param approvalRequest - The rejection request data
   * @returns Response with status
   */
  async rejectContract(approvalRequest: ContractApprovalRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 20, // Mode 20: Reject Contract
      parameters: {
        ContractID: approvalRequest.contractId,
        RejectionReason: approvalRequest.rejectionReason,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract rejected successfully");
      return {
        Status: 1,
        Message: response.message || "Contract rejected successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reject contract",
    };
  }

  /**
   * Reset approval status (Mode 21) - Manager only
   * @param contractId - The ID of the contract
   * @returns Response with status
   */
  async resetApprovalStatus(contractId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 21, // Mode 21: Reset Approval Status
      parameters: {
        ContractID: contractId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract approval status reset successfully");
      return {
        Status: 1,
        Message: response.message || "Contract approval status reset successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reset contract approval status",
    };
  }

  /**
   * Get contracts pending approval (Mode 22)
   * @returns Array of contracts pending approval
   */
  async getContractsPendingApproval(): Promise<Contract[]> {
    const request: BaseRequest = {
      mode: 22, // Mode 22: Get Contracts Pending Approval
      parameters: {},
    };

    const response = await this.execute<Contract[]>(request);
    return response.success ? response.data || [] : [];
  }
}

// Export a singleton instance
export const contractService = new ContractService();
