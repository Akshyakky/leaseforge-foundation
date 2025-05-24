// src/types/invoiceTypes.ts
export interface BaseInvoice {
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

export interface LeaseInvoice extends BaseInvoice {
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
  PeriodFromDate?: string | Date;
  PeriodToDate?: string | Date;
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
  NextInvoiceDate?: string | Date;
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
  OverdueDays?: number;
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

export interface OverdueInvoice extends LeaseInvoice {
  OverdueDays: number;
}

export interface PaymentApplication {
  LeaseInvoiceID: number;
  PaymentAmount: number;
  NewPaidAmount?: number;
  NewBalanceAmount?: number;
}

export interface InvoicePosting {
  PostingID?: number;
  VoucherNo?: string;
  CustomerAccountID?: number;
  RevenueAccountID?: number;
  TaxAccountID?: number;
}

// Search parameters
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

// Request parameters for invoice operations
export interface InvoiceRequest {
  invoice: Partial<LeaseInvoice>;
}

export interface InvoiceUpdateRequest {
  invoice: Partial<LeaseInvoice> & { LeaseInvoiceID: number };
}

export interface PaymentApplicationRequest {
  LeaseInvoiceID: number;
  PaymentAmount: number;
}

export interface RecurringInvoiceParams {
  recurringFromDate?: string | Date;
  recurringToDate?: string | Date;
}

export interface OverdueInvoiceParams {
  overdueDays?: number;
  filterCustomerID?: number;
  filterCompanyID?: number;
}

// API response
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewInvoiceID?: number;
  NewPaidAmount?: number;
  NewBalanceAmount?: number;
  PostingID?: number;
  VoucherNo?: string;
  IsActive?: boolean;
  [key: string]: any;
  data?: T;
}
