// src/services/pettyCashService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import {
  PettyCashVoucher,
  PettyCashVoucherPostingLine,
  PettyCashSearchParams,
  PettyCashRequest,
  PettyCashUpdateRequest,
  PettyCashReverseRequest,
  ApiResponse,
} from "../types/pettyCashTypes";

// Re-export types for convenience
export type { PettyCashVoucher, PettyCashVoucherPostingLine, PettyCashSearchParams, PettyCashRequest, PettyCashUpdateRequest, PettyCashReverseRequest };

/**
 * Service for petty cash voucher management operations
 */
class PettyCashService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/PettyCash"); // Assuming a similar endpoint structure
  }

  /**
   * Create a new petty cash voucher
   * @param data - The petty cash voucher data to create
   * @returns Response with status and newly created posting ID
   */
  async createPettyCashVoucher(data: PettyCashRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Petty Cash Voucher
      parameters: {
        VoucherNo: data.voucher.VoucherNo,
        TransactionDate: data.voucher.TransactionDate,
        PostingDate: data.voucher.PostingDate,
        CompanyID: data.voucher.CompanyID,
        FiscalYearID: data.voucher.FiscalYearID,
        Amount: data.voucher.Amount,
        CurrencyID: data.voucher.CurrencyID,
        ExchangeRate: data.voucher.ExchangeRate,
        ExpenseAccountID: data.voucher.ExpenseAccountID,
        PettyCashAccountID: data.voucher.PettyCashAccountID,
        ReceivedBy: data.voucher.ReceivedBy,
        ExpenseCategory: data.voucher.ExpenseCategory,
        Description: data.voucher.Description,
        Narration: data.voucher.Narration,
        PostingStatus: data.voucher.PostingStatus,
        ReceiptNo: data.voucher.ReceiptNo,
        CostCenter1ID: data.voucher.CostCenter1ID,
        CostCenter2ID: data.voucher.CostCenter2ID,
        CostCenter3ID: data.voucher.CostCenter3ID,
        CostCenter4ID: data.voucher.CostCenter4ID,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Petty Cash Voucher created successfully");
      return {
        Status: 1,
        Message: response.message || "Petty Cash Voucher created successfully",
        PostingID: response.PostingID,
        VoucherNo: response.VoucherNo,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create Petty Cash Voucher",
    };
  }

  /**
   * Update an existing petty cash voucher
   * @param data - The petty cash voucher data to update
   * @returns Response with status
   */
  async updatePettyCashVoucher(data: PettyCashUpdateRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Petty Cash Voucher
      parameters: {
        PostingID: data.voucher.PostingID,
        TransactionDate: data.voucher.TransactionDate,
        PostingDate: data.voucher.PostingDate,
        Description: data.voucher.Description,
        Narration: data.voucher.Narration,
        ReceiptNo: data.voucher.ReceiptNo,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Petty Cash Voucher updated successfully");
      return {
        Status: 1,
        Message: response.message || "Petty Cash Voucher updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update Petty Cash Voucher",
    };
  }

  /**
   * Get all petty cash vouchers
   * @returns Array of petty cash vouchers
   */
  async getAllPettyCashVouchers(): Promise<PettyCashVoucher[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Petty Cash Vouchers
      parameters: {},
    };

    const response = await this.execute<PettyCashVoucher[]>(request);
    return response.success ? response.table1 || [] : []; // Stored procedure returns data in table1
  }

  /**
   * Get a petty cash voucher by ID (including posting lines)
   * @param postingId - The ID of the petty cash voucher to fetch
   * @returns PettyCashVoucher object with posting lines
   */
  async getPettyCashVoucherById(postingId: number): Promise<{
    voucher: PettyCashVoucher | null;
    postingLines: PettyCashVoucherPostingLine[];
  }> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Petty Cash Voucher by ID
      parameters: {
        PostingID: postingId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        voucher: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        postingLines: response.table2 || [],
      };
    }

    return { voucher: null, postingLines: [] };
  }

  /**
   * Delete a petty cash voucher
   * @param postingId - The ID of the petty cash voucher to delete
   * @returns Response with status
   */
  async deletePettyCashVoucher(postingId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Petty Cash Voucher
      parameters: {
        PostingID: postingId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Petty Cash Voucher deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Petty Cash Voucher deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete Petty Cash Voucher",
    };
  }

  /**
   * Search for petty cash vouchers with filters
   * @param params - Search parameters
   * @returns Array of matching petty cash vouchers
   */
  async searchPettyCashVouchers(params: PettyCashSearchParams = {}): Promise<PettyCashVoucher[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Petty Cash Vouchers
      parameters: {
        SearchText: params.searchText,
        FilterFromDate: params.filterFromDate,
        FilterToDate: params.filterToDate,
        FilterExpenseCategory: params.filterExpenseCategory,
        FilterPostingStatus: params.filterPostingStatus,
        FilterCompanyID: params.filterCompanyID,
        FilterFiscalYearID: params.filterFiscalYearID,
        FilterExpenseAccountID: params.filterExpenseAccountID,
      },
    };

    const response = await this.execute<PettyCashVoucher[]>(request);
    return response.success ? response.table1 || [] : []; // Assuming table1 holds the search results
  }

  /**
   * Post petty cash voucher to General Ledger
   * @param postingId - The ID of the petty cash voucher to post
   * @returns Response with status
   */
  async postPettyCashVoucher(postingId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Post Petty Cash Voucher
      parameters: {
        PostingID: postingId,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Petty Cash Voucher posted successfully");
      return {
        Status: 1,
        Message: response.message || "Petty Cash Voucher posted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to post Petty Cash Voucher",
    };
  }

  /**
   * Reverse a petty cash voucher
   * @param data - Reversal data including posting ID and reason
   * @returns Response with status and reversal voucher number
   */
  async reversePettyCashVoucher(data: PettyCashReverseRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Reverse Petty Cash Voucher
      parameters: {
        PostingID: data.PostingID,
        ReversalReason: data.reversalReason,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Petty Cash Voucher reversed successfully");
      return {
        Status: 1,
        Message: response.message || "Petty Cash Voucher reversed successfully",
        ReversalVoucherNo: response.ReversalVoucherNo,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reverse Petty Cash Voucher",
    };
  }
}

// Export a singleton instance
export const pettyCashService = new PettyCashService();
