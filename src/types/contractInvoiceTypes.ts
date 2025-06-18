// src/types/contractInvoiceTypes.ts - Updated with Approval Features

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

// ========== Core Contract Invoice Types ==========

export interface ContractInvoice extends BaseEntity {
  LeaseInvoiceID: number;
  InvoiceNo: string;
  InvoiceDate: string | Date;
  DueDate: string | Date;
  ContractID: number;
  ContractUnitID: number;
  CustomerID: number;
  CompanyID: number;
  FiscalYearID: number;
  InvoiceType: string; // 'Rent', 'Security Deposit', 'Admin Fee', 'Utilities', 'Custom'
  InvoiceStatus: string; // 'Draft', 'Pending', 'Approved', 'Active', 'Paid', 'Cancelled', 'Voided'
  PeriodFromDate?: string | Date;
  PeriodToDate?: string | Date;
  SubTotal: number;
  TaxAmount?: number;
  DiscountAmount?: number;
  TotalAmount: number;
  PaidAmount: number;
  BalanceAmount: number;
  CurrencyID: number;
  ExchangeRate?: number;
  PaymentTermID?: number;
  SalesPersonID?: number;
  TaxID?: number;
  IsRecurring: boolean;
  RecurrencePattern?: string; // 'Monthly', 'Quarterly', 'Annual', 'Custom'
  NextInvoiceDate?: string | Date;
  Notes?: string;
  InternalNotes?: string;

  // Approval Fields
  ApprovalStatus: string; // 'Pending', 'Approved', 'Rejected'
  RequiresApproval: boolean;
  ApprovedID?: number;
  ApprovedBy?: string;
  ApprovedOn?: string | Date;
  ApprovalComments?: string;
  RejectedID?: number;
  RejectedBy?: string;
  RejectedOn?: string | Date;
  RejectionReason?: string;

  // Joined fields for display
  CustomerName?: string;
  CustomerNo?: string;
  CustomerTaxNo?: string;
  ContractNo?: string;
  ContractStatus?: string;
  UnitNo?: string;
  UnitStatus?: string;
  PropertyName?: string;
  PropertyNo?: string;
  CurrencyCode?: string;
  CurrencyName?: string;
  PaymentTermName?: string;
  SalesPersonName?: string;
  TaxName?: string;
  TaxRate?: number;

  // Calculated fields
  IsOverdue?: boolean;
  DaysOverdue?: number;
  IsPosted?: boolean;
}

export interface InvoicePayment extends BaseEntity {
  LeaseReceiptID: number;
  ReceiptNo: string;
  ReceiptDate: string | Date;
  ReceivedAmount: number;
  PaymentType: string; // 'Cash', 'Cheque', 'Bank Transfer', 'Credit Card', 'Online'
  PaymentStatus: string; // 'Pending', 'Cleared', 'Deposited', 'Cancelled'
  BankAccountNo?: string;
  ChequeNo?: string;
  ChequeDate?: string | Date;
  TransactionReference?: string;
  Notes?: string;
}

export interface InvoicePosting extends BaseEntity {
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

// ========== Approval Types ==========

export interface InvoiceApprovalRequest {
  invoiceId: number;
  approvalComments?: string;
}

export interface InvoiceRejectionRequest {
  invoiceId: number;
  rejectionReason: string;
}

export interface BulkInvoiceApprovalRequest {
  invoiceIds: number[];
  approvalComments?: string;
}

export interface BulkInvoiceRejectionRequest {
  invoiceIds: number[];
  rejectionReason: string;
}

// ========== Generation and Request Types ==========

export interface ContractUnitForInvoice {
  ContractUnitID: number;
  PeriodFromDate: string | Date;
  PeriodToDate: string | Date;
  InvoiceAmount: number;
  TaxPercentage?: number;
  TaxAmount?: number;
  DiscountAmount?: number;
  TotalAmount: number;

  // Additional unit details for display
  UnitID?: number;
  UnitNo?: string;
  PropertyName?: string;
  RentPerMonth?: number;
  ContractDays?: number;
}

export interface InvoiceGenerationRequest {
  CompanyID: number;
  FiscalYearID: number;
  GenerationMode: "Single" | "Multiple" | "Recurring" | "Batch";
  InvoiceDate?: string | Date;
  InvoiceType?: string;
  InvoiceStatus?: string;
  AutoNumbering?: boolean;
  BulkGeneration?: boolean;

  // Approval settings
  RequiresApproval?: boolean;
  ApprovalStatus?: string;

  // For single generation
  ContractID?: number;
  ContractUnitID?: number;
  CustomerID?: number;
  PeriodFromDate?: string | Date;
  PeriodToDate?: string | Date;
  SubTotal?: number;
  TaxAmount?: number;
  DiscountAmount?: number;
  TotalAmount?: number;
  CurrencyID?: number;
  ExchangeRate?: number;
  PaymentTermID?: number;
  TaxID?: number;
  IsRecurring?: boolean;
  RecurrencePattern?: string;
  NextInvoiceDate?: string | Date;
  Notes?: string;
  InternalNotes?: string;

  // For multiple generation
  ContractUnits?: ContractUnitForInvoice[];

  // For bulk generation
  GenerateFromDate?: string | Date;
  GenerateToDate?: string | Date;
  InvoiceTemplateType?: string; // 'Monthly', 'Quarterly', 'Annual', 'Custom'

  // Auto-posting options
  AutoPost?: boolean;
  PostingDate?: string | Date;
  DebitAccountID?: number;
  CreditAccountID?: number;
  PostingNarration?: string;
}

export interface InvoiceUpdateRequest {
  LeaseInvoiceID: number;
  InvoiceNo?: string;
  InvoiceDate?: string | Date;
  DueDate?: string | Date;
  InvoiceType?: string;
  InvoiceStatus?: string;
  PeriodFromDate?: string | Date;
  PeriodToDate?: string | Date;
  SubTotal?: number;
  TaxAmount?: number;
  DiscountAmount?: number;
  TotalAmount?: number;
  CurrencyID?: number;
  ExchangeRate?: number;
  PaymentTermID?: number;
  SalesPersonID?: number;
  TaxID?: number;
  IsRecurring?: boolean;
  RecurrencePattern?: string;
  NextInvoiceDate?: string | Date;
  Notes?: string;
  InternalNotes?: string;

  // Approval fields
  RequiresApproval?: boolean;
  ApprovalStatus?: string;
  ApprovalComments?: string;
}

// ========== Posting Types ==========

export interface InvoicePostingRequest {
  LeaseInvoiceID: number;
  PostingDate: string | Date;
  DebitAccountID: number;
  CreditAccountID: number;
  PostingNarration?: string;
  PostingReference?: string;
  ExchangeRate?: number;
}

export interface BulkInvoicePostingRequest {
  PostingDate: string | Date;
  CurrencyID?: number;
  ExchangeRate?: number;
  SelectedInvoices: SelectedInvoiceForPosting[];
}

export interface SelectedInvoiceForPosting {
  LeaseInvoiceID: number;
  PostingAmount: number;
  DebitAccountID: number;
  CreditAccountID: number;
  Narration: string;
}

export interface PostingReversalRequest {
  PostingID: number;
  ReversalReason: string;
}

export interface UnpostedInvoice extends ContractInvoice {
  SuggestedNarration: string;
  IsEligibleForPosting: boolean;
  ValidationMessages?: string[];
}

// ========== Payment Types ==========

export interface InvoicePaymentRequest {
  LeaseInvoiceID: number;
  PaymentAmount: number;
  PaymentDate?: string | Date;
  PaymentReference?: string;
  PaymentMethod?: string; // 'Cash', 'Cheque', 'Bank Transfer', 'Credit Card', 'Online'
  Notes?: string;
}

// ========== Search and Filter Types ==========

export interface InvoiceSearchParams {
  searchText?: string;
  FilterInvoiceStatus?: string;
  FilterInvoiceType?: string;
  FilterApprovalStatus?: string;
  FilterPropertyID?: number;
  FilterUnitID?: number;
  FilterCustomerID?: number;
  FilterContractID?: number;
  FilterFromDate?: string | Date;
  FilterToDate?: string | Date;
  FilterDueDateFrom?: string | Date;
  FilterDueDateTo?: string | Date;
  FilterPostedOnly?: boolean;
  FilterUnpostedOnly?: boolean;
  FilterOverdueOnly?: boolean;
  FilterPendingApprovalOnly?: boolean;
  CompanyID?: number;
  FiscalYearID?: number;
}

// ========== Statistics and Reporting Types ==========

export interface InvoiceStatistics {
  statusCounts: {
    InvoiceStatus: string;
    InvoiceCount: number;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
  }[];
  approvalStatusCounts: {
    ApprovalStatus: string;
    InvoiceCount: number;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
  }[];
  overdueInvoices: {
    OverdueCount: number;
    OverdueAmount: number;
    AvgDaysOverdue: number;
  };
  monthlyTrends: {
    InvoiceYear: number;
    InvoiceMonth: number;
    InvoiceCount: number;
    TotalAmount: number;
    CollectedAmount: number;
  }[];
}

export interface PostingSummary {
  PostingDate: string | Date;
  TransactionCount: number;
  TotalDebitAmount: number;
  TotalCreditAmount: number;
  InvoiceCount: number;
  ReceiptCount: number;
  CompanyID: number;
  FiscalYearID: number;
}

// ========== Dashboard Types ==========

export interface InvoiceDashboardData {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  currentMonthGenerated: number;
  currentMonthCollected: number;
  recentInvoices: ContractInvoice[];
  overdueInvoices: ContractInvoice[];
  paymentTrends: {
    month: string;
    generated: number;
    collected: number;
  }[];
}

// ========== Validation Types ==========

export interface InvoiceValidationResponse {
  IsValid: boolean;
  Errors: string[];
  Warnings: string[];
}

export interface PostingValidationResponse {
  IsValid: boolean;
  Errors: string[];
  Warnings: string[];
  ValidatedTransactions: SelectedInvoiceForPosting[];
}

// ========== Response Types ==========

export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewInvoiceID?: number;
  NewReceiptID?: number;
  VoucherNo?: string;
  PostedCount?: number;
  FailedCount?: number;
  GeneratedCount?: number;
  TotalAmount?: number;
  GeneratedTotal?: number;
  ReceiptNo?: string;
  data?: T;
  [key: string]: any;
}

export interface InvoiceGenerationResponse {
  Status: number;
  Message: string;
  NewInvoiceID?: number;
  InvoiceNo?: string;
  GeneratedCount?: number;
  GeneratedTotal?: number;
}

export interface PostingResponse {
  Status: number;
  Message: string;
  VoucherNo?: string;
  PostedCount?: number;
  FailedCount?: number;
  TotalPostedAmount?: number;
}

// ========== Dropdown/Reference Types ==========

export interface Account {
  AccountID: number;
  AccountCode: string;
  AccountName: string;
  AccountTypeID: number;
  IsActive: boolean;
  IsPostable: boolean;
}

export interface PaymentTerm {
  PaymentTermID: number;
  TermCode: string;
  TermName: string;
  DaysCount?: number;
}

export interface TaxRate {
  TaxID: number;
  TaxCode: string;
  TaxName: string;
  TaxRate: number;
  IsActive: boolean;
}

export interface Currency {
  CurrencyID: number;
  CurrencyCode: string;
  CurrencyName: string;
  ConversionRate?: number;
  IsDefault: boolean;
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

export interface Company {
  CompanyID: number;
  CompanyName: string;
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

export interface Customer {
  CustomerID: number;
  CustomerNo: string;
  CustomerFullName: string;
}

export interface Contract {
  ContractID: number;
  ContractNo: string;
  CustomerID: number;
  CustomerName?: string;
  ContractStatus: string;
}

export interface User {
  UserID: number;
  UserName: string;
  UserFullName: string;
}

// ========== Export/Import Types ==========

export interface InvoiceExportOptions {
  format: "CSV" | "Excel" | "PDF";
  includeHeaders: boolean;
  includePayments: boolean;
  includePostings: boolean;
  dateFormat?: string;
}

export interface InvoiceImportData {
  ContractID: number;
  InvoiceType: string;
  InvoiceDate: string | Date;
  PeriodFromDate: string | Date;
  PeriodToDate: string | Date;
  InvoiceAmount: number;
  TaxAmount?: number;
  Notes?: string;
}

// ========== Constants and Enums ==========

export const INVOICE_STATUS = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
  ACTIVE: "Active",
  PAID: "Paid",
  CANCELLED: "Cancelled",
  VOIDED: "Voided",
} as const;

export const APPROVAL_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export const INVOICE_TYPE = {
  RENT: "Rent",
  SECURITY_DEPOSIT: "Security Deposit",
  ADMIN_FEE: "Admin Fee",
  UTILITIES: "Utilities",
  MAINTENANCE: "Maintenance",
  CUSTOM: "Custom",
} as const;

export const GENERATION_MODE = {
  SINGLE: "Single",
  MULTIPLE: "Multiple",
  RECURRING: "Recurring",
  BATCH: "Batch",
} as const;

export const PAYMENT_METHOD = {
  CASH: "Cash",
  CHEQUE: "Cheque",
  BANK_TRANSFER: "Bank Transfer",
  CREDIT_CARD: "Credit Card",
  ONLINE: "Online",
} as const;

export const CONTRACT_INVOICE_MODES = {
  GENERATE_INVOICE: 1,
  UPDATE_INVOICE: 2,
  GET_ALL_INVOICES: 3,
  GET_INVOICE_BY_ID: 4,
  DELETE_INVOICE: 5,
  SEARCH_INVOICES: 6,
  CHANGE_INVOICE_STATUS: 7,
  GET_INVOICE_STATISTICS: 8,
  GET_UNPOSTED_INVOICES: 9,
  POST_SINGLE_INVOICE: 10,
  POST_MULTIPLE_INVOICES: 11,
  REVERSE_INVOICE_POSTING: 12,
  RECORD_PAYMENT: 13,
  APPROVE_INVOICE: 14,
  REJECT_INVOICE: 15,
  RESET_INVOICE_APPROVAL: 16,
  GET_PENDING_APPROVAL_INVOICES: 17,
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];
export type ApprovalStatus = (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];
export type InvoiceType = (typeof INVOICE_TYPE)[keyof typeof INVOICE_TYPE];
export type GenerationMode = (typeof GENERATION_MODE)[keyof typeof GENERATION_MODE];
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];
export type ContractInvoiceMode = (typeof CONTRACT_INVOICE_MODES)[keyof typeof CONTRACT_INVOICE_MODES];
