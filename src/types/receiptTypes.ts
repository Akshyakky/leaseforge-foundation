// src/types/receiptTypes.ts
export interface BaseReceipt {
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
  AccountID?: number;
  IsPosted: boolean;
  PostingID?: number;
  Notes?: string;

  // Joined fields from related tables
  CustomerFullName?: string;
  InvoiceNo?: string;
  CurrencyName?: string;
  BankName?: string;
  DepositedBankName?: string;
  ReceivedByUser?: string;
  AccountName?: string;
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
  PostingID?: number;
  VoucherNo?: string;
  CustomerGLAccountID?: number;
  CashBankAccountID?: number;
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
  receipt: Partial<LeaseReceipt>;
}

export interface ReceiptUpdateRequest {
  receipt: Partial<LeaseReceipt> & { LeaseReceiptID: number };
}

export interface ReceiptPostingRequest {
  LeaseReceiptID: number;
  reversePosting?: boolean;
  reversalReason?: string;
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

// Payment status enum
export enum PaymentStatus {
  RECEIVED = "Received",
  PENDING = "Pending",
  CLEARED = "Cleared",
  BOUNCED = "Bounced",
  CANCELLED = "Cancelled",
  DEPOSITED = "Deposited",
}

// API response
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewReceiptID?: number;
  PostingID?: number;
  VoucherNo?: string;
  [key: string]: any;
  data?: T;
}
