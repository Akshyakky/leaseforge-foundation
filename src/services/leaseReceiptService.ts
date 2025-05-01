// src/services/leaseReceiptService.ts
import { BaseService, BaseRequest } from "./BaseService";
import { LeaseReceipt, ReceiptDetail, ReceiptStatistics, ReceiptSearchParams, ApiResponse } from "../types/leaseReceiptTypes";

/**
 * Service for lease receipt management operations
 */
class LeaseReceiptService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Finance/leasereceipt");
  }

  /**
   * Create a new lease receipt with optional details (invoice allocations)
   * @param data - The receipt data with optional details
   * @returns Response with status and newly created receipt ID
   */
  async createReceipt(data: { receipt: Partial<LeaseReceipt>; details?: Partial<ReceiptDetail>[] }): Promise<ApiResponse> {
    // Prepare JSON data for details if provided
    const receiptDetailsJSON = data.details && data.details.length > 0 ? JSON.stringify(data.details) : null;

    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Receipt with Details
      parameters: {
        // Receipt header parameters
        ReceiptNo: data.receipt.ReceiptNo,
        ReceiptDate: data.receipt.ReceiptDate,
        CustomerID: data.receipt.CustomerID,
        ContractID: data.receipt.ContractID,
        PaymentMethod: data.receipt.PaymentMethod,
        PaymentReference: data.receipt.PaymentReference,
        PaymentDate: data.receipt.PaymentDate,
        BankName: data.receipt.BankName,
        ChequeNo: data.receipt.ChequeNo,
        ChequeDate: data.receipt.ChequeDate,
        ReceiptAmount: data.receipt.ReceiptAmount,
        ReceiptStatus: data.receipt.ReceiptStatus,
        IsCleared: data.receipt.IsCleared,
        ClearingDate: data.receipt.ClearingDate,
        CurrencyID: data.receipt.CurrencyID,
        ExchangeRate: data.receipt.ExchangeRate,
        Notes: data.receipt.Notes,
        CompanyID: data.receipt.CompanyID,

        // JSON parameter for details
        ReceiptDetailsJSON: receiptDetailsJSON,

        // Current user information for audit
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt created successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt created successfully",
        NewReceiptID: response.NewReceiptID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create receipt",
    };
  }

  /**
   * Update an existing lease receipt
   * @param data - The receipt data with optional details
   * @returns Response with status
   */
  async updateReceipt(data: { receipt: Partial<LeaseReceipt> & { ReceiptID: number }; details?: Partial<ReceiptDetail>[] }): Promise<ApiResponse> {
    // Prepare JSON data for details if provided
    const receiptDetailsJSON = data.details && data.details.length > 0 ? JSON.stringify(data.details) : null;

    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Receipt
      parameters: {
        // Receipt header parameters
        ReceiptID: data.receipt.ReceiptID,
        ReceiptNo: data.receipt.ReceiptNo,
        ReceiptDate: data.receipt.ReceiptDate,
        CustomerID: data.receipt.CustomerID,
        ContractID: data.receipt.ContractID,
        PaymentMethod: data.receipt.PaymentMethod,
        PaymentReference: data.receipt.PaymentReference,
        PaymentDate: data.receipt.PaymentDate,
        BankName: data.receipt.BankName,
        ChequeNo: data.receipt.ChequeNo,
        ChequeDate: data.receipt.ChequeDate,
        ReceiptAmount: data.receipt.ReceiptAmount,
        ReceiptStatus: data.receipt.ReceiptStatus,
        IsCleared: data.receipt.IsCleared,
        ClearingDate: data.receipt.ClearingDate,
        CurrencyID: data.receipt.CurrencyID,
        ExchangeRate: data.receipt.ExchangeRate,
        Notes: data.receipt.Notes,
        CompanyID: data.receipt.CompanyID,

        // JSON parameter for details
        ReceiptDetailsJSON: receiptDetailsJSON,

        // Current user information for audit
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt updated successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update receipt",
    };
  }

  /**
   * Get all active receipts
   * @returns Array of receipts
   */
  async getAllReceipts(): Promise<LeaseReceipt[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Receipts
      parameters: {},
    };

    const response = await this.execute<LeaseReceipt[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get a receipt by ID (including details)
   * @param receiptId - The ID of the receipt to fetch
   * @returns Object containing the receipt and its details
   */
  async getReceiptById(receiptId: number): Promise<{
    receipt: LeaseReceipt | null;
    details: ReceiptDetail[];
  }> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Receipt by ID
      parameters: {
        ReceiptID: receiptId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        receipt: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        details: response.table2 || [],
      };
    }

    return { receipt: null, details: [] };
  }

  /**
   * Delete a receipt
   * @param receiptId - The ID of the receipt to delete
   * @returns Response with status
   */
  async deleteReceipt(receiptId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Receipt
      parameters: {
        ReceiptID: receiptId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete receipt",
    };
  }

  /**
   * Search for receipts with filters
   * @param params - Search parameters
   * @returns Array of matching receipts
   */
  async searchReceipts(params: ReceiptSearchParams = {}): Promise<LeaseReceipt[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Receipts with Filters
      parameters: {
        SearchText: params.searchText,
        FilterCustomerID: params.customerID,
        FilterContractID: params.contractID,
        FilterReceiptStatus: params.receiptStatus,
        FilterFromDate: params.fromDate,
        FilterToDate: params.toDate,
        FilterIsCleared: params.isCleared,
        FilterPaymentMethod: params.paymentMethod,
        FilterCompanyID: params.companyID,
      },
    };

    const response = await this.execute<LeaseReceipt[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Post receipt to financial system
   * @param receiptId - The receipt ID
   * @returns Response with status and posting ID
   */
  async postToFinancialSystem(receiptId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Post Receipt to Financial System
      parameters: {
        ReceiptID: receiptId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Receipt posted to financial system successfully");
      return {
        Status: 1,
        Message: response.message || "Receipt posted to financial system successfully",
        PostingID: response.PostingID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to post receipt to financial system",
    };
  }

  /**
   * Change receipt status
   * @param receiptId - The receipt ID
   * @param status - The new status
   * @returns Response with status
   */
  async changeReceiptStatus(receiptId: number, status: string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Change Receipt Status
      parameters: {
        ReceiptID: receiptId,
        ReceiptStatus: status,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`Receipt status changed to ${status} successfully`);
      return {
        Status: 1,
        Message: response.message || `Receipt status changed to ${status} successfully`,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to change receipt status",
    };
  }

  /**
   * Get unpaid invoices for customer and contract
   * @param customerId - The customer ID
   * @param contractId - The contract ID
   * @returns Array of unpaid invoices
   */
  async getUnpaidInvoices(customerId: number, contractId: number): Promise<any[]> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Unpaid Invoices for Customer and Contract
      parameters: {
        CustomerID: customerId,
        ContractID: contractId,
      },
    };

    const response = await this.execute<any[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Add invoice to receipt
   * @param receiptId - The receipt ID
   * @param invoiceId - The invoice ID
   * @param allocatedAmount - The amount to allocate
   * @returns Response with status and new detail ID
   */
  async addInvoiceToReceipt(receiptId: number, invoiceId: number, allocatedAmount: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Add Invoice to Receipt
      parameters: {
        ReceiptID: receiptId,
        InvoiceID: invoiceId,
        AllocatedAmount: allocatedAmount,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Invoice allocation added successfully");
      return {
        Status: 1,
        Message: response.message || "Invoice allocation added successfully",
        NewReceiptDetailID: response.NewReceiptDetailID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to add invoice allocation",
    };
  }

  /**
   * Update receipt detail (allocation)
   * @param detailId - The receipt detail ID
   * @param allocatedAmount - The new allocated amount
   * @returns Response with status
   */
  async updateReceiptDetail(detailId: number, allocatedAmount: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 11, // Mode 11: Update Receipt Detail (Allocation)
      parameters: {
        ReceiptDetailID: detailId,
        AllocatedAmount: allocatedAmount,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Allocation updated successfully");
      return {
        Status: 1,
        Message: response.message || "Allocation updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update allocation",
    };
  }

  /**
   * Delete receipt detail (remove allocation)
   * @param detailId - The receipt detail ID
   * @returns Response with status
   */
  async deleteReceiptDetail(detailId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 12, // Mode 12: Delete Receipt Detail (Remove Allocation)
      parameters: {
        ReceiptDetailID: detailId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Allocation removed successfully");
      return {
        Status: 1,
        Message: response.message || "Allocation removed successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to remove allocation",
    };
  }

  /**
   * Validate receipt (check allocation balance)
   * @param receiptId - The receipt ID
   * @returns Response with validation result
   */
  async validateReceipt(receiptId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 13, // Mode 13: Validate Receipt (Check for Balance)
      parameters: {
        ReceiptID: receiptId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        Status: 1,
        Message: response.message || "Receipt validation successful",
        ReceiptAmount: response.ReceiptAmount,
        AllocatedAmount: response.AllocatedAmount,
        Difference: response.Difference,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Receipt validation failed",
      ReceiptAmount: response.ReceiptAmount,
      AllocatedAmount: response.AllocatedAmount,
      Difference: response.Difference,
    };
  }

  /**
   * Get receipt statistics
   * @param fromDate - Optional start date for statistics
   * @param toDate - Optional end date for statistics
   * @param companyId - Optional company ID filter
   * @returns Receipt statistics
   */
  async getReceiptStatistics(fromDate?: Date | string, toDate?: Date | string, companyId?: number): Promise<ReceiptStatistics> {
    const request: BaseRequest = {
      mode: 14, // Mode 14: Get Receipt Statistics
      parameters: {
        FilterFromDate: fromDate,
        FilterToDate: toDate,
        FilterCompanyID: companyId,
      },
    };

    const response = await this.execute(request, false);

    if (response.success) {
      return {
        byStatus: response.table1 || [],
        byPaymentMethod: response.table2 || [],
        byDate: response.table3 || [],
        topCustomers: response.table4 || [],
      };
    }

    return {
      byStatus: [],
      byPaymentMethod: [],
      byDate: [],
      topCustomers: [],
    };
  }

  /**
   * Get receipts by customer
   * @param customerId - The customer ID
   * @returns Array of receipts for the specified customer
   */
  async getReceiptsByCustomer(customerId: number): Promise<LeaseReceipt[]> {
    const request: BaseRequest = {
      mode: 15, // Mode 15: Get Receipts by Customer
      parameters: {
        CustomerID: customerId,
      },
    };

    const response = await this.execute<LeaseReceipt[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get receipts by contract
   * @param contractId - The contract ID
   * @returns Array of receipts for the specified contract
   */
  async getReceiptsByContract(contractId: number): Promise<LeaseReceipt[]> {
    const request: BaseRequest = {
      mode: 16, // Mode 16: Get Receipts by Contract
      parameters: {
        ContractID: contractId,
      },
    };

    const response = await this.execute<LeaseReceipt[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Mark cheque as cleared/uncleared
   * @param receiptId - The receipt ID
   * @param isCleared - Whether the cheque is cleared
   * @param clearingDate - Optional clearing date (defaults to current date if isCleared is true)
   * @returns Response with status
   */
  async markChequeStatus(receiptId: number, isCleared: boolean, clearingDate?: Date | string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 17, // Mode 17: Mark Cheque as Cleared/Uncleared
      parameters: {
        ReceiptID: receiptId,
        IsCleared: isCleared,
        ClearingDate: clearingDate,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(isCleared ? "Cheque marked as cleared" : "Cheque marked as uncleared");
      return {
        Status: 1,
        Message: response.message || (isCleared ? "Cheque marked as cleared" : "Cheque marked as uncleared"),
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update cheque status",
    };
  }

  /**
   * Get receipts for posting
   * @param companyId - Optional company ID filter
   * @returns Array of receipts that can be posted
   */
  async getReceiptsForPosting(companyId?: number): Promise<LeaseReceipt[]> {
    const request: BaseRequest = {
      mode: 18, // Mode 18: Get Receipts for Posting
      parameters: {
        FilterCompanyID: companyId,
      },
    };

    const response = await this.execute<LeaseReceipt[]>(request);
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
export const leaseReceiptService = new LeaseReceiptService();
