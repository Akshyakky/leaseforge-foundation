// src/types/leaseContractTypes.ts
export interface BaseContract {
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

export interface Contract extends BaseContract {
  ContractID: number;
  ContractNo: string;
  ContractStatus: string;
  CustomerID: number;
  JointCustomerID?: number;
  TransactionDate: string | Date;
  TotalAmount: number;
  AdditionalCharges: number;
  GrandTotal: number;
  Remarks?: string;

  // Joined fields
  CustomerFullName?: string;
  CustomerNo?: string;
  JointCustomerName?: string;
  JointCustomerNo?: string;
  UnitCount?: number;
  ChargeCount?: number;
  AttachmentCount?: number;
}

export interface ContractUnit extends BaseContract {
  ContractUnitID: number;
  ContractID: number;
  UnitID: number;
  FromDate: string | Date;
  ToDate: string | Date;
  FitoutFromDate?: string | Date;
  FitoutToDate?: string | Date;
  CommencementDate?: string | Date;
  ContractDays?: number;
  ContractMonths?: number;
  ContractYears?: number;
  RentPerMonth: number;
  RentPerYear: number;
  NoOfInstallments?: number;
  RentFreePeriodFrom?: string | Date;
  RentFreePeriodTo?: string | Date;
  RentFreeAmount?: number;
  TaxPercentage?: number;
  TaxAmount?: number;
  TotalAmount: number;

  // Joined fields
  UnitNo?: string;
  PropertyName?: string;
  FloorName?: string;
  PropertyID?: number;
  FloorID?: number;
}

export interface ContractAdditionalCharge extends BaseContract {
  ContractAdditionalChargeID: number;
  ContractID: number;
  AdditionalChargesID: number;
  Amount: number;
  TaxPercentage?: number;
  TaxAmount?: number;
  TotalAmount: number;

  // Joined fields
  ChargesName?: string;
  ChargesCode?: string;
  Description?: string;
}

export interface ContractAttachment extends BaseContract {
  ContractAttachmentID: number;
  ContractID: number;
  DocTypeID: number;
  DocumentName: string;
  FilePath?: string;
  FileContent?: string | ArrayBuffer | null; // Base64 encoded string
  FileContentType?: string;
  FileSize?: number;
  DocIssueDate?: string | Date;
  DocExpiryDate?: string | Date;
  Remarks?: string;

  // Joined fields
  DocTypeName?: string;

  // For UI only - not sent to backend
  file?: File;
  fileUrl?: string; // For displaying preview
}

export interface ContractSummaryReport {
  TotalContracts: number;
  ActiveContracts: number;
  DraftContracts: number;
  ExpiredContracts: number;
  TotalContractValue: number;
  AverageContractValue: number;
}

export interface ContractValidationError {
  ErrorMessage: string;
}

// Search parameters for contracts
export interface ContractSearchParams {
  searchText?: string;
  statusFilter?: string;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  customerFilter?: number;
  pageNumber?: number;
  pageSize?: number;
}

// Contract request for create/update
export interface ContractRequest {
  // Contract Master Parameters
  ContractID?: number;
  ContractNo?: string;
  ContractStatus?: string;
  CustomerID: number;
  JointCustomerID?: number;
  TransactionDate: string | Date;
  TotalAmount: number;
  AdditionalCharges?: number;
  GrandTotal?: number;
  Remarks?: string;
}

// Contract Unit request for add/update
export interface ContractUnitRequest {
  ContractUnitID?: number;
  ContractID: number;
  UnitID: number;
  FromDate: string | Date;
  ToDate: string | Date;
  FitoutFromDate?: string | Date;
  FitoutToDate?: string | Date;
  CommencementDate?: string | Date;
  ContractDays?: number;
  ContractMonths?: number;
  ContractYears?: number;
  RentPerMonth: number;
  RentPerYear?: number;
  NoOfInstallments?: number;
  RentFreePeriodFrom?: string | Date;
  RentFreePeriodTo?: string | Date;
  RentFreeAmount?: number;
  TaxPercentage?: number;
  TaxAmount?: number;
  UnitTotalAmount?: number;
}

// Contract Additional Charge request for add/update
export interface ContractAdditionalChargeRequest {
  ContractAdditionalChargeID?: number;
  ContractID: number;
  AdditionalChargesID: number;
  ChargeAmount: number;
  ChargeTaxPercentage?: number;
  ChargeTaxAmount?: number;
  ChargeTotalAmount?: number;
}

// Contract Attachment request for add/update
export interface ContractAttachmentRequest {
  ContractAttachmentID?: number;
  ContractID: number;
  DocTypeID: number;
  DocumentName: string;
  FilePath?: string;
  FileContent?: string | ArrayBuffer | null;
  FileContentType?: string;
  FileSize?: number;
  DocIssueDate?: string | Date;
  DocExpiryDate?: string | Date;
  AttachmentRemarks?: string;
}

// Response interfaces for different operations
export interface CreateContractResponse {
  success: boolean;
  message: string;
  contractId?: number;
  contractNo?: string;
}

export interface ContractResponse {
  contract: Contract | null;
  units: ContractUnit[];
  additionalCharges: ContractAdditionalCharge[];
  attachments: ContractAttachment[];
}

export interface ContractListResponse {
  contracts: Contract[];
  totalRecords: number;
}

export interface ContractUnitResponse {
  success: boolean;
  message: string;
  contractUnitId?: number;
}

export interface ContractChargeResponse {
  success: boolean;
  message: string;
  contractAdditionalChargeId?: number;
}

export interface ContractAttachmentResponse {
  success: boolean;
  message: string;
  contractAttachmentId?: number;
}

export interface ContractValidationResponse {
  isValid: boolean;
  errors: ContractValidationError[];
}

// Status update request
export interface ContractStatusUpdateRequest {
  ContractID: number;
  ContractStatus: string;
}

// Common response structure
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  [key: string]: any;
  data?: T;
  table1?: any[];
  table2?: any[];
  table3?: any[];
  table4?: any[];
}

// Contract statistics for dashboard
export interface ContractStatistics {
  statusCounts: { ContractStatus: string; ContractCount: number; TotalAmount: number }[];
  customerCounts: { CustomerID: number; CustomerFullName: string; ContractCount: number; TotalAmount: number }[];
  monthlyTrends: { Month: string; ContractCount: number; TotalAmount: number }[];
}

// Enums for contract status
export enum ContractStatus {
  DRAFT = "Draft",
  ACTIVE = "Active",
  APPROVED = "Approved",
  EXPIRED = "Expired",
  TERMINATED = "Terminated",
  CANCELLED = "Cancelled",
}

// Contract modes corresponding to stored procedure modes
export const CONTRACT_MODES = {
  CREATE_CONTRACT: 1,
  UPDATE_CONTRACT: 2,
  GET_ALL_CONTRACTS: 3,
  GET_CONTRACT_BY_ID: 4,
  DELETE_CONTRACT: 5,
  GET_CONTRACT_UNITS: 6,
  ADD_UPDATE_CONTRACT_UNIT: 7,
  DELETE_CONTRACT_UNIT: 8,
  GET_CONTRACT_ADDITIONAL_CHARGES: 9,
  ADD_UPDATE_CONTRACT_ADDITIONAL_CHARGE: 10,
  DELETE_CONTRACT_ADDITIONAL_CHARGE: 11,
  GET_CONTRACT_ATTACHMENTS: 12,
  ADD_CONTRACT_ATTACHMENT: 13,
  UPDATE_CONTRACT_ATTACHMENT: 14,
  DELETE_CONTRACT_ATTACHMENT: 15,
  UPDATE_CONTRACT_STATUS: 16,
  GET_CONTRACT_SUMMARY_REPORT: 17,
  VALIDATE_CONTRACT_DATA: 18,
} as const;

export type ContractMode = (typeof CONTRACT_MODES)[keyof typeof CONTRACT_MODES];

// Supporting interfaces for dropdown data
export interface Customer {
  CustomerID: number;
  CustomerNo?: string;
  CustomerFullName: string;
}

export interface Unit {
  UnitID: number;
  UnitNo: string;
  PropertyID?: number;
  PropertyName?: string;
  FloorID?: number;
  FloorName?: string;
}

export interface AdditionalCharge {
  ChargesID: number;
  ChargesCode: string;
  ChargesName: string;
  Description?: string;
}

export interface DocType {
  DocTypeID: number;
  Description: string;
}

export interface Company {
  CompanyID: number;
  CompanyName: string;
}

// File handling interfaces
export interface FileUpload {
  file: File;
  docTypeId: number;
  documentName: string;
  remarks?: string;
  docIssueDate?: Date;
  docExpiryDate?: Date;
}

// Bulk operations interfaces
export interface BulkContractOperation {
  contractIds: number[];
  operation: "approve" | "reject" | "activate" | "expire";
  reason?: string;
}

export interface BulkOperationResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: { contractId: number; error: string }[];
}

// Advanced filtering and sorting
export interface ContractAdvancedFilters extends ContractSearchParams {
  unitPropertyId?: number;
  unitId?: number;
  minAmount?: number;
  maxAmount?: number;
  hasAttachments?: boolean;
  hasAdditionalCharges?: boolean;
  jointCustomer?: boolean;
  sortBy?: "contractNo" | "transactionDate" | "customerName" | "totalAmount" | "contractStatus";
  sortOrder?: "asc" | "desc";
}

// Contract duplication request
export interface ContractDuplicationRequest {
  sourceContractId: number;
  newCustomerId?: number;
  newTransactionDate: Date;
  copyUnits: boolean;
  copyAdditionalCharges: boolean;
  copyAttachments: boolean;
  adjustDates?: {
    dayOffset: number;
  };
}

// Contract renewal request
export interface ContractRenewalRequest {
  contractId: number;
  newFromDate: Date;
  newToDate: Date;
  newRentPerMonth?: number;
  adjustmentPercentage?: number;
  copyAdditionalCharges: boolean;
}

// Error handling
export interface ContractError {
  field?: string;
  message: string;
  code?: string;
}

export interface ContractValidationResult {
  isValid: boolean;
  errors: ContractError[];
  warnings?: string[];
}

// Export utilities
export interface ContractExportOptions {
  format: "excel" | "pdf" | "csv";
  includeUnits: boolean;
  includeCharges: boolean;
  includeAttachments: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  statusFilter?: string[];
}

// Contract templates
export interface ContractTemplate {
  templateId: number;
  templateName: string;
  description?: string;
  defaultContractStatus: string;
  defaultContractDays?: number;
  defaultContractMonths?: number;
  defaultContractYears?: number;
  defaultTaxPercentage?: number;
  templateUnits?: Partial<ContractUnit>[];
  templateCharges?: Partial<ContractAdditionalCharge>[];
  isActive: boolean;
}
