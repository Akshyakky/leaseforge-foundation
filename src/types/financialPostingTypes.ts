// src/types/financialPostingTypes.ts
export interface BaseEntity {
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

export interface Posting extends BaseEntity {
  PostingID: number;
  PostingNo: string;
  PostingType: string; // Invoice, Receipt, Journal, Payment, Petty Cash, Revenue, Reversal
  PostingDate: string | Date;
  TransactionDate: string | Date;
  FiscalYearID: number;
  ReferenceNo?: string;
  SourceType?: string; // Contract, Termination, Manual, etc.
  SourceID?: number; // ContractID, TerminationID, etc.
  AccountID: number;
  TotalDebit: number;
  TotalCredit: number;
  CurrencyID: number;
  ExchangeRate: number;
  Narration?: string;
  PostingStatus: string; // Draft, Posted, Reversed
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

export interface PostingDetail extends BaseEntity {
  PostingDetailID: number;
  PostingID: number;
  LineNo: number;
  AccountID: number;
  DebitAmount: number;
  CreditAmount: number;
  BaseDebitAmount: number;
  BaseCreditAmount: number;
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

export interface PostingAttachment extends BaseEntity {
  PostingAttachmentID: number;
  PostingID: number;
  DocTypeID: number;
  DocumentName: string;
  FilePath?: string;
  FileContent?: string | ArrayBuffer | null; // Base64 encoded string
  FileContentType?: string;
  FileSize?: number;
  DocIssueDate?: string | Date;
  DocExpiryDate?: string | Date;
  Remarks?: string;

  // Joined fields
  DocTypeName?: string;

  // For UI only - not sent to backend
  file?: File;
  fileUrl?: string; // For displaying preview
}

export interface PostingStatistics {
  typeCounts: { PostingType: string; PostingCount: number; PostedCount: number; ReversedCount: number; TotalAmount: number }[];
  dailyPostings: { PostingDate: string | Date; TotalAmount: number; PostingCount: number }[];
  topAccounts: { AccountID: number; AccountName: string; PostingCount: number; TotalDebits: number; TotalCredits: number }[];
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

// Financial reports
export interface GeneralLedgerEntry {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeName: string;
  PostingDate: string | Date;
  PostingNo: string;
  PostingType: string;
  ReferenceNo?: string;
  DebitAmount: number;
  CreditAmount: number;
  Narration?: string;
  PostingStatus: string;
  IsReversed: boolean;
}

export interface TrialBalanceEntry {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeName: string;
  Balance: number;
  TotalDebit: number;
  TotalCredit: number;
}

export interface ProfitLossEntry {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeName: string;
  TotalDebit: number;
  TotalCredit: number;
  NetAmount: number;
}

export interface BalanceSheetEntry {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeName: string;
  TotalDebit: number;
  TotalCredit: number;
  Balance: number;
}

// Request for creating/updating a posting with details and attachments
export interface PostingRequest {
  posting: Partial<Posting>;
  details?: Partial<PostingDetail>[];
  attachments?: Partial<PostingAttachment>[];
}

// API response
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewPostingID?: number;
  [key: string]: any;
  data?: T;
}
