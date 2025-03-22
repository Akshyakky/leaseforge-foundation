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

export interface CustomerType {
  TypeID: number;
  Description: string;
}

export interface ContactType {
  ContactTypeID: number;
  ContactDesc: string;
}

export interface DocType {
  DocTypeID: number;
  Description: string;
}

export interface CustomerStatistics {
  TotalCustomers: number;
  ActiveCustomers: number;
  CustomersThisMonth: number;
  CustomersLastMonth: number;
  TypeDistribution: {
    TypeName: string;
    Count: number;
  }[];
}

// Request parameters for customer operations
export interface CustomerRequest {
  Customer: Partial<Customer>;
  Contacts?: Partial<CustomerContact>[];
  Attachments?: Partial<CustomerAttachment>[];
}

// API response
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  [key: string]: any;
  data?: T;
}
