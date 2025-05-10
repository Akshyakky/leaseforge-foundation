// src/types/accountTypes.ts
export interface BaseAccount {
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

export interface Account extends BaseAccount {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeID: number;
  ParentAccountID?: number;
  AccountLevel: number;
  CurrencyID: number;
  CashFlowCategoryID?: number;
  IsActive: boolean;
  IsPostable: boolean;
  CostCenter1ID?: number;
  CostCenter2ID?: number;
  CostCenter3ID?: number;
  CostCenter4ID?: number;
  CompanyID: number;
  Description?: string;

  // Joined fields
  AccountTypeName?: string;
  ParentAccountName?: string;
  CashFlowCategoryName?: string;
  CurrencyName?: string;
  CostCenter1Name?: string;
  CostCenter2Name?: string;
  CostCenter3Name?: string;
  CostCenter4Name?: string;
  CompanyName?: string;
}

export interface AccountType extends BaseAccount {
  AccountTypeID: number;
  AccountTypeCode: string;
  AccountTypeName: string;
  ParentAccountTypeID?: number;
  AccountLevel: number;
  IsActive: boolean;

  // Joined fields
  ParentAccountTypeName?: string;
  AccountCount?: number;
}

export interface AccountOpeningBalance extends BaseAccount {
  OpeningBalanceID: number;
  AccountID: number;
  FiscalYearID: number;
  OpeningDebit: number;
  OpeningCredit: number;
  OpeningBalance: number;
  CompanyID: number;

  // Joined fields
  FYCode?: string;
  FYDescription?: string;
  StartDate?: Date | string;
  EndDate?: Date | string;
}

export interface AccountTransaction {
  PostingDetailID: number;
  PostingID: number;
  PostingNo: string;
  PostingType: string;
  PostingDate: Date | string;
  ReferenceNo?: string;
  DebitAmount?: number;
  CreditAmount?: number;
  RunningBalance?: number;
  Narration?: string;
  SourceType?: string;
  SourceID?: number;
  CustomerID?: number;
  ContractID?: number;
  UnitID?: number;

  // Joined fields
  CustomerFullName?: string;
  ContractNo?: string;
  UnitNo?: string;
}

export interface AccountHierarchy {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeID: number;
  ParentAccountID?: number;
  AccountLevel: number;
  IsActive: boolean;
  IsPostable: boolean;
  HierarchyPath: string;
  HierarchyName: string;
  AccountTypeName?: string;
}

export interface AccountTypeHierarchy {
  AccountTypeID: number;
  AccountTypeCode: string;
  AccountTypeName: string;
  ParentAccountTypeID?: number;
  AccountLevel: number;
  IsActive: boolean;
  HierarchyPath: string;
  HierarchyName: string;
  AccountCount?: number;
}

export interface BalanceSheetItem {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeID: number;
  AccountLevel: number;
  AccountTypeName: string;
  OpeningBalance: number;
  TransactionBalance: number;
  CurrentBalance: number;
  DisplayOrder: number;
}

export interface IncomeStatementItem {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeID: number;
  AccountLevel: number;
  AccountTypeName: string;
  NetAmount: number;
  DisplayOrder: number;
}

export interface TrialBalanceItem {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeID: number;
  AccountTypeName: string;
  OpeningDebit: number;
  OpeningCredit: number;
  TransactionDebit: number;
  TransactionCredit: number;
  TotalDebit: number;
  TotalCredit: number;
  EndingDebit: number;
  EndingCredit: number;
}

export interface TrialBalanceSummary {
  TotalOpeningDebit: number;
  TotalOpeningCredit: number;
  TotalTransactionDebit: number;
  TotalTransactionCredit: number;
  GrandTotalDebit: number;
  GrandTotalCredit: number;
  TotalEndingDebit: number;
  TotalEndingCredit: number;
}

export interface IncomeSummary {
  Category: string;
  Total: number;
}

// Search parameters
export interface AccountSearchParams {
  searchText?: string;
  accountTypeID?: number;
  parentAccountID?: number;
  isActive?: boolean;
  isPostable?: boolean;
  cashFlowCategoryID?: number;
  companyID?: number;
}

// API response
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewAccountID?: number;
  NewAccountTypeID?: number;
  [key: string]: any;
  data?: T;
}
