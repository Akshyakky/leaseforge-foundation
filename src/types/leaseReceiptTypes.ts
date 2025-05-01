// src/types/leaseReceiptTypes.ts
export interface BaseReceipt {
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
  DeletedBy?: string;
  DeletedOn?: string;
  RecordStatus?: boolean;
}

export interface LeaseReceipt extends BaseReceipt {
  ReceiptID: number;
  ReceiptNo: string;
  ReceiptDate: string | Date;
  CustomerID: number;
  ContractID: number;
  PaymentMethod: string; // Cash, Cheque, Bank Transfer, Credit Card, etc.
  PaymentReference?: string;
  PaymentDate?: string | Date;
  BankName?: string;
  ChequeNo?: string;
  ChequeDate?: string | Date;
  ReceiptAmount: number;
  ReceiptStatus: string; // Draft, Validated, Posted, Cleared, Cancelled
  IsCleared: boolean;
  ClearingDate?: string | Date;
  PostingID?: number;
  PostingStatus?: string;
  CurrencyID: number;
  ExchangeRate: number;
  Notes?: string;
  CompanyID: number;

  // Joined fields
  CustomerFullName?: string;
  ContractNo?: string;
  CurrencyName?: string;
  CompanyName?: string;
  DetailCount?: number;
  IsPosted?: boolean;
}

export interface ReceiptDetail extends BaseReceipt {
  ReceiptDetailID: number;
  ReceiptID: number;
  InvoiceID: number;
  AllocatedAmount: number;

  // Joined fields from Invoice
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
  byStatus: {
    ReceiptStatus: string;
    ReceiptCount: number;
    TotalAmount: number;
  }[];
  byPaymentMethod: {
    PaymentMethod: string;
    ReceiptCount: number;
    TotalAmount: number;
    ClearedAmount: number;
  }[];
  byDate: {
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

// Search parameters
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

// API response
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewReceiptID?: number;
  ReceiptAmount?: number;
  AllocatedAmount?: number;
  Difference?: number;
  PostingID?: number;
  [key: string]: any;
  data?: T;
}
