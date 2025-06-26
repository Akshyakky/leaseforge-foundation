// src/services/LeaseContractService.ts
import { BaseService, BaseRequest } from "./BaseService";
import {
  Contract,
  ContractUnit,
  ContractAdditionalCharge,
  ContractAttachment,
  ContractSummaryReport,
  ContractValidationError,
  ContractSearchParams,
  ContractRequest,
  ContractUnitRequest,
  ContractAdditionalChargeRequest,
  ContractAttachmentRequest,
  CreateContractResponse,
  ContractResponse,
  ContractListResponse,
  ContractUnitResponse,
  ContractChargeResponse,
  ContractAttachmentResponse,
  ContractValidationResponse,
  ContractStatusUpdateRequest,
  ContractStatistics,
  ContractStatus,
  CONTRACT_MODES,
  ApiResponse,
  ContractAdvancedFilters,
  ContractDuplicationRequest,
  ContractRenewalRequest,
  ContractValidationResult,
  BulkContractOperation,
  BulkOperationResult,
  Customer,
  Unit,
  AdditionalCharge,
  DocType,
} from "../types/leaseContractTypes";

/**
 * Service for contract management operations
 * Implements all 18 modes from sp_ContractManagement stored procedure
 */
class ContractService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/contractManagement");
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
  private async processAttachmentFile(attachment: Partial<ContractAttachment>): Promise<Partial<ContractAttachment>> {
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
   * Validate contract data before submission
   * @param contractData - The contract data to validate
   * @returns Validation result
   */
  private validateContractDataBeforeSubmission(contractData: ContractRequest): ContractValidationResult {
    const errors: { field?: string; message: string; code?: string }[] = [];

    if (!contractData.CustomerID) {
      errors.push({ field: "CustomerID", message: "Customer ID is required", code: "REQUIRED" });
    }

    if (!contractData.TransactionDate) {
      errors.push({ field: "TransactionDate", message: "Transaction Date is required", code: "REQUIRED" });
    }

    if (!contractData.TotalAmount || contractData.TotalAmount <= 0) {
      errors.push({ field: "TotalAmount", message: "Total Amount must be greater than zero", code: "INVALID_AMOUNT" });
    }

    const transactionDate = new Date(contractData.TransactionDate);
    if (isNaN(transactionDate.getTime())) {
      errors.push({ field: "TransactionDate", message: "Invalid transaction date format", code: "INVALID_DATE" });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ==========================================
  // CONTRACT MASTER OPERATIONS (Modes 1-5)
  // ==========================================

  /**
   * Mode 1: Create/Insert Contract
   * @param contractData - The contract data to create
   * @returns Response with status and contract details
   */
  async createContract(contractData: ContractRequest): Promise<CreateContractResponse> {
    // Validate contract data
    const validation = this.validateContractDataBeforeSubmission(contractData);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.map((e) => e.message).join("; "),
      };
    }

    const request: BaseRequest = {
      mode: CONTRACT_MODES.CREATE_CONTRACT,
      parameters: {
        ...contractData,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract created successfully");
      return {
        success: true,
        message: response.message || "Contract created successfully",
        contractId: response.NewContractID,
        contractNo: response.NewContractNo,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to create contract",
    };
  }

  /**
   * Mode 2: Update Contract
   * @param contractData - The contract data to update
   * @returns Response with status
   */
  async updateContract(contractData: ContractRequest & { ContractID: number }): Promise<CreateContractResponse> {
    if (!contractData.ContractID) {
      return {
        success: false,
        message: "Contract ID is required for update operation",
      };
    }

    const request: BaseRequest = {
      mode: CONTRACT_MODES.UPDATE_CONTRACT,
      parameters: {
        ...contractData,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract updated successfully");
      return {
        success: true,
        message: response.message || "Contract updated successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update contract",
    };
  }

  /**
   * Mode 3: Get All Contracts (with pagination and filtering)
   * @param params - Search and filter parameters
   * @returns Array of contracts with total count
   */
  async getAllContracts(params: ContractSearchParams = {}): Promise<ContractListResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.GET_ALL_CONTRACTS,
      parameters: {
        PageNumber: params.pageNumber || 1,
        PageSize: params.pageSize || 50,
        SearchText: params.searchText,
        StatusFilter: params.statusFilter,
        DateFrom: params.dateFrom,
        DateTo: params.dateTo,
        CustomerFilter: params.customerFilter,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      const contracts = response.data || [];
      const totalRecords = contracts.length > 0 ? contracts[0].TotalRecords || 0 : 0;

      return {
        contracts,
        totalRecords,
      };
    }

    return {
      contracts: [],
      totalRecords: 0,
    };
  }

  /**
   * Mode 4: Get Contract by ID (including units, charges, and attachments)
   * @param contractId - The contract ID to fetch
   * @returns Complete contract data
   */
  async getContractById(contractId: number): Promise<ContractResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.GET_CONTRACT_BY_ID,
      parameters: {
        ContractID: contractId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      // Process attachments to create file URLs
      const attachments = (response.table4 || []).map((attachment: ContractAttachment) => {
        if (attachment.FileContent && attachment.FileContentType) {
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

    return {
      contract: null,
      units: [],
      additionalCharges: [],
      attachments: [],
    };
  }

  /**
   * Mode 5: Soft Delete Contract
   * @param contractId - The contract ID to delete
   * @returns Response with status
   */
  async deleteContract(contractId: number): Promise<CreateContractResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.DELETE_CONTRACT,
      parameters: {
        ContractID: contractId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract deleted successfully");
      return {
        success: true,
        message: response.message || "Contract deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete contract",
    };
  }

  // ==========================================
  // CONTRACT UNITS OPERATIONS (Modes 6-8)
  // ==========================================

  /**
   * Mode 6: Get Contract Units by Contract ID
   * @param contractId - The contract ID
   * @returns Array of contract units
   */
  async getContractUnits(contractId: number): Promise<ContractUnit[]> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.GET_CONTRACT_UNITS,
      parameters: {
        ContractID: contractId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute<ContractUnit[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Mode 7: Add/Update Contract Unit
   * @param unitData - The contract unit data
   * @returns Response with status and unit ID
   */
  async addOrUpdateContractUnit(unitData: ContractUnitRequest): Promise<ContractUnitResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.ADD_UPDATE_CONTRACT_UNIT,
      parameters: {
        ...unitData,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      const action = unitData.ContractUnitID ? "updated" : "added";
      this.showSuccess(`Contract unit ${action} successfully`);
      return {
        success: true,
        message: response.message || `Contract unit ${action} successfully`,
        contractUnitId: response.ContractUnitID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to save contract unit",
    };
  }

  /**
   * Mode 8: Delete Contract Unit
   * @param contractUnitId - The contract unit ID to delete
   * @returns Response with status
   */
  async deleteContractUnit(contractUnitId: number): Promise<ContractUnitResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.DELETE_CONTRACT_UNIT,
      parameters: {
        ContractUnitID: contractUnitId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract unit deleted successfully");
      return {
        success: true,
        message: response.message || "Contract unit deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete contract unit",
    };
  }

  // ==========================================
  // CONTRACT ADDITIONAL CHARGES (Modes 9-11)
  // ==========================================

  /**
   * Mode 9: Get Contract Additional Charges
   * @param contractId - The contract ID
   * @returns Array of additional charges
   */
  async getContractAdditionalCharges(contractId: number): Promise<ContractAdditionalCharge[]> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.GET_CONTRACT_ADDITIONAL_CHARGES,
      parameters: {
        ContractID: contractId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute<ContractAdditionalCharge[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Mode 10: Add/Update Contract Additional Charge
   * @param chargeData - The additional charge data
   * @returns Response with status and charge ID
   */
  async addOrUpdateContractAdditionalCharge(chargeData: ContractAdditionalChargeRequest): Promise<ContractChargeResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.ADD_UPDATE_CONTRACT_ADDITIONAL_CHARGE,
      parameters: {
        ...chargeData,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      const action = chargeData.ContractAdditionalChargeID ? "updated" : "added";
      this.showSuccess(`Contract additional charge ${action} successfully`);
      return {
        success: true,
        message: response.message || `Contract additional charge ${action} successfully`,
        contractAdditionalChargeId: response.ContractAdditionalChargeID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to save contract additional charge",
    };
  }

  /**
   * Mode 11: Delete Contract Additional Charge
   * @param contractAdditionalChargeId - The charge ID to delete
   * @returns Response with status
   */
  async deleteContractAdditionalCharge(contractAdditionalChargeId: number): Promise<ContractChargeResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.DELETE_CONTRACT_ADDITIONAL_CHARGE,
      parameters: {
        ContractAdditionalChargeID: contractAdditionalChargeId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract additional charge deleted successfully");
      return {
        success: true,
        message: response.message || "Contract additional charge deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete contract additional charge",
    };
  }

  // ==========================================
  // CONTRACT ATTACHMENTS (Modes 12-15)
  // ==========================================

  /**
   * Mode 12: Get Contract Attachments
   * @param contractId - The contract ID
   * @returns Array of attachments
   */
  async getContractAttachments(contractId: number): Promise<ContractAttachment[]> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.GET_CONTRACT_ATTACHMENTS,
      parameters: {
        ContractID: contractId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute<ContractAttachment[]>(request);

    if (response.success) {
      // Process attachments to create file URLs
      const attachments = (response.data || []).map((attachment: ContractAttachment) => {
        if (attachment.FileContent && attachment.FileContentType) {
          attachment.fileUrl = `data:${attachment.FileContentType};base64,${attachment.FileContent}`;
        }
        return attachment;
      });

      return attachments;
    }

    return [];
  }

  /**
   * Mode 13: Add Contract Attachment
   * @param attachmentData - The attachment data
   * @returns Response with status and attachment ID
   */
  async addContractAttachment(attachmentData: ContractAttachmentRequest): Promise<ContractAttachmentResponse> {
    // Process the attachment file if present
    const processedAttachment = await this.processAttachmentFile(attachmentData);

    const request: BaseRequest = {
      mode: CONTRACT_MODES.ADD_CONTRACT_ATTACHMENT,
      parameters: {
        ...processedAttachment,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract attachment added successfully");
      return {
        success: true,
        message: response.message || "Contract attachment added successfully",
        contractAttachmentId: response.ContractAttachmentID,
      };
    }

    return {
      success: false,
      message: response.message || "Failed to add contract attachment",
    };
  }

  /**
   * Mode 14: Update Contract Attachment
   * @param attachmentData - The attachment data to update
   * @returns Response with status
   */
  async updateContractAttachment(attachmentData: ContractAttachmentRequest & { ContractAttachmentID: number }): Promise<ContractAttachmentResponse> {
    // Process the attachment file if present
    const processedAttachment = await this.processAttachmentFile(attachmentData);

    const request: BaseRequest = {
      mode: CONTRACT_MODES.UPDATE_CONTRACT_ATTACHMENT,
      parameters: {
        ...processedAttachment,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract attachment updated successfully");
      return {
        success: true,
        message: response.message || "Contract attachment updated successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update contract attachment",
    };
  }

  /**
   * Mode 15: Delete Contract Attachment
   * @param contractAttachmentId - The attachment ID to delete
   * @returns Response with status
   */
  async deleteContractAttachment(contractAttachmentId: number): Promise<ContractAttachmentResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.DELETE_CONTRACT_ATTACHMENT,
      parameters: {
        ContractAttachmentID: contractAttachmentId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract attachment deleted successfully");
      return {
        success: true,
        message: response.message || "Contract attachment deleted successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to delete contract attachment",
    };
  }

  // ==========================================
  // CONTRACT STATUS AND REPORTING (Modes 16-18)
  // ==========================================

  /**
   * Mode 16: Update Contract Status
   * @param statusData - The status update data
   * @returns Response with status
   */
  async updateContractStatus(statusData: ContractStatusUpdateRequest): Promise<CreateContractResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.UPDATE_CONTRACT_STATUS,
      parameters: {
        ...statusData,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Contract status updated successfully");
      return {
        success: true,
        message: response.message || "Contract status updated successfully",
      };
    }

    return {
      success: false,
      message: response.message || "Failed to update contract status",
    };
  }

  /**
   * Mode 17: Get Contract Summary Report
   * @param dateFrom - Start date filter
   * @param dateTo - End date filter
   * @returns Contract summary report
   */
  async getContractSummaryReport(dateFrom?: string | Date, dateTo?: string | Date): Promise<ContractSummaryReport | null> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.GET_CONTRACT_SUMMARY_REPORT,
      parameters: {
        DateFrom: dateFrom,
        DateTo: dateTo,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success && response.data && response.data.length > 0) {
      return response.data[0];
    }

    return null;
  }

  /**
   * Mode 18: Validate Contract Data
   * @param contractId - The contract ID to validate
   * @returns Validation response with errors
   */
  async validateContractData(contractId: number): Promise<ContractValidationResponse> {
    const request: BaseRequest = {
      mode: CONTRACT_MODES.VALIDATE_CONTRACT_DATA,
      parameters: {
        ContractID: contractId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        isValid: response.Status === 1,
        errors: response.data || [],
      };
    }

    return {
      isValid: false,
      errors: [{ ErrorMessage: response.message || "Validation failed" }],
    };
  }

  // ==========================================
  // CONVENIENCE AND HELPER METHODS
  // ==========================================

  /**
   * Search contracts with advanced filters
   * @param filters - Advanced search filters
   * @returns Filtered contracts
   */
  async searchContracts(filters: ContractAdvancedFilters): Promise<ContractListResponse> {
    return this.getAllContracts(filters);
  }

  /**
   * Get contracts by customer
   * @param customerId - The customer ID
   * @returns Array of customer contracts
   */
  async getContractsByCustomer(customerId: number): Promise<Contract[]> {
    const result = await this.getAllContracts({ customerFilter: customerId, pageSize: 1000 });
    return result.contracts;
  }

  /**
   * Get contracts by status
   * @param status - The contract status
   * @returns Array of contracts with specified status
   */
  async getContractsByStatus(status: string): Promise<Contract[]> {
    const result = await this.getAllContracts({ statusFilter: status, pageSize: 1000 });
    return result.contracts;
  }

  /**
   * Approve a contract
   * @param contractId - The contract ID to approve
   * @returns Response with status
   */
  async approveContract(contractId: number): Promise<CreateContractResponse> {
    return this.updateContractStatus({
      ContractID: contractId,
      ContractStatus: ContractStatus.APPROVED,
    });
  }

  /**
   * Activate a contract
   * @param contractId - The contract ID to activate
   * @returns Response with status
   */
  async activateContract(contractId: number): Promise<CreateContractResponse> {
    return this.updateContractStatus({
      ContractID: contractId,
      ContractStatus: ContractStatus.ACTIVE,
    });
  }

  /**
   * Expire a contract
   * @param contractId - The contract ID to expire
   * @returns Response with status
   */
  async expireContract(contractId: number): Promise<CreateContractResponse> {
    return this.updateContractStatus({
      ContractID: contractId,
      ContractStatus: ContractStatus.EXPIRED,
    });
  }

  /**
   * Cancel a contract
   * @param contractId - The contract ID to cancel
   * @returns Response with status
   */
  async cancelContract(contractId: number): Promise<CreateContractResponse> {
    return this.updateContractStatus({
      ContractID: contractId,
      ContractStatus: ContractStatus.CANCELLED,
    });
  }

  /**
   * Get contract statistics for dashboard
   * @returns Contract statistics
   */
  async getContractStatistics(): Promise<ContractStatistics> {
    const summaryReport = await this.getContractSummaryReport();
    const allContracts = await this.getAllContracts({ pageSize: 1000 });

    // Group by status
    const statusCounts = allContracts.contracts.reduce((acc, contract) => {
      const existing = acc.find((item) => item.ContractStatus === contract.ContractStatus);
      if (existing) {
        existing.ContractCount++;
        existing.TotalAmount += contract.TotalAmount;
      } else {
        acc.push({
          ContractStatus: contract.ContractStatus,
          ContractCount: 1,
          TotalAmount: contract.TotalAmount,
        });
      }
      return acc;
    }, [] as { ContractStatus: string; ContractCount: number; TotalAmount: number }[]);

    // Group by customer
    const customerCounts = allContracts.contracts.reduce((acc, contract) => {
      const existing = acc.find((item) => item.CustomerID === contract.CustomerID);
      if (existing) {
        existing.ContractCount++;
        existing.TotalAmount += contract.TotalAmount;
      } else {
        acc.push({
          CustomerID: contract.CustomerID,
          CustomerFullName: contract.CustomerFullName || "Unknown",
          ContractCount: 1,
          TotalAmount: contract.TotalAmount,
        });
      }
      return acc;
    }, [] as { CustomerID: number; CustomerFullName: string; ContractCount: number; TotalAmount: number }[]);

    return {
      statusCounts,
      customerCounts,
      monthlyTrends: [], // This would need additional implementation
    };
  }

  /**
   * Bulk update contract status
   * @param operation - The bulk operation to perform
   * @returns Result of bulk operation
   */
  async performBulkOperation(operation: BulkContractOperation): Promise<BulkOperationResult> {
    const results: BulkOperationResult = {
      success: true,
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    for (const contractId of operation.contractIds) {
      try {
        let response: CreateContractResponse;

        switch (operation.operation) {
          case "approve":
            response = await this.approveContract(contractId);
            break;
          case "activate":
            response = await this.activateContract(contractId);
            break;
          case "expire":
            response = await this.expireContract(contractId);
            break;
          default:
            throw new Error(`Unsupported operation: ${operation.operation}`);
        }

        if (response.success) {
          results.successCount++;
        } else {
          results.failureCount++;
          results.errors.push({
            contractId,
            error: response.message,
          });
        }
      } catch (error) {
        results.failureCount++;
        results.errors.push({
          contractId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    results.success = results.failureCount === 0;

    if (results.success) {
      this.showSuccess(`Bulk operation completed successfully. ${results.successCount} contracts updated.`);
    }

    return results;
  }

  /**
   * Export contracts to CSV format
   * @param contracts - Array of contracts to export
   * @param includeHeaders - Whether to include column headers
   * @returns CSV string
   */
  exportContractsToCSV(contracts: Contract[], includeHeaders = true): string {
    if (!contracts || contracts.length === 0) {
      return includeHeaders ? "No data to export" : "";
    }

    const headers = [
      "Contract No",
      "Contract Status",
      "Customer Name",
      "Joint Customer",
      "Transaction Date",
      "Total Amount",
      "Additional Charges",
      "Grand Total",
      "Remarks",
      "Created By",
      "Created On",
    ];

    const csvRows: string[] = [];

    if (includeHeaders) {
      csvRows.push(headers.join(","));
    }

    contracts.forEach((contract) => {
      const row = [
        `"${contract.ContractNo}"`,
        `"${contract.ContractStatus}"`,
        `"${contract.CustomerFullName || ""}"`,
        `"${contract.JointCustomerName || ""}"`,
        `"${new Date(contract.TransactionDate).toLocaleDateString()}"`,
        contract.TotalAmount.toFixed(2),
        contract.AdditionalCharges.toFixed(2),
        contract.GrandTotal.toFixed(2),
        `"${contract.Remarks || ""}"`,
        `"${contract.CreatedBy || ""}"`,
        `"${contract.CreatedOn ? new Date(contract.CreatedOn).toLocaleDateString() : ""}"`,
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }

  /**
   * Calculate contract totals
   * @param contractId - The contract ID
   * @returns Calculated totals
   */
  async calculateContractTotals(contractId: number): Promise<{
    unitTotal: number;
    chargesTotal: number;
    grandTotal: number;
  }> {
    const units = await this.getContractUnits(contractId);
    const charges = await this.getContractAdditionalCharges(contractId);

    const unitTotal = units.reduce((sum, unit) => sum + unit.TotalAmount, 0);
    const chargesTotal = charges.reduce((sum, charge) => sum + charge.TotalAmount, 0);
    const grandTotal = unitTotal + chargesTotal;

    return {
      unitTotal,
      chargesTotal,
      grandTotal,
    };
  }

  /**
   * Get available contract statuses
   * @returns Array of contract statuses
   */
  getContractStatuses(): { value: string; label: string }[] {
    return [
      { value: ContractStatus.DRAFT, label: "Draft" },
      { value: ContractStatus.ACTIVE, label: "Active" },
      { value: ContractStatus.APPROVED, label: "Approved" },
      { value: ContractStatus.EXPIRED, label: "Expired" },
      { value: ContractStatus.TERMINATED, label: "Terminated" },
      { value: ContractStatus.CANCELLED, label: "Cancelled" },
    ];
  }

  /**
   * Format amount for display
   * @param amount - The amount to format
   * @param currencyCode - Optional currency code
   * @returns Formatted amount string
   */
  formatAmount(amount: number, currencyCode: string = "USD"): string {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  }

  /**
   * Calculate contract duration in days
   * @param fromDate - Start date
   * @param toDate - End date
   * @returns Number of days
   */
  calculateContractDuration(fromDate: Date | string, toDate: Date | string): number {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Export a singleton instance
export const contractService = new ContractService();
