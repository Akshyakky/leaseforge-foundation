// src/types/paymentVoucherTypes.ts
export interface BasePaymentVoucher {
  CreatedBy?: string;
  CreatedOn?: string | Date;
  CreatedID?: number;
  UpdatedBy?: string;
  UpdatedOn?: string | Date;
  UpdatedID?: number;
  DeletedBy?: string;
  DeletedOn?: string | Date;
  DeletedID?: number;
  RecordStatus?: number;
}

export interface PaymentVoucher extends BasePaymentVoucher {
  PostingID?: number;
  VoucherNo: string;
  TransactionDate: string | Date;
  PostingDate: string | Date;
  CompanyID: number;
  FiscalYearID: number;
  SupplierID?: number;
  PaymentType: PaymentType;
  PaymentStatus: PaymentStatus;
  TotalAmount: number;
  CurrencyID?: number;
  ExchangeRate?: number;
  BaseCurrencyAmount?: number;

  // Bank/Cheque Details
  BankID?: number;
  BankAccountNo?: string;
  ChequeNo?: string;
  ChequeDate?: string | Date;
  TransactionReference?: string;

  // GL Account Details
  BankAccountID?: number; // Credit account (bank/cash account)
  PayableAccountID?: number; // Debit account (supplier payable account)

  // Description and Notes
  Description?: string;
  Narration?: string;
  InternalNotes?: string;

  // Cost Center Information
  CostCenter1ID?: number;
  CostCenter2ID?: number;
  CostCenter3ID?: number;
  CostCenter4ID?: number;

  // Tax Information
  TaxID?: number;
  TaxPercentage?: number;
  TaxAmount?: number;
  IsTaxInclusive?: boolean;
  BaseAmount?: number;

  // Reference Information
  ReferenceType?: string; // 'Invoice', 'Advance', 'Expense', 'Other'
  ReferenceID?: number;
  ReferenceNo?: string;

  // Approval Workflow
  ApprovedBy?: number;
  ApprovedOn?: string | Date;
  RequiresApproval?: boolean;

  // Additional Parameters
  AutoPostToGL?: boolean;
  IsRecurring?: boolean;
  RecurrencePattern?: string;

  // Joined fields from related tables
  SupplierName?: string;
  CompanyName?: string;
  CurrencyName?: string;
  BankName?: string;
  FYDescription?: string;
  BankAccountName?: string;
  PayableAccountName?: string;
  TaxName?: string;
  ApprovedByUserName?: string;
}

export interface PaymentVoucherLine extends BasePaymentVoucher {
  PostingID: number;
  Line_No?: number;
  AccountID: number;
  Description?: string;
  DebitAmount: number;
  CreditAmount: number;
  TaxID?: number;
  TaxPercentage?: number;
  TaxAmount?: number;
  BaseAmount?: number;
  CostCenter1ID?: number;
  CostCenter2ID?: number;
  CostCenter3ID?: number;
  CostCenter4ID?: number;

  // Joined fields
  AccountCode?: string;
  AccountName?: string;
  TransactionType?: string;
  TaxName?: string;
  CostCenter1Name?: string;
  CostCenter2Name?: string;
  CostCenter3Name?: string;
  CostCenter4Name?: string;
}

export interface PaymentVoucherAttachment extends BasePaymentVoucher {
  PostingAttachmentID: number;
  PostingID: number;
  DocTypeID: number;
  DocumentName: string;
  FilePath?: string;
  FileContent?: string | ArrayBuffer | null; // Base64 encoded string
  FileContentType?: string;
  FileSize?: number;
  DocumentDescription?: string;
  IsRequired?: boolean;
  DisplayOrder?: number;
  UploadedDate?: string | Date;
  UploadedByUserID?: number;

  // Joined fields
  DocTypeName?: string;

  // For UI only - not sent to backend
  file?: File;
  fileUrl?: string; // For displaying preview
}

export interface PaymentVoucherStatistics {
  statusCounts: {
    PaymentStatus: string;
    VoucherCount: number;
    TotalAmount: number;
  }[];
  paymentTypeCounts: {
    PaymentType: string;
    VoucherCount: number;
    TotalAmount: number;
  }[];
  supplierCounts: {
    SupplierID: number;
    SupplierName: string;
    VoucherCount: number;
    TotalAmount: number;
  }[];
  companyCounts: {
    CompanyID: number;
    CompanyName: string;
    VoucherCount: number;
    TotalAmount: number;
  }[];
}

export interface PaymentVoucherSummaryReport {
  CompanyID: number;
  CompanyName: string;
  PostingStatus: string;
  VoucherCount: number;
  TotalAmount: number;
  AverageAmount: number;
}

// Search parameters
export interface PaymentVoucherSearchParams {
  searchText?: string;
  filterSupplierID?: number;
  filterBankID?: number;
  filterPaymentType?: string;
  filterPaymentStatus?: string;
  filterCompanyID?: number;
  filterFiscalYearID?: number;
  dateFrom?: string | Date;
  dateTo?: string | Date;
}

// Request parameters for payment voucher operations
export interface PaymentVoucherRequest {
  voucher: Partial<PaymentVoucher>;
  paymentLines?: Partial<PaymentVoucherLine>[];
  attachments?: Partial<PaymentVoucherAttachment>[];
}

export interface PaymentVoucherUpdateRequest {
  voucher: Partial<PaymentVoucher> & { VoucherNo: string };
  paymentLines?: Partial<PaymentVoucherLine>[];
  attachments?: Partial<PaymentVoucherAttachment>[];
}

export interface PaymentVoucherApprovalRequest {
  VoucherNo: string;
  ApprovedBy?: number;
  ApprovedOn?: string | Date;
}

export interface PaymentVoucherPostingRequest {
  VoucherNo: string;
  AutoPostToGL?: boolean;
}

export interface PaymentVoucherReversalRequest {
  VoucherNo: string;
  ReversalReason?: string;
}

export interface PaymentVoucherAttachmentRequest {
  VoucherNo?: string;
  PostingAttachmentID?: number;
  DocTypeID: number;
  DocumentName: string;
  FilePath?: string;
  FileContent?: string | ArrayBuffer | null;
  FileContentType?: string;
  FileSize?: number;
  DocumentDescription?: string;
  IsRequired?: boolean;
  DisplayOrder?: number;
}

// Payment types enum
export enum PaymentType {
  CASH = "Cash",
  CHEQUE = "Cheque",
  BANK_TRANSFER = "Bank Transfer",
  CREDIT_CARD = "Credit Card",
  ONLINE_PAYMENT = "Online Payment",
}

// Payment status enum
export enum PaymentStatus {
  DRAFT = "Draft",
  PENDING = "Pending",
  APPROVED = "Approved",
  POSTED = "Posted",
  CANCELLED = "Cancelled",
}

// Reference types enum
export enum ReferenceType {
  INVOICE = "Invoice",
  ADVANCE = "Advance",
  EXPENSE = "Expense",
  OTHER = "Other",
}

// API response interface
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  VoucherNo?: string;
  PostingID?: number;
  NewPostingID?: number;
  AttachmentID?: number;
  NewAttachmentID?: number;
  ReversalVoucherNo?: string;
  [key: string]: any;
  data?: T;
}

// Payment voucher status constants
export const PAYMENT_VOUCHER_STATUS = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
  POSTED: "Posted",
  CANCELLED: "Cancelled",
} as const;

// Payment type constants
export const PAYMENT_TYPE = {
  CASH: "Cash",
  CHEQUE: "Cheque",
  BANK_TRANSFER: "Bank Transfer",
  CREDIT_CARD: "Credit Card",
  ONLINE_PAYMENT: "Online Payment",
} as const;

// Reference type constants
export const REFERENCE_TYPE = {
  INVOICE: "Invoice",
  ADVANCE: "Advance",
  EXPENSE: "Expense",
  OTHER: "Other",
} as const;

// Validation rules for payment vouchers
export interface PaymentVoucherValidation {
  requiresSupplier: boolean;
  requiresBankDetails: boolean;
  requiresChequeDetails: boolean;
  requiresApproval: boolean;
  allowsMultipleLines: boolean;
}

// Payment type configurations
export const PAYMENT_TYPE_CONFIG: Record<PaymentType, PaymentVoucherValidation> = {
  [PaymentType.CASH]: {
    requiresSupplier: true,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    requiresApproval: true,
    allowsMultipleLines: true,
  },
  [PaymentType.CHEQUE]: {
    requiresSupplier: true,
    requiresBankDetails: true,
    requiresChequeDetails: true,
    requiresApproval: true,
    allowsMultipleLines: true,
  },
  [PaymentType.BANK_TRANSFER]: {
    requiresSupplier: true,
    requiresBankDetails: true,
    requiresChequeDetails: false,
    requiresApproval: true,
    allowsMultipleLines: true,
  },
  [PaymentType.CREDIT_CARD]: {
    requiresSupplier: true,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    requiresApproval: true,
    allowsMultipleLines: true,
  },
  [PaymentType.ONLINE_PAYMENT]: {
    requiresSupplier: true,
    requiresBankDetails: false,
    requiresChequeDetails: false,
    requiresApproval: true,
    allowsMultipleLines: true,
  },
};

// Status transitions allowed for payment vouchers
export const ALLOWED_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.DRAFT]: [PaymentStatus.PENDING, PaymentStatus.CANCELLED],
  [PaymentStatus.PENDING]: [PaymentStatus.APPROVED, PaymentStatus.CANCELLED, PaymentStatus.DRAFT],
  [PaymentStatus.APPROVED]: [PaymentStatus.POSTED, PaymentStatus.CANCELLED],
  [PaymentStatus.POSTED]: [], // Terminal status (can only be reversed)
  [PaymentStatus.CANCELLED]: [], // Terminal status
};

// Utility type guards
export function isDraftVoucher(voucher: PaymentVoucher): boolean {
  return voucher.PaymentStatus === PaymentStatus.DRAFT;
}

export function isApprovedVoucher(voucher: PaymentVoucher): boolean {
  return voucher.PaymentStatus === PaymentStatus.APPROVED;
}

export function isPostedVoucher(voucher: PaymentVoucher): boolean {
  return voucher.PaymentStatus === PaymentStatus.POSTED;
}

export function canEditVoucher(voucher: PaymentVoucher): boolean {
  return voucher.PaymentStatus === PaymentStatus.DRAFT || voucher.PaymentStatus === PaymentStatus.PENDING;
}

export function canApproveVoucher(voucher: PaymentVoucher): boolean {
  return voucher.PaymentStatus === PaymentStatus.PENDING;
}

export function canPostVoucher(voucher: PaymentVoucher): boolean {
  return voucher.PaymentStatus === PaymentStatus.APPROVED;
}

export function canReverseVoucher(voucher: PaymentVoucher): boolean {
  return voucher.PaymentStatus === PaymentStatus.POSTED;
}

export function requiresChequeDetails(paymentType: PaymentType): boolean {
  return PAYMENT_TYPE_CONFIG[paymentType]?.requiresChequeDetails || false;
}

export function requiresBankDetails(paymentType: PaymentType): boolean {
  return PAYMENT_TYPE_CONFIG[paymentType]?.requiresBankDetails || false;
}

// Enhanced types for specific payment voucher views
export interface PaymentVoucherListItem extends PaymentVoucher {
  // Additional computed properties for list display
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  canPost?: boolean;
  canReverse?: boolean;
  displayStatus?: string;
  lineCount?: number;
  attachmentCount?: number;
}

export interface PaymentVoucherSummary {
  totalVouchers: number;
  totalAmount: number;
  draftCount: number;
  draftAmount: number;
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  postedCount: number;
  postedAmount: number;
  cancelledCount: number;
  cancelledAmount: number;
}
