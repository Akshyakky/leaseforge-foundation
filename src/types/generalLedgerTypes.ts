// src/types/generalLedgerTypes.ts
export interface BaseGeneralLedger {
  CreatedBy?: string;
  CreatedOn?: string;
  CreatedID?: number;
  UpdatedBy?: string;
  UpdatedOn?: string;
  UpdatedID?: number;
  DeletedBy?: string;
  DeletedOn?: string;
  DeletedID?: number;
  RecordStatus?: number;
}

// Account Ledger Types (Mode 1)
export interface AccountLedgerTransaction {
  PostingID: number;
  VoucherNo: string;
  VoucherType: string;
  TransactionDate: string | Date;
  PostingDate: string | Date;
  TransactionType: string;
  DebitAmount?: number;
  CreditAmount?: number;
  Description?: string;
  Narration?: string;
  ReferenceType?: string;
  ReferenceNo?: string;
  CustomerID?: number;
  SupplierID?: number;
  ChequeNo?: string;
  ChequeDate?: string | Date;
  IsReversed: boolean;
  SourceModule?: string;
  RunningBalance: number;

  // Tax-related fields (added from stored procedure modification)
  BaseAmount?: number;
  TaxID?: number;
  TaxCode?: string;
  TaxName?: string;
  TaxPercentage?: number;
  LineTaxAmount?: number;
  IsTaxInclusive?: boolean;

  // Joined fields
  CustomerFullName?: string;
  SupplierName?: string;
}

export interface AccountLedgerSummary {
  OpeningBalance: number;
  TotalDebits: number;
  TotalCredits: number;
  ClosingBalance: number;
  TransactionCount: number;
}

export interface AccountInfo {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeID: number;
  ParentAccountID?: number;
  AccountLevel: number;
  CurrencyID: number;
  IsActive: boolean;
  IsPostable: boolean;
  AccountTypeName?: string;
  ParentAccountName?: string;
  CurrencyName?: string;
}

// Trial Balance Types (Mode 2)
export interface TrialBalanceItem {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeID: number;
  AccountLevel: number;
  AccountTypeName: string;
  OpeningDebit: number;
  OpeningCredit: number;
  PeriodDebit: number;
  PeriodCredit: number;
  TotalDebit: number;
  TotalCredit: number;
  DebitBalance: number;
  CreditBalance: number;
}

export interface TrialBalanceTotals {
  TotalOpeningDebit: number;
  TotalOpeningCredit: number;
  TotalPeriodDebit: number;
  TotalPeriodCredit: number;
  GrandTotalDebit: number;
  GrandTotalCredit: number;
}

// Balance Sheet Types (Mode 3)
export interface BalanceSheetItem {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeID: number;
  AccountLevel: number;
  AccountTypeName: string;
  BSCategory: "ASSETS" | "LIABILITIES" | "EQUITY" | "OTHER";
  Balance: number;
  DisplayOrder: number;
}

export interface BalanceSheetCategoryTotal {
  BSCategory: "ASSETS" | "LIABILITIES" | "EQUITY" | "OTHER";
  Total: number;
}

// Income Statement Types (Mode 4)
export interface IncomeStatementItem {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeID: number;
  AccountLevel: number;
  AccountTypeName: string;
  PLCategory: "REVENUE" | "EXPENSES" | "OTHER";
  NetAmount: number;
  DisplayOrder: number;
}

export interface IncomeStatementSummary {
  Category: "Total Revenue" | "Total Expenses" | "Net Income";
  Amount: number;
}

// Chart of Accounts with Balances Types (Mode 5)
export interface ChartOfAccountsItem {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeID: number;
  ParentAccountID?: number;
  AccountLevel: number;
  CurrencyID: number;
  IsActive: boolean;
  IsPostable: boolean;
  Description?: string;
  AccountTypeName?: string;
  ParentAccountName?: string;
  CurrencyName?: string;
  CurrentBalance: number;
  TransactionCount: number;
  LastTransactionDate?: string | Date;
}

// GL Summary by Account Type (Mode 6)
export interface GLAccountTypeSummary {
  AccountTypeID: number;
  AccountTypeName: string;
  AccountCount: number;
  VoucherCount: number;
  TotalDebits: number;
  TotalCredits: number;
  NetBalance: number;
  FirstTransactionDate?: string | Date;
  LastTransactionDate?: string | Date;
}

// Detailed GL Transactions (Mode 7)
export interface DetailedGLTransaction {
  PostingID: number;
  VoucherNo: string;
  VoucherType: string;
  TransactionDate: string | Date;
  PostingDate: string | Date;
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeName: string;
  TransactionType: string;
  DebitAmount?: number;
  CreditAmount?: number;
  Description?: string;
  Narration?: string;
  ReferenceType?: string;
  ReferenceNo?: string;
  CustomerID?: number;
  CustomerFullName?: string;
  SupplierID?: number;
  SupplierName?: string;
  ChequeNo?: string;
  ChequeDate?: string | Date;
  BankID?: number;
  BankName?: string;
  PostingStatus: string;
  IsReversed: boolean;
  SourceModule?: string;
  CreatedBy?: string;
  CreatedOn?: string | Date;

  // Tax-related fields (added from stored procedure modification)
  BaseAmount?: number;
  TaxID?: number;
  TaxCode?: string;
  TaxName?: string;
  TaxPercentage?: number;
  LineTaxAmount?: number;
  IsTaxInclusive?: boolean;
}

// Account Activity Summary Types (Mode 8)
export interface AccountActivitySummary {
  TransactionCount: number;
  VoucherCount: number;
  TotalDebits: number;
  TotalCredits: number;
  NetMovement: number;
  FirstTransactionDate?: string | Date;
  LastTransactionDate?: string | Date;
  UniqueCustomers: number;
  UniqueSuppliers: number;
}

export interface AccountActivityByVoucherType {
  VoucherType: string;
  TransactionCount: number;
  TotalDebits: number;
  TotalCredits: number;
  NetAmount: number;
}

export interface AccountActivityByMonth {
  Year: number;
  Month: number;
  MonthName: string;
  TransactionCount: number;
  TotalDebits: number;
  TotalCredits: number;
  NetMovement: number;
}

// Bank Reconciliation Types (Mode 9)
export interface BankReconciliationTransaction {
  PostingID: number;
  VoucherNo: string;
  VoucherType: string;
  PostingDate: string | Date;
  TransactionType: string;
  DebitAmount?: number;
  CreditAmount?: number;
  Description?: string;
  ChequeNo?: string;
  ChequeDate?: string | Date;
  Amount: number;

  // Tax-related fields (added from stored procedure modification)
  BaseAmount?: number;
  TaxID?: number;
  TaxCode?: string;
  TaxName?: string;
  TaxPercentage?: number;
  LineTaxAmount?: number;
  IsTaxInclusive?: boolean;
}

export interface BankReconciliationSummary {
  BookBalance: number;
  BankStatementBalance?: number;
  Difference: number;
  ReconciliationDate: string | Date;
}

// Aged Trial Balance Types (Mode 10)
export interface AgedTrialBalanceItem {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeName: string;
  Current_0_30: number;
  Days_31_60: number;
  Days_61_90: number;
  Days_91_120: number;
  Over_120: number;
  TotalBalance: number;
}

// Search and Request Parameters
export interface AccountLedgerParams {
  accountID: number;
  companyID?: number;
  fiscalYearID?: number;
  fromDate?: string | Date;
  toDate?: string | Date;
  postingDate?: string | Date;
  voucherType?: string;
  voucherNo?: string;
  postingStatus?: string;
  customerID?: number;
  supplierID?: number;
  isReversed?: boolean;
  includeOpeningBalances?: boolean;
  includeClosingBalances?: boolean;
}

export interface TrialBalanceParams {
  companyID: number;
  fiscalYearID: number;
  balanceAsOfDate?: string | Date;
  accountTypeID?: number;
  parentAccountID?: number;
  isActiveOnly?: boolean;
  showZeroBalances?: boolean;
}

export interface BalanceSheetParams {
  companyID: number;
  fiscalYearID: number;
  balanceAsOfDate?: string | Date;
  showZeroBalances?: boolean;
}

export interface IncomeStatementParams {
  companyID: number;
  fiscalYearID: number;
  fromDate?: string | Date;
  toDate?: string | Date;
  showZeroBalances?: boolean;
}

export interface ChartOfAccountsParams {
  companyID: number;
  fiscalYearID?: number;
  balanceAsOfDate?: string | Date;
  isActiveOnly?: boolean;
  isPostableOnly?: boolean;
  accountTypeID?: number;
  parentAccountID?: number;
  accountLevel?: number;
  searchText?: string;
  showZeroBalances?: boolean;
}

export interface GLSummaryParams {
  companyID: number;
  fiscalYearID?: number;
  fromDate?: string | Date;
  toDate?: string | Date;
  accountTypeID?: number;
}

export interface DetailedGLParams {
  companyID: number;
  fiscalYearID?: number;
  fromDate?: string | Date;
  toDate?: string | Date;
  accountID?: number;
  voucherType?: string;
  voucherNo?: string;
  postingStatus?: string;
  customerID?: number;
  supplierID?: number;
  isReversed?: boolean;
  searchText?: string;
}

export interface AccountActivityParams {
  accountID: number;
  fromDate?: string | Date;
  toDate?: string | Date;
}

export interface BankReconciliationParams {
  accountID: number;
  reconciliationDate: string | Date;
  fiscalYearID?: number;
  bankStatementBalance?: number;
}

export interface AgedTrialBalanceParams {
  companyID: number;
  balanceAsOfDate?: string | Date;
  showZeroBalances?: boolean;
}

// Combined response types for complex operations
export interface AccountLedgerResponse {
  accountInfo: AccountInfo;
  transactions: AccountLedgerTransaction[];
  summary: AccountLedgerSummary;
}

export interface TrialBalanceResponse {
  items: TrialBalanceItem[];
  totals: TrialBalanceTotals;
}

export interface BalanceSheetResponse {
  items: BalanceSheetItem[];
  categoryTotals: BalanceSheetCategoryTotal[];
}

export interface IncomeStatementResponse {
  items: IncomeStatementItem[];
  summary: IncomeStatementSummary[];
}

export interface AccountActivityResponse {
  summary: AccountActivitySummary;
  byVoucherType: AccountActivityByVoucherType[];
  byMonth?: AccountActivityByMonth[];
}

export interface BankReconciliationResponse {
  transactions: BankReconciliationTransaction[];
  summary: BankReconciliationSummary;
}

// API Response
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  [key: string]: any;
  data?: T;
}
