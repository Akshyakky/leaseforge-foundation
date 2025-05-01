// src/types/financialPostingTypes.ts
export interface BasePosting {
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
  DeletedBy?: string;
  DeletedOn?: string;
  RecordStatus?: boolean;
}

export interface Posting extends BasePosting {
  PostingID: number;
  PostingNo: string;
  PostingType: string;
  PostingDate: string | Date;
  TransactionDate: string | Date;
  FiscalYearID: number;
  ReferenceNo?: string;
  SourceType?: string;
  SourceID?: number;
  AccountID: number;
  TotalDebit: number;
  TotalCredit: number;
  CurrencyID: number;
  ExchangeRate: number;
  Narration?: string;
  PostingStatus: string;
  IsReversed?: boolean;
  ReversalID?: number;
  ReversalReason?: string;
  ReversalDate?: string | Date;
  PostedBy?: number;
  PostedOn?: string | Date;
  CompanyID: number;
  CostCenter1ID?: number;
  CostCenter2ID?: number;
  CostCenter3ID?: number;
  CostCenter4ID?: number;

  // Joined fields
  AccountName?: string;
  CurrencyName?: string;
  FYDescription?: string;
  CompanyName?: string;
  PostedByName?: string;
  CostCenter1Name?: string;
  CostCenter2Name?: string;
  CostCenter3Name?: string;
  CostCenter4Name?: string;
}

export interface PostingDetail extends BasePosting {
  PostingDetailID: number;
  PostingID: number;
  LineNo: number;
  AccountID: number;
  DebitAmount: number;
  CreditAmount: number;
  BaseDebitAmount?: number;
  BaseCreditAmount?: number;
  Narration?: string;
  ReferenceNo?: string;
  ReferenceDate?: string | Date;
  CostCenter1ID?: number;
  CostCenter2ID?: number;
  CostCenter3ID?: number;
  CostCenter4ID?: number;
  CustomerID?: number;
  ContractID?: number;
  UnitID?: number;

  // Joined fields
  AccountName?: string;
  AccountCode?: string;
  CostCenter1Name?: string;
  CostCenter2Name?: string;
  CostCenter3Name?: string;
  CostCenter4Name?: string;
  CustomerFullName?: string;
  ContractNo?: string;
  UnitNo?: string;
  PropertyName?: string;
}

export interface PostingAttachment extends BasePosting {
  PostingAttachmentID: number;
  PostingID: number;
  DocTypeID: number;
  DocumentName: string;
  FilePath?: string;
  FileContent?: string | ArrayBuffer | null;
  FileContentType?: string;
  FileSize?: number;
  DocIssueDate?: string | Date;
  DocExpiryDate?: string | Date;
  Remarks?: string;

  // Joined fields
  DocTypeName?: string;

  // For UI only - not sent to backend
  file?: File;
  fileUrl?: string;
}

export interface PostingValidation {
  Status: number;
  Message: string;
  TotalDebit: number;
  TotalCredit: number;
  Difference: number;
}

export interface PostingStatistics {
  byType: {
    PostingType: string;
    PostingCount: number;
    PostedCount: number;
    ReversedCount: number;
    TotalAmount: number;
  }[];
  byDay: {
    PostingDate: string | Date;
    TotalAmount: number;
    PostingCount: number;
  }[];
  topAccounts: {
    AccountID: number;
    AccountName: string;
    PostingCount: number;
    TotalDebits: number;
    TotalCredits: number;
  }[];
}

export interface GeneralLedgerReport {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeName: string;
  PostingDate: string | Date;
  PostingNo: string;
  PostingType: string;
  ReferenceNo: string;
  DebitAmount: number;
  CreditAmount: number;
  Narration: string;
  PostingStatus: string;
  IsReversed: boolean;
}

export interface TrialBalanceReport {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeName: string;
  Balance: number;
  TotalDebit: number;
  TotalCredit: number;
}

export interface ProfitLossReport {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeName: string;
  TotalDebit: number;
  TotalCredit: number;
  NetAmount: number;
}

export interface BalanceSheetReport {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeName: string;
  TotalDebit: number;
  TotalCredit: number;
  Balance: number;
}

// Search parameters
export interface PostingSearchParams {
  searchText?: string;
  postingType?: string;
  postingStatus?: string;
  fromDate?: string | Date;
  toDate?: string | Date;
  sourceType?: string;
  sourceID?: number;
  accountID?: number;
  currencyID?: number;
  companyID?: number;
}

// API response
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewPostingID?: number;
  ReversalPostingID?: number;
  PostingID?: number;
  [key: string]: any;
  data?: T;
}
