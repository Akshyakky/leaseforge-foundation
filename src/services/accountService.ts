// src/services/accountService.ts
import { BaseService, BaseRequest } from "./BaseService";
import {
  Account,
  AccountType,
  AccountOpeningBalance,
  AccountTransaction,
  AccountHierarchy,
  AccountTypeHierarchy,
  BalanceSheetItem,
  IncomeStatementItem,
  TrialBalanceItem,
  TrialBalanceSummary,
  IncomeSummary,
  AccountSearchParams,
  ApiResponse,
} from "../types/accountTypes";

/**
 * Service for account management operations
 */
class AccountService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Master/accountmanagement");
  }

  /**
   * Create a new account with optional opening balance
   * @param account - The account data to create
   * @param openingBalance - Optional opening balance information
   * @returns Response with status and new account ID
   */
  async createAccount(
    account: Partial<Account>,
    openingBalance?: {
      fiscalYearID: number;
      openingDebit?: number;
      openingCredit?: number;
      openingBalance?: number;
    }
  ): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 1, // Mode 1: Insert New Account
      parameters: {
        AccountCode: account.AccountCode,
        AccountName: account.AccountName,
        AccountTypeID: account.AccountTypeID,
        ParentAccountID: account.ParentAccountID,
        AccountLevel: account.AccountLevel,
        CurrencyID: account.CurrencyID,
        CashFlowCategoryID: account.CashFlowCategoryID,
        IsActive: account.IsActive !== undefined ? account.IsActive : true,
        IsPostable: account.IsPostable !== undefined ? account.IsPostable : true,
        CostCenter1ID: account.CostCenter1ID,
        CostCenter2ID: account.CostCenter2ID,
        CostCenter3ID: account.CostCenter3ID,
        CostCenter4ID: account.CostCenter4ID,
        CompanyID: account.CompanyID,
        Description: account.Description,

        // Opening balance fields if provided
        FiscalYearID: openingBalance?.fiscalYearID,
        OpeningDebit: openingBalance?.openingDebit,
        OpeningCredit: openingBalance?.openingCredit,
        OpeningBalance: openingBalance?.openingBalance,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Account created successfully");
      return {
        Status: 1,
        Message: response.message || "Account created successfully",
        NewAccountID: response.NewAccountID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create account",
    };
  }

  /**
   * Update an existing account with optional opening balance
   * @param account - The account data to update
   * @param openingBalance - Optional opening balance information
   * @returns Response with status
   */
  async updateAccount(
    account: Partial<Account> & { AccountID: number },
    openingBalance?: {
      fiscalYearID: number;
      openingDebit?: number;
      openingCredit?: number;
      openingBalance?: number;
    }
  ): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 2, // Mode 2: Update Existing Account
      parameters: {
        AccountID: account.AccountID,
        AccountCode: account.AccountCode,
        AccountName: account.AccountName,
        AccountTypeID: account.AccountTypeID,
        ParentAccountID: account.ParentAccountID,
        AccountLevel: account.AccountLevel,
        CurrencyID: account.CurrencyID,
        CashFlowCategoryID: account.CashFlowCategoryID,
        IsActive: account.IsActive,
        IsPostable: account.IsPostable,
        CostCenter1ID: account.CostCenter1ID,
        CostCenter2ID: account.CostCenter2ID,
        CostCenter3ID: account.CostCenter3ID,
        CostCenter4ID: account.CostCenter4ID,
        CompanyID: account.CompanyID,
        Description: account.Description,

        // Opening balance fields if provided
        FiscalYearID: openingBalance?.fiscalYearID,
        OpeningDebit: openingBalance?.openingDebit,
        OpeningCredit: openingBalance?.openingCredit,
        OpeningBalance: openingBalance?.openingBalance,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Account updated successfully");
      return {
        Status: 1,
        Message: response.message || "Account updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update account",
    };
  }

  /**
   * Get all active accounts
   * @returns Array of accounts
   */
  async getAllAccounts(): Promise<Account[]> {
    const request: BaseRequest = {
      mode: 3, // Mode 3: Fetch All Active Accounts
      parameters: {},
    };

    const response = await this.execute<Account[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get account by ID with opening balances
   * @param accountId - The ID of the account to fetch
   * @returns The account and its opening balances
   */
  async getAccountById(accountId: number): Promise<{ account: Account | null; openingBalances: AccountOpeningBalance[] }> {
    const request: BaseRequest = {
      mode: 4, // Mode 4: Fetch Account by ID
      parameters: {
        AccountID: accountId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        account: response.table1 && response.table1.length > 0 ? response.table1[0] : null,
        openingBalances: response.table2 || [],
      };
    }

    return { account: null, openingBalances: [] };
  }

  /**
   * Delete an account
   * @param accountId - The ID of the account to delete
   * @returns Response with status
   */
  async deleteAccount(accountId: number): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 5, // Mode 5: Soft Delete Account
      parameters: {
        AccountID: accountId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Account deleted successfully");
      return {
        Status: 1,
        Message: response.message || "Account deleted successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to delete account",
    };
  }

  /**
   * Search for accounts with filters
   * @param params - Search parameters
   * @returns Array of matching accounts
   */
  async searchAccounts(params: AccountSearchParams = {}): Promise<Account[]> {
    const request: BaseRequest = {
      mode: 6, // Mode 6: Search Accounts with Filters
      parameters: {
        SearchText: params.searchText,
        FilterAccountTypeID: params.accountTypeID,
        FilterParentAccountID: params.parentAccountID,
        FilterIsActive: params.isActive,
        FilterIsPostable: params.isPostable,
        FilterCashFlowCategoryID: params.cashFlowCategoryID,
        FilterCompanyID: params.companyID,
      },
    };

    const response = await this.execute<Account[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get account hierarchy
   * @param companyId - Optional company ID filter
   * @returns Array of accounts in hierarchical format
   */
  async getAccountHierarchy(companyId?: number): Promise<AccountHierarchy[]> {
    const request: BaseRequest = {
      mode: 7, // Mode 7: Get Account Hierarchy
      parameters: {
        FilterCompanyID: companyId,
      },
    };

    const response = await this.execute<AccountHierarchy[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Set account opening balance
   * @param accountId - The account ID
   * @param fiscalYearId - The fiscal year ID
   * @param openingBalance - Opening balance details
   * @returns Response with status
   */
  async setAccountOpeningBalance(
    accountId: number,
    fiscalYearId: number,
    openingBalance: {
      openingDebit?: number;
      openingCredit?: number;
      openingBalance?: number;
      companyId: number;
    }
  ): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 8, // Mode 8: Set Account Opening Balance
      parameters: {
        AccountID: accountId,
        FiscalYearID: fiscalYearId,
        OpeningDebit: openingBalance.openingDebit || 0,
        OpeningCredit: openingBalance.openingCredit || 0,
        OpeningBalance: openingBalance.openingBalance,
        CompanyID: openingBalance.companyId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Opening balance set successfully");
      return {
        Status: 1,
        Message: response.message || "Opening balance set successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to set opening balance",
    };
  }
  /**
   * Get account transactions with enhanced filtering options
   * @param accountId - The account ID
   * @param options - Optional filtering parameters
   * @returns Array of account transactions
   */
  async getAccountTransactions(
    accountId: number,
    options?: {
      asOfDate?: Date | string;
      fromDate?: Date | string;
      toDate?: Date | string;
      fiscalYearId?: number;
    }
  ): Promise<AccountTransaction[]> {
    const request: BaseRequest = {
      mode: 9, // Mode 9: Get Account Transactions
      parameters: {
        AccountID: accountId,
        BalanceAsOfDate: options?.asOfDate,
        FilterFromDate: options?.fromDate,
        FilterToDate: options?.toDate,
        FiscalYearID: options?.fiscalYearId,
      },
    };

    const response = await this.execute<AccountTransaction[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Create a new account type
   * @param accountType - The account type data to create
   * @returns Response with status and new account type ID
   */
  async createAccountType(accountType: Partial<AccountType>): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 10, // Mode 10: Create New Account Type
      parameters: {
        AccountTypeCode: accountType.AccountTypeCode,
        AccountTypeName: accountType.AccountTypeName,
        ParentAccountTypeID: accountType.ParentAccountTypeID,
        AccountTypeLevel: accountType.AccountLevel,
        IsActive: accountType.IsActive !== undefined ? accountType.IsActive : true,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Account type created successfully");
      return {
        Status: 1,
        Message: response.message || "Account type created successfully",
        NewAccountTypeID: response.NewAccountTypeID,
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to create account type",
    };
  }

  /**
   * Update an existing account type
   * @param accountType - The account type data to update
   * @returns Response with status
   */
  async updateAccountType(accountType: Partial<AccountType> & { AccountTypeID: number }): Promise<ApiResponse> {
    const request: BaseRequest = {
      mode: 11, // Mode 11: Update Account Type
      parameters: {
        AccountTypeID: accountType.AccountTypeID,
        AccountTypeCode: accountType.AccountTypeCode,
        AccountTypeName: accountType.AccountTypeName,
        ParentAccountTypeID: accountType.ParentAccountTypeID,
        AccountTypeLevel: accountType.AccountLevel,
        IsActive: accountType.IsActive,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      this.showSuccess("Account type updated successfully");
      return {
        Status: 1,
        Message: response.message || "Account type updated successfully",
      };
    }

    return {
      Status: 0,
      Message: response.message || "Failed to update account type",
    };
  }

  /**
   * Get all account types
   * @returns Array of account types
   */
  async getAllAccountTypes(): Promise<AccountType[]> {
    const request: BaseRequest = {
      mode: 12, // Mode 12: Get All Account Types
      parameters: {},
    };

    const response = await this.execute<AccountType[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get account type hierarchy
   * @returns Array of account types in hierarchical format
   */
  async getAccountTypeHierarchy(): Promise<AccountTypeHierarchy[]> {
    const request: BaseRequest = {
      mode: 13, // Mode 13: Get Account Type Hierarchy
      parameters: {},
    };

    const response = await this.execute<AccountTypeHierarchy[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get account balance sheet
   * @param asOfDate - The date to get balance sheet as of
   * @param companyId - Optional company ID filter
   * @returns Array of balance sheet items
   */
  async getBalanceSheet(asOfDate: Date | string, companyId?: number): Promise<BalanceSheetItem[]> {
    const request: BaseRequest = {
      mode: 14, // Mode 14: Get Account Balance Sheet
      parameters: {
        BalanceAsOfDate: asOfDate,
        FilterCompanyID: companyId,
      },
    };

    const response = await this.execute<BalanceSheetItem[]>(request);
    return response.success ? response.data || [] : [];
  }

  /**
   * Get account income statement
   * @param fromDate - Start date for the income statement
   * @param toDate - End date for the income statement
   * @param companyId - Optional company ID filter
   * @returns Income statement data and summary
   */
  async getIncomeStatement(
    fromDate: Date | string,
    toDate: Date | string,
    companyId?: number
  ): Promise<{
    items: IncomeStatementItem[];
    summary: IncomeSummary[];
  }> {
    const request: BaseRequest = {
      mode: 15, // Mode 15: Get Account Income Statement
      parameters: {
        FilterFromDate: fromDate,
        FilterToDate: toDate,
        FilterCompanyID: companyId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        items: response.table1 || [],
        summary: response.table2 || [],
      };
    }

    return { items: [], summary: [] };
  }

  /**
   * Get trial balance
   * @param asOfDate - The date to get trial balance as of
   * @param companyId - Optional company ID filter
   * @returns Trial balance data and summary
   */
  async getTrialBalance(
    asOfDate: Date | string,
    companyId?: number
  ): Promise<{
    items: TrialBalanceItem[];
    summary: TrialBalanceSummary | null;
  }> {
    const request: BaseRequest = {
      mode: 16, // Mode 16: Get Trial Balance
      parameters: {
        BalanceAsOfDate: asOfDate,
        FilterCompanyID: companyId,
      },
    };

    const response = await this.execute(request);

    if (response.success) {
      return {
        items: response.table1 || [],
        summary: response.table2 && response.table2.length > 0 ? response.table2[0] : null,
      };
    }

    return { items: [], summary: null };
  }
}

// Export a singleton instance
export const accountService = new AccountService();
