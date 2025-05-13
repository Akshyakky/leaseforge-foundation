// src/types/supplierTypes.ts
export interface BaseSupplier {
  CreatedBy?: string;
  CreatedOn?: string;
  CreatedID?: number;
  UpdatedBy?: string;
  UpdatedOn?: string;
  UpdatedID?: number;
  DeletedBy?: string;
  DeletedOn?: string;
  DeletedID?: number;
  RecordStatus?: boolean;
}

export interface Supplier extends BaseSupplier {
  SupplierID: number;
  SupplierNo: string;
  SupplierName: string;
  SupplierTypeID?: number;
  PaymentTermID?: number;
  ChequeName?: string;
  HasCreditFacility: boolean;
  CreditLimit?: number;
  CreditDays?: number;
  VatRegNo?: string;
  TaxID?: number;
  DiscountPercentage?: number;
  Status: string;
  PhoneNo?: string;
  FaxNo?: string;
  MobileNo?: string;
  Email?: string;
  Website?: string;
  Address?: string;
  CountryID?: number;
  CityID?: number;
  AccountID?: number;
  AccountCode?: string;
  AccountName?: string;
  Remarks?: string;

  // Joined fields
  SupplierTypeName?: string;
  PaymentTermName?: string;
  TaxName?: string;
  CountryName?: string;
  CityName?: string;
  GLAccountName?: string;
  StateName?: string;
}

export interface SupplierContact extends BaseSupplier {
  SupplierContactID: number;
  SupplierID: number;
  ContactTypeID?: number;
  ContactName: string;
  Designation?: string;
  EmailID?: string;
  PhoneNo?: string;
  MobileNo?: string;
  CountryID?: number;
  CityID?: number;
  Address?: string;
  IsDefault: boolean;
  Remarks?: string;

  // Joined fields
  ContactTypeDescription?: string;
  CountryName?: string;
  CityName?: string;
}

export interface SupplierBankDetails extends BaseSupplier {
  SupplierBankID: number;
  SupplierID: number;
  AccountNo: string;
  BankID?: number;
  BranchName?: string;
  SwiftCode?: string;
  IBAN?: string;
  CountryID?: number;
  CityID?: number;
  ContactPerson?: string;
  ContactNo?: string;
  CategoryID?: number;
  IsDefault: boolean;

  // Joined fields
  BankName?: string;
  BankSwiftCode?: string;
  CountryName?: string;
  CityName?: string;
  BankCategoryName?: string;
}

export interface SupplierGLDetails extends BaseSupplier {
  SupplierGLID: number;
  SupplierID: number;
  AccountID?: number;
  AccountCode?: string;
  AccountName?: string;
  AccountTypeID?: number;
  CurrencyID?: number;
  IsDefault: boolean;
  Remarks?: string;

  // Joined fields
  GLAccountName?: string;
  AccountTypeName?: string;
  CurrencyName?: string;
}

export interface SupplierType extends BaseSupplier {
  SupplierTypeID: number;
  SupplierTypeCode: string;
  SupplierTypeName: string;
  SupplierTypeDescription?: string;
  IsActive: boolean;
  SupplierCount?: number;
}

export interface SupplierAttachment extends BaseSupplier {
  SupplierAttachmentID: number;
  SupplierID: number;
  DocTypeID?: number;
  DocumentName?: string;
  FilePath?: string;
  FileContent?: string | ArrayBuffer | null;
  FileContentType?: string;
  FileSize?: number;
  DocIssueDate?: string | Date;
  DocExpiryDate?: string | Date;
  Remarks?: string;

  // Joined fields
  DocTypeName?: string;

  // For UI only - not sent to backend
  file?: File;
  fileUrl?: string;
}

export interface SupplierOutstandingBalance {
  SupplierID: number;
  SupplierNo: string;
  SupplierName: string;
  OutstandingBalance: number;
  BalanceAsOfDate: string | Date;
}

export interface BankCategory {
  CategoryID: number;
  CategoryName: string;
  Description?: string;
}

export interface Bank {
  BankID: number;
  BankCode: string;
  BankName: string;
  SwiftCode?: string;
  CountryID?: number;
  CountryName?: string;
}

export interface PaymentTerm {
  PaymentTermID: number;
  TermCode: string;
  TermName: string;
  DaysCount?: number;
  Description?: string;
}

// Search parameters
export interface SupplierSearchParams {
  searchText?: string;
  supplierTypeID?: number;
  status?: string;
  countryID?: number;
  cityID?: number;
  hasCreditFacility?: boolean;
}

// Request types
export interface SupplierRequest {
  supplier: Partial<Supplier>;
  contacts?: Partial<SupplierContact>[];
  bankDetails?: Partial<SupplierBankDetails>[];
  glAccountDetails?: {
    createNewAccount?: boolean;
    accountID?: number;
    accountCode?: string;
    accountName?: string;
    accountTypeID?: number;
    currencyID?: number;
    companyID?: number;
  };
}

export interface GLAccountRequest {
  createNewAccount: boolean;
  accountID?: number;
  accountCode?: string;
  accountName?: string;
  accountTypeID?: number;
  currencyID?: number;
  companyID?: number;
}

// API response
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewSupplierID?: number;
  NewSupplierTypeID?: number;
  NewContactID?: number;
  NewBankID?: number;
  ContactID?: number;
  BankID?: number;
  [key: string]: any;
  data?: T;
}
