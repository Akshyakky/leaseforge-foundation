// src/types/terminationTypes.ts
export interface BaseTermination {
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
  DeletedBy?: string;
  DeletedOn?: string;
  RecordStatus?: boolean;
}

export interface ContractTermination extends BaseTermination {
  TerminationID: number;
  TerminationNo: string;
  ContractID: number;
  TerminationDate: string | Date;
  NoticeDate?: string | Date;
  EffectiveDate: string | Date;
  VacatingDate?: string | Date;
  MoveOutDate?: string | Date;
  KeyReturnDate?: string | Date;
  StayPeriodDays?: number;
  StayPeriodAmount?: number;
  TerminationReason?: string;
  TerminationStatus: string;
  TotalDeductions: number;
  SecurityDepositAmount: number;
  AdjustAmount?: number;
  TotalInvoiced?: number;
  TotalReceived?: number;
  CreditNoteAmount?: number;
  RefundAmount?: number;
  IsRefundProcessed: boolean;
  RefundDate?: string | Date;
  RefundReference?: string;
  Notes?: string;

  // Approval fields
  ApprovalStatus: string;
  RequiresApproval: boolean;
  ApprovalComments?: string;
  RejectionReason?: string;
  ApprovedID?: number;
  ApprovedBy?: string;
  ApprovedOn?: string | Date;
  RejectedID?: number;
  RejectedBy?: string;
  RejectedOn?: string | Date;

  // Joined fields
  ContractNo?: string;
  CustomerFullName?: string;
  CustomerEmail?: string;
  CustomerID?: number;
  PropertyID?: number;
  PropertyName?: string;
  UnitNumbers?: string;
  DeductionCount?: number;
  AttachmentCount?: number;

  EmailNotificationSent: boolean;
  EmailNotificationPending: boolean;
  EmailNotificationFailed: boolean;
  LastEmailSentDate: string;
}

export interface TerminationDeduction extends BaseTermination {
  TerminationDeductionID: number;
  TerminationID: number;
  DeductionID?: number;
  DeductionName: string;
  DeductionDescription?: string;
  DeductionAmount: number;
  TaxPercentage?: number;
  TaxAmount?: number;
  TotalAmount: number;

  // Joined fields
  DeductionCode?: string;
  DeductionType?: string;
}

export interface TerminationAttachment extends BaseTermination {
  TerminationAttachmentID: number;
  TerminationID: number;
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

export interface TerminationStatistics {
  statusCounts: {
    TerminationStatus: string;
    TerminationCount: number;
    TotalSecurityDeposit: number;
    TotalDeductions: number;
    TotalRefunds: number;
    ProcessedRefundCount: number;
  }[];
  approvalStatusCounts: {
    ApprovalStatus: string;
    TerminationCount: number;
    TotalSecurityDeposit: number;
    TotalDeductions: number;
    TotalRefunds: number;
  }[];
  monthlyTerminations: {
    MonthNumber: number;
    MonthName: string;
    TerminationCount: number;
    TotalSecurityDeposit: number;
    TotalDeductions: number;
    TotalRefunds: number;
  }[];
  pendingRefunds: {
    TerminationID: number;
    TerminationNo: string;
    ContractID: number;
    ContractNo: string;
    CustomerFullName: string;
    TerminationDate: string | Date;
    EffectiveDate: string | Date;
    RefundAmount: number;
  }[];
  pendingApprovals: {
    TerminationID: number;
    TerminationNo: string;
    ContractID: number;
    ContractNo: string;
    CustomerFullName: string;
    TerminationDate: string | Date;
    CreatedBy: string;
    CreatedOn: string | Date;
  }[];
}

// Search parameters
export interface TerminationSearchParams {
  searchText?: string;
  contractID?: number;
  terminationStatus?: string;
  approvalStatus?: string;
  fromDate?: string | Date;
  toDate?: string | Date;
  customerID?: number;
  propertyID?: number;
  unitID?: number;
}

// Termination request for create/update
export interface TerminationRequest {
  termination: Partial<ContractTermination>;
  deductions?: Partial<TerminationDeduction>[];
  attachments?: Partial<TerminationAttachment>[];
}

// Approval request interfaces
export interface TerminationApprovalRequest {
  terminationId: number;
  approvalComments?: string;
}

export interface TerminationRejectionRequest {
  terminationId: number;
  rejectionReason: string;
}

// API response
export interface ApiResponse<T = any> {
  Status: number;
  Message: string;
  NewTerminationID?: number;
  [key: string]: any;
  data?: T;
}
