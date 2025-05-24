// src/types/pettyCashTypes.ts
import { BaseContract } from "./contractTypes"; // Reusing BaseContract for common fields

export interface BasePettyCash extends BaseContract {
  CreatedID?: number;
  UpdatedID?: number;
  DeletedID?: number;
}

export interface PettyCashVoucher extends BasePettyCash {
  PostingID: number;
  VoucherNo: string;
  TransactionDate: string | Date;
  PostingDate: string | Date;
  CompanyID: number;
  FiscalYearID: number;
  Amount: number;
  CurrencyID?: number;
  ExchangeRate?: number;
  ExpenseAccountID?: number;
  PettyCashAccountID?: number;
  ReceivedBy?: string;
  ExpenseCategory?: string;
  Description?: string;
  Narration?: string;
  PostingStatus: string;
  ReceiptNo?: string;
  CostCenter1ID?: number;
  CostCenter2ID?: number;
  CostCenter3ID?: number;
  CostCenter4ID?: number;

  // Joined fields
  CompanyName?: string;
  FYDescription?: string;
  CurrencyName?: string;
  ExpenseAccount?: string;
}

export interface PettyCashVoucherPostingLine {
  PostingID: number;
  AccountID: number;
  TransactionType: "Debit" | "Credit";
  DebitAmount: number;
  CreditAmount: number;
  CostCenter1ID?: number;
  CostCenter2ID?: number;
  CostCenter3ID?: number;
  CostCenter4ID?: number;
  AccountCode?: string;
  AccountName?: string;
  CostCenter1Name?: string;
  CostCenter2Name?: string;
  CostCenter3Name?: string;
  CostCenter4Name?: string;
}

export interface PettyCashSearchParams {
  searchText?: string;
  filterFromDate?: string | Date;
  filterToDate?: string | Date;
  filterExpenseCategory?: string;
  filterPostingStatus?: string;
  filterCompanyID?: number;
  filterFiscalYearID?: number;
  filterExpenseAccountID?: number;
}

// Request parameters for petty cash voucher operations
export interface PettyCashRequest {
  voucher: Partial<PettyCashVoucher>;
}

export interface PettyCashUpdateRequest {
  voucher: Partial<PettyCashVoucher> & { PostingID: number };
}

export interface PettyCashReverseRequest {
  PostingID: number;
  reversalReason: string;
}

// API response structure (reusing from other types if identical)
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  PostingID?: number;
  VoucherNo?: string;
  ReversalVoucherNo?: string;
  [key: string]: any;
  data?: T;
}
