// src/types/leaseTypes.ts
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

// ========== Lease Invoice Types ==========

export interface LeaseInvoice extends BaseEntity {
  InvoiceID: number;
  InvoiceNo: string;
  InvoiceDate: string | Date;
  DueDate: string | Date;
  ContractID: number;
  ContractUnitID: number;
  CustomerID: number;
  InvoiceStatus: string; // Draft, Posted, Paid, Partially Paid, Cancelled, Void
  InvoiceType: string; // Rent, Security Deposit, Admin Fee, etc.
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
  CurrencyID: number;
  ExchangeRate: number;
  PostingID?: number;
  PostingStatus?: string;
  Notes?: string;
  CompanyID: number;

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

export interface InvoicePaymentAllocation {
  ReceiptID: number;
  AllocatedAmount: number;
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
  statusCounts: {
    InvoiceStatus: string;
    InvoiceCount: number;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
  }[];
  overdueInvoices: LeaseInvoice[];
  invoicesByCustomer: {
    CustomerID: number;
    CustomerFullName: string;
    InvoiceCount: number;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
    OverdueAmount: number;
  }[];
  invoicesByMonth: {
    InvoiceYear: number;
    InvoiceMonth: number;
    InvoiceCount: number;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
  }[];
}

export interface OverdueInvoice extends LeaseInvoice {
  DaysOverdue: number;
  AgingBucket: string; // 1-30 Days, 31-60 Days, 61-90 Days, Over 90 Days
}

export interface OverdueStatistics {
  invoices: OverdueInvoice[];
  agingSummary: {
    AgingBucket: string;
    InvoiceCount: number;
    TotalAmount: number;
  }[];
}

// ========== Lease Receipt Types ==========

export interface LeaseReceipt extends BaseEntity {
  ReceiptID: number;
  ReceiptNo: string;
  ReceiptDate: string | Date;
  CustomerID: number;
  ContractID: number;
  PaymentMethod: string; // Cash, Cheque, Bank Transfer, Credit Card, etc.
  PaymentReference?: string;
  PaymentDate: string | Date;
  BankName?: string;
  ChequeNo?: string;
  ChequeDate?: string | Date;
  ReceiptAmount: number;
  ReceiptStatus: string; // Draft, Validated, Posted, Cleared, Cancelled
  IsCleared: boolean;
  ClearingDate?: string | Date;
  PostingID?: number;
  PostingStatus?: string;
  Notes?: string;
  CompanyID: number;
  CurrencyID: number;
  ExchangeRate: number;

  // Joined fields
  CustomerFullName?: string;
  ContractNo?: string;
  CurrencyName?: string;
  CompanyName?: string;
  DetailCount?: number;
  Posted?: boolean;
}

export interface ReceiptDetail extends BaseEntity {
  ReceiptDetailID: number;
  ReceiptID: number;
  InvoiceID: number;
  AllocatedAmount: number;

  // Joined fields from invoice
  InvoiceNo?: string;
  InvoiceDate?: string | Date;
  DueDate?: string | Date;
  InvoiceAmount?: number;
  TaxAmount?: number;
  TotalAmount?: number;
  BalanceAmount?: number;
  InvoiceStatus?: string;
  InvoicePeriodFrom?: string | Date;
  InvoicePeriodTo?: string | Date;
}

export interface ReceiptStatistics {
  statusCounts: {
    ReceiptStatus: string;
    ReceiptCount: number;
    TotalAmount: number;
  }[];
  paymentMethodCounts: {
    PaymentMethod: string;
    ReceiptCount: number;
    TotalAmount: number;
    ClearedAmount: number;
  }[];
  dailyReceipts: {
    ReceiptDate: string | Date;
    ReceiptCount: number;
    TotalAmount: number;
  }[];
  topCustomers: {
    CustomerID: number;
    CustomerFullName: string;
    ReceiptCount: number;
    TotalAmount: number;
  }[];
}

// ========== Request/Response Types ==========

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

export interface ReceiptSearchParams {
  searchText?: string;
  customerID?: number;
  contractID?: number;
  receiptStatus?: string;
  fromDate?: string | Date;
  toDate?: string | Date;
  isCleared?: boolean;
  paymentMethod?: string;
  companyID?: number;
}

export interface GenerateInvoiceParams {
  contractID: number;
  month?: number;
  year?: number;
  fromDate?: string | Date;
  toDate?: string | Date;
  invoiceType?: string;
}

export interface InvoiceRequest {
  invoice: Partial<LeaseInvoice>;
  paymentAllocations?: Partial<InvoicePaymentAllocation>[];
  additionalCharges?: Partial<AdditionalCharge>[];
}

export interface ReceiptRequest {
  receipt: Partial<LeaseReceipt>;
  details?: Partial<ReceiptDetail>[];
}

export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewInvoiceID?: number;
  NewReceiptID?: number;
  [key: string]: any;
  data?: T;
}
