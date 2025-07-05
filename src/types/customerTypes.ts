// src/types/customerTypes.ts
export interface BaseCustomer {
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
  DeletedBy?: string;
  DeletedOn?: string;
  RecordStatus?: boolean;
}

export interface Customer extends BaseCustomer {
  CustomerID: number;
  CustomerNo?: string;
  TypeID?: number;
  FirstName?: string;
  LastName?: string;
  CustomerFullName?: string;
  AgentID?: number;
  SourceID?: number;
  Gender?: string;
  SalesPersonID?: number;
  SubSourseID?: number;
  BirthDate?: string | Date;
  CountryID?: number;
  CityID?: number;
  NationalityID?: number;
  Address?: string;
  TaxRegNo?: string;
  TaxID?: number;
  CustomerIdentityNo?: string;
  SubGroupID?: number;
  AccountCode?: string;
  AccountName?: string;
  CreateGL?: string;
  GLID?: number;
  Remark?: string;

  // Additional fields from joins
  CountryName?: string;
  CityName?: string;
  TypeName?: string;
  AgentName?: string;
  SourceName?: string;
  GLAccountName?: string; // NEW: GL Account Name

  // New GL Account Creation Parameters
  CreateNewAccount?: boolean;
  AccountTypeID?: number;
  CurrencyID?: number;
  CompanyID?: number;
}

export interface CustomerContact extends BaseCustomer {
  CustomerContactID: number;
  CustomerID: number;
  ContactTypeID?: number;
  ContactName?: string;
  EmailID?: string;
  CountryID?: number;
  CityID?: number;
  ContactNo?: string;
  Address?: string;

  // Additional fields from joins
  ContactTypeName?: string;
  CountryName?: string;
  CityName?: string;
}

export interface CustomerAttachment extends BaseCustomer {
  CustomerAttachmentID: number;
  CustomerID: number;
  DocTypeID?: number;
  DocumentName?: string;
  FileContent?: string | ArrayBuffer | null; // Base64 encoded string or ArrayBuffer
  FileContentType?: string; // MIME type of the file
  FileSize?: number; // Size in bytes
  DocIssueDate?: string | Date;
  DocExpiryDate?: string | Date;
  Remark?: string;

  // Additional fields from joins
  DocTypeName?: string;

  // For UI only - not sent to backend
  file?: File;
  fileUrl?: string; // For displaying preview
}

// NEW: Customer GL Details interface
export interface CustomerGLDetails extends BaseCustomer {
  CustomerGLID: number;
  CustomerID: number;
  AccountID: number;
  AccountCode?: string;
  AccountName?: string;
  AccountTypeID?: number;
  CurrencyID?: number;
  IsDefault?: boolean;
  Remarks?: string;

  // Additional fields from joins
  GLAccountName?: string;
  AccountTypeName?: string;
  CurrencyName?: string;
}

// NEW: Customer Outstanding Balance interface
export interface CustomerOutstandingBalance {
  CustomerID: number;
  CustomerNo: string;
  CustomerFullName: string;
  OutstandingBalance: number;
}

export interface CustomerType {
  TypeID: number;
  Description: string;
}

export interface ContactType {
  ContactTypeID: number;
  ContactTypeDescription: string;
}

export interface DocType {
  DocTypeID: number;
  Description: string;
}

// NEW: Account Type interface
export interface AccountType {
  AccountTypeID: number;
  AccountTypeName: string;
}

// NEW: Currency interface
export interface Currency {
  CurrencyID: number;
  CurrencyName: string;
  CurrencyCode?: string;
}

// NEW: Company interface
export interface Company {
  CompanyID: number;
  CompanyName: string;
}

export interface CustomerStatistics {
  TotalCustomers: number;
  ActiveCustomers: number;
  CustomersThisMonth: number;
  CustomersLastMonth: number;
  CustomersThisYear: number;
  CustomersWithContacts: number;
  CustomersWithAttachments: number;
  CustomersWithGLAccounts: number;
  DocumentsExpiringSoon: number;
  AvgContactsPerCustomer: number;
  AvgAttachmentsPerCustomer: number;
}

// Request parameters for customer operations
export interface CustomerRequest {
  Customer: Partial<Customer>;
  Contacts?: Partial<CustomerContact>[];
  Attachments?: Partial<CustomerAttachment>[];
}

// NEW: Customer GL Details request
export interface CustomerGLRequest {
  CustomerID: number;
  AccountID: number;
  AccountCode?: string;
  AccountName?: string;
  AccountTypeID?: number;
  CurrencyID?: number;
  IsDefault?: boolean;
  Remarks?: string;
  CustomerGLID?: number; // For updates
}
export interface CustomerCountryDistribution {
  CountryID: number;
  CountryName: string;
  CustomerCount: number;
  Percentage: number;
}
export interface CustomerTypeDistribution {
  TypeID: number;
  TypeName: string;
  CustomerCount: number;
  Percentage: number;
}
export interface CustomerMonthlyTrend {
  Year: number;
  Month: number;
  MonthName: string;
  CustomerCount: number;
}
export interface CustomerStatusSummary {
  Metric: string;
  Value: string;
}

export interface CustomerDashboardData {
  statistics: CustomerStatistics;
  typeDistribution: CustomerTypeDistribution[];
  countryDistribution: CustomerCountryDistribution[];
  monthlyTrend: CustomerMonthlyTrend[];
  statusSummary: CustomerStatusSummary[];
}

// API response
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  [key: string]: any;
  data?: T;
}
