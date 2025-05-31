// src/types/receiptTypes.ts - Updated to match stored procedure
export interface BaseReceipt {
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

export interface LeaseReceipt extends BaseReceipt {
  LeaseReceiptID: number;
  ReceiptNo: string;
  ReceiptDate: string | Date;
  LeaseInvoiceID?: number;
  CustomerID: number;
  CompanyID: number;
  FiscalYearID: number;
  PaymentType: string;
  PaymentStatus: string;
  ReceivedAmount: number;
  CurrencyID?: number;
  ExchangeRate?: number;
  BankID?: number;
  BankAccountNo?: string;
  ChequeNo?: string;
  ChequeDate?: string | Date;
  TransactionReference?: string;
  DepositedBankID?: number;
  DepositDate?: string | Date;
  ClearanceDate?: string | Date;
  IsAdvancePayment: boolean;
  SecurityDepositAmount?: number;
  PenaltyAmount?: number;
  DiscountAmount?: number;
  ReceivedByUserID?: number;
  AccountID?: number; // Cash/Bank account for the receipt
  IsPosted: boolean;
  PostingID?: number; // Main posting ID (DR leg)
  Notes?: string;

  // Joined fields from related tables
  CustomerFullName?: string;
  InvoiceNo?: string;
  CurrencyName?: string;
  BankName?: string;
  DepositedBankName?: string;
  ReceivedByUser?: string;
  CashBankAccountName?: string; // Account name for AccountID
  CompanyName?: string;
  FYDescription?: string;
}

export interface ReceiptStatistics {
  paymentTypeCounts: {
    PaymentType: string;
    ReceiptCount: number;
    TotalAmount: number;
  }[];
  postingStatusSummary: {
    IsPosted: boolean;
    ReceiptCount: number;
    TotalAmount: number;
  }[];
}

export interface UnpostedReceipt {
  LeaseReceiptID: number;
  ReceiptNo: string;
  ReceiptDate: string | Date;
  ReceivedAmount: number;
  PaymentType: string;
  CustomerFullName?: string;
  InvoiceNo?: string;
}

export interface ReceiptPosting {
  MainPostingID?: number;
  GLVoucherNo?: string;
  CustomerGLAccountID?: number;
  CashBankAccountID?: number;
}

export interface ReceiptReversal {
  ReversalGLVoucherNo?: string;
  OriginalVoucherNo?: string;
  ReversalReason: string;
}

// Search parameters
export interface ReceiptSearchParams {
  searchText?: string;
  filterCustomerID?: number;
  filterInvoiceID?: number;
  filterPaymentType?: string;
  filterPaymentStatus?: string;
  filterFromDate?: string | Date;
  filterToDate?: string | Date;
  filterCompanyID?: number;
  filterFiscalYearID?: number;
  filterIsPosted?: boolean;
}

// Request parameters for receipt operations
export interface ReceiptRequest {
  receipt: {
    ReceiptNo?: string;
    ReceiptDate: string | Date;
    LeaseInvoiceID?: number;
    CustomerID: number;
    CompanyID: number;
    FiscalYearID: number;
    PaymentType: string;
    PaymentStatus?: string;
    ReceivedAmount: number;
    CurrencyID?: number;
    ExchangeRate?: number;
    BankID?: number;
    BankAccountNo?: string;
    ChequeNo?: string;
    ChequeDate?: string | Date;
    TransactionReference?: string;
    DepositedBankID?: number;
    DepositDate?: string | Date;
    ClearanceDate?: string | Date;
    IsAdvancePayment?: boolean;
    SecurityDepositAmount?: number;
    PenaltyAmount?: number;
    DiscountAmount?: number;
    ReceivedByUserID?: number;
    AccountID?: number; // Cash/Bank account
    IsPosted?: boolean;
    PostingID?: number;
    Notes?: string;
  };
}

export interface ReceiptUpdateRequest {
  receipt: Partial<LeaseReceipt> & { LeaseReceiptID: number };
}

export interface ReceiptPostingRequest {
  LeaseReceiptID: number;
  ReversePosting?: boolean;
  ReversalReason?: string;
}

export interface ReceiptReversalRequest {
  LeaseReceiptID: number;
  ReversalReason: string;
}

export interface ReceiptStatisticsParams {
  filterCompanyID?: number;
  filterFiscalYearID?: number;
  filterFromDate?: string | Date;
  filterToDate?: string | Date;
}

// Payment types enum for better type safety
export enum PaymentType {
  CASH = "Cash",
  CHEQUE = "Cheque",
  BANK_TRANSFER = "Bank Transfer",
  CREDIT_CARD = "Credit Card",
  ONLINE_PAYMENT = "Online Payment",
  BANK_DRAFT = "Bank Draft",
}

// Payment status enum - Updated to match stored procedure
export enum PaymentStatus {
  RECEIVED = "Received",
  PENDING = "Pending",
  CLEARED = "Cleared",
  BOUNCED = "Bounced",
  CANCELLED = "Cancelled",
  DEPOSITED = "Deposited",
  PENDING_CLEARANCE = "Pending Clearance",
  REVERSED = "Reversed", // New status for reversed receipts
}

// API response interface
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewReceiptID?: number;
  MainPostingID?: number;
  PostingID?: number;
  GLVoucherNo?: string;
  ReversalGLVoucherNo?: string;
  VoucherNo?: string;
  [key: string]: any;
  data?: T;
}

// Receipt posting status constants
export const RECEIPT_POSTING_STATUS = {
  PENDING: false,
  POSTED: true,
} as const;

// Receipt validation rules
export interface ReceiptValidation {
  requiresBank: boolean;
  requiresChequeDetails: boolean;
  requiresTransactionRef: boolean;
  allowsAdvancePayment: boolean;
}

// Receipt type configurations
export const PAYMENT_TYPE_CONFIG: Record<PaymentType, ReceiptValidation> = {
  [PaymentType.CASH]: {
    requiresBank: false,
    requiresChequeDetails: false,
    requiresTransactionRef: false,
    allowsAdvancePayment: true,
  },
  [PaymentType.CHEQUE]: {
    requiresBank: true,
    requiresChequeDetails: true,
    requiresTransactionRef: false,
    allowsAdvancePayment: true,
  },
  [PaymentType.BANK_TRANSFER]: {
    requiresBank: true,
    requiresChequeDetails: false,
    requiresTransactionRef: true,
    allowsAdvancePayment: true,
  },
  [PaymentType.CREDIT_CARD]: {
    requiresBank: false,
    requiresChequeDetails: false,
    requiresTransactionRef: true,
    allowsAdvancePayment: true,
  },
  [PaymentType.ONLINE_PAYMENT]: {
    requiresBank: false,
    requiresChequeDetails: false,
    requiresTransactionRef: true,
    allowsAdvancePayment: true,
  },
  [PaymentType.BANK_DRAFT]: {
    requiresBank: true,
    requiresChequeDetails: true,
    requiresTransactionRef: false,
    allowsAdvancePayment: true,
  },
};

// Status transitions allowed for receipts
export const ALLOWED_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.RECEIVED]: [PaymentStatus.DEPOSITED, PaymentStatus.CLEARED, PaymentStatus.BOUNCED, PaymentStatus.CANCELLED],
  [PaymentStatus.PENDING]: [PaymentStatus.RECEIVED, PaymentStatus.CANCELLED],
  [PaymentStatus.DEPOSITED]: [PaymentStatus.CLEARED, PaymentStatus.BOUNCED, PaymentStatus.PENDING_CLEARANCE],
  [PaymentStatus.PENDING_CLEARANCE]: [PaymentStatus.CLEARED, PaymentStatus.BOUNCED],
  [PaymentStatus.CLEARED]: [
    PaymentStatus.BOUNCED, // In case of later discovery
  ],
  [PaymentStatus.BOUNCED]: [
    PaymentStatus.RECEIVED, // If re-submitted
  ],
  [PaymentStatus.CANCELLED]: [], // Terminal status
  [PaymentStatus.REVERSED]: [], // Terminal status
};
