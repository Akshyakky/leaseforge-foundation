// src/types/invoiceTypes.ts - Updated to match stored procedure
export interface LeaseInvoice {
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
  PeriodFromDate?: string | Date | null;
  PeriodToDate?: string | Date | null;
  SubTotal: number;
  TaxAmount: number;
  DiscountAmount: number;
  TotalAmount: number;
  PaidAmount: number;
  BalanceAmount: number;
  CurrencyID?: number;
  ExchangeRate?: number;
  PaymentTermID?: number;
  SalesPersonID?: number;
  TaxID?: number;
  IsRecurring: boolean;
  RecurrencePattern?: string;
  NextInvoiceDate?: string | Date | null;
  Notes?: string;
  InternalNotes?: string;

  // Joined fields from related tables
  CustomerFullName?: string;
  ContractNo?: string;
  UnitNo?: string;
  PropertyName?: string;
  CurrencyName?: string;
  CompanyName?: string;
  FYDescription?: string;
  PaymentTermName?: string;
  TaxName?: string;
  TaxRate?: number;

  // Calculated fields
  OverdueDays?: number;

  // Audit fields
  CreatedBy?: string;
  CreatedOn?: string | Date;
  UpdatedBy?: string;
  UpdatedOn?: string | Date;
}

export interface InvoiceRequest {
  invoice: {
    InvoiceNo?: string;
    InvoiceDate: string | Date;
    DueDate: string | Date;
    ContractID: number;
    ContractUnitID: number;
    CustomerID: number;
    CompanyID: number;
    FiscalYearID?: number;
    InvoiceType: string;
    InvoiceStatus: string;
    PeriodFromDate?: string | Date | null;
    PeriodToDate?: string | Date | null;
    SubTotal: number;
    TaxAmount: number;
    DiscountAmount: number;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
    CurrencyID?: number;
    ExchangeRate?: number;
    PaymentTermID?: number;
    SalesPersonID?: number;
    TaxID?: number;
    IsRecurring: boolean;
    RecurrencePattern?: string;
    NextInvoiceDate?: string | Date | null;
    Notes?: string;
    InternalNotes?: string;
  };
}

export interface InvoiceUpdateRequest {
  invoice: {
    LeaseInvoiceID: number;
    InvoiceNo?: string;
    InvoiceDate?: string | Date;
    DueDate?: string | Date;
    ContractID?: number;
    ContractUnitID?: number;
    CustomerID?: number;
    CompanyID?: number;
    FiscalYearID?: number;
    InvoiceType?: string;
    InvoiceStatus?: string;
    PeriodFromDate?: string | Date | null;
    PeriodToDate?: string | Date | null;
    SubTotal?: number;
    TaxAmount?: number;
    DiscountAmount?: number;
    TotalAmount?: number;
    PaidAmount?: number;
    BalanceAmount?: number;
    CurrencyID?: number;
    ExchangeRate?: number;
    PaymentTermID?: number;
    SalesPersonID?: number;
    TaxID?: number;
    IsRecurring?: boolean;
    RecurrencePattern?: string;
    NextInvoiceDate?: string | Date | null;
    Notes?: string;
    InternalNotes?: string;
  };
}

export interface InvoiceSearchParams {
  searchText?: string;
  filterCustomerID?: number;
  filterContractID?: number;
  filterInvoiceType?: string;
  filterInvoiceStatus?: string;
  filterFromDate?: string | Date;
  filterToDate?: string | Date;
  filterCompanyID?: number;
  filterFiscalYearID?: number;
}

export interface PaymentApplicationRequest {
  LeaseInvoiceID: number;
  PaymentAmount: number;
}

export interface PaymentApplication {
  NewPaidAmount: number;
  NewBalanceAmount: number;
}

export interface OverdueInvoiceParams {
  overdueDays?: number;
  filterCustomerID?: number;
  filterCompanyID?: number;
}

export interface OverdueInvoice {
  LeaseInvoiceID: number;
  InvoiceNo: string;
  InvoiceDate: string | Date;
  DueDate: string | Date;
  TotalAmount: number;
  PaidAmount: number;
  BalanceAmount: number;
  CustomerFullName: string;
  CustomerNo: string;
  OverdueDays: number;
}

export interface InvoiceStatistics {
  statusCounts: {
    InvoiceStatus: string;
    InvoiceCount: number;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
  }[];
  overdueSummary: {
    OverdueCount: number;
    OverdueAmount: number;
  };
}

export interface InvoicePosting {
  PostingID?: number;
  VoucherNo?: string;
  GLVoucherNo?: string;
}

export interface RecurringInvoiceParams {
  fromDate: string | Date;
  toDate: string | Date;
}

export interface ApiResponse {
  Status: number;
  Message: string;
  NewInvoiceID?: number;
  NewPaidAmount?: number;
  NewBalanceAmount?: number;
  PostingID?: number;
  VoucherNo?: string;
  GLVoucherNo?: string;
}

// Invoice status constants
export const INVOICE_STATUS = {
  DRAFT: "Draft",
  PENDING: "Pending",
  SENT: "Sent",
  PARTIAL: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
} as const;

// Invoice type constants
export const INVOICE_TYPE = {
  REGULAR: "Regular",
  ADVANCE: "Advance",
  SECURITY_DEPOSIT: "Security Deposit",
  PENALTY: "Penalty",
  ADJUSTMENT: "Adjustment",
} as const;

// Recurrence pattern constants
export const RECURRENCE_PATTERN = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  SEMI_ANNUALLY: "Semi-Annually",
  ANNUALLY: "Annually",
} as const;
