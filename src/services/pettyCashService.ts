import { BaseService, BaseRequest } from "./BaseService"; // Assuming BaseResponse is part of BaseService or not strictly needed
import {
  PettyCashVoucher,
  PettyCashVoucherPostingLine,
  PettyCashSearchParams,
  PettyCashCreateRequest, // Use specific create request
  PettyCashUpdateRequest, // Use specific update request
  PettyCashReverseRequest,
  ApiResponse,
  PettyCashEntry, // Import new type
} from "../types/pettyCashTypes";

// Re-export types for convenience
export type { PettyCashVoucher, PettyCashVoucherPostingLine, PettyCashSearchParams, PettyCashCreateRequest, PettyCashUpdateRequest, PettyCashReverseRequest, PettyCashEntry };

/**
 * Service for petty cash voucher management operations
 */
class PettyCashService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/pettyCash");
  }

  /**
   * Create a new petty cash voucher
   * @param data - The petty cash voucher data to create
   * @returns Response with status and newly created posting ID
   */
  async createPettyCashVoucher(data: PettyCashCreateRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Petty Cash Voucher
      parameters: {
        VoucherNo: data.voucher.VoucherNo,
        TransactionDate: data.voucher.TransactionDate,
        PostingDate: data.voucher.PostingDate,
        CompanyID: data.voucher.CompanyID,
        FiscalYearID: data.voucher.FiscalYearID,
        // TotalAmount is calculated by the SP based on entries
        CurrencyID: data.voucher.CurrencyID,
        ExchangeRate: data.voucher.ExchangeRate,
        Description: data.voucher.Description,
        Narration: data.voucher.Narration,
        PostingStatus: data.voucher.PostingStatus,
        ReceiptNo: data.voucher.ReceiptNo,
        // Debit/Credit entries are now JSON strings
        DebitEntriesJSON: JSON.stringify(data.debitEntries),
        CreditEntriesJSON: JSON.stringify(data.creditEntries),
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
        NewPostingID: response.NewPostingID, // Corrected to NewPostingID as per SP output
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
        VoucherNo: data.voucher.VoucherNo, // Update uses VoucherNo to identify the record
        TransactionDate: data.voucher.TransactionDate,
        PostingDate: data.voucher.PostingDate,
        CompanyID: data.voucher.CompanyID, // CompanyID and FiscalYearID are crucial for context
        FiscalYearID: data.voucher.FiscalYearID,
        CurrencyID: data.voucher.CurrencyID,
        ExchangeRate: data.voucher.ExchangeRate,
        Description: data.voucher.Description,
        Narration: data.voucher.Narration,
        PostingStatus: data.voucher.PostingStatus,
        ReceiptNo: data.voucher.ReceiptNo,
        DebitEntriesJSON: JSON.stringify(data.debitEntries),
        CreditEntriesJSON: JSON.stringify(data.creditEntries),
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
    // Mode 3 returns a single result set of aggregated voucher data
    return response.success ? response.table1 || [] : [];
  }

  /**
   * Get a petty cash voucher by VoucherNo (including posting lines)
   * @param voucherNo - The VoucherNo of the petty cash voucher to fetch
   * @returns PettyCashVoucher object with posting lines
   */
  async getPettyCashVoucherByVoucherNo(voucherNo: string): Promise<{
    voucher: PettyCashVoucher | null;
    postingLines: PettyCashVoucherPostingLine[];
  }> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Petty Cash Voucher by VoucherNo
      parameters: {
        VoucherNo: voucherNo, // Fetch by VoucherNo
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      // Mode 4 returns two tables: table1 for header, table2 for lines
      return {
        voucher: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        postingLines: response.table2 || [],
      };
    }

    return { voucher: null, postingLines: [] };
  }

  /**
   * Delete a petty cash voucher
   * @param voucherNo - The VoucherNo of the petty cash voucher to delete
   * @returns Response with status
   */
  async deletePettyCashVoucher(voucherNo: string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Petty Cash Voucher
      parameters: {
        VoucherNo: voucherNo, // Delete by VoucherNo
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
        // Removed FilterExpenseCategory as it's not in the SP
        FilterPostingStatus: params.filterPostingStatus,
        FilterCompanyID: params.filterCompanyID,
        FilterFiscalYearID: params.filterFiscalYearID,
        FilterAccountID: params.filterAccountID, // Changed to FilterAccountID
      },
    };

    const response = await this.execute<PettyCashVoucher[]>(request);
    return response.success ? response.table1 || [] : [];
  }

  /**
   * Post petty cash voucher to General Ledger
   * @param voucherNo - The VoucherNo of the petty cash voucher to post
   * @returns Response with status
   */
  async postPettyCashVoucher(voucherNo: string): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Post Petty Cash Voucher
      parameters: {
        VoucherNo: voucherNo, // Post by VoucherNo
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
   * @param data - Reversal data including VoucherNo and reason
   * @returns Response with status and reversal voucher number
   */
  async reversePettyCashVoucher(data: PettyCashReverseRequest): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Reverse Petty Cash Voucher
      parameters: {
        VoucherNo: data.VoucherNo, // Reverse by VoucherNo
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
