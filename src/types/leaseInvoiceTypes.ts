// src/types/leaseInvoiceTypes.ts
export interface BaseInvoice {
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
  DeletedBy?: string;
  DeletedOn?: string;
  RecordStatus?: boolean;
}

export interface LeaseInvoice extends BaseInvoice {
  InvoiceID: number;
  InvoiceNo: string;
  InvoiceDate: string | Date;
  DueDate: string | Date;
  ContractID: number;
  ContractUnitID: number;
  CustomerID: number;
  InvoiceStatus: string; // Draft, Posted, Paid, Partially Paid, Cancelled, Void
  InvoiceType: string; // Rent, Service Charge, Utility, etc.
  InvoicePeriodFrom: string | Date;
  InvoicePeriodTo: string | Date;
  InvoiceAmount: number;
  TaxID?: number;
  TaxPercentage?: number;
  TaxAmount?: number;
  AdditionalCharges?: number;
  DiscountAmount?: number;
  TotalAmount: number;
  PaidAmount: number;
  BalanceAmount: number;
  CurrencyID?: number;
  ExchangeRate?: number;
  PostingID?: number;
  PostingStatus?: string;
  Notes?: string;
  CompanyID?: number;

  // Joined fields
  ContractNo?: string;
  CustomerFullName?: string;
  CustomerNo?: string;
  UnitNo?: string;
  PropertyName?: string;
  CompanyName?: string;
  CurrencyName?: string;
  TaxName?: string;
  DaysUntilDue?: number;
  OverdueStatus?: string;
}

export interface PaymentAllocation {
  ReceiptID: number;
  InvoiceID: number;
  AllocatedAmount: number;

  // For display purposes
  ReceiptNo?: string;
  ReceiptDate?: string | Date;
  PaymentMethod?: string;
  PaymentReference?: string;
  ReceiptAmount?: number;
  ReceiptStatus?: string;
  IsCleared?: boolean;
  ClearingDate?: string | Date;
}

export interface AdditionalCharge {
  ChargeID: number;
  ChargeName: string;
  ChargeAmount: number;
  TaxID?: number;
  TaxPercentage?: number;
  TaxAmount?: number;
  TotalAmount: number;
}

export interface InvoiceStatistics {
  byStatus: {
    InvoiceStatus: string;
    InvoiceCount: number;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
  }[];
  overdueInvoices: {
    InvoiceID: number;
    InvoiceNo: string;
    InvoiceDate: string | Date;
    DueDate: string | Date;
    CustomerID: number;
    CustomerFullName: string;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
    DaysOverdue: number;
  }[];
  byCustomer: {
    CustomerID: number;
    CustomerFullName: string;
    InvoiceCount: number;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
    OverdueAmount: number;
  }[];
  byMonth: {
    InvoiceYear: number;
    InvoiceMonth: number;
    InvoiceCount: number;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
  }[];
}

export interface InvoiceAgingReport {
  invoices: {
    InvoiceID: number;
    InvoiceNo: string;
    InvoiceDate: string | Date;
    DueDate: string | Date;
    CustomerID: number;
    ContractID: number;
    InvoiceAmount: number;
    TaxAmount: number;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
    CustomerFullName: string;
    ContractNo: string;
    UnitNo: string;
    PropertyName: string;
    DaysOverdue: number;
    AgingBucket: string;
  }[];
  summary: {
    AgingBucket: string;
    InvoiceCount: number;
    TotalAmount: number;
  }[];
}

// Search parameters
export interface InvoiceSearchParams {
  searchText?: string;
  customerID?: number;
  contractID?: number;
  unitID?: number;
  invoiceStatus?: string;
  invoiceType?: string;
  fromDate?: string | Date;
  toDate?: string | Date;
  isPaid?: boolean;
  companyID?: number;
}

// Invoice generation parameters
export interface InvoiceGenerationParams {
  contractID: number;
  month?: number;
  year?: number;
  fromDate?: string | Date;
  toDate?: string | Date;
  invoiceType?: string;
}

// API response
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewInvoiceID?: number;
  [key: string]: any;
  data?: T;
}
