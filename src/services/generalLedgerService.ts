// src/services/generalLedgerService.ts
import { BaseService, BaseRequest } from "./BaseService";
import {
  AccountLedgerParams,
  AccountLedgerResponse,
  AccountLedgerTransaction,
  AccountLedgerSummary,
  AccountInfo,
  TrialBalanceParams,
  TrialBalanceResponse,
  TrialBalanceItem,
  TrialBalanceTotals,
  BalanceSheetParams,
  BalanceSheetResponse,
  BalanceSheetItem,
  BalanceSheetCategoryTotal,
  IncomeStatementParams,
  IncomeStatementResponse,
  IncomeStatementItem,
  IncomeStatementSummary,
  ChartOfAccountsParams,
  ChartOfAccountsItem,
  GLSummaryParams,
  GLAccountTypeSummary,
  DetailedGLParams,
  DetailedGLTransaction,
  AccountActivityParams,
  AccountActivityResponse,
  AccountActivitySummary,
  AccountActivityByVoucherType,
  AccountActivityByMonth,
  BankReconciliationParams,
  BankReconciliationResponse,
  BankReconciliationTransaction,
  BankReconciliationSummary,
  AgedTrialBalanceParams,
  AgedTrialBalanceItem,
  ApiResponse,
} from "../types/generalLedgerTypes";

/**
 * Service for General Ledger management operations
 * Implements all modes of the sp_GeneralLedgerManagement stored procedure
 */
class GeneralLedgerService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/generalLedger");
  }

  /**
   * Mode 1: Get Account Ledger with Running Balance
   * @param params - Account ledger parameters
   * @returns Account ledger with transactions, summary, and account info
   */
  async getAccountLedger(params: AccountLedgerParams): Promise<AccountLedgerResponse> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Get Account Ledger with Running Balance
      parameters: {
        AccountID: params.accountID,
        CompanyID: params.companyID,
        FiscalYearID: params.fiscalYearID,
        FromDate: params.fromDate,
        ToDate: params.toDate,
        PostingDate: params.postingDate,
        VoucherType: params.voucherType,
        VoucherNo: params.voucherNo,
        PostingStatus: params.postingStatus,
        CustomerID: params.customerID,
        SupplierID: params.supplierID,
        IsReversed: params.isReversed,
        IncludeOpeningBalances: params.includeOpeningBalances,
        IncludeClosingBalances: params.includeClosingBalances,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        accountInfo: response.table1?.[0] || null,
        transactions: response.table2 || [],
        summary: response.table3?.[0] || null,
      };
    }

    return {
      accountInfo: null,
      transactions: [],
      summary: null,
    };
  }

  /**
   * Mode 2: Get Trial Balance
   * @param params - Trial balance parameters
   * @returns Trial balance items and totals
   */
  async getTrialBalance(params: TrialBalanceParams): Promise<TrialBalanceResponse> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Get Trial Balance
      parameters: {
        CompanyID: params.companyID,
        FiscalYearID: params.fiscalYearID,
        BalanceAsOfDate: params.balanceAsOfDate,
        AccountTypeID: params.accountTypeID,
        ParentAccountID: params.parentAccountID,
        IsActiveOnly: params.isActiveOnly,
        ShowZeroBalances: params.showZeroBalances,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        items: response.table1 || [],
        totals: response.table2?.[0] || null,
      };
    }

    return {
      items: [],
      totals: null,
    };
  }

  /**
   * Mode 3: Get Balance Sheet
   * @param params - Balance sheet parameters
   * @returns Balance sheet items and category totals
   */
  async getBalanceSheet(params: BalanceSheetParams): Promise<BalanceSheetResponse> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Get Balance Sheet
      parameters: {
        CompanyID: params.companyID,
        FiscalYearID: params.fiscalYearID,
        BalanceAsOfDate: params.balanceAsOfDate,
        ShowZeroBalances: params.showZeroBalances,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        items: response.table1 || [],
        categoryTotals: response.table2 || [],
      };
    }

    return {
      items: [],
      categoryTotals: [],
    };
  }

  /**
   * Mode 4: Get Income Statement (Profit & Loss)
   * @param params - Income statement parameters
   * @returns Income statement items and summary
   */
  async getIncomeStatement(params: IncomeStatementParams): Promise<IncomeStatementResponse> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Get Income Statement (Profit & Loss)
      parameters: {
        CompanyID: params.companyID,
        FiscalYearID: params.fiscalYearID,
        FromDate: params.fromDate,
        ToDate: params.toDate,
        ShowZeroBalances: params.showZeroBalances,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        items: response.table1 || [],
        summary: response.table2 || [],
      };
    }

    return {
      items: [],
      summary: [],
    };
  }

  /**
   * Mode 5: Get Chart of Accounts with Balances
   * @param params - Chart of accounts parameters
   * @returns Array of accounts with current balances
   */
  async getChartOfAccountsWithBalances(params: ChartOfAccountsParams): Promise<ChartOfAccountsItem[]> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Get Chart of Accounts with Balances
      parameters: {
        CompanyID: params.companyID,
        FiscalYearID: params.fiscalYearID,
        BalanceAsOfDate: params.balanceAsOfDate,
        IsActiveOnly: params.isActiveOnly,
        IsPostableOnly: params.isPostableOnly,
        AccountTypeID: params.accountTypeID,
        ParentAccountID: params.parentAccountID,
        AccountLevel: params.accountLevel,
        SearchText: params.searchText,
        ShowZeroBalances: params.showZeroBalances,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute<ChartOfAccountsItem[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Mode 6: Get GL Summary by Account Type
   * @param params - GL summary parameters
   * @returns Array of account type summaries
   */
  async getGLSummaryByAccountType(params: GLSummaryParams): Promise<GLAccountTypeSummary[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Get GL Summary by Account Type
      parameters: {
        CompanyID: params.companyID,
        FiscalYearID: params.fiscalYearID,
        FromDate: params.fromDate,
        ToDate: params.toDate,
        AccountTypeID: params.accountTypeID,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute<GLAccountTypeSummary[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Mode 7: Get Detailed GL Transactions
   * @param params - Detailed GL transaction parameters
   * @returns Array of detailed GL transactions
   */
  async getDetailedGLTransactions(params: DetailedGLParams): Promise<DetailedGLTransaction[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Detailed GL Transactions
      parameters: {
        CompanyID: params.companyID,
        FiscalYearID: params.fiscalYearID,
        FromDate: params.fromDate,
        ToDate: params.toDate,
        AccountID: params.accountID,
        VoucherType: params.voucherType,
        VoucherNo: params.voucherNo,
        PostingStatus: params.postingStatus,
        CustomerID: params.customerID,
        SupplierID: params.supplierID,
        IsReversed: params.isReversed,
        SearchText: params.searchText,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute<DetailedGLTransaction[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Mode 8: Get Account Activity Summary
   * @param params - Account activity parameters
   * @returns Account activity summary with breakdowns
   */
  async getAccountActivitySummary(params: AccountActivityParams): Promise<AccountActivityResponse> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Get Account Activity Summary
      parameters: {
        AccountID: params.accountID,
        FromDate: params.fromDate,
        ToDate: params.toDate,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        summary: response.table1?.[0] || null,
        byVoucherType: response.table2 || [],
        byMonth: response.table3 || undefined,
      };
    }

    return {
      summary: null,
      byVoucherType: [],
      byMonth: undefined,
    };
  }

  /**
   * Mode 9: Get Bank Reconciliation Data
   * @param params - Bank reconciliation parameters
   * @returns Bank reconciliation transactions and summary
   */
  async getBankReconciliationData(params: BankReconciliationParams): Promise<BankReconciliationResponse> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Bank Reconciliation Data
      parameters: {
        AccountID: params.accountID,
        ReconciliationDate: params.reconciliationDate,
        FiscalYearID: params.fiscalYearID,
        BankStatementBalance: params.bankStatementBalance,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        transactions: response.table1 || [],
        summary: response.table2?.[0] || null,
      };
    }

    return {
      transactions: [],
      summary: null,
    };
  }

  /**
   * Mode 10: Get Aged Trial Balance
   * @param params - Aged trial balance parameters
   * @returns Array of aged trial balance items
   */
  async getAgedTrialBalance(params: AgedTrialBalanceParams): Promise<AgedTrialBalanceItem[]> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Get Aged Trial Balance
      parameters: {
        CompanyID: params.companyID,
        BalanceAsOfDate: params.balanceAsOfDate,
        ShowZeroBalances: params.showZeroBalances,
        CurrentUserID: this.getCurrentUserId(),
        CurrentUserName: this.getCurrentUser(),
      },
    };

    const response = await this.execute<AgedTrialBalanceItem[]>(request);
    return response.success ? response.data || [] : [];
  }

  // Convenience methods for common operations

  /**
   * Get account ledger for a specific period
   * @param accountId - The account ID
   * @param fromDate - Start date
   * @param toDate - End date
   * @param companyId - Optional company ID
   * @returns Account ledger response
   */
  async getAccountLedgerForPeriod(accountId: number, fromDate: string | Date, toDate: string | Date, companyId?: number): Promise<AccountLedgerResponse> {
    return this.getAccountLedger({
      accountID: accountId,
      fromDate,
      toDate,
      companyID: companyId,
    });
  }

  /**
   * Get trial balance as of a specific date
   * @param companyId - The company ID
   * @param fiscalYearId - The fiscal year ID
   * @param asOfDate - The balance date
   * @returns Trial balance response
   */
  async getTrialBalanceAsOfDate(companyId: number, fiscalYearId: number, asOfDate?: string | Date): Promise<TrialBalanceResponse> {
    return this.getTrialBalance({
      companyID: companyId,
      fiscalYearID: fiscalYearId,
      balanceAsOfDate: asOfDate,
    });
  }

  /**
   * Get balance sheet as of a specific date
   * @param companyId - The company ID
   * @param fiscalYearId - The fiscal year ID
   * @param asOfDate - The balance date
   * @returns Balance sheet response
   */
  async getBalanceSheetAsOfDate(companyId: number, fiscalYearId: number, asOfDate?: string | Date): Promise<BalanceSheetResponse> {
    return this.getBalanceSheet({
      companyID: companyId,
      fiscalYearID: fiscalYearId,
      balanceAsOfDate: asOfDate,
    });
  }

  /**
   * Get income statement for a specific period
   * @param companyId - The company ID
   * @param fiscalYearId - The fiscal year ID
   * @param fromDate - Start date
   * @param toDate - End date
   * @returns Income statement response
   */
  async getIncomeStatementForPeriod(companyId: number, fiscalYearId: number, fromDate?: string | Date, toDate?: string | Date): Promise<IncomeStatementResponse> {
    return this.getIncomeStatement({
      companyID: companyId,
      fiscalYearID: fiscalYearId,
      fromDate,
      toDate,
    });
  }

  /**
   * Get chart of accounts with current balances
   * @param companyId - The company ID
   * @param activeOnly - Whether to include only active accounts
   * @returns Array of accounts with balances
   */
  async getActiveChartOfAccounts(companyId: number, activeOnly: boolean = true): Promise<ChartOfAccountsItem[]> {
    return this.getChartOfAccountsWithBalances({
      companyID: companyId,
      isActiveOnly: activeOnly,
    });
  }

  /**
   * Get GL transactions for a specific account and period
   * @param accountId - The account ID
   * @param companyId - The company ID
   * @param fromDate - Start date
   * @param toDate - End date
   * @returns Array of detailed GL transactions
   */
  async getAccountTransactions(accountId: number, companyId: number, fromDate?: string | Date, toDate?: string | Date): Promise<DetailedGLTransaction[]> {
    return this.getDetailedGLTransactions({
      companyID: companyId,
      accountID: accountId,
      fromDate,
      toDate,
    });
  }

  /**
   * Get bank reconciliation for a specific account
   * @param accountId - The bank account ID
   * @param reconciliationDate - The reconciliation date
   * @param bankStatementBalance - The bank statement balance
   * @returns Bank reconciliation response
   */
  async getBankReconciliation(accountId: number, reconciliationDate: string | Date, bankStatementBalance?: number): Promise<BankReconciliationResponse> {
    return this.getBankReconciliationData({
      accountID: accountId,
      reconciliationDate,
      bankStatementBalance,
    });
  }

  /**
   * Get aged receivables/payables
   * @param companyId - The company ID
   * @param asOfDate - The aging date
   * @returns Array of aged trial balance items
   */
  async getAgedReceivablesPayables(companyId: number, asOfDate?: string | Date): Promise<AgedTrialBalanceItem[]> {
    return this.getAgedTrialBalance({
      companyID: companyId,
      balanceAsOfDate: asOfDate,
    });
  }

  /**
   * Search GL transactions
   * @param companyId - The company ID
   * @param searchText - The search text
   * @param fromDate - Optional start date
   * @param toDate - Optional end date
   * @returns Array of matching GL transactions
   */
  async searchGLTransactions(companyId: number, searchText: string, fromDate?: string | Date, toDate?: string | Date): Promise<DetailedGLTransaction[]> {
    return this.getDetailedGLTransactions({
      companyID: companyId,
      searchText,
      fromDate,
      toDate,
    });
  }
}

// Export a singleton instance
export const generalLedgerService = new GeneralLedgerService();
