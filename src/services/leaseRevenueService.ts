// src/services/leaseRevenueService.ts
import { BaseService, BaseRequest } from "./BaseService";
import {
  LeaseRevenueData,
  PostedLeaseRevenueEntry,
  LeaseRevenueSearchRequest,
  LeaseRevenuePostingRequest,
  PostingReversalRequest,
  LeaseRevenueSearchParams,
  PostedEntriesSearchParams,
  LeaseRevenueStatistics,
  LeaseRevenueDashboardData,
  PostingValidationResponse,
  LeaseRevenuePostingResponse,
  ReversalResponse,
  LEASE_REVENUE_MODES,
} from "../types/leaseRevenueTypes";

/**
 * Service for lease revenue posting operations
 */
class LeaseRevenueService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/leaseRevenuePosting");
  }

  /**
   * Get lease revenue data for posting period
   * @param searchRequest - The search parameters
   * @returns Array of lease revenue data
   */
  async getLeaseRevenueData(searchRequest: LeaseRevenueSearchRequest): Promise<LeaseRevenueData[]> {
    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.GET_LEASE_REVENUE_DATA,
      parameters: {
        PropertyID: searchRequest.PropertyID,
        UnitID: searchRequest.UnitID,
        PeriodFrom: searchRequest.PeriodFrom,
        PeriodTo: searchRequest.PeriodTo,
        IncludePMUnits: searchRequest.IncludePMUnits || false,
        ShowUnpostedOnly: searchRequest.ShowUnpostedOnly || false,
        CompanyID: searchRequest.CompanyID,
        FiscalYearID: searchRequest.FiscalYearID,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute<LeaseRevenueData[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Process lease revenue posting (batch operation)
   * @param postingRequest - The posting request data
   * @returns Response with posting results
   */
  async processLeaseRevenuePosting(postingRequest: LeaseRevenuePostingRequest): Promise<LeaseRevenuePostingResponse> {
    // Validate required parameters
    if (!postingRequest.DebitAccountID || !postingRequest.CreditAccountID) {
      return {
        Status: 0,
        Message: "Debit and Credit accounts are required",
        ProcessedCount: 0,
        TotalAmount: 0,
        PostingResults: [],
      };
    }

    if (!postingRequest.SelectedContractUnits || postingRequest.SelectedContractUnits.length === 0) {
      return {
        Status: 0,
        Message: "No contract units selected for posting",
        ProcessedCount: 0,
        TotalAmount: 0,
        PostingResults: [],
      };
    }

    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.PROCESS_LEASE_REVENUE_POSTING,
      parameters: {
        PropertyID: null, // Not used in batch posting
        UnitID: null, // Not used in batch posting
        PeriodFrom: postingRequest.PeriodFrom,
        PeriodTo: postingRequest.PeriodTo,
        DebitAccountID: postingRequest.DebitAccountID,
        CreditAccountID: postingRequest.CreditAccountID,
        PostingDate: postingRequest.PostingDate || new Date(),
        VoucherNo: postingRequest.VoucherNo,
        RefNo: postingRequest.RefNo,
        Narration: postingRequest.Narration,
        PrintVoucher: postingRequest.PrintVoucher || false,
        ContractUnitsJSON: JSON.stringify(postingRequest.SelectedContractUnits),
        CompanyID: postingRequest.CompanyID,
        FiscalYearID: postingRequest.FiscalYearID,
        CurrencyID: postingRequest.CurrencyID || 1,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess(`Lease revenue posting completed successfully. Processed: ${response.ProcessedCount} units`);
      return {
        Status: 1,
        Message: response.message || "Lease revenue posting completed successfully",
        VoucherNo: response.VoucherNo,
        ProcessedCount: response.ProcessedCount || 0,
        TotalAmount: response.TotalAmount || 0,
        PostingResults: response.data || [],
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to process lease revenue posting",
      ProcessedCount: 0,
      TotalAmount: 0,
      PostingResults: [],
    };
  }

  /**
   * Get posted lease revenue entries for period
   * @param searchParams - The search parameters
   * @returns Array of posted lease revenue entries
   */
  async getPostedEntries(searchParams: PostedEntriesSearchParams): Promise<PostedLeaseRevenueEntry[]> {
    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.GET_POSTED_ENTRIES,
      parameters: {
        PropertyID: searchParams.FilterPropertyID,
        UnitID: searchParams.FilterUnitID,
        PeriodFrom: searchParams.PeriodFrom,
        PeriodTo: searchParams.PeriodTo,
        CompanyID: searchParams.CompanyID,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute<PostedLeaseRevenueEntry[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Reverse lease revenue posting
   * @param reversalRequest - The reversal request data
   * @returns Response with reversal details
   */
  async reversePosting(reversalRequest: PostingReversalRequest): Promise<ReversalResponse> {
    if (!reversalRequest.VoucherNo) {
      return {
        Status: 0,
        Message: "Voucher number is required for reversal",
        ReversedAmount: 0,
        ReversedEntries: 0,
      };
    }

    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.REVERSE_POSTING,
      parameters: {
        VoucherNo: reversalRequest.VoucherNo,
        PostingDate: reversalRequest.PostingDate || new Date(),
        CompanyID: reversalRequest.CompanyID,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Lease revenue posting reversed successfully");
      return {
        Status: 1,
        Message: response.message || "Lease revenue posting reversed successfully",
        ReversalVoucherNo: response.ReversalVoucherNo,
        ReversedAmount: response.ReversedAmount || 0,
        ReversedEntries: response.ReversedEntries || 0,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to reverse lease revenue posting",
      ReversedAmount: 0,
      ReversedEntries: 0,
    };
  }

  /**
   * Search lease revenue data with advanced filters
   * @param searchParams - The search parameters
   * @returns Array of matching lease revenue data
   */
  async searchLeaseRevenue(searchParams: LeaseRevenueSearchParams): Promise<LeaseRevenueData[]> {
    const request: BaseRequest = {
      mode: LEASE_REVENUE_MODES.GET_LEASE_REVENUE_DATA,
      parameters: {
        PropertyID: searchParams.FilterPropertyID,
        UnitID: searchParams.FilterUnitID,
        PeriodFrom: searchParams.PeriodFrom,
        PeriodTo: searchParams.PeriodTo,
        IncludePMUnits: searchParams.IncludePMUnits || false,
        ShowUnpostedOnly: searchParams.ShowUnpostedOnly || false,
        CompanyID: searchParams.CompanyID,
        FiscalYearID: searchParams.FiscalYearID,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute<LeaseRevenueData[]>(request);

    if (response.success) {
      let filteredData = response.data || [];

      // Apply additional client-side filters
      if (searchParams.searchText) {
        const searchText = searchParams.searchText.toLowerCase();
        filteredData = filteredData.filter(
          (item) =>
            item.LeaseNo?.toLowerCase().includes(searchText) ||
            item.Property?.toLowerCase().includes(searchText) ||
            item.UnitNo?.toLowerCase().includes(searchText) ||
            item.CustomerName?.toLowerCase().includes(searchText)
        );
      }

      if (searchParams.FilterCustomerID) {
        // Note: This would require CustomerID in the response data
        // You might need to add this to the stored procedure
      }

      if (searchParams.FilterContractStatus) {
        filteredData = filteredData.filter((item) => item.ContractStatus === searchParams.FilterContractStatus);
      }

      if (searchParams.FilterPostedOnly) {
        filteredData = filteredData.filter((item) => item.IsPosted === true);
      }

      if (searchParams.FilterUnpostedOnly) {
        filteredData = filteredData.filter((item) => item.IsPosted === false);
      }

      return filteredData;
    }

    return [];
  }

  /**
   * Validate posting data before processing
   * @param postingRequest - The posting request to validate
   * @returns Validation response with errors and warnings
   */
  async validatePostingData(postingRequest: LeaseRevenuePostingRequest): Promise<PostingValidationResponse> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!postingRequest.CompanyID) {
      errors.push("Company ID is required");
    }

    if (!postingRequest.FiscalYearID) {
      errors.push("Fiscal Year ID is required");
    }

    if (!postingRequest.DebitAccountID) {
      errors.push("Debit account is required");
    }

    if (!postingRequest.CreditAccountID) {
      errors.push("Credit account is required");
    }

    if (postingRequest.DebitAccountID === postingRequest.CreditAccountID) {
      errors.push("Debit and Credit accounts cannot be the same");
    }

    if (!postingRequest.PeriodFrom || !postingRequest.PeriodTo) {
      errors.push("Period From and To dates are required");
    }

    if (new Date(postingRequest.PeriodFrom) >= new Date(postingRequest.PeriodTo)) {
      errors.push("Period From date must be before Period To date");
    }

    if (!postingRequest.SelectedContractUnits || postingRequest.SelectedContractUnits.length === 0) {
      errors.push("No contract units selected for posting");
    }

    // Calculate total posting amount
    const totalAmount = postingRequest.SelectedContractUnits?.reduce((sum, unit) => sum + (unit.PostingAmount || 0), 0) || 0;

    if (totalAmount <= 0) {
      errors.push("Total posting amount must be greater than zero");
    }

    // Add warnings for large amounts or unusual conditions
    if (totalAmount > 1000000) {
      warnings.push("Large posting amount detected. Please verify the amounts are correct");
    }

    if (postingRequest.SelectedContractUnits && postingRequest.SelectedContractUnits.length > 100) {
      warnings.push("Large number of units selected. Processing may take some time");
    }

    return {
      IsValid: errors.length === 0,
      Errors: errors,
      Warnings: warnings,
      ValidatedUnits: postingRequest.SelectedContractUnits || [],
      TotalPostingAmount: totalAmount,
    };
  }

  /**
   * Get lease revenue statistics for dashboard
   * @param companyId - Company ID
   * @param fiscalYearId - Fiscal Year ID
   * @param periodFrom - Period from date
   * @param periodTo - Period to date
   * @returns Lease revenue statistics
   */
  async getLeaseRevenueStatistics(companyId: number, fiscalYearId: number, periodFrom: string | Date, periodTo: string | Date): Promise<LeaseRevenueStatistics> {
    // This would be a separate mode in the stored procedure or a different endpoint
    // For now, implementing basic statistics calculation
    const leaseData = await this.getLeaseRevenueData({
      CompanyID: companyId,
      FiscalYearID: fiscalYearId,
      PeriodFrom: periodFrom,
      PeriodTo: periodTo,
    });

    const totalRevenue = leaseData.reduce((sum, item) => sum + item.PostingAmount, 0);
    const postedRevenue = leaseData.filter((item) => item.IsPosted).reduce((sum, item) => sum + item.PostingAmount, 0);
    const unpostedRevenue = totalRevenue - postedRevenue;

    // Group by property
    const propertyMap = new Map();
    leaseData.forEach((item) => {
      const key = item.Property;
      if (!propertyMap.has(key)) {
        propertyMap.set(key, {
          PropertyID: 0, // Would need to be included in the response
          PropertyName: key,
          UnitCount: 0,
          TotalRevenue: 0,
          PostedRevenue: 0,
          UnpostedRevenue: 0,
        });
      }
      const property = propertyMap.get(key);
      property.UnitCount += 1;
      property.TotalRevenue += item.PostingAmount;
      if (item.IsPosted) {
        property.PostedRevenue += item.PostingAmount;
      } else {
        property.UnpostedRevenue += item.PostingAmount;
      }
    });

    return {
      periodSummary: {
        TotalContracts: new Set(leaseData.map((item) => item.LeaseNo)).size,
        TotalUnits: leaseData.length,
        TotalRevenue: totalRevenue,
        PostedRevenue: postedRevenue,
        UnpostedRevenue: unpostedRevenue,
        AverageRentPerDay: leaseData.length > 0 ? leaseData.reduce((sum, item) => sum + item.RentPerDay, 0) / leaseData.length : 0,
      },
      propertyBreakdown: Array.from(propertyMap.values()),
      contractStatusSummary: [],
      customerBreakdown: [],
    };
  }

  /**
   * Get dashboard data for lease revenue
   * @param companyId - Company ID
   * @param fiscalYearId - Fiscal Year ID
   * @returns Dashboard data
   */
  async getDashboardData(companyId: number, fiscalYearId: number): Promise<LeaseRevenueDashboardData> {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const currentMonthData = await this.getLeaseRevenueData({
      CompanyID: companyId,
      FiscalYearID: fiscalYearId,
      PeriodFrom: firstDayOfMonth,
      PeriodTo: lastDayOfMonth,
    });

    const totalRevenue = currentMonthData.reduce((sum, item) => sum + item.PostingAmount, 0);
    const postedRevenue = currentMonthData.filter((item) => item.IsPosted).reduce((sum, item) => sum + item.PostingAmount, 0);
    const unpostedRevenue = totalRevenue - postedRevenue;

    return {
      totalRevenue: totalRevenue,
      postedRevenue: postedRevenue,
      unpostedRevenue: unpostedRevenue,
      currentMonthRevenue: totalRevenue,
      previousMonthRevenue: 0, // Would need historical data
      averageRentPerDay: currentMonthData.length > 0 ? currentMonthData.reduce((sum, item) => sum + item.RentPerDay, 0) / currentMonthData.length : 0,
      totalUnitsPosted: currentMonthData.filter((item) => item.IsPosted).length,
      totalContractsProcessed: new Set(currentMonthData.map((item) => item.LeaseNo)).size,
      recentPostings: [],
      pendingPostings: currentMonthData.filter((item) => !item.IsPosted),
      revenueTrends: [],
      propertyPerformance: [],
    };
  }

  /**
   * Export lease revenue data
   * @param searchParams - Search parameters for data to export
   * @param format - Export format
   * @returns Export file data
   */
  async exportLeaseRevenueData(
    searchParams: LeaseRevenueSearchParams,
    format: "CSV" | "Excel" | "PDF" = "Excel"
  ): Promise<{ success: boolean; data?: Blob; filename?: string; message?: string }> {
    try {
      const data = await this.searchLeaseRevenue(searchParams);

      if (data.length === 0) {
        return {
          success: false,
          message: "No data found to export",
        };
      }

      // This would typically call a separate export endpoint
      // For now, returning a placeholder implementation
      const csvData = this.convertToCSV(data);
      const blob = new Blob([csvData], { type: "text/csv" });
      const filename = `lease-revenue-${new Date().toISOString().split("T")[0]}.csv`;

      return {
        success: true,
        data: blob,
        filename: filename,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to export data",
      };
    }
  }

  /**
   * Convert data to CSV format
   * @private
   */
  private convertToCSV(data: LeaseRevenueData[]): string {
    const headers = [
      "Contract Unit ID",
      "Lease No",
      "Property",
      "Unit No",
      "Customer Name",
      "Start Date",
      "End Date",
      "Total Lease Days",
      "Rent Per Day",
      "Posting Amount",
      "Contract Status",
      "Is Posted",
    ];

    const rows = data.map((item) => [
      item.ContractUnitID,
      item.LeaseNo,
      item.Property,
      item.UnitNo,
      item.CustomerName,
      new Date(item.StartDate).toLocaleDateString(),
      new Date(item.EndDate).toLocaleDateString(),
      item.TotalLeaseDays,
      item.RentPerDay.toFixed(2),
      item.PostingAmount.toFixed(2),
      item.ContractStatus,
      item.IsPosted ? "Yes" : "No",
    ]);

    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  }
  /**
   * Get lease revenue details by Contract Unit ID
   * @param contractUnitId - The contract unit ID
   * @param companyId - Company ID
   * @param fiscalYearId - Fiscal Year ID
   * @returns Lease revenue data for the specific unit
   */
  async getLeaseRevenueDetails(contractUnitId: number, companyId: number, fiscalYearId: number): Promise<LeaseRevenueData | null> {
    try {
      // Fetch all data for current period and find the specific item
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const searchRequest: LeaseRevenueSearchRequest = {
        PeriodFrom: startOfMonth,
        PeriodTo: endOfMonth,
        CompanyID: companyId,
        FiscalYearID: fiscalYearId,
        ShowUnpostedOnly: false, // Include both posted and unposted
        IncludePMUnits: true, // Include all units
      };

      const data = await this.getLeaseRevenueData(searchRequest);
      const item = data.find((d) => d.ContractUnitID === contractUnitId);

      return item || null;
    } catch (error) {
      console.error("Error fetching lease revenue details:", error);
      return null;
    }
  }

  /**
   * Get posted entry details by Posting ID
   * @param postingId - The posting ID
   * @param companyId - Company ID
   * @returns Posted entry details
   */
  async getPostedEntryDetails(postingId: number, companyId: number): Promise<PostedLeaseRevenueEntry | null> {
    try {
      const request: BaseRequest = {
        mode: LEASE_REVENUE_MODES.GET_TRANSACTION_DETAILS,
        parameters: {
          TransactionType: "PostedEntry",
          TransactionID: postingId,
          CompanyID: companyId,
          CurrentUserID: this.getCurrentUserId(),
          CurrentUserName: this.getCurrentUser(),
        },
      };

      const response = await this.execute<any>(request);

      if (response.success && response.data) {
        // Transform the response to match PostedLeaseRevenueEntry interface
        const data = Array.isArray(response.data) ? response.data[0] : response.data;

        return {
          PostingID: data.TransactionID || data.PostingID || postingId,
          VoucherNo: data.TransactionNo || data.VoucherNo,
          TransactionDate: data.TransactionDate,
          PostingDate: data.PostingDate || data.TransactionDate,
          AccountID: data.AccountID || 0,
          AccountCode: data.AccountCode || "",
          AccountName: data.AccountName || "",
          TransactionType: data.EntryType || data.TransactionType || "Debit",
          DebitAmount: data.DebitAmount || 0,
          CreditAmount: data.CreditAmount || 0,
          Description: data.Description || "",
          Narration: data.Narration || "",
          ContractUnitID: data.ContractUnitID,
          UnitID: data.UnitID,
          UnitNo: data.UnitNo,
          PropertyName: data.PropertyName,
          ContractNo: data.ContractNo,
          CustomerFullName: data.CustomerName || data.CustomerFullName,
          PostingStatus: data.PostingStatus || "Posted",
          CreatedBy: data.CreatedBy,
          CreatedOn: data.CreatedOn,
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching posted entry details:", error);
      return null;
    }
  }
}

// Export a singleton instance
export const leaseRevenueService = new LeaseRevenueService();
