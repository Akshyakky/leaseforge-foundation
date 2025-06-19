// src/types/leaseRevenuePostingTypes.ts

export interface BaseLeaseRevenue {
  CreatedID?: number;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedID?: number;
  UpdatedBy?: string;
  UpdatedOn?: string;
  DeletedBy?: string;
  DeletedOn?: string;
  RecordStatus?: number;
}

/**
 * Interface for unposted lease revenue transactions
 */
export interface LeaseRevenueTransaction extends BaseLeaseRevenue {
  TransactionType: "Invoice" | "Receipt";
  TransactionID: number;
  TransactionNo: string;
  TransactionDate: string | Date;
  Property: string;
  UnitNo: string;
  CustomerName: string;
  PostingAmount: number;
  BalanceAmount: number;
  BalanceNarration: string;
  StartDate: string | Date;
  EndDate: string | Date;
  TotalLeaseDays: number;
  ContractValue: number;
  RentPerDay: number;
  DaysToCalculate: number;
  PostedAmountDebit: number;
  PostedAmountCredit: number;
  IsPosted: boolean;
  CompanyID: number;
  FiscalYearID: number;
  CustomerID: number;
  ContractID?: number;
  UnitID?: number;
  PropertyID?: number;
  CurrencyID: number;
}

/**
 * Interface for posted lease revenue transactions
 */
export interface PostedLeaseRevenueTransaction extends BaseLeaseRevenue {
  PostingID: number;
  VoucherNo: string;
  VoucherType: string;
  PostingDate: string | Date;
  TransactionDate: string | Date;
  TransactionType: "LeaseInvoice" | "LeaseReceipt";
  TransactionID: number;
  TransactionNo: string;
  CustomerID: number;
  CustomerName: string;
  Property: string;
  UnitNo: string;
  DebitAmount: number;
  CreditAmount: number;
  BalanceNarration: string;
  DebitAccountCode: string;
  DebitAccountName: string;
  CreditAccountCode: string;
  CreditAccountName: string;
  IsReversed: boolean;
  ReversalReason?: string;

  // Approval workflow fields
  ApprovalStatus?: ApprovalStatus;
  RequiresApproval?: boolean;
  ApprovalComments?: string;
  ApprovedBy?: number;
  ApprovedOn?: string | Date;
  RejectedBy?: number;
  RejectedOn?: string | Date;
  RejectionReason?: string;
  ApprovedByName?: string;
  RejectedByName?: string;

  CompanyID: number;
  FiscalYearID: number;
  PostingStatus: PostingStatus;
}

/**
 * Interface for transaction selection in bulk posting
 */
export interface SelectedTransaction {
  TransactionType: "Invoice" | "Receipt";
  TransactionID: number;
  PostingAmount: number;
  DebitAccountID: number;
  CreditAccountID: number;
  Narration: string;
}

/**
 * Interface for transaction details
 */
export interface LeaseTransactionDetails extends BaseLeaseRevenue {
  TransactionType: "Invoice" | "Receipt";
  TransactionID: number;
  TransactionNo: string;
  TransactionDate: string | Date;
  DueDate?: string | Date;
  CustomerID: number;
  CustomerName: string;
  ContractID?: number;
  ContractNo?: string;
  UnitID?: number;
  UnitNo?: string;
  PropertyID?: number;
  PropertyName?: string;
  InvoiceType?: string;
  InvoiceStatus?: string;
  PeriodFromDate?: string | Date;
  PeriodToDate?: string | Date;
  SubTotal: number;
  TaxAmount: number;
  DiscountAmount: number;
  TotalAmount: number;
  PaidAmount: number;
  BalanceAmount: number;
  CurrencyID: number;
  CurrencyName: string;
  ExchangeRate?: number;
  RentPerMonth?: number;
  LeaseStartDate?: string | Date;
  LeaseEndDate?: string | Date;
  IsPosted: boolean;
}

/**
 * Interface for posting summary report
 */
export interface PostingSummary {
  PostingDate: string | Date;
  TransactionCount: number;
  TotalDebitAmount: number;
  TotalCreditAmount: number;
  InvoiceCount: number;
  ReceiptCount: number;
  ApprovalStatus: ApprovalStatus;
  CompanyID: number;
  FiscalYearID: number;
}

/**
 * Interface for filter parameters
 */
export interface LeaseRevenueFilters {
  PropertyID?: number;
  UnitID?: number;
  CompanyID?: number;
  FiscalYearID?: number;
  PeriodFromDate?: Date;
  PeriodToDate?: Date;
  PostingFromDate?: Date;
  PostingToDate?: Date;
  CustomerID?: number;
  ContractID?: number;
  IncludePMUnits?: boolean;
  ShowUnpostedOnly?: boolean;
  ShowPostedOnly?: boolean;
  FilterApprovalStatus?: ApprovalStatus;
}

/**
 * Interface for posting request parameters
 */
export interface PostingRequest {
  PostingDate: Date;
  DebitAccountID?: number;
  CreditAccountID?: number;
  Narration?: string;
  ReferenceNo?: string;
  CurrencyID?: number;
  ExchangeRate?: number;
  CompanyID: number;
  FiscalYearID: number;
  ApprovalStatus?: ApprovalStatus;
  RequiresApproval?: boolean;
  ApprovalComments?: string;
  SelectedTransactions: SelectedTransaction[];
  CurrentUserID?: number;
  CurrentUserName?: string;
}

/**
 * Interface for reversal request parameters
 */
export interface ReversalRequest {
  PostingID: number;
  ReversalReason: string;
  CurrentUserID?: number;
  CurrentUserName?: string;
}

/**
 * Interface for approval request parameters
 */
export interface ApprovalRequest {
  PostingID: number;
  ApprovalAction: ApprovalAction;
  ApprovalComments?: string;
  RejectionReason?: string;
  CurrentUserID?: number;
  CurrentUserName?: string;
}

/**
 * Interface for posting response
 */
export interface PostingResponse {
  success: boolean;
  message: string;
  PostedCount?: number;
  FailedCount?: number;
  TotalAmount?: number;
}

/**
 * Interface for approval response
 */
export interface ApprovalResponse {
  success: boolean;
  message: string;
}

/**
 * Interface for account information (for dropdowns)
 */
export interface Account {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeID: number;
  IsActive: boolean;
  IsPostable: boolean;
}

/**
 * Interface for property information (for dropdowns)
 */
export interface Property {
  PropertyID: number;
  PropertyNo: string;
  PropertyName: string;
}

/**
 * Interface for unit information (for dropdowns)
 */
export interface Unit {
  UnitID: number;
  UnitNo: string;
  PropertyID: number;
  PropertyName?: string;
}

/**
 * Interface for customer information (for dropdowns)
 */
export interface Customer {
  CustomerID: number;
  CustomerNo: string;
  CustomerFullName: string;
}

/**
 * Interface for company information (for dropdowns)
 */
export interface Company {
  CompanyID: number;
  CompanyName: string;
}

/**
 * Interface for fiscal year information (for dropdowns)
 */
export interface FiscalYear {
  FiscalYearID: number;
  FYCode: string;
  FYDescription: string;
  StartDate: string | Date;
  EndDate: string | Date;
  IsActive: boolean;
  IsClosed: boolean;
}

/**
 * Interface for currency information (for dropdowns)
 */
export interface Currency {
  CurrencyID: number;
  CurrencyCode: string;
  CurrencyName: string;
  ConversionRate?: number;
  IsDefault: boolean;
}

/**
 * Interface for API response structure
 */
export interface LeaseRevenueApiResponse<T = any> {
  Status: number;
  Message: string;
  data?: T;
  table1?: any[];
  table2?: any[];
  table3?: any[];
  [key: string]: any;
}

/**
 * Interface for statistics and dashboard data
 */
export interface LeaseRevenueStatistics {
  TotalUnpostedTransactions: number;
  TotalUnpostedAmount: number;
  TotalPostedTransactions: number;
  TotalPostedAmount: number;
  PendingApprovalTransactions: number;
  PendingApprovalAmount: number;
  TransactionsByType: {
    TransactionType: string;
    Count: number;
    Amount: number;
  }[];
  PostingsByDate: {
    PostingDate: string;
    Count: number;
    Amount: number;
  }[];
  ApprovalsByStatus: {
    ApprovalStatus: string;
    Count: number;
    Amount: number;
  }[];
}

/**
 * Interface for bulk posting status
 */
export interface BulkPostingStatus {
  TransactionID: number;
  TransactionType: string;
  TransactionNo: string;
  Status: "Success" | "Failed";
  Message: string;
  PostingID?: number;
}

/**
 * Interface for validation response
 */
export interface ValidationResponse {
  IsValid: boolean;
  Errors: string[];
  Warnings: string[];
}

/**
 * Interface for detailed error information
 */
export interface PostingError {
  TransactionID: number;
  TransactionType: string;
  ErrorCode: string;
  ErrorMessage: string;
  FieldName?: string;
}

/**
 * Interface for audit trail information
 */
export interface AuditTrail {
  Action: string;
  ActionDate: string | Date;
  ActionBy: string;
  Description: string;
  OldValues?: Record<string, any>;
  NewValues?: Record<string, any>;
}

/**
 * Interface for pending approval items
 */
export interface PendingApprovalItem {
  VoucherNo: string;
  PostingDate: string | Date;
  TransactionDate: string | Date;
  TransactionType: "LeaseInvoice" | "LeaseReceipt";
  TransactionID: number;
  TransactionNo: string;
  CustomerID: number;
  CustomerName: string;
  Property: string;
  UnitNo: string;
  TotalDebitAmount: number;
  TotalCreditAmount: number;
  ApprovalStatus: ApprovalStatus;
  RequiresApproval: boolean;
  CompanyID: number;
  FiscalYearID: number;
  CreatedBy: string;
  CreatedOn: string | Date;
}

// Enums and supporting types
export enum PostingStatus {
  DRAFT = "Draft",
  POSTED = "Posted",
  REVERSED = "Reversed",
  ERROR = "Error",
}

export enum ApprovalStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
}

export enum ApprovalAction {
  APPROVE = "Approve",
  REJECT = "Reject",
}

export enum TransactionStatus {
  ACTIVE = "Active",
  APPROVED = "Approved",
  CANCELLED = "Cancelled",
  EXPIRED = "Expired",
}

export enum PaymentStatus {
  PENDING = "Pending",
  CLEARED = "Cleared",
  DEPOSITED = "Deposited",
  CANCELLED = "Cancelled",
}

/**
 * Type definitions for mode parameters
 */
export const LEASE_REVENUE_MODES = {
  GET_UNPOSTED_TRANSACTIONS: 1,
  GET_POSTED_TRANSACTIONS: 2,
  POST_SELECTED_TRANSACTIONS: 3,
  REVERSE_TRANSACTION: 4,
  GET_TRANSACTION_DETAILS: 5,
  GET_POSTING_SUMMARY: 6,
  APPROVE_REJECT_POSTING: 7,
  GET_PENDING_APPROVALS: 8,
  RESET_APPROVAL_STATUS: 9,
} as const;

export type LeaseRevenueMode = (typeof LEASE_REVENUE_MODES)[keyof typeof LEASE_REVENUE_MODES];

// Form validation schemas
export interface LeaseRevenuePostingFormData {
  postingDate: Date;
  debitAccountId?: number;
  creditAccountId?: number;
  narration?: string;
  referenceNo?: string;
  currencyId?: number;
  exchangeRate?: number;
  companyId: number;
  fiscalYearId: number;
  selectedTransactions: {
    transactionType: "Invoice" | "Receipt";
    transactionId: number;
    postingAmount: number;
    debitAccountId: number;
    creditAccountId: number;
    narration: string;
  }[];
}

// Error types
export interface LeaseRevenuePostingError {
  field?: string;
  message: string;
  code?: string;
}

export interface LeaseValidationResult {
  isValid: boolean;
  errors: LeaseRevenuePostingError[];
}

// Utility types
export type LeaseRevenueTransactionInput = Omit<LeaseRevenueTransaction, keyof BaseLeaseRevenue>;
export type PostedLeaseRevenueTransactionInput = Omit<PostedLeaseRevenueTransaction, keyof BaseLeaseRevenue>;
export type LeaseTransactionDetailsInput = Omit<LeaseTransactionDetails, keyof BaseLeaseRevenue>;

// Export default types for common usage
export type LeaseRevenuePostingCreate = PostingRequest;
export type LeaseRevenuePostingApproval = ApprovalRequest;
export type LeaseRevenuePostingReversal = ReversalRequest;
