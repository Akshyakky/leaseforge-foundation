// src/types/contractReceiptTypes.ts

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

// ========== Core Contract Receipt Types ==========

export interface ContractReceipt extends BaseEntity {
  LeaseReceiptID: number;
  ReceiptNo: string;
  ReceiptDate: string | Date;
  LeaseInvoiceID?: number;
  CustomerID: number;
  CompanyID: number;
  FiscalYearID: number;
  PaymentType: string; // 'Cash', 'Cheque', 'Bank Transfer', 'Credit Card', 'Online'
  PaymentStatus: string; // 'Received', 'Deposited', 'Cleared', 'Bounced', 'Cancelled', 'Reversed'
  ReceivedAmount: number;
  CurrencyID: number;
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

  // Approval fields
  ApprovalStatus: string; // 'Pending', 'Approved', 'Rejected', 'Not Required'
  RequiresApproval: boolean;
  ApprovalThreshold?: number;
  RejectedID?: number;
  RejectedBy?: string;
  RejectedOn?: string | Date;
  RejectionReason?: string;

  // Joined fields for display
  CustomerName?: string;
  CustomerNo?: string;
  CustomerTaxNo?: string;
  InvoiceNo?: string;
  InvoiceDate?: string | Date;
  InvoiceAmount?: number;
  InvoiceBalance?: number;
  ContractNo?: string;
  ContractID?: number;
  UnitNo?: string;
  UnitID?: number;
  PropertyName?: string;
  PropertyID?: number;
  CurrencyCode?: string;
  CurrencyName?: string;
  BankName?: string;
  SwiftCode?: string;
  DepositBankName?: string;
  ReceivedByUser?: string;
  CompanyName?: string;
  FiscalYear?: string;

  // Calculated fields
  PostingStatus?: string;
  DaysToDeposit?: number;
  RequiresDeposit?: boolean;
}

export interface ReceiptPosting extends BaseEntity {
  PostingID: number;
  VoucherNo: string;
  PostingDate: string | Date;
  TransactionType: string; // 'Debit' or 'Credit'
  DebitAmount: number;
  CreditAmount: number;
  Description: string;
  Narration: string;
  AccountCode: string;
  AccountName: string;
  IsReversed: boolean;
  ReversalReason?: string;
}

export interface InvoiceAllocation {
  LeaseInvoiceID: number;
  AllocationAmount: number;
  Notes?: string;
}

// ========== Request Types ==========

export interface ReceiptCreateRequest {
  CustomerID: number;
  CompanyID: number;
  FiscalYearID: number;
  ReceivedAmount: number;
  ReceiptDate?: string | Date;
  ReceiptNo?: string;
  LeaseInvoiceID?: number;
  PaymentType?: string;
  PaymentStatus?: string;
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
  AccountID?: number;
  Notes?: string;

  // Approval fields
  RequiresApproval?: boolean;
  ApprovalThreshold?: number;

  // Auto-posting options
  AutoPost?: boolean;
  PostingDate?: string | Date;
  DebitAccountID?: number;
  CreditAccountID?: number;
  PostingNarration?: string;
  PostingReference?: string;

  // Multiple invoice allocation
  AllocationMode?: "Single" | "Multiple" | "Proportional";
  InvoiceAllocations?: InvoiceAllocation[];
}

export interface ReceiptUpdateRequest {
  LeaseReceiptID: number;
  ReceiptNo?: string;
  ReceiptDate?: string | Date;
  LeaseInvoiceID?: number;
  PaymentType?: string;
  PaymentStatus?: string;
  ReceivedAmount?: number;
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
  AccountID?: number;
  Notes?: string;

  // Approval fields
  ApprovalStatus?: string;
  RequiresApproval?: boolean;
  ApprovalThreshold?: number;
}

export interface ReceiptAllocationRequest {
  LeaseReceiptID: number;
  LeaseInvoiceID?: number;
  ReceivedAmount?: number;
  InvoiceAllocations?: InvoiceAllocation[];
}

// ========== Approval Types ==========

export interface ReceiptApprovalRequest {
  LeaseReceiptID: number;
  Comments?: string;
}

export interface ReceiptRejectionRequest {
  LeaseReceiptID: number;
  RejectionReason: string;
}

export interface BulkApprovalRequest {
  SelectedReceiptIDs: number[];
  BulkOperation: "Approve" | "Reject";
  BulkApprovalComments?: string;
  BulkRejectionReason?: string;
}

// ========== Posting Types ==========

export interface ReceiptPostingRequest {
  LeaseReceiptID: number;
  PostingDate: string | Date;
  DebitAccountID: number;
  CreditAccountID: number;
  PostingNarration?: string;
  PostingReference?: string;
  ExchangeRate?: number;
}

export interface BulkReceiptPostingRequest {
  PostingDate: string | Date;
  CurrencyID?: number;
  ExchangeRate?: number;
  SelectedReceipts: SelectedReceiptForPosting[];
}

export interface SelectedReceiptForPosting {
  LeaseReceiptID: number;
  PostingAmount: number;
  DebitAccountID: number;
  CreditAccountID: number;
  Narration: string;
}

export interface PostingReversalRequest {
  PostingID?: number;
  LeaseReceiptID?: number;
  ReversalReason: string;
}

export interface UnpostedReceipt extends ContractReceipt {
  SuggestedNarration: string;
  IsEligibleForPosting: boolean;
  ValidationMessages?: string[];
}

// ========== Search and Filter Types ==========

export interface ReceiptSearchParams {
  searchText?: string;
  FilterPaymentStatus?: string;
  FilterPaymentType?: string;
  FilterApprovalStatus?: string;
  FilterPropertyID?: number;
  FilterUnitID?: number;
  FilterCustomerID?: number;
  FilterContractID?: number;
  FilterFromDate?: string | Date;
  FilterToDate?: string | Date;
  FilterDepositFromDate?: string | Date;
  FilterDepositToDate?: string | Date;
  FilterPostedOnly?: boolean;
  FilterUnpostedOnly?: boolean;
  FilterAdvanceOnly?: boolean;
  FilterPendingApprovalOnly?: boolean;
  FilterBankID?: number;
  FilterReceivedByUserID?: number;
  FilterAmountFrom?: number;
  FilterAmountTo?: number;
  CompanyID?: number;
  FiscalYearID?: number;
}

// ========== Bulk Operations Types ==========

export interface BulkReceiptOperation {
  LeaseReceiptID: number;
  Operation: "UpdateStatus" | "Deposit" | "Post" | "Approve" | "Reject";
  NewStatus?: string;
  DepositBankID?: number;
  DepositDate?: string | Date;
  PostingAmount?: number;
  DebitAccountID?: number;
  CreditAccountID?: number;
  Narration?: string;
}

export interface BulkOperationRequest {
  BulkOperation: string;
  SelectedReceipts: BulkReceiptOperation[];
  BulkPaymentStatus?: string;
  BulkDepositDate?: string | Date;
  BulkDepositBankID?: number;
  BulkApprovalComments?: string;
  BulkRejectionReason?: string;
}

// ========== Statistics and Reporting Types ==========

export interface ReceiptStatistics {
  statusCounts: {
    PaymentStatus: string;
    ReceiptCount: number;
    TotalAmount: number;
    AdvanceAmount: number;
    SecurityDepositTotal: number;
    PenaltyTotal: number;
  }[];
  approvalCounts: {
    ApprovalStatus: string;
    ReceiptCount: number;
    TotalAmount: number;
    AverageAmount: number;
  }[];
  paymentTypeCounts: {
    PaymentType: string;
    ReceiptCount: number;
    TotalAmount: number;
    AverageAmount: number;
  }[];
  monthlyTrends: {
    ReceiptYear: number;
    ReceiptMonth: number;
    ReceiptCount: number;
    TotalAmount: number;
    PostedAmount: number;
    UnpostedAmount: number;
  }[];
  pendingDeposits: {
    PendingDepositCount: number;
    PendingDepositAmount: number;
    AvgDaysWaiting: number;
  };
}

export interface ReceiptReportParams {
  ReportType: "Summary" | "Detailed" | "BankDeposit" | "Outstanding";
  GroupBy?: "Customer" | "Property" | "PaymentType" | "Bank" | "Date";
  FilterFromDate?: string | Date;
  FilterToDate?: string | Date;
  FilterCustomerID?: number;
  FilterPropertyID?: number;
  FilterBankID?: number;
  CompanyID?: number;
}

// ========== Dashboard Types ==========

export interface ReceiptDashboardData {
  totalReceipts: number;
  totalAmount: number;
  postedAmount: number;
  unpostedAmount: number;
  pendingApprovalAmount: number;
  rejectedAmount: number;
  advancePayments: number;
  securityDeposits: number;
  pendingDeposits: number;
  overdueDeposits: number;
  currentMonthReceived: number;
  recentReceipts: ContractReceipt[];
  pendingApprovalList: ContractReceipt[];
  pendingDepositList: ContractReceipt[];
  receiptTrends: {
    month: string;
    received: number;
    posted: number;
  }[];
}

// ========== Validation Types ==========

export interface ReceiptValidationResponse {
  IsValid: boolean;
  Errors: string[];
  Warnings: string[];
}

export interface PostingValidationResponse {
  IsValid: boolean;
  Errors: string[];
  Warnings: string[];
  ValidatedTransactions: SelectedReceiptForPosting[];
}

export interface AllocationValidationResponse {
  IsValid: boolean;
  Errors: string[];
  Warnings: string[];
  TotalAllocation: number;
  RemainingAmount: number;
}

// ========== Response Types ==========

export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewReceiptID?: number;
  ReceiptNo?: string;
  PostedCount?: number;
  FailedCount?: number;
  UpdatedCount?: number;
  TotalAmount?: number;
  TotalAllocated?: number;
  AllocatedAmount?: number;
  VoucherNo?: string;
  data?: T;
  [key: string]: any;
}

export interface ReceiptCreateResponse {
  Status: number;
  Message: string;
  NewReceiptID?: number;
  ReceiptNo?: string;
}

export interface PostingResponse {
  Status: number;
  Message: string;
  VoucherNo?: string;
  PostedCount?: number;
  FailedCount?: number;
  TotalPostedAmount?: number;
}

export interface BulkOperationResponse {
  Status: number;
  Message: string;
  UpdatedCount: number;
  FailedCount: number;
}

// ========== Dropdown/Reference Types ==========

export interface Bank {
  BankID: number;
  BankCode: string;
  BankName: string;
  SwiftCode?: string;
  CountryID?: number;
  IsActive: boolean;
}

export interface Account {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeID: number;
  IsActive: boolean;
  IsPostable: boolean;
}

export interface Currency {
  CurrencyID: number;
  CurrencyCode: string;
  CurrencyName: string;
  ConversionRate?: number;
  IsDefault: boolean;
}

export interface Customer {
  CustomerID: number;
  CustomerNo: string;
  CustomerFullName: string;
}

export interface Invoice {
  LeaseInvoiceID: number;
  InvoiceNo: string;
  InvoiceDate: string | Date;
  TotalAmount: number;
  BalanceAmount: number;
  CustomerID: number;
  ContractID: number;
}

export interface Property {
  PropertyID: number;
  PropertyNo: string;
  PropertyName: string;
}

export interface Unit {
  UnitID: number;
  UnitNo: string;
  PropertyID: number;
  PropertyName?: string;
}

export interface Company {
  CompanyID: number;
  CompanyName: string;
}

export interface FiscalYear {
  FiscalYearID: number;
  FYCode: string;
  FYDescription: string;
  StartDate: string | Date;
  EndDate: string | Date;
  IsActive: boolean;
  IsClosed: boolean;
}

export interface User {
  UserID: number;
  UserName: string;
  UserFullName: string;
}

// ========== Export/Import Types ==========

export interface ReceiptExportOptions {
  format: "CSV" | "Excel" | "PDF";
  includeHeaders: boolean;
  includePostings: boolean;
  dateFormat?: string;
}

export interface ReceiptImportData {
  CustomerID: number;
  ReceivedAmount: number;
  ReceiptDate: string | Date;
  PaymentType: string;
  TransactionReference?: string;
  LeaseInvoiceID?: number;
  Notes?: string;
}

// ========== Constants and Enums ==========

export const PAYMENT_TYPE = {
  CASH: "Cash",
  CHEQUE: "Cheque",
  BANK_TRANSFER: "Bank Transfer",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  ONLINE: "Online",
  MOBILE_PAYMENT: "Mobile Payment",
} as const;

export const PAYMENT_STATUS = {
  RECEIVED: "Received",
  DEPOSITED: "Deposited",
  CLEARED: "Cleared",
  BOUNCED: "Bounced",
  CANCELLED: "Cancelled",
  REVERSED: "Reversed",
  PENDING: "Pending",
} as const;

export const APPROVAL_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  NOT_REQUIRED: "Not Required",
} as const;

export const ALLOCATION_MODE = {
  SINGLE: "Single",
  MULTIPLE: "Multiple",
  PROPORTIONAL: "Proportional",
} as const;

export const BULK_OPERATION_TYPE = {
  UPDATE_STATUS: "UpdateStatus",
  DEPOSIT: "Deposit",
  POST: "Post",
  APPROVE: "Approve",
  REJECT: "Reject",
} as const;

export const REPORT_TYPE = {
  SUMMARY: "Summary",
  DETAILED: "Detailed",
  BANK_DEPOSIT: "BankDeposit",
  OUTSTANDING: "Outstanding",
} as const;

export const GROUP_BY_TYPE = {
  CUSTOMER: "Customer",
  PROPERTY: "Property",
  PAYMENT_TYPE: "PaymentType",
  BANK: "Bank",
  DATE: "Date",
} as const;

export const CONTRACT_RECEIPT_MODES = {
  CREATE_RECEIPT: 1,
  UPDATE_RECEIPT: 2,
  GET_ALL_RECEIPTS: 3,
  GET_RECEIPT_BY_ID: 4,
  DELETE_RECEIPT: 5,
  SEARCH_RECEIPTS: 6,
  CHANGE_RECEIPT_STATUS: 7,
  GET_RECEIPT_STATISTICS: 8,
  ALLOCATE_TO_INVOICE: 9,
  POST_RECEIPT: 10,
  REVERSE_POSTING: 11,
  GET_UNPOSTED_RECEIPTS: 12,
  ALLOCATE_TO_MULTIPLE_INVOICES: 13,
  GET_RECEIPTS_BY_CUSTOMER: 14,
  GET_RECEIPTS_BY_INVOICE: 15,
  BULK_UPDATE_RECEIPTS: 16,
  GET_RECEIPT_REPORTS: 17,
  APPROVE_RECEIPT: 18,
  REJECT_RECEIPT: 19,
  RESET_APPROVAL_STATUS: 20,
  GET_RECEIPTS_PENDING_APPROVAL: 21,
} as const;

export type PaymentType = (typeof PAYMENT_TYPE)[keyof typeof PAYMENT_TYPE];
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export type ApprovalStatus = (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];
export type AllocationMode = (typeof ALLOCATION_MODE)[keyof typeof ALLOCATION_MODE];
export type BulkOperationType = (typeof BULK_OPERATION_TYPE)[keyof typeof BULK_OPERATION_TYPE];
export type ReportType = (typeof REPORT_TYPE)[keyof typeof REPORT_TYPE];
export type GroupByType = (typeof GROUP_BY_TYPE)[keyof typeof GROUP_BY_TYPE];
export type ContractReceiptMode = (typeof CONTRACT_RECEIPT_MODES)[keyof typeof CONTRACT_RECEIPT_MODES];

// ========== Utility Types ==========

export interface ReceiptSummary {
  CustomerID: number;
  CustomerName: string;
  TotalReceipts: number;
  TotalAmount: number;
  LastReceiptDate: string | Date;
  OutstandingAmount: number;
}

export interface BankDepositSummary {
  DepositDate: string | Date;
  BankName: string;
  ReceiptCount: number;
  TotalDepositAmount: number;
  EarliestReceiptDate: string | Date;
  LatestReceiptDate: string | Date;
  AvgDaysToDeposit: number;
}

export interface OutstandingDepositItem {
  LeaseReceiptID: number;
  ReceiptNo: string;
  ReceiptDate: string | Date;
  ReceivedAmount: number;
  PaymentType: string;
  CustomerName: string;
  BankName?: string;
  ChequeNo?: string;
  TransactionReference?: string;
  DaysOutstanding: number;
  Status: "Current" | "Due Soon" | "Overdue";
}

export interface ReceiptAging {
  CustomerID: number;
  CustomerName: string;
  Current: number; // 0-30 days
  Days31To60: number;
  Days61To90: number;
  Over90Days: number;
  TotalOutstanding: number;
}
