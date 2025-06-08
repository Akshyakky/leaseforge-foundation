// src/types/leaseInvoiceGenerationTypes.ts

export interface BaseLeaseInvoice {
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
  DeletedBy?: string;
  DeletedOn?: string;
  RecordStatus?: boolean;
}

/**
 * Interface for eligible units for invoice generation
 */
export interface EligibleUnit extends BaseLeaseInvoice {
  ContractUnitID: number;
  ContractID: number;
  LeaseNo: string;
  PropertyID: number;
  Property: string;
  UnitID: number;
  UnitNo: string;
  UnitType: string;
  CustomerID: number;
  Tenant: string;
  Rent: number;
  StartDate: string | Date;
  EndDate: string | Date;
  SecurityDepositAmount: number;
  ServiceCharges: number;
  UtilityCharges: number;
  InvoiceAmount: number;
  NextDueDate: string | Date;
  AlreadyInvoiced: boolean;
  CurrencyCode: string;
  FiscalYear: string;
  ContractTotal: number;
}

/**
 * Interface for generated lease invoices
 */
export interface GeneratedLeaseInvoice extends BaseLeaseInvoice {
  LeaseInvoiceID: number;
  InvoiceNo: string;
  InvoiceDate: string | Date;
  DueDate: string | Date;
  InvoiceType: string;
  InvoiceStatus: string;
  Property: string;
  UnitNo: string;
  Tenant: string;
  SubTotal: number;
  TaxAmount: number;
  TotalAmount: number;
  PaidAmount: number;
  BalanceAmount: number;
  Currency: string;
  StartDate: string | Date;
  EndDate: string | Date;
  PostingStatus: "Posted" | "Unposted";
  Description: string;
}

/**
 * Interface for detailed lease invoice information
 */
export interface LeaseInvoiceDetails extends BaseLeaseInvoice {
  LeaseInvoiceID: number;
  InvoiceNo: string;
  InvoiceDate: string | Date;
  DueDate: string | Date;
  ContractID: number;
  ContractUnitID: number;
  CustomerID: number;
  CompanyID: number;
  FiscalYearID: number;
  InvoiceType: string;
  InvoiceStatus: string;
  PeriodFromDate: string | Date;
  PeriodToDate: string | Date;
  SubTotal: number;
  TaxAmount: number;
  DiscountAmount: number;
  TotalAmount: number;
  PaidAmount: number;
  BalanceAmount: number;
  CurrencyID: number;
  ExchangeRate: number;
  PaymentTermID?: number;
  TaxID?: number;
  IsRecurring: boolean;
  RecurrencePattern?: string;
  Notes?: string;
  PropertyName: string;
  UnitNo: string;
  CustomerName: string;
  CurrencyCode: string;
  FiscalYear: string;
  IsPosted: boolean;
}

/**
 * Interface for selected units during invoice generation
 */
export interface SelectedUnitForInvoice {
  ContractUnitID: number;
  InvoiceAmount: number;
  Description: string;
}

/**
 * Interface for filter parameters
 */
export interface LeaseInvoiceFilters {
  PropertyID?: number;
  UnitID?: number;
  UnitTypeID?: number;
  CustomerID?: number;
  LeaseNo?: string;
  CompanyID?: number;
  FiscalYearID?: number;
  TransactionDate?: Date;
  DueDateFrom?: Date;
  DueDateTo?: Date;
  InvoiceType?: "Installment" | "General" | "Rent" | "Service" | "Utility";
}

/**
 * Interface for invoice generation request
 */
export interface InvoiceGenerationRequest {
  SelectedUnits: SelectedUnitForInvoice[];
  InvoiceDate?: Date;
  DueDate: Date;
  PeriodFromDate?: Date;
  PeriodToDate?: Date;
  IncludeOtherCharges?: boolean;
  AutoGenerateNumber?: boolean;
  InvoiceNarration?: string;
  InvoiceType?: "Installment" | "General" | "Rent" | "Service" | "Utility";
  CompanyID?: number;
  FiscalYearID?: number;
  CurrencyID?: number;
  ExchangeRate?: number;
}

/**
 * Interface for invoice posting request
 */
export interface InvoicePostingRequest {
  LeaseInvoiceID: number;
  PostingDate?: Date;
  DebitAccountID: number;
  CreditAccountID: number;
  PostingAmount?: number;
  PostingNarration?: string;
  ReferenceNo?: string;
  CurrencyID?: number;
  ExchangeRate?: number;
}

/**
 * Interface for invoice reversal request
 */
export interface InvoiceReversalRequest {
  LeaseInvoiceID: number;
  ReversalReason: string;
}

/**
 * Interface for invoice cancellation request
 */
export interface InvoiceCancellationRequest {
  LeaseInvoiceID: number;
  CancelReason: string;
}

/**
 * Interface for invoice generation response
 */
export interface InvoiceGenerationResponse {
  success: boolean;
  message: string;
  InvoiceCount?: number;
  TotalAmount?: number;
}

/**
 * Interface for posting response
 */
export interface InvoicePostingResponse {
  success: boolean;
  message: string;
}

/**
 * Interface for invoice statistics
 */
export interface LeaseInvoiceStatistics {
  TotalInvoices: number;
  TotalInvoiceAmount: number;
  PendingInvoices: number;
  PendingAmount: number;
  OverdueInvoices: number;
  OverdueAmount: number;
  PaidInvoices: number;
  PaidAmount: number;
  InvoicesByType: {
    InvoiceType: string;
    Count: number;
    Amount: number;
  }[];
  InvoicesByStatus: {
    Status: string;
    Count: number;
    Amount: number;
  }[];
}

/**
 * Interface for unit type information (for dropdowns)
 */
export interface UnitType {
  UnitTypeID: number;
  UnitTypeName: string;
  UnitTypeCode?: string;
}

/**
 * Interface for payment terms (for dropdowns)
 */
export interface PaymentTerm {
  PaymentTermID: number;
  PaymentTermName: string;
  PaymentDays: number;
}

/**
 * Interface for tax information (for dropdowns)
 */
export interface Tax {
  TaxID: number;
  TaxName: string;
  TaxRate: number;
  TaxCode: string;
}

/**
 * Interface for additional charges
 */
export interface AdditionalCharge {
  AdditionalChargesID: number;
  ChargesName: string;
  ChargesType: string;
  Amount: number;
  IsPercentage: boolean;
}

/**
 * Interface for validation response
 */
export interface InvoiceValidationResponse {
  IsValid: boolean;
  Errors: string[];
  Warnings: string[];
}

/**
 * Interface for bulk operations status
 */
export interface BulkInvoiceOperationStatus {
  ContractUnitID: number;
  UnitNo: string;
  Status: "Success" | "Failed";
  Message: string;
  InvoiceID?: number;
  InvoiceNo?: string;
}

/**
 * Interface for invoice printing/export parameters
 */
export interface InvoicePrintRequest {
  LeaseInvoiceIDs: number[];
  IncludeDetails?: boolean;
  Format?: "PDF" | "Excel" | "CSV";
  TemplateName?: string;
}

/**
 * Type for invoice status
 */
export type InvoiceStatus = "Active" | "Pending" | "Approved" | "Cancelled" | "Paid" | "Overdue";

/**
 * Type for invoice types
 */
export type InvoiceType = "Installment" | "General" | "Rent" | "Service" | "Utility" | "Maintenance" | "Penalty";

/**
 * Type for posting status
 */
export type PostingStatus = "Posted" | "Unposted" | "Reversed";

/**
 * Interface for recurring invoice settings
 */
export interface RecurringInvoiceSettings {
  IsRecurring: boolean;
  RecurrencePattern: "Monthly" | "Quarterly" | "Semi-Annual" | "Annual";
  RecurrenceInterval: number;
  StartDate: Date;
  EndDate?: Date;
  NextGenerationDate: Date;
  AutoGenerate: boolean;
  AutoPost: boolean;
}

/**
 * Interface for invoice aging analysis
 */
export interface InvoiceAging {
  AgeGroup: string;
  DaysRange: string;
  InvoiceCount: number;
  TotalAmount: number;
  Percentage: number;
}

/**
 * Interface for customer invoice summary
 */
export interface CustomerInvoiceSummary {
  CustomerID: number;
  CustomerName: string;
  TotalInvoices: number;
  TotalAmount: number;
  PaidAmount: number;
  BalanceAmount: number;
  OverdueAmount: number;
  LastInvoiceDate: string | Date;
  LastPaymentDate?: string | Date;
}

/**
 * Constants for mode parameters
 */
export const LEASE_INVOICE_MODES = {
  GET_ELIGIBLE_UNITS: 1,
  GENERATE_INSTALLMENT_INVOICES: 2,
  GENERATE_GENERAL_INVOICES: 3,
  GET_GENERATED_INVOICES: 4,
  POST_INVOICE_TO_ACCOUNTING: 5,
  REVERSE_POSTED_INVOICE: 6,
  GET_INVOICE_DETAILS: 7,
  CANCEL_INVOICE: 8,
} as const;

export type LeaseInvoiceMode = (typeof LEASE_INVOICE_MODES)[keyof typeof LEASE_INVOICE_MODES];

/**
 * Constants for invoice types
 */
export const INVOICE_TYPES = {
  INSTALLMENT: "Installment",
  GENERAL: "General",
  RENT: "Rent",
  SERVICE: "Service",
  UTILITY: "Utility",
  MAINTENANCE: "Maintenance",
  PENALTY: "Penalty",
} as const;

/**
 * Constants for invoice statuses
 */
export const INVOICE_STATUSES = {
  ACTIVE: "Active",
  PENDING: "Pending",
  APPROVED: "Approved",
  CANCELLED: "Cancelled",
  PAID: "Paid",
  OVERDUE: "Overdue",
} as const;
