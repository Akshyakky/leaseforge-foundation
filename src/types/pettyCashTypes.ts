// src/types/pettyCashTypes.ts

export interface BasePettyCash {
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
  DeletedBy?: string;
  DeletedOn?: string;
  RecordStatus?: boolean;
}

export interface PettyCashVoucher extends BasePettyCash {
  PostingID?: number;
  VoucherNo: string;
  VoucherType?: string;
  TransactionDate: string | Date;
  PostingDate?: string | Date;
  CompanyID: number;
  FiscalYearID: number;
  CurrencyID: number;
  ExchangeRate?: number;
  Description?: string;
  Narration?: string;
  PaidTo?: string;
  InvoiceNo?: string;
  RefNo?: string;
  ChequeNo?: string;
  ChequeDate?: string | Date;
  BankID?: number;
  SourceModule?: string;
  PostingStatus?: VoucherStatus;

  // Cost Center Parameters
  CostCenter1ID?: number;
  CostCenter2ID?: number;
  CostCenter3ID?: number;
  CostCenter4ID?: number;

  // Tax Parameters
  TaxID?: number;
  IsTaxInclusive?: boolean;

  // Additional fields from joins
  CompanyName?: string;
  FYDescription?: string;
  CurrencyName?: string;
  BankName?: string;
  CostCenter1Name?: string;
  CostCenter2Name?: string;
  CostCenter3Name?: string;
  CostCenter4Name?: string;

  // Calculated fields
  TotalDebit?: number;
  TotalCredit?: number;

  // Approval fields
  ApprovedBy?: number;
  ApprovedOn?: string;
  ApprovedByUserName?: string;

  // Reversal fields
  IsReversed?: boolean;
  ReversedBy?: number;
  ReversedOn?: string;
  ReversedByUserName?: string;
  ReversalReason?: string;
  ReversalPostingID?: number;
}

export interface PettyCashVoucherLine extends BasePettyCash {
  PostingID?: number;
  VoucherNo?: string;
  AccountID: number;
  TransactionType: TransactionType;
  DebitAmount: number;
  CreditAmount: number;
  BaseAmount?: number;
  TaxPercentage?: number;
  LineTaxAmount?: number;
  LineDescription?: string;

  // Line-specific cost centers (override voucher-level)
  LineCostCenter1ID?: number;
  LineCostCenter2ID?: number;
  LineCostCenter3ID?: number;
  LineCostCenter4ID?: number;

  // Customer/Supplier assignment
  CustomerID?: number;
  SupplierID?: number;

  // Currency conversion
  BaseCurrencyAmount?: number;

  // Additional fields from joins
  AccountCode?: string;
  AccountName?: string;
  CustomerFullName?: string;
  SupplierName?: string;
  CostCenter1Name?: string;
  CostCenter2Name?: string;
  CostCenter3Name?: string;
  CostCenter4Name?: string;
}

export interface PettyCashAttachment extends BasePettyCash {
  PostingAttachmentID: number;
  PostingID: number;
  DocTypeID: number;
  DocumentName: string;
  FilePath?: string;
  FileContent?: string | ArrayBuffer | null;
  FileContentType?: string;
  FileSize?: number;
  DocumentDescription?: string;
  UploadedDate?: string;
  UploadedByUserID?: number;
  IsRequired?: boolean;
  DisplayOrder?: number;

  // Additional fields from joins
  DocTypeName?: string;
  UploadedByUserName?: string;

  // For UI only - not sent to backend
  file?: File;
  fileUrl?: string;
}

// Enums and supporting types
export enum VoucherStatus {
  DRAFT = "Draft",
  PENDING = "Pending",
  POSTED = "Posted",
  REJECTED = "Rejected",
  REVERSED = "Reversed",
}

export enum TransactionType {
  DEBIT = "Debit",
  CREDIT = "Credit",
}

export enum ApprovalAction {
  APPROVE = "Approve",
  REJECT = "Reject",
}

// Request/Response types
export interface PettyCashVoucherRequest {
  voucher: Partial<PettyCashVoucher>;
  lines: Partial<PettyCashVoucherLine>[];
  attachments?: Partial<PettyCashAttachment>[];
}

export interface PettyCashVoucherResponse {
  voucher: PettyCashVoucher | null;
  lines: PettyCashVoucherLine[];
  attachments: PettyCashAttachment[];
}

export interface PettyCashSearchFilters {
  searchText?: string;
  dateFrom?: Date;
  dateTo?: Date;
  companyId?: number;
  fiscalYearId?: number;
  status?: VoucherStatus;
  accountId?: number;
}

export interface PettyCashSummaryReport {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  TotalDebits: number;
  TotalCredits: number;
  NetAmount: number;
  VoucherCount: number;
}

export interface AccountBalance {
  AccountID: number;
  AccountCode?: string;
  AccountName?: string;
  Balance: number;
  BalanceDate: Date;
}

export interface PettyCashStatistics {
  TotalVouchers: number;
  DraftVouchers: number;
  PendingVouchers: number;
  PostedVouchers: number;
  RejectedVouchers: number;
  TotalAmount: number;
  MonthlyTrend: {
    Month: string;
    Amount: number;
    Count: number;
  }[];
  AccountDistribution: {
    AccountName: string;
    Amount: number;
    Percentage: number;
  }[];
}

// API Response interfaces
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  [key: string]: any;
  data?: T;
}

export interface CreateVoucherResponse {
  success: boolean;
  message: string;
  voucherNo?: string;
  postingId?: number;
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
}

export interface ReversalResponse {
  success: boolean;
  message: string;
  reversalVoucherNo?: string;
}

export interface AttachmentResponse {
  success: boolean;
  message: string;
  attachmentId?: number;
}

export interface NextVoucherNumberResponse {
  success: boolean;
  message: string;
  nextVoucherNo?: string;
}

// Form validation schemas (for use with form libraries)
export interface PettyCashFormData {
  // Header information
  voucherNo?: string;
  transactionDate: Date;
  postingDate?: Date;
  companyId: number;
  fiscalYearId: number;
  currencyId: number;
  exchangeRate?: number;
  description?: string;
  narration?: string;
  paidTo?: string;
  invoiceNo?: string;
  refNo?: string;
  chequeNo?: string;
  chequeDate?: Date;
  bankId?: number;

  // Cost centers
  costCenter1Id?: number;
  costCenter2Id?: number;
  costCenter3Id?: number;
  costCenter4Id?: number;

  // Tax information
  taxId?: number;
  isTaxInclusive?: boolean;

  // Voucher lines
  lines: {
    accountId: number;
    transactionType: TransactionType;
    amount: number;
    description?: string;
    customerId?: number;
    supplierId?: number;
    taxPercentage?: number;
    lineCostCenter1Id?: number;
    lineCostCenter2Id?: number;
    lineCostCenter3Id?: number;
    lineCostCenter4Id?: number;
  }[];

  // Attachments
  attachments?: {
    docTypeId: number;
    documentName: string;
    file?: File;
    documentDescription?: string;
    isRequired?: boolean;
  }[];
}

// Error types
export interface PettyCashError {
  field?: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: PettyCashError[];
}

// Utility types
export type VoucherLineInput = Omit<PettyCashVoucherLine, "PostingID" | "VoucherNo" | keyof BasePettyCash>;
export type AttachmentInput = Omit<PettyCashAttachment, "PostingAttachmentID" | "PostingID" | "UploadedDate" | "UploadedByUserID" | keyof BasePettyCash>;
export type VoucherInput = Omit<PettyCashVoucher, "PostingID" | keyof BasePettyCash>;

// Export default types for common usage
export type PettyCashVoucherCreate = PettyCashVoucherRequest;
export type PettyCashVoucherUpdate = PettyCashVoucherRequest & { voucherNo: string };
export type PettyCashVoucherDetail = PettyCashVoucherResponse;
